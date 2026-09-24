package com.storagehub.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Quyết toán khi trả kho: kiểm tra hư hại → tính phí / hoàn cọc (FR-19/20).
 * Ghi qua CheckoutService duy nhất (AD-6).
 */
@Getter
@Setter
@Entity
@Table(name = "settlements")
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long settlementId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id")
    private User staff;

    /** Phí hư hại (0 nếu kho sạch) — VND DECIMAL(15,0) (AD-7). */
    private BigDecimal damageFee;

    private String damageReason;

    /** Số tiền hoàn cọc — VND DECIMAL(15,0) (AD-7). */
    private BigDecimal refundAmount;

    /** Mã phiếu quyết toán TL-... — duy nhất. */
    private String receiptCode;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
