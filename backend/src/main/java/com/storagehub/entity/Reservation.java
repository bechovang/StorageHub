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
 * V3: 1 bản ghi trọn vòng đời đặt chỗ → thuê → trả; CHECKED_IN = "đang thuê".
 * Ghi qua ReservationService duy nhất (AD-6). Trạng thái EXPIRED là suy diễn on-read
 * theo AD-4 — không bao giờ persist vào cột này; CANCELLED dự phòng (v1 không kích hoạt).
 */
@Getter
@Setter
@Entity
@Table(name = "reservations")
public class Reservation {

    public enum Status {
        PENDING_PAYMENT,
        RESERVED,
        CHECKED_IN,
        CHECKOUT_REQUESTED,
        CLOSED,
        /** Suy diễn on-read (AD-4) — chỉ xuất hiện trong DTO, không lưu DB. */
        EXPIRED,
        /** Dự phòng — v1 không kích hoạt. */
        CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservationId;

    /** Mã hiển thị BK-... — duy nhất suốt vòng đời. */
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    /** Ngày bắt đầu (đã cộng turnover buffer) — ngữ nghĩa ICT (AD-7). */
    private LocalDate startDate;

    /** Dịch ngay khi phí gia hạn được thanh toán. */
    private LocalDate endDate;

    /** Cọc 10% giữ suốt phiên (top-up khi gia hạn) — VND DECIMAL(15,0) (AD-7). */
    private BigDecimal depositAmount;

    /** Cấp khi check-in — sensitive, chỉ reveal qua endpoint có permission (AD-5). */
    private String accessCode;

    @Enumerated(EnumType.STRING)
    private Status status;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
