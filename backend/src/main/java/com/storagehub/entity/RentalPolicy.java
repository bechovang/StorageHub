package com.storagehub.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;

/**
 * Chính sách giá theo phiên bản có ngày hiệu lực (FR-29/30). Contract snapshot policy_id
 * tại lúc draft — PricingEngine resolve phiên bản hiệu lực (AD-11).
 */
@Getter
@Setter
@Entity
@Table(name = "rental_policies")
public class RentalPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer policyId;

    /** Tên phiên bản: v2, v3... — duy nhất. */
    private String version;

    /** Ngày hiệu lực (ICT). */
    private LocalDate effectiveDate;

    /** 0 = nháp, 1 = đang dùng, 2 = ngừng. */
    @JdbcTypeCode(SqlTypes.TINYINT)
    private Integer status;
}
