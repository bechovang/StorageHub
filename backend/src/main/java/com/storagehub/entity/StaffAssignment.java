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
        FULL_DAY,
        EVENING
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assignmentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id")
    private User staff;

    @jakarta.persistence.ManyToMany(fetch = FetchType.LAZY)
    @jakarta.persistence.JoinTable(
            name = "staff_assignment_types",
            joinColumns = @jakarta.persistence.JoinColumn(name = "assignment_id"),
            inverseJoinColumns = @jakarta.persistence.JoinColumn(name = "unit_type_id")
    )
    private java.util.Set<UnitType> unitTypes = new java.util.LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    private Shift shift;

    /** Ngày nghiệp vụ theo lịch ICT (AD-7). */
    private LocalDate workDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    /** Convenience cho code cũ/test: một loại kho duy nhất. */
    public UnitType getUnitType() {
        return unitTypes == null || unitTypes.isEmpty() ? null : unitTypes.iterator().next();
    }

    public void setUnitType(UnitType type) {
        if (unitTypes == null) {
            unitTypes = new java.util.LinkedHashSet<>();
        }
        unitTypes.clear();
        if (type != null) {
            unitTypes.add(type);
        }
    }
}
