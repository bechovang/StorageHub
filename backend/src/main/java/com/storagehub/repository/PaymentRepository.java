package com.storagehub.repository;

import com.storagehub.entity.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /** Lock biên khi resolve (poll/confirm đua nhau) — chống handler chạy 2 lần. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.paymentId = :paymentId")
    Optional<Payment> findByIdForUpdate(@Param("paymentId") Long paymentId);

    /**
     * Load kèm payer + reservation (+unit, type) cho ownership check và build DTO
     * ngoài transaction. US-8: mọi payment đều gắn reservation (DEPOSIT/RENT).
     */
    @Query("""
            SELECT p FROM Payment p
            JOIN FETCH p.payer
            JOIN FETCH p.reservation r
            JOIN FETCH r.unit u
            JOIN FETCH u.type
            WHERE p.paymentId = :paymentId
            """)
    Optional<Payment> findByIdWithAssociations(@Param("paymentId") Long paymentId);

    /** US-9/US-11: lịch sử payment của reservation (ReservationService, ContractService). */
    List<Payment> findByReservation_ReservationId(Long reservationId);

    Page<Payment> findByReservation_ReservationId(Long reservationId, Pageable pageable);

    /** Duplicate check — payment active (PENDING/PROCESSING) hoặc đã SUCCEEDED cho (reservation, purpose). */
    boolean existsByReservation_ReservationIdAndPurposeAndStatusIn(
            Long reservationId,
            Payment.Purpose purpose,
            Collection<Payment.Status> statuses
    );

    Page<Payment> findByPayer_EmailIgnoreCase(String email, Pageable pageable);

    Page<Payment> findByPayer_EmailIgnoreCaseAndReservation_ReservationId(
            String email,
            Long reservationId,
            Pageable pageable
    );

    /** MAX receipt_code theo prefix "RT-2026-" — sinh NNNN tăng dần trong năm. */
    @Query("SELECT MAX(p.receiptCode) FROM Payment p WHERE p.receiptCode LIKE CONCAT(:prefix, '%')")
    String findMaxReceiptCodeByPrefix(@Param("prefix") String prefix);

    List<Payment> findByReservation_ReservationIdOrderByCreatedAtAsc(Long reservationId);
}
