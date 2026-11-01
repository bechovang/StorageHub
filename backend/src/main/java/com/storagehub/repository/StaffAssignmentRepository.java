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

    /** Staff trực ca cho loại kho trong ngày — dùng gán task tự động (FR-25). */
    Optional<StaffAssignment> findFirstByUnitType_TypeIdAndWorkDate(Integer typeId, LocalDate workDate);

    @Query("""
            SELECT sa FROM StaffAssignment sa
            JOIN FETCH sa.staff
            JOIN FETCH sa.unitType
            WHERE sa.unitType.typeId = :typeId
              AND sa.workDate = :workDate
              AND sa.shift = :shift
            """)
    Optional<StaffAssignment> findByUnitType_TypeIdAndWorkDateAndShift(
            @Param("typeId") Integer typeId,
            @Param("workDate") LocalDate workDate,
            @Param("shift") StaffAssignment.Shift shift
    );

    @Query("SELECT sa FROM StaffAssignment sa JOIN FETCH sa.staff WHERE sa.workDate = :workDate AND sa.shift = :shift")
    List<StaffAssignment> findByWorkDateAndShift(
            @Param("workDate") LocalDate workDate,
            @Param("shift") StaffAssignment.Shift shift
    );

    @Query("SELECT sa FROM StaffAssignment sa JOIN FETCH sa.unitType WHERE sa.staff.userId = :staffId AND sa.workDate = :workDate")
    List<StaffAssignment> findByStaff_UserIdAndWorkDate(
            @Param("staffId") Long staffId,
            @Param("workDate") LocalDate workDate
    );

    @Query("SELECT sa FROM StaffAssignment sa JOIN FETCH sa.unitType WHERE sa.staff.userId = :staffId AND sa.workDate = :workDate AND sa.shift = :shift")
    Optional<StaffAssignment> findByStaff_UserIdAndWorkDateAndShift(
            @Param("staffId") Long staffId,
            @Param("workDate") LocalDate workDate,
            @Param("shift") StaffAssignment.Shift shift
    );

    @Query("""
        SELECT sa FROM StaffAssignment sa
        JOIN FETCH sa.staff s
        JOIN FETCH sa.unitType t
        WHERE (:startDate IS NULL OR sa.workDate >= :startDate)
          AND (:endDate IS NULL OR sa.workDate <= :endDate)
          AND (:staffId IS NULL OR s.userId = :staffId)
          AND (:typeId IS NULL OR t.typeId = :typeId)
        ORDER BY sa.workDate ASC, sa.shift ASC
    """)
    List<StaffAssignment> findFiltered(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("staffId") Long staffId,
            @Param("typeId") Integer typeId
    );

    @Query("SELECT sa FROM StaffAssignment sa JOIN FETCH sa.staff s JOIN FETCH sa.unitType t WHERE sa.workDate BETWEEN :startDate AND :endDate ORDER BY sa.workDate ASC, sa.shift ASC")
    List<StaffAssignment> findByWorkDateBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
