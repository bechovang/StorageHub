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

import java.time.LocalDateTime;

/**
 * Audit trail hệ thống (FR-35) — append-only qua LogService (AD-6), không update/xóa.
 * entity_type / action là registry mở — map String, không enum.
 */
@Getter
@Setter
@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id")
    private User actor;

    /** Bảng/nghiệp vụ bị tác động — registry mở. */
    private String entityType;

    private Long entityId;

    /** Hành động — registry mở. */
    private String action;

    /** Giá trị trước / sau (snapshot ngắn) — nullable. */
    private String fromValue;

    private String toValue;

    private String reason;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
