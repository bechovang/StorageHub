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
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Giao dịch thanh toán 1-nhiều mục đích (cọc / thuê / gia hạn / hư hại / phát sinh).
 * CHECK ở DB: đúng 1 trong reservation / extension / settlement NOT NULL — service
 * phải tự đảm bảo vì validate không kiểm CHECK. Ghi qua PaymentService duy nhất (AD-6);
 * gateway là mock (AD-9).
 */
@Getter
@Setter
@Entity
@Table(name = "payments")
public class Payment {

    public enum Purpose {
        DEPOSIT,
        RENT,
        EXTENSION_FEE,
        DAMAGE_FEE,
        EXTRA_FEE
    }

    public enum Method {
        CARD,
        MOMO,
        VNPAY
    }

    public enum Status {
        PENDING,
        PROCESSING,
        SUCCEEDED,
        FAILED,
        EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    /** Mã biên lai RT-... — duy nhất. */
    private String receiptCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payer_id")
    private User payer;

    /** Nguồn giao dịch — đúng 1 trong 3 NOT NULL (CHECK ở DB). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "extension_id")
    private Extension extension;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id")
    private Settlement settlement;

    @Enumerated(EnumType.STRING)
    private Purpose purpose;

    @Enumerated(EnumType.STRING)
    private Method method;

    /** Số tiền — VND DECIMAL(15,0) (AD-7). */
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private Status status;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
