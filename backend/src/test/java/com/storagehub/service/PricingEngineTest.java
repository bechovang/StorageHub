package com.storagehub.service;

import com.storagehub.dto.quote.QuoteLineResponse;
import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Unit;
import com.storagehub.entity.UnitType;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PricingEngineTest {

    @Mock
    private RentalPolicyRepository rentalPolicyRepository;

    @Mock
    private PolicyRuleRepository policyRuleRepository;

    @InjectMocks
    private PricingEngine pricingEngine;

    private UnitType typeS;
    private Unit unit;
    private RentalPolicy activePolicy;

    @BeforeEach
    void setUp() {
        typeS = new UnitType();
        typeS.setTypeId(2);
        typeS.setName("S");

        unit = new Unit();
        unit.setUnitId(3L);
        unit.setCode("S-3");
        unit.setType(typeS);
        unit.setSizeM2(new BigDecimal("5.00"));

        activePolicy = new RentalPolicy();
        activePolicy.setPolicyId(2);
        activePolicy.setVersion("v3");
        activePolicy.setStatus(1);
    }

    @Test
    @DisplayName("calculateQuote tính chính xác tiền thuê, tiền cọc và hạn thuê")
    void testCalculateQuote_Success() {
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));

        PolicyRule rentRule = new PolicyRule();
        rentRule.setType(typeS);
        rentRule.setRuleType(PolicyRule.RuleType.RENT_RATE);
        rentRule.setValue(new BigDecimal("345000"));

        PolicyRule depositRule = new PolicyRule();
        depositRule.setType(typeS);
        depositRule.setRuleType(PolicyRule.RuleType.DEPOSIT_RATE);
        depositRule.setValue(new BigDecimal("10"));

        when(policyRuleRepository.findByPolicy_PolicyId(2)).thenReturn(List.of(rentRule, depositRule));

        LocalDate startDate = LocalDate.of(2026, 10, 3);
        QuoteResponse quote = pricingEngine.calculateQuote(unit, startDate, 3);

        assertThat(quote.unitId()).isEqualTo(3L);
        assertThat(quote.startDate()).isEqualTo(LocalDate.of(2026, 10, 3));
        assertThat(quote.endDate()).isEqualTo(LocalDate.of(2027, 1, 2));
        assertThat(quote.durationMonths()).isEqualTo(3);
        assertThat(quote.totalRent()).isEqualTo(1035000L);
        assertThat(quote.depositAmount()).isEqualTo(103500L);
        assertThat(quote.dueNow()).isEqualTo(103500L);
        assertThat(quote.policyVersion()).isEqualTo("v3");

        assertThat(quote.lines()).hasSize(2);
        QuoteLineResponse rentLine = quote.lines().get(0);
        assertThat(rentLine.kind()).isEqualTo("RENT");
        assertThat(rentLine.code()).isEqualTo("RENT_RATE");
        assertThat(rentLine.amount()).isEqualTo(1035000L);
        assertThat(rentLine.refundable()).isFalse();

        QuoteLineResponse depositLine = quote.lines().get(1);
        assertThat(depositLine.kind()).isEqualTo("DEPOSIT");
        assertThat(depositLine.code()).isEqualTo("DEPOSIT_RATE");
        assertThat(depositLine.amount()).isEqualTo(103500L);
        assertThat(depositLine.refundable()).isTrue();
    }

    @Test
    @DisplayName("calculateQuote ném ngoại lệ khi durationMonths < 1")
    void testCalculateQuote_InvalidDuration() {
        assertThatThrownBy(() -> pricingEngine.calculateQuote(unit, LocalDate.of(2026, 10, 3), 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Thời hạn thuê tối thiểu 1 tháng");
    }

    @Test
    @DisplayName("calculateQuote ném ngoại lệ khi không có chính sách giá hiệu lực")
    void testCalculateQuote_NoActivePolicy() {
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pricingEngine.calculateQuote(unit, LocalDate.of(2026, 10, 3), 3))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Hệ thống chưa có chính sách giá hiệu lực");
    }
}
