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
 * Thông báo in-app (FR-33). type là registry mở — map String, không enum
 * (danh sách loại thông báo không đóng).
 */
@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    /** Loại thông báo — registry mở, validate ở service. */
    private String type;

    private String title;

    /** Route FE tương đối (VD: /reservations/BK-2025-001) — không chứa origin. */
    private String deepLink;

    private Boolean isRead;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
