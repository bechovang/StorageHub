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

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Task vận hành nhật ký (check-in/out, dọn kho, support, in hợp đồng) gán cho staff
 * theo ngày (FR-25). refCode trỏ mã nghiệp vụ (BK-/CT-/SR-...) — đa hình, không FK.
 * Ghi qua TaskService (AD-6).
 */
@Getter
@Setter
@Entity
@Table(name = "tasks")
public class Task {

    public enum Type {
        CHECK_IN,
        CHECKOUT,
        CLEANING,
        SUPPORT,
        CONTRACT
    }

    public enum Status {
        TODO,
        IN_PROGRESS,
        DONE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long taskId;

    @Enumerated(EnumType.STRING)
    private Type type;

    /** Mã nghiệp vụ tham chiếu (BK-..., CT-..., SR-...) — nullable, đa hình. */
    private String refCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;

    private LocalDate workDate;

    @Enumerated(EnumType.STRING)
    private Status status;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
