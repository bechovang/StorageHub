package com.storagehub.repository;

import com.storagehub.entity.BookingDraft;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingDraftRepository extends JpaRepository<BookingDraft, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM BookingDraft d WHERE d.draftId = :draftId")
    Optional<BookingDraft> findByIdForUpdate(@Param("draftId") Long draftId);

    @Query("""
            SELECT d FROM BookingDraft d
            JOIN FETCH d.unit u
            JOIN FETCH u.type
            WHERE d.draftId = :draftId
              AND LOWER(d.customer.email) = LOWER(:email)
            """)
    Optional<BookingDraft> findOwnedWithUnit(
            @Param("draftId") Long draftId,
            @Param("email") String email
    );

    /** Draft còn sống chồng lấn khoảng ngày (đã tính turnover buffer ở caller). */
    @Query("""
            SELECT d FROM BookingDraft d
            WHERE d.unit.unitId = :unitId
              AND d.status = com.storagehub.entity.BookingDraft.Status.PENDING
              AND d.expiresAt > :now
              AND d.startDate <= :latestStart
              AND d.endDate >= :earliestEnd
            """)
    List<BookingDraft> findActiveDraftsForUnit(
            @Param("unitId") Long unitId,
            @Param("now") LocalDateTime now,
            @Param("latestStart") LocalDate latestStart,
            @Param("earliestEnd") LocalDate earliestEnd
    );

    @Query("""
            SELECT d FROM BookingDraft d
            WHERE d.unit.unitId IN :unitIds
              AND d.status = com.storagehub.entity.BookingDraft.Status.PENDING
              AND d.expiresAt > :now
            """)
    List<BookingDraft> findActiveDraftsForUnits(
            @Param("unitIds") Collection<Long> unitIds,
            @Param("now") LocalDateTime now
    );
}
