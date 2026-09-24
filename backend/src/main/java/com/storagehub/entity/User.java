package com.storagehub.entity;

import jakarta.persistence.Entity;
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
 * Bản ghi trung tâm dùng chung 5 vai trò (AD-5). Ghi qua UserService duy nhất (AD-6).
 * createdAt UTC do app ghi (AD-7).
 */
@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String fullName;

    private String email;

    private String phone;

    private String passwordHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id")
    private Role role;

    /** Nullable — demo 1 facility, scoping đa facility cho FACILITY_MANAGER (AD-6 delta 4). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id")
    private Facility facility;

    /** 0 = off, 1 = active, 2 = locked — filter kiểm tra mỗi request, token của tài khoản lock hết hiệu lực ngay (AD-5). */
    @JdbcTypeCode(SqlTypes.TINYINT)
    private Integer status;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
