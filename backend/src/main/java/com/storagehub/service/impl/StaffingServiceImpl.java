package com.storagehub.service.impl;

import com.storagehub.dto.shift.CreateShiftAssignmentRequest;
import com.storagehub.dto.shift.ShiftAssignmentResponse;
import com.storagehub.dto.shift.StaffRosterMember;
import com.storagehub.entity.Role;
import com.storagehub.entity.StaffAssignment;
import com.storagehub.entity.User;
import com.storagehub.entity.Zone;
import com.storagehub.exception.ShiftConflictException;
import com.storagehub.exception.ShiftNotFoundException;
import com.storagehub.exception.UserNotFoundException;
import com.storagehub.repository.StaffAssignmentRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.repository.ZoneRepository;
import com.storagehub.service.LogService;
import com.storagehub.service.StaffingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class StaffingServiceImpl implements StaffingService {

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final StaffAssignmentRepository staffAssignmentRepository;
    private final UserRepository userRepository;
    private final ZoneRepository zoneRepository;
    private final LogService logService;

    public StaffingServiceImpl(
            StaffAssignmentRepository staffAssignmentRepository,
            UserRepository userRepository,
            ZoneRepository zoneRepository,
            LogService logService
    ) {
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.userRepository = userRepository;
        this.zoneRepository = zoneRepository;
        this.logService = logService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftAssignmentResponse> getShifts(
            LocalDate startDate,
            LocalDate endDate,
            Long staffId,
            Integer zoneId
    ) {
        LocalDate start = startDate != null ? startDate : LocalDate.now(ICT_ZONE).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate end = endDate != null ? endDate : start.plusDays(6);

        List<StaffAssignment> list = staffAssignmentRepository.findFiltered(start, end, staffId, zoneId);
        return list.stream()
                .map(ShiftAssignmentResponse::fromEntity)
                .toList();
    }

    @Override
    public ShiftAssignmentResponse createShiftAssignment(
            String actorEmail,
            CreateShiftAssignmentRequest request
    ) {
        User actor = actorEmail != null ? userRepository.findByEmailIgnoreCase(actorEmail).orElse(null) : null;

        User staff = userRepository.findById(request.staffId())
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy nhân viên với ID " + request.staffId()));

        Zone zone = zoneRepository.findById(request.zoneId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khu vực (Zone) với ID " + request.zoneId()));

        // Guard: Kiểm tra xung đột trước khi lưu (FR-27)
        // Không lưu phân công trùng người - ca - ngày
        Optional<StaffAssignment> existingConflict = staffAssignmentRepository
                .findByStaff_UserIdAndWorkDateAndShift(staff.getUserId(), request.workDate(), request.shift());

        if (existingConflict.isPresent()) {
            StaffAssignment conflict = existingConflict.get();
            String conflictZone = conflict.getZone() != null ? conflict.getZone().getCode() : "";
            throw new ShiftConflictException(staff.getUserId(), staff.getFullName(), conflict.getShift(), conflictZone, conflict.getWorkDate());
        }

        StaffAssignment assignment = new StaffAssignment();
        assignment.setStaff(staff);
        assignment.setZone(zone);
        assignment.setShift(request.shift());
        assignment.setWorkDate(request.workDate());

        StaffAssignment saved = staffAssignmentRepository.save(assignment);

        // Audit Trail (FR-28 / AD-6)
        logService.log(
                actor,
                "STAFF_ASSIGNMENT",
                saved.getAssignmentId(),
                "CREATED",
                null,
                saved.getShift().name(),
                String.format("Phân công ca trực mới: %s - Zone %s (%s)", staff.getFullName(), zone.getCode(), saved.getShift().name())
        );

        return ShiftAssignmentResponse.fromEntity(saved);
    }

    @Override
    public void deleteShiftAssignment(
            String actorEmail,
            Long assignmentId
    ) {
        User actor = actorEmail != null ? userRepository.findByEmailIgnoreCase(actorEmail).orElse(null) : null;

        StaffAssignment assignment = staffAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ShiftNotFoundException("Không tìm thấy phân công ca trực với ID " + assignmentId));

        logService.log(
                actor,
                "STAFF_ASSIGNMENT",
                assignment.getAssignmentId(),
                "DELETED",
                assignment.getShift().name(),
                null,
                String.format("Hủy phân công ca trực: %s - Zone %s (%s)",
                        assignment.getStaff() != null ? assignment.getStaff().getFullName() : "N/A",
                        assignment.getZone() != null ? assignment.getZone().getCode() : "N/A",
                        assignment.getShift().name())
        );

        staffAssignmentRepository.delete(assignment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffRosterMember> getStaffRoster(
            LocalDate startDate,
            LocalDate endDate
    ) {
        LocalDate start = startDate != null ? startDate : LocalDate.now(ICT_ZONE).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate end = endDate != null ? endDate : start.plusDays(6);

        List<User> staffUsers = userRepository.findByRole_NameAndStatus(Role.Name.STAFF, 1);
        List<StaffAssignment> weekAssignments = staffAssignmentRepository.findByWorkDateBetween(start, end);

        List<StaffRosterMember> roster = new ArrayList<>();
        for (User staff : staffUsers) {
            List<ShiftAssignmentResponse> staffShifts = weekAssignments.stream()
                    .filter(a -> a.getStaff() != null && a.getStaff().getUserId().equals(staff.getUserId()))
                    .map(ShiftAssignmentResponse::fromEntity)
                    .toList();

            // Tính số ca xung đột (nếu có 2 ca cùng ngày cùng shift trong dữ liệu)
            long conflicts = staffShifts.stream()
                    .filter(s1 -> staffShifts.stream().anyMatch(s2 ->
                            !s2.assignmentId().equals(s1.assignmentId())
                                    && s2.workDate().equals(s1.workDate())
                                    && s2.shift().equals(s1.shift())
                    ))
                    .count();

            String roleLabel = "Staff · Zones " + (staff.getFacility() != null ? staff.getFacility().getName() : "Tân Bình");
            String status = staffShifts.isEmpty() ? "OFF" : "ON_DUTY";
            String code = "KC-" + staff.getUserId();

            roster.add(new StaffRosterMember(
                    staff.getUserId(),
                    staff.getFullName(),
                    staff.getEmail(),
                    code,
                    roleLabel,
                    status,
                    staffShifts.size(),
                    (int) conflicts,
                    staffShifts
            ));
        }

        return roster;
    }
}
