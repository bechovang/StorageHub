package com.storagehub.service;

import com.storagehub.dto.policy.PolicyActiveResponse;
import com.storagehub.dto.policy.PolicyRateItem;
import com.storagehub.dto.policy.PolicySaveRequest;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.UnitType;
import com.storagehub.exception.BusinessRuleException;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.UnitTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Policy API (US quản trị chính sách giá) — đọc/ghi RentalPolicy + PolicyRule
 * theo AD-6/AD-11. Lưu = tạo PHIÊN BẢN MỚI (status=1, bản cũ → 2) để hợp đồng
 * đã ký giữ đúng snapshot phiên bản của nó; reset = khôi phục bộ seed mặc định.
 */
@Service
@RequiredArgsConstructor
public class PolicyAdminService {

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /** Bộ giá seed mặc định (₫/ngày) — POST /reset khôi phục về đây. */
    private static final Map<String, Long> DEFAULT_DAILY_RATES = Map.of(
            "Locker", 3_000L,
            "S", 5_000L,
            "M", 8_000L,
            "L", 15_000L
    );
    private static final int DEFAULT_DEPOSIT_PERCENT = 10;
    private static final int DEFAULT_TURNOVER_BUFFER_DAYS = 1;
    private static final int DEFAULT_LATE_CHECKOUT_PERCENT = 5;
    private static final long SURCHARGE_CAP_PERCENT = 10;

    private final RentalPolicyRepository rentalPolicyRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final UnitTypeRepository unitTypeRepository;

    @Transactional(readOnly = true)
    public PolicyActiveResponse getActivePolicy() {
        RentalPolicy active = requireActivePolicy();
        return toResponse(active);
    }

    @Transactional
    public PolicyActiveResponse savePolicy(PolicySaveRequest request, String actorEmail) {
        RentalPolicy current = requireActivePolicy();
        List<UnitType> types = unitTypeRepository.findAll();
        List<PolicyRule> currentRules = policyRuleRepository.findByPolicy_PolicyId(current.getPolicyId());

        int depositPercent = request.depositPercent() != null
                ? request.depositPercent() : DEFAULT_DEPOSIT_PERCENT;
        int bufferDays = request.turnoverBufferDays() != null
                ? request.turnoverBufferDays() : DEFAULT_TURNOVER_BUFFER_DAYS;
        int latePercent = request.lateCheckoutPercent() != null
                ? request.lateCheckoutPercent() : DEFAULT_LATE_CHECKOUT_PERCENT;

        // Map rateVnd theo typeName từ request
        Map<String, Long> requestedRates = request.baseRates() == null ? Map.of()
                : request.baseRates().stream().collect(Collectors.toMap(
                        r -> r.typeName(), r -> r.rateVnd(), (a, b) -> a));

        // 1. Bản hiện hành → ngừng (status 2)
        current.setStatus(2);
        rentalPolicyRepository.save(current);

        // 2. Tạo phiên bản mới status 1
        int nextVersion = rentalPolicyRepository.findAll().stream()
                .map(p -> parseVersionNumber(p.getVersion()))
                .max(Integer::compareTo).orElse(1) + 1;
        RentalPolicy created = new RentalPolicy();
        created.setVersion("v" + nextVersion);
        created.setEffectiveDate(LocalDate.now(ICT_ZONE));
        created.setStatus(1);
        created.setUpdatedAt(LocalDateTime.now(ICT_ZONE));
        created.setUpdatedBy(actorEmail);
        RentalPolicy saved = rentalPolicyRepository.save(created);

        // 3. Ghi rules: RENT_RATE theo type từ request; global rules theo surcharges;
        //    LATE_FEE/DISCOUNT/WAIVER_CAP copy từ phiên bản vừa ngừng.
        List<PolicyRule> rules = new ArrayList<>();
        for (UnitType type : types) {
            long rateVnd = requestedRates.containsKey(type.getName())
                    ? requestedRates.get(type.getName())
                    : defaultRateFor(type.getName(), currentRules, type.getTypeId());
            rules.add(buildRule(saved, type, PolicyRule.RuleType.RENT_RATE, null, rateVnd, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.DEPOSIT_RATE, null,
                    depositPercent, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.TURNOVER_BUFFER, null,
                    bufferDays, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.SURCHARGE,
                    PolicyRule.SurchargeType.PERCENT, latePercent, SURCHARGE_CAP_PERCENT));

            copyRule(currentRules, type.getTypeId(), PolicyRule.RuleType.LATE_FEE)
                    .ifPresent(r -> rules.add(buildRule(saved, type, PolicyRule.RuleType.LATE_FEE,
                            r.getSurchargeType(), r.getValue().longValue(), r.getCap() != null ? r.getCap().longValue() : null)));
            copyRule(currentRules, type.getTypeId(), PolicyRule.RuleType.DISCOUNT)
                    .ifPresent(r -> rules.add(buildRule(saved, type, PolicyRule.RuleType.DISCOUNT,
                            r.getSurchargeType(), r.getValue().longValue(), r.getCap() != null ? r.getCap().longValue() : null)));
            copyRule(currentRules, type.getTypeId(), PolicyRule.RuleType.WAIVER_CAP)
                    .ifPresent(r -> rules.add(buildRule(saved, type, PolicyRule.RuleType.WAIVER_CAP,
                            r.getSurchargeType(), r.getValue().longValue(), r.getCap() != null ? r.getCap().longValue() : null)));
        }
        policyRuleRepository.saveAll(rules);

        return toResponse(saved);
    }

