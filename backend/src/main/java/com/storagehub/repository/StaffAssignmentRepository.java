package com.storagehub.repository;

import com.storagehub.entity.StaffAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffAssignmentRepository extends JpaRepository<StaffAssignment, Long> {

    /** Các ca trực phụ trách loại kho trong ngày + ca — dùng gán task tự động. */
    @Query("""
            SELECT DISTINCT sa FROM StaffAssignment sa
            JOIN FETCH sa.staff s
            LEFT JOIN FETCH sa.unitTypes t
            WHERE s.userId = sa.staff.userId
              AND sa.workDate = :workDate
              AND sa.shift = :shift
              AND EXISTS (SELECT 1 FROM sa.unitTypes ut WHERE ut.typeId = :typeId)
            """)
    List<StaffAssignment> findByUnitType_TypeIdAndWorkDateAndShift(
            @Param("typeId") Integer typeId,
            @Param("workDate") LocalDate workDate,
            @Param("shift") StaffAssignment.Shift shift
    );

    @Query("SELECT DISTINCT sa FROM StaffAssignment sa JOIN FETCH sa.staff WHERE sa.workDate = :workDate AND sa.shift = :shift")
    List<StaffAssignment> findByWorkDateAndShift(
            @Param("workDate") LocalDate workDate,
            @Param("shift") StaffAssignment.Shift shift
    );

    @Query("SELECT DISTINCT sa FROM StaffAssignment sa LEFT JOIN FETCH sa.unitTypes WHERE sa.staff.userId = :staffId AND sa.workDate = :workDate")
    List<StaffAssignment> findByStaff_UserIdAndWorkDate(
            @Param("staffId") Long staffId,
            @Param("workDate") LocalDate workDate
    );

    @Query("SELECT DISTINCT sa FROM StaffAssignment sa LEFT JOIN FETCH sa.unitTypes WHERE sa.staff.userId = :staffId AND sa.workDate = :workDate AND sa.shift = :shift")
    Optional<StaffAssignment> findByStaff_UserIdAndWorkDateAndShift(
            @Param("staffId") Long staffId,
            @Param("workDate") LocalDate workDate,
            @Param("shift") StaffAssignment.Shift shift
    );

    @Query("""
        SELECT DISTINCT sa FROM StaffAssignment sa
        JOIN FETCH sa.staff s
        LEFT JOIN FETCH sa.unitTypes t
        WHERE sa.workDate BETWEEN :startDate AND :endDate
        ORDER BY sa.workDate ASC, sa.shift ASC
    """)
    List<StaffAssignment> findByWorkDateBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /** Backward-compatible filtered view (tests/legacy callers). */
    default List<StaffAssignment> findFiltered(
            LocalDate startDate, LocalDate endDate, Long staffId, Integer typeId) {
        return findByWorkDateBetween(startDate, endDate).stream()
                .filter(a -> staffId == null || (a.getStaff() != null && a.getStaff().getUserId().equals(staffId)))
                .filter(a -> typeId == null || (a.getUnitTypes() != null
                        && a.getUnitTypes().stream().anyMatch(t -> t.getTypeId().equals(typeId))))
                .toList();
    }
}
