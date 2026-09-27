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
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Nguồn chân lý duy nhất cho mọi dòng tiền theo AD-11 (Pricing Single-Source).
 * Mọi số liệu tại Unit Detail, Booking Summary, Payment Modal, Contract đều
 * sinh từ PricingEngine đọc Policy active.
 */
@Component
@RequiredArgsConstructor
public class PricingEngine {

    private final RentalPolicyRepository rentalPolicyRepository;
    private final PolicyRuleRepository policyRuleRepository;

    public QuoteResponse calculateQuote(Unit unit, LocalDate startDate, int durationMonths) {
        if (durationMonths < 1) {
            throw new IllegalArgumentException("Thời hạn thuê tối thiểu 1 tháng");
        }

        RentalPolicy activePolicy = rentalPolicyRepository.findByStatus(1)
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có chính sách giá hiệu lực"));

        List<PolicyRule> rules = policyRuleRepository.findByPolicy_PolicyId(activePolicy.getPolicyId());

        long monthlyRent = 0L;
        int depositPercent = 10; // Mặc định 10% nếu chưa cấu hình

        Integer typeId = unit.getType().getTypeId();
        for (PolicyRule r : rules) {
            if (r.getType().getTypeId().equals(typeId)) {
                if (r.getRuleType() == PolicyRule.RuleType.RENT_RATE) {
                    monthlyRent = r.getValue().longValue();
                } else if (r.getRuleType() == PolicyRule.RuleType.DEPOSIT_RATE) {
                    depositPercent = r.getValue().intValue();
                }
            }
        }

        // Ngày kết thúc thuê (inclusive theo chuẩn AD-7 & contract)
        LocalDate endDate = startDate.plusMonths(durationMonths).minusDays(1);

        long totalRent = monthlyRent * durationMonths;
        long depositAmount = (totalRent * depositPercent) / 100;
        long dueNow = depositAmount; // Tại bước đặt kho, khoản phải trả ngay là tiền cọc (booking deposit)

        List<QuoteLineResponse> lines = new ArrayList<>();

        // 1. Dòng tiền thuê (RENT)
        String formattedRent = String.format(Locale.GERMANY, "%,d ₫", monthlyRent);
        String rentLabel = String.format("Rent %s × %d months", formattedRent, durationMonths);
        lines.add(new QuoteLineResponse("RENT", "RENT_RATE", rentLabel, totalRent, false));

        // 2. Dòng tiền cọc (DEPOSIT)
        String depositLabel = String.format("Deposit (%d%%, refundable)", depositPercent);
        lines.add(new QuoteLineResponse("DEPOSIT", "DEPOSIT_RATE", depositLabel, depositAmount, true));

        return new QuoteResponse(
                unit.getUnitId(),
                startDate,
                endDate,
                durationMonths,
                lines,
                totalRent,
                depositAmount,
                dueNow,
                activePolicy.getVersion()
        );
    }
}
