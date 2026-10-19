package com.storagehub.repository;

import com.storagehub.entity.Extension;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

/**
 * AD-6: ExtensionService duy nhất ghi bảng extensions.
 * PENDING_PAYMENT chỉ tồn tại 1 row "sống" mỗi reservation — single live
 * payment invariant của AD-9 làm "extension mới nhất chờ trả" trở nên duy nhất.
 */
public interface ExtensionRepository extends JpaRepository<Extension, Long> {

    /** Extension PENDING_PAYMENT mới nhất của reservation — handler dùng để apply. */
    Optional<Extension> findFirstByReservation_ReservationIdAndStatusOrderByExtensionIdDesc(
            Long reservationId, Extension.Status status);

    /** Idempotent: bấm "xác nhận" 2 lần với cùng newEndDate → tái dùng row đang chờ. */
    Optional<Extension> findFirstByReservation_ReservationIdAndStatusAndNewEndDateOrderByExtensionIdDesc(
            Long reservationId, Extension.Status status, LocalDate newEndDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Extension e WHERE e.extensionId = :extensionId")
    Optional<Extension> findByIdForUpdate(@Param("extensionId") Long extensionId);
}
