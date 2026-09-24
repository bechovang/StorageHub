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
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Yêu cầu gia hạn: endDate chỉ dịch khi phí được thanh toán (APPLIED).
 * Ghi qua ExtensionService duy nhất (AD-6).
 */
@Getter
@Setter
@Entity
@Table(name = "extensions")
public class Extension {

    public enum Status {
        PENDING_PAYMENT,
        APPLIED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long extensionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    private LocalDate oldEndDate;

    private LocalDate newEndDate;

    /** Phí gia hạn — VND DECIMAL(15,0) (AD-7). */
    private BigDecimal extensionFee;

    @Enumerated(EnumType.STRING)
    private Status status;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
