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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Escalation lên quản lý (FR-23/24): manager quyết định chuyển khách sang unit khác
 * (MAINTENANCE_RELOCATE) hay trả lại cho staff xử lý (RETURN_TO_STAFF).
 * Ghi qua TicketService (AD-6).
 */
@Getter
@Setter
@Entity
@Table(name = "escalations")
public class Escalation {

    public enum Decision {
        PENDING,
        MAINTENANCE_RELOCATE,
        RETURN_TO_STAFF
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long escalationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id")
    private SupportTicket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "escalated_by_staff_id")
    private User escalatedByStaff;

    /** Nullable — quản lý chưa nhận xử lý. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    /** Mô tả tình huống — TEXT. */
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    private String note;

    @Enumerated(EnumType.STRING)
    private Decision decision;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
