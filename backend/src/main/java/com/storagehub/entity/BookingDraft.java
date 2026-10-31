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
 * Giữ chỗ tạm trước khi trả cọc — KHÔNG phải đơn thuê.
 * Khách chỉ nhận Reservation (RESERVED) sau khi PayOS xác nhận cọc; draft
 * hết hạn sau 30 phút và tự nhả chỗ. Chỉ owner service này ghi bảng.
 */
@Getter
@Setter
@Entity
@Table(name = "booking_drafts")
public class BookingDraft {

    public enum Status {
        PENDING,
        CONVERTED,
        EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long draftId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    private LocalDate startDate;

    private LocalDate endDate;

    private BigDecimal depositAmount;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime expiresAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
