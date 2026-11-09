package com.storagehub.service;

import com.storagehub.dto.quote.QuoteLineResponse;
import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Unit;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Nguồn chân lý duy nhất cho mọi dòng tiền theo AD-11 (Pricing Single-Source).
 * Mô hình thuê THEO NGÀY: RENT_RATE = đơn giá ₫/ngày, kỳ thuê tính theo số
 * ngày (end inclusive — AD-7), tối thiểu 1 ngày.
 * Cọc có sàn MIN_DEPOSIT để mọi giao dịch chuyển khoản (PayOS) luôn vượt
 * ngưỡng tối thiểu 2.000 ₫ của cổng thanh toán.
 */
@Component
@RequiredArgsConstructor
public class PricingEngine {

    /** Sàn tiền cọc — bảo đảm giao dịch PayOS luôn ≥ 2.000 ₫. */
    public static final long MIN_DEPOSIT = 5_000L;

    private final RentalPolicyRepository rentalPolicyRepository;
    private final PolicyRuleRepository policyRuleRepository;

    public QuoteResponse calculateQuote(Unit unit, LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }
        RentalPolicy activePolicy = rentalPolicyRepository.findByStatus(1)
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có chính sách giá hiệu lực"));
        return calculateQuote(unit, startDate, endDate, activePolicy);
    }

    /** Tính quote theo đúng policy snapshot (reservation/contract), không dùng active. */
    public QuoteResponse calculateQuote(
            Unit unit,
            LocalDate startDate,
            LocalDate endDate,
            RentalPolicy policy
    ) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }

        RentalPolicy activePolicy = policy != null
                ? policy
                : rentalPolicyRepository.findByStatus(1)
                    .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có chính sách giá hiệu lực"));

        List<PolicyRule> rules = resolveRules(
                unit, policyRuleRepository.findByPolicy_PolicyId(activePolicy.getPolicyId()));

        long dailyRent = 0L;
        int depositPercent = 10; // Mặc định 10% nếu chưa cấu hình

        Integer typeId = unit.getType().getTypeId();
        for (PolicyRule r : rules) {
            if (r.getType().getTypeId().equals(typeId)) {
                if (r.getRuleType() == PolicyRule.RuleType.RENT_RATE) {
                    dailyRent = r.getValue().longValue();
                } else if (r.getRuleType() == PolicyRule.RuleType.DEPOSIT_RATE) {
                    depositPercent = r.getValue().intValue();
                }
            }
        }

        // Số ngày thuê (end inclusive theo chuẩn AD-7 & contract)
        int durationDays = (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;

        long totalRent = dailyRent * durationDays;
        long depositAmount = Math.max((totalRent * depositPercent) / 100, MIN_DEPOSIT);
        long dueNow = depositAmount; // Tại bước đặt kho, khoản phải trả ngay là tiền cọc (booking deposit)

        List<QuoteLineResponse> lines = new ArrayList<>();

        // 1. Dòng tiền thuê (RENT)
        String formattedRent = String.format(Locale.GERMANY, "%,d ₫", dailyRent);
        String rentLabel = String.format("Rent %s/ngày × %d ngày", formattedRent, durationDays);
        lines.add(new QuoteLineResponse("RENT", "RENT_RATE", rentLabel, totalRent, false));

        // 2. Dòng tiền cọc (DEPOSIT)
        String depositLabel = String.format("Deposit (%d%%, tối thiểu %,d ₫, hoàn lại)", depositPercent, MIN_DEPOSIT);
        lines.add(new QuoteLineResponse("DEPOSIT", "DEPOSIT_RATE", depositLabel, depositAmount, true));

        return new QuoteResponse(
                unit.getUnitId(),
                startDate,
                endDate,
                durationDays,
                lines,
                totalRent,
                depositAmount,
                dueNow,
                activePolicy.getVersion(),
                activePolicy.getPolicyId(),
                depositPercent,
                MIN_DEPOSIT
        );
    }

    /** Đọc rule số nguyên theo policy snapshot + facility; fallback mặc định. */
    public int ruleInt(Unit unit, RentalPolicy policy, PolicyRule.RuleType ruleType, int fallback) {
        return (int) ruleLong(unit, policy, ruleType, fallback);
    }

    public long ruleLong(Unit unit, RentalPolicy policy, PolicyRule.RuleType ruleType, long fallback) {
        RentalPolicy resolved = policy != null
                ? policy
                : rentalPolicyRepository.findByStatus(1).orElse(null);
        if (resolved == null || unit == null || unit.getType() == null) {
            return fallback;
        }
        return resolveRules(unit, policyRuleRepository.findByPolicy_PolicyId(resolved.getPolicyId())).stream()
                .filter(r -> r.getRuleType() == ruleType)
                .filter(r -> r.getType() != null
                        && r.getType().getTypeId().equals(unit.getType().getTypeId()))
                .map(r -> r.getValue().longValue())
                .findFirst()
                .orElse(fallback);
    }

    /** Rule của policy đang hiệu lực, đã merge theo facility của unit. */
    public List<PolicyRule> resolveRules(Unit unit, RentalPolicy policy) {
        RentalPolicy resolved = policy != null
                ? policy
                : rentalPolicyRepository.findByStatus(1).orElse(null);
        if (resolved == null) {
            return List.of();
        }
        return resolveRules(unit, policyRuleRepository.findByPolicy_PolicyId(resolved.getPolicyId()));
    }

    /**
     * Merge rule theo (unit type, rule type): facility-specific thắng global.
     * Không trộn rule của cơ sở khác — thiếu rule facility thì dùng global.
     */
    public List<PolicyRule> resolveRules(Unit unit, List<PolicyRule> all) {
        if (all == null || all.isEmpty()) {
            return List.of();
        }
        Integer facilityId = facilityIdOf(unit);
        java.util.Map<String, PolicyRule> merged = new java.util.LinkedHashMap<>();
        for (PolicyRule r : all) {
            if (r.getType() == null || r.getRuleType() == null) {
                continue;
            }
            if (r.getFacility() != null
                    && (facilityId == null || !facilityId.equals(r.getFacility().getFacilityId()))) {
                continue;
            }
            String key = r.getType().getTypeId() + "|" + r.getRuleType().name();
            PolicyRule existing = merged.get(key);
            if (existing == null || (existing.getFacility() == null && r.getFacility() != null)) {
                merged.put(key, r);
            }
        }
        return new ArrayList<>(merged.values());
    }

    private Integer facilityIdOf(Unit unit) {
        return unit != null && unit.getZone() != null && unit.getZone().getFacility() != null
                ? unit.getZone().getFacility().getFacilityId()
                : null;
    }
}
