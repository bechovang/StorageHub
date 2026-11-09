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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Case trễ checkout do manager xử lý (V42).
 * LATE = đang trễ 1..ngưỡng, staff vẫn tất toán được; PENDING_MANAGER = đã quá ngưỡng,
 * staff bị chặn cho đến khi manager EXTEND/LIQUIDATE. Không thay đổi status reservation
 * (AD-4: lateness là derived state).
 */
@Getter
@Setter
@Entity
@Table(name = "late_checkout_cases")
public class LateCheckoutCase {

    public enum Status {
        LATE,
        PENDING_MANAGER,
        EXTENDED,
        RESOLVED,
        LIQUIDATED
    }

    public enum Decision {
        EXTEND,
        LIQUIDATE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long caseId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", unique = true)
    private Reservation reservation;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Enumerated(EnumType.STRING)
    private Decision decision;

    private Integer daysLate;

    private BigDecimal accruedFee;

    private Integer escalationCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    private Integer extensionDays;

    private LocalDate extendedUntil;

    private String reason;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id")
    private Settlement settlement;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime decidedAt;
}
