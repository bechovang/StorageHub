package com.storagehub.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Vai trò hệ thống (reference data, 5 dòng seed sẵn trong V1).
 * Name là tên máy UPPER_SNAKE, khớp JWT claim (AD-5) và machine code (AD-8).
 */
@Getter
@Setter
@Entity
@Table(name = "roles")
public class Role {

    /** 4+1 vai trò: CUSTOMER / STAFF / FACILITY_MANAGER / BUSINESS_OPS / SYSTEM_ADMIN (PRD FR-37..41). */
    public enum Name {
        CUSTOMER,
        STAFF,
        FACILITY_MANAGER,
        BUSINESS_OPS,
        SYSTEM_ADMIN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer roleId;

    @Enumerated(EnumType.STRING)
    private Name name;

    private String description;
}
