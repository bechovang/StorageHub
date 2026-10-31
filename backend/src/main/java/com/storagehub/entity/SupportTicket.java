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

import java.time.LocalDateTime;

/**
 * Ticket sự cố của khách trên 1 unit (FR-21..24). ESCALATED suy diễn từ existence
 * của escalation; assigned_staff nullable = chưa phân công. Ghi qua TicketService (AD-6).
 */
@Getter
@Setter
@Entity
@Table(name = "support_tickets")
public class SupportTicket {

    public enum IncidentType {
        LOST_ACCESS,
        DEVICE_ISSUE,
        SECURITY,
        CLEANLINESS,
        OTHER
    }

    public enum Status {
        OPEN,
        IN_PROGRESS,
        RESOLVED,
        ESCALATED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketId;

    /** Mã hiển thị SR-... — duy nhất. */
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    /** Nullable — liên kết reservation khi sự cố gắn phiên thuê cụ thể. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @Enumerated(EnumType.STRING)
    private IncidentType incidentType;

    /** Mô tả sự cố của khách (V20). */
    private String description;

    /** Phương án xử lý của quản lý khi điều phối (V20). */
    private String managerPlan;

    /** NORMAL / SEVERE — mức độ điều phối (V20). */
    private String severityMode;

    /** Kho thay thế khi di dời khẩn cấp SEVERE (V20). */
    private String relocatedUnitCode;

    /** Ghi chú kết quả xử lý (V20). */
    private String resolutionNote;

    /** Lý do chuyển cấp lên quản lý (V20). */
    private String escalationReason;

    private LocalDateTime resolvedAt;

    @Enumerated(EnumType.STRING)
    private Status status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
