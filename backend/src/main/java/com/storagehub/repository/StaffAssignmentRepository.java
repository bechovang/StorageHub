package com.storagehub.repository;

import com.storagehub.entity.StaffAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface StaffAssignmentRepository extends JpaRepository<StaffAssignment, Long> {

    /** Staff trực ca tại zone trong ngày — dùng gán task CHECK_IN tự động (FR-25). */
    Optional<StaffAssignment> findFirstByZone_ZoneIdAndWorkDate(Integer zoneId, LocalDate workDate);
}
