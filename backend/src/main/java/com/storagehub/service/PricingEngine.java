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

        List<PolicyRule> rules = policyRuleRepository.findByPolicy_PolicyId(activePolicy.getPolicyId());

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
                activePolicy.getVersion()
        );
    }
}
