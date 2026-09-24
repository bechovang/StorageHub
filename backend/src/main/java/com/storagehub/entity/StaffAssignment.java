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

/** Lịch trực staff theo ngày + ca + zone (FR-27). Ghi qua StaffingService duy nhất (AD-6). */
@Getter
@Setter
@Entity
@Table(name = "staff_assignments")
public class StaffAssignment {

    public enum Shift {
        MORNING,
        AFTERNOON,
        EVENING
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assignmentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id")
    private User staff;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @Enumerated(EnumType.STRING)
    private Shift shift;

    /** Ngày nghiệp vụ theo lịch ICT (AD-7). */
    private LocalDate workDate;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
