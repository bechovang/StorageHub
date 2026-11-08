package com.storagehub.service;

import com.storagehub.dto.policy.PolicyActiveResponse;
import com.storagehub.dto.policy.PolicyRateItem;
import com.storagehub.dto.policy.PolicySaveRequest;
import com.storagehub.entity.Facility;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.UnitType;
import com.storagehub.exception.BusinessRuleException;
import com.storagehub.repository.FacilityRepository;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    /**
     * Bộ giá seed mặc định (₫/ngày) theo mã cơ sở + type_id — POST /reset khôi
     * phục về đây. Khớp seed V40: TB 30/22/15/25k, TD 27/20/13/22k, BT 35/26/18/30k.
     */
    private static final Map<String, Map<Integer, Long>> DEFAULT_DAILY_RATES_BY_FACILITY = Map.of(
            "TB", Map.of(1, 30_000L, 2, 22_000L, 3, 15_000L, 4, 25_000L),
            "TD", Map.of(1, 27_000L, 2, 20_000L, 3, 13_000L, 4, 22_000L),
            "BT", Map.of(1, 35_000L, 2, 26_000L, 3, 18_000L, 4, 30_000L)
    );
    private static final long FALLBACK_DAILY_RATE = 5_000L;
    private static final int DEFAULT_DEPOSIT_PERCENT = 10;
    private static final int DEFAULT_TURNOVER_BUFFER_DAYS = 1;
    private static final int DEFAULT_LATE_CHECKOUT_PERCENT = 300;
    private static final int DEFAULT_LATE_ESCALATION_DAYS = 3;
    private static final int DEFAULT_GRACE_DAYS = 3;
    private static final long DEFAULT_HANDOVER_LATE_FEE = 50_000L;

    private final RentalPolicyRepository rentalPolicyRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final FacilityRepository facilityRepository;

    @Transactional(readOnly = true)
    public PolicyActiveResponse getActivePolicy(Integer facilityId) {
        RentalPolicy active = requireActivePolicy();
        Facility facility = resolveFacilityForRead(active, facilityId);
        return toResponse(active, facility);
    }

    @Transactional
    public PolicyActiveResponse savePolicy(PolicySaveRequest request, String actorEmail) {
        Facility facility = requireActiveFacility(request.facilityId());
        RentalPolicy current = requireActivePolicyForUpdate();
        List<UnitType> types = unitTypeRepository.findAll();
        List<PolicyRule> currentRules = policyRuleRepository.findByPolicy_PolicyId(current.getPolicyId());

        int depositPercent = request.depositPercent() != null
                ? request.depositPercent()
                : resolvedInt(currentRules, facility.getFacilityId(),
                        PolicyRule.RuleType.DEPOSIT_RATE, DEFAULT_DEPOSIT_PERCENT);
        int bufferDays = request.turnoverBufferDays() != null
                ? request.turnoverBufferDays()
                : resolvedInt(currentRules, facility.getFacilityId(),
                        PolicyRule.RuleType.TURNOVER_BUFFER, DEFAULT_TURNOVER_BUFFER_DAYS);
        int latePercent = request.lateCheckoutPercent() != null
                ? request.lateCheckoutPercent()
                : resolvedInt(currentRules, facility.getFacilityId(),
                        PolicyRule.RuleType.LATE_FEE_PERCENT, DEFAULT_LATE_CHECKOUT_PERCENT);
        int escalationDays = request.lateEscalationDays() != null
                ? request.lateEscalationDays()
                : resolvedInt(currentRules, facility.getFacilityId(),
                        PolicyRule.RuleType.LATE_ESCALATION_DAYS, DEFAULT_LATE_ESCALATION_DAYS);
        int checkinGrace = request.checkinGraceDays() != null
                ? request.checkinGraceDays()
                : resolvedInt(currentRules, facility.getFacilityId(),
                        PolicyRule.RuleType.CHECKIN_GRACE_DAYS, DEFAULT_GRACE_DAYS);
        long checkinLateFee = request.checkinLateFeePerDay() != null
                ? request.checkinLateFeePerDay()
                : resolvedLong(currentRules, facility.getFacilityId(),
                        PolicyRule.RuleType.CHECKIN_LATE_FEE_PER_DAY, DEFAULT_HANDOVER_LATE_FEE);
        int extensionGrace = request.extensionGraceDays() != null
                ? request.extensionGraceDays()
                : resolvedInt(currentRules, facility.getFacilityId(),
                        PolicyRule.RuleType.EXTENSION_GRACE_DAYS, DEFAULT_GRACE_DAYS);
        long extensionLateFee = request.extensionLateFeePerDay() != null
                ? request.extensionLateFeePerDay()
                : resolvedLong(currentRules, facility.getFacilityId(),
                        PolicyRule.RuleType.EXTENSION_LATE_FEE_PER_DAY, DEFAULT_HANDOVER_LATE_FEE);

        // Map rateVnd theo typeName từ request
        Map<String, Long> requestedRates = request.baseRates() == null ? Map.of()
                : request.baseRates().stream().collect(Collectors.toMap(
                        r -> r.typeName(), r -> r.rateVnd(), (a, b) -> a));

        RentalPolicy saved = deactivateAndCreateVersion(current, actorEmail);

        // 3. RENT_RATE của cơ sở đang sửa lấy từ request; RENT_RATE của các cơ
        //    sở khác copy nguyên từ version cũ. Rule vận hành còn lại là global.
        List<PolicyRule> rules = new ArrayList<>();
        copyOtherFacilityRentRules(currentRules, saved, facility.getFacilityId(), rules);
        for (UnitType type : types) {
            long rateVnd = requestedRates.containsKey(type.getName())
                    ? requestedRates.get(type.getName())
                    : currentRentFor(currentRules, facility, type.getTypeId())
                            .map(r -> r.getValue().longValue())
                            .orElseGet(() -> defaultRateFor(facility, type.getTypeId()));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.RENT_RATE, null,
                    rateVnd, null, facility));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.DEPOSIT_RATE, null,
                    depositPercent, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.TURNOVER_BUFFER, null,
                    bufferDays, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.LATE_FEE_PERCENT,
                    null, latePercent, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.LATE_ESCALATION_DAYS,
                    null, escalationDays, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.CHECKIN_GRACE_DAYS,
                    null, checkinGrace, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.CHECKIN_LATE_FEE_PER_DAY,
                    null, checkinLateFee, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.EXTENSION_GRACE_DAYS,
                    null, extensionGrace, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.EXTENSION_LATE_FEE_PER_DAY,
                    null, extensionLateFee, null, null));

            copyRuleAsGlobal(currentRules, facility, type, PolicyRule.RuleType.LATE_FEE, saved, rules);
            copyRuleAsGlobal(currentRules, facility, type, PolicyRule.RuleType.DISCOUNT, saved, rules);
            copyRuleAsGlobal(currentRules, facility, type, PolicyRule.RuleType.WAIVER_CAP, saved, rules);
        }
        policyRuleRepository.saveAll(rules);

        return toResponse(saved, facility);
    }

    @Transactional
    public PolicyActiveResponse resetToDefault(Integer facilityId, String actorEmail) {
        Facility facility = requireActiveFacility(facilityId);
        RentalPolicy current = requireActivePolicyForUpdate();
        List<PolicyRule> currentRules = policyRuleRepository.findByPolicy_PolicyId(current.getPolicyId());

        RentalPolicy saved = deactivateAndCreateVersion(current, actorEmail);

        List<PolicyRule> rules = new ArrayList<>();
        copyOtherFacilityRentRules(currentRules, saved, facility.getFacilityId(), rules);
        for (UnitType type : unitTypeRepository.findAll()) {
            long rate = defaultRateFor(facility, type.getTypeId());
            rules.add(buildRule(saved, type, PolicyRule.RuleType.RENT_RATE, null,
                    rate, null, facility));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.DEPOSIT_RATE, null,
                    DEFAULT_DEPOSIT_PERCENT, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.TURNOVER_BUFFER, null,
                    DEFAULT_TURNOVER_BUFFER_DAYS, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.LATE_FEE_PERCENT,
                    null, DEFAULT_LATE_CHECKOUT_PERCENT, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.LATE_ESCALATION_DAYS,
                    null, DEFAULT_LATE_ESCALATION_DAYS, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.CHECKIN_GRACE_DAYS,
                    null, DEFAULT_GRACE_DAYS, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.CHECKIN_LATE_FEE_PER_DAY,
                    null, DEFAULT_HANDOVER_LATE_FEE, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.EXTENSION_GRACE_DAYS,
                    null, DEFAULT_GRACE_DAYS, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.EXTENSION_LATE_FEE_PER_DAY,
                    null, DEFAULT_HANDOVER_LATE_FEE, null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.LATE_FEE, null,
                    Math.max(2_000L, rate / 3), null, null));
            rules.add(buildRule(saved, type, PolicyRule.RuleType.WAIVER_CAP, null,
                    10_000L, null, null));
        }
        policyRuleRepository.saveAll(rules);

        return toResponse(saved, facility);
    }

    private PolicyActiveResponse toResponse(RentalPolicy policy, Facility facility) {
        List<PolicyRule> rules = policyRuleRepository.findByPolicy_PolicyId(policy.getPolicyId());
        Integer facilityId = facility.getFacilityId();

        // RENT_RATE theo cơ sở; fallback bản global nếu cơ sở chưa có dòng riêng.
        Map<Integer, PolicyRule> facilityRent = new HashMap<>();
        Map<Integer, PolicyRule> globalRent = new HashMap<>();
        for (PolicyRule r : rules) {
            if (r.getRuleType() != PolicyRule.RuleType.RENT_RATE || r.getType() == null) continue;
            if (r.getFacility() == null) {
                globalRent.put(r.getType().getTypeId(), r);
            } else if (facilityId.equals(r.getFacility().getFacilityId())) {
                facilityRent.put(r.getType().getTypeId(), r);
            }
        }

        List<PolicyRateItem> baseRates = unitTypeRepository.findAll().stream()
                .map(t -> {
                    PolicyRule rent = facilityRent.getOrDefault(
                            t.getTypeId(), globalRent.get(t.getTypeId()));
                    long rate = rent != null
                            ? rent.getValue().longValue()
                            : defaultRateFor(facility, t.getTypeId());
                    return new PolicyRateItem(
                            t.getTypeId().longValue(),
                            t.getName(),
                            t.getDescription(),
                            rate
                    );
                })
                .sorted(java.util.Comparator.comparing(PolicyRateItem::id))
                .toList();

        int latePercent = resolvedInt(rules, facilityId,
                PolicyRule.RuleType.LATE_FEE_PERCENT, DEFAULT_LATE_CHECKOUT_PERCENT);
        int escalationDays = resolvedInt(rules, facilityId,
                PolicyRule.RuleType.LATE_ESCALATION_DAYS, DEFAULT_LATE_ESCALATION_DAYS);
        int depositPercent = resolvedInt(rules, facilityId,
                PolicyRule.RuleType.DEPOSIT_RATE, DEFAULT_DEPOSIT_PERCENT);
        int bufferDays = resolvedInt(rules, facilityId,
                PolicyRule.RuleType.TURNOVER_BUFFER, DEFAULT_TURNOVER_BUFFER_DAYS);
        int checkinGrace = resolvedInt(rules, facilityId,
                PolicyRule.RuleType.CHECKIN_GRACE_DAYS, DEFAULT_GRACE_DAYS);
        int checkinLateFee = resolvedInt(rules, facilityId,
                PolicyRule.RuleType.CHECKIN_LATE_FEE_PER_DAY, (int) DEFAULT_HANDOVER_LATE_FEE);
        int extensionGrace = resolvedInt(rules, facilityId,
                PolicyRule.RuleType.EXTENSION_GRACE_DAYS, DEFAULT_GRACE_DAYS);
        int extensionLateFee = resolvedInt(rules, facilityId,
                PolicyRule.RuleType.EXTENSION_LATE_FEE_PER_DAY, (int) DEFAULT_HANDOVER_LATE_FEE);

        PolicyActiveResponse.Surcharges surcharges = new PolicyActiveResponse.Surcharges(
                latePercent,
                escalationDays,
                depositPercent,
                bufferDays,
                checkinGrace,
                checkinLateFee,
                extensionGrace,
                extensionLateFee
        );

        return new PolicyActiveResponse(
                policy.getPolicyId().longValue(),
                policy.getVersion(),
                policy.getStatus(),
                policy.getUpdatedAt(),
                policy.getUpdatedBy(),
                policy.getEffectiveDate(),
                facility.getFacilityId(),
                facility.getCode(),
                facility.getName(),
                baseRates,
                surcharges
        );
    }

    /** Rule của đúng cơ sở trước, rồi global, rồi bất kỳ (dữ liệu legacy). */
    private Optional<PolicyRule> findResolvedRule(
            List<PolicyRule> rules,
            Integer facilityId,
            PolicyRule.RuleType ruleType,
            Integer unitTypeId
    ) {
        Optional<PolicyRule> facilityRule = rules.stream()
                .filter(r -> r.getRuleType() == ruleType)
                .filter(r -> unitTypeId == null
                        || (r.getType() != null && unitTypeId.equals(r.getType().getTypeId())))
                .filter(r -> r.getFacility() != null
                        && facilityId.equals(r.getFacility().getFacilityId()))
                .findFirst();
        if (facilityRule.isPresent()) {
            return facilityRule;
        }
        Optional<PolicyRule> globalRule = rules.stream()
                .filter(r -> r.getRuleType() == ruleType)
                .filter(r -> unitTypeId == null
                        || (r.getType() != null && unitTypeId.equals(r.getType().getTypeId())))
                .filter(r -> r.getFacility() == null)
                .findFirst();
        if (globalRule.isPresent()) {
            return globalRule;
        }
        return rules.stream()
                .filter(r -> r.getRuleType() == ruleType)
                .filter(r -> unitTypeId == null
                        || (r.getType() != null && unitTypeId.equals(r.getType().getTypeId())))
                .findFirst();
    }

    private int resolvedInt(
            List<PolicyRule> rules,
            Integer facilityId,
            PolicyRule.RuleType ruleType,
            int fallback
    ) {
        return findResolvedRule(rules, facilityId, ruleType, null)
                .map(r -> r.getValue().intValue())
                .orElse(fallback);
    }

    private long resolvedLong(
            List<PolicyRule> rules,
            Integer facilityId,
            PolicyRule.RuleType ruleType,
            long fallback
    ) {
        return findResolvedRule(rules, facilityId, ruleType, null)
                .map(r -> r.getValue().longValue())
                .orElse(fallback);
    }

    private Optional<PolicyRule> currentRentFor(
            List<PolicyRule> currentRules,
            Facility facility,
            Integer typeId
    ) {
        return findResolvedRule(currentRules, facility.getFacilityId(),
                PolicyRule.RuleType.RENT_RATE, typeId);
    }

    private long defaultRateFor(Facility facility, Integer typeId) {
        return DEFAULT_DAILY_RATES_BY_FACILITY
                .getOrDefault(facility.getCode(), Map.of())
                .getOrDefault(typeId, FALLBACK_DAILY_RATE);
    }

    /** Copy RENT_RATE của các cơ sở khác sang version mới, giữ nguyên giá của họ. */
    private void copyOtherFacilityRentRules(
            List<PolicyRule> currentRules,
            RentalPolicy target,
            Integer targetFacilityId,
            List<PolicyRule> out
    ) {
        for (PolicyRule r : currentRules) {
            if (r.getRuleType() != PolicyRule.RuleType.RENT_RATE) continue;
            boolean otherFacility = r.getFacility() != null
                    && !targetFacilityId.equals(r.getFacility().getFacilityId());
            boolean globalFallback = r.getFacility() == null;
            if (!otherFacility && !globalFallback) continue;
            out.add(buildRule(target, r.getType(), PolicyRule.RuleType.RENT_RATE,
                    null, r.getValue().longValue(), null, r.getFacility()));
        }
    }

    private void copyRuleAsGlobal(
            List<PolicyRule> currentRules,
            Facility facility,
            UnitType type,
            PolicyRule.RuleType ruleType,
            RentalPolicy target,
            List<PolicyRule> out
    ) {
        findResolvedRule(currentRules, facility.getFacilityId(), ruleType, type.getTypeId())
                .ifPresent(r -> out.add(buildRule(
                        target,
                        type,
                        ruleType,
                        r.getSurchargeType(),
                        r.getValue().longValue(),
                        r.getCap() != null ? r.getCap().longValue() : null,
                        null
                )));
    }

    private RentalPolicy deactivateAndCreateVersion(RentalPolicy current, String actorEmail) {
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
        return rentalPolicyRepository.save(created);
    }

    private Facility requireActiveFacility(Integer facilityId) {
        if (facilityId == null) {
            throw new BusinessRuleException(
                    "facilityId là bắt buộc — chính sách giá phải được lưu theo từng cơ sở.");
        }
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new BusinessRuleException(
                        "Cơ sở không tồn tại: " + facilityId));
        if (facility.getStatus() == null || facility.getStatus() != 1) {
            throw new BusinessRuleException("Cơ sở đã đóng cửa: " + facilityId);
        }
        return facility;
    }

    private Facility resolveFacilityForRead(RentalPolicy activePolicy, Integer facilityId) {
        if (facilityId != null) {
            return requireActiveFacility(facilityId);
        }
        Integer inferred = policyRuleRepository.findByPolicy_PolicyId(activePolicy.getPolicyId()).stream()
                .filter(r -> r.getRuleType() == PolicyRule.RuleType.RENT_RATE)
                .filter(r -> r.getFacility() != null)
                .map(r -> r.getFacility().getFacilityId())
                .min(Integer::compareTo)
                .orElse(null);
        if (inferred != null) {
            return requireActiveFacility(inferred);
        }
        return facilityRepository.findByStatusOrderByFacilityIdAsc(1).stream()
                .findFirst()
                .orElseThrow(() -> new BusinessRuleException("Chưa có cơ sở đang hoạt động."));
    }

    private PolicyRule buildRule(
            RentalPolicy policy,
            UnitType type,
            PolicyRule.RuleType ruleType,
            PolicyRule.SurchargeType surchargeType,
            long value,
            Long cap,
            Facility facility
    ) {
        PolicyRule r = new PolicyRule();
        r.setPolicy(policy);
        r.setType(type);
        r.setRuleType(ruleType);
        r.setSurchargeType(surchargeType);
        r.setValue(java.math.BigDecimal.valueOf(value));
        r.setCap(cap != null ? java.math.BigDecimal.valueOf(cap) : null);
        r.setFacility(facility);
        return r;
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

    private RentalPolicy requireActivePolicyForUpdate() {
        return rentalPolicyRepository.findForUpdateByStatus(1)
                .orElseThrow(() -> new BusinessRuleException(
                        "Hệ thống chưa có chính sách giá hiệu lực."));
    }
}
