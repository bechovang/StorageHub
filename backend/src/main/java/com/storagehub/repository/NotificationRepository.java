package com.storagehub.repository;

import com.storagehub.entity.Notification;
import com.storagehub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Đếm số thông báo chưa đọc của user cho bell badge (FR-33). */
    long countByUserAndIsReadFalse(User user);

    /** Lấy feed thông báo theo user có phân trang (FR-34). */
    Page<Notification> findByUser(User user, Pageable pageable);

    /** Lấy thông báo chưa đọc của user có phân trang (FR-34 unread-only). */
    Page<Notification> findByUserAndIsReadFalse(User user, Pageable pageable);

    /** Đánh dấu tất cả thông báo của user là đã đọc (FR-34). */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user AND n.isRead = false")
    int markAllAsReadByUser(@Param("user") User user);
}
