package com.storagehub.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    public static final int STATUS_OFF = 0;
    public static final int STATUS_ACTIVE = 1;
    public static final int STATUS_LOCKED = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "status", nullable = false)
    private Byte status;

    protected User() {
    }

    public User(
            Long id,
            String fullName,
            String email,
            String phone,
            String passwordHash,
            Role role,
            Byte status
    ) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = status;
    }

    public boolean isActive() {
        return status != null && status == STATUS_ACTIVE;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public Byte getStatus() {
        return status;
    }
}