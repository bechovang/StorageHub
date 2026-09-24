package com.storagehub.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Luật giá áp cho từng (policy, unit type). Ghi qua PolicyService (AD-6); đọc qua PricingEngine (AD-11). */
@Getter
@Setter
@Entity
@Table(name = "policy_rules")
public class PolicyRule {

    public enum RuleType {
        DEPOSIT_RATE,
        RENT_RATE,
        LATE_FEE,
        SURCHARGE,
        TURNOVER_BUFFER,
        DISCOUNT,
        WAIVER_CAP
    }

    /** Chỉ áp dụng cho SURCHARGE / DISCOUNT: PERCENT (%) hoặc FIXED (đồng). */
    public enum SurchargeType {
        PERCENT,
        FIXED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ruleId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "policy_id")
    private RentalPolicy policy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "type_id")
    private UnitType type;

    @Enumerated(EnumType.STRING)
    private RuleType ruleType;

    /** Nullable — chỉ SURCHARGE / DISCOUNT dùng. */
    @Enumerated(EnumType.STRING)
    private SurchargeType surchargeType;

    /** Giá trị luật: tiền VND (DECIMAL(15,0), AD-7) hoặc % / số ngày theo ruleType. */
    private BigDecimal value;

    /** Trần phụ thu (%) — nullable, chỉ SURCHARGE. */
    private BigDecimal cap;
}