    @Transactional
    public PolicyActiveResponse resetToDefault(String actorEmail) {
        RentalPolicy current = requireActivePolicy();

        current.setStatus(2);
        rentalPolicyRepository.save(current);

        int nextVersion = rentalPolicyRepository.findAll().stream()
                .map(p -> parseVersionNumber(p.getVersion()))
                .max(Integer::compareTo).orElse(1) + 1;
        RentalPolicy created = new RentalPolicy();
        created.setVersion("v" + nextVersion);
        created.setEffectiveDate(LocalDate.now(ICT_ZONE));
        created.setStatus(1);
        created.setUpdatedAt(LocalDateTime.now(ICT_ZONE));
        created.setUpdatedBy(actorEmail);
        RentalPolicy saved = rentalPolicyRepository.save(created);

        List<PolicyRule> rules = new ArrayList<>();
        for (UnitType type : unitTypeRepository.findAll()) {
            long rate = DEFAULT_DAILY_RATES.getOrDefault(type.getName(), 5_000L);
            rules.add(buildRule(saved, type, PolicyRule.RuleType.RENT_RATE, null, rate, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.DEPOSIT_RATE, null,
                    DEFAULT_DEPOSIT_PERCENT, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.TURNOVER_BUFFER, null,
                    DEFAULT_TURNOVER_BUFFER_DAYS, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.SURCHARGE,
                    PolicyRule.SurchargeType.PERCENT, DEFAULT_LATE_CHECKOUT_PERCENT,
                    SURCHARGE_CAP_PERCENT));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.LATE_FEE, null,
                    Math.max(2_000L, rate / 3), null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.WAIVER_CAP, null, 10_000L, null));
        }
        policyRuleRepository.saveAll(rules);

        return toResponse(saved);
    }

    private PolicyActiveResponse toResponse(RentalPolicy policy) {
        List<PolicyRule> rules = policyRuleRepository.findByPolicy_PolicyId(policy.getPolicyId());
        Map<Integer, PolicyRule> byTypeAndRule = rules.stream()
                .collect(Collectors.toMap(
                        r -> r.getType().getTypeId() * 100 + r.getRuleType().ordinal(),
                        Function.identity(),
                        (a, b) -> a));

        List<PolicyRateItem> baseRates = unitTypeRepository.findAll().stream()
                .map(t -> {
                    PolicyRule rent = byTypeAndRule.get(t.getTypeId() * 100 + PolicyRule.RuleType.RENT_RATE.ordinal());
                    return new PolicyRateItem(
                            t.getTypeId().longValue(),
                            t.getName(),
                            t.getDescription(),
                            rent != null ? rent.getValue().longValue() : 0L
                    );
                })
                .sorted(java.util.Comparator.comparing(PolicyRateItem::id))
                .toList();

        // Global surcharges lấy từ rule của type đầu tiên (seed luôn đồng bộ giữa các type)
        PolicyRule depositRule = rules.stream()
                .filter(r -> r.getRuleType() == PolicyRule.RuleType.DEPOSIT_RATE).findFirst().orElse(null);
        PolicyRule bufferRule = rules.stream()
                .filter(r -> r.getRuleType() == PolicyRule.RuleType.TURNOVER_BUFFER).findFirst().orElse(null);
        PolicyRule lateRule = rules.stream()
                .filter(r -> r.getRuleType() == PolicyRule.RuleType.SURCHARGE).findFirst().orElse(null);

        PolicyActiveResponse.Surcharges surcharges = new PolicyActiveResponse.Surcharges(
                lateRule != null ? lateRule.getValue().intValue() : DEFAULT_LATE_CHECKOUT_PERCENT,
                depositRule != null ? depositRule.getValue().intValue() : DEFAULT_DEPOSIT_PERCENT,
                bufferRule != null ? bufferRule.getValue().intValue() : DEFAULT_TURNOVER_BUFFER_DAYS
        );

        return new PolicyActiveResponse(
                policy.getPolicyId().longValue(),
                policy.getVersion(),
                policy.getStatus(),
                policy.getUpdatedAt(),
                policy.getUpdatedBy(),
                baseRates,
                surcharges
        );
    }

    private long defaultRateFor(String typeName, List<PolicyRule> currentRules, Integer typeId) {
        return currentRules.stream()
                .filter(r -> r.getType().getTypeId().equals(typeId)
                        && r.getRuleType() == PolicyRule.RuleType.RENT_RATE)
                .findFirst()
                .map(r -> r.getValue().longValue())
                .orElse(DEFAULT_DAILY_RATES.getOrDefault(typeName, 5_000L));
    }

    private PolicyRule buildRule(
            RentalPolicy policy,
            UnitType type,
            PolicyRule.RuleType ruleType,
            PolicyRule.SurchargeType surchargeType,
            long value,
            Long cap
    ) {
        PolicyRule r = new PolicyRule();
        r.setPolicy(policy);
        r.setType(type);
        r.setRuleType(ruleType);
        r.setSurchargeType(surchargeType);
        r.setValue(java.math.BigDecimal.valueOf(value));
        r.setCap(cap != null ? java.math.BigDecimal.valueOf(cap) : null);
        return r;
    }

    private java.util.Optional<PolicyRule> copyRule(
            List<PolicyRule> rules,
            Integer typeId,
            PolicyRule.RuleType ruleType
    ) {
        return rules.stream()
                .filter(r -> r.getType().getTypeId().equals(typeId) && r.getRuleType() == ruleType)
                .findFirst();
    }

    private int parseVersionNumber(String version) {
        try {
            return Integer.parseInt(version.replaceFirst("^v", ""));
        } catch (NumberFormatException e) {
            return 1;
        }
    }

    private RentalPolicy requireActivePolicy() {
        return rentalPolicyRepository.findByStatus(1)
                .orElseThrow(() -> new BusinessRuleException(
                        "Hệ thống chưa có chính sách giá hiệu lực."));
    }
}
