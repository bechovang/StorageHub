package com.storagehub.service.impl;

import com.storagehub.dto.shift.CreateShiftAssignmentRequest;
import com.storagehub.dto.shift.ShiftAssignmentResponse;
import com.storagehub.dto.shift.StaffRosterMember;
import com.storagehub.entity.Role;
import com.storagehub.entity.StaffAssignment;
import com.storagehub.entity.UnitType;
import com.storagehub.entity.User;
import com.storagehub.exception.ShiftConflictException;
import com.storagehub.exception.ShiftNotFoundException;
import com.storagehub.exception.UserNotFoundException;
import com.storagehub.repository.StaffAssignmentRepository;
import com.storagehub.repository.UnitTypeRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.LogService;
import com.storagehub.service.StaffingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional
public class StaffingServiceImpl implements StaffingService {

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final StaffAssignmentRepository staffAssignmentRepository;
    private final UserRepository userRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final LogService logService;

    public StaffingServiceImpl(
            StaffAssignmentRepository staffAssignmentRepository,
            UserRepository userRepository,
            UnitTypeRepository unitTypeRepository,
            LogService logService
    ) {
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.userRepository = userRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.logService = logService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftAssignmentResponse> getShifts(
            LocalDate startDate,
            LocalDate endDate,
            Long staffId,
            Integer typeId
    ) {
        LocalDate start = startDate != null ? startDate : LocalDate.now(ICT_ZONE).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate end = endDate != null ? endDate : start.plusDays(6);

        return staffAssignmentRepository.findFiltered(start, end, staffId, typeId).stream()
                .map(ShiftAssignmentResponse::fromEntity)
                .toList();
    }

    @Override
    public List<ShiftAssignmentResponse> createShiftAssignments(
            String actorEmail,
            CreateShiftAssignmentRequest request
    ) {
        User actor = actorEmail != null ? userRepository.findByEmailIgnoreCase(actorEmail).orElse(null) : null;

        User staff = userRepository.findById(request.staffId())
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy nhân viên với ID " + request.staffId()));

        if (request.unitTypeIds() == null || request.unitTypeIds().isEmpty()) {
            throw new IllegalArgumentException("Chọn ít nhất một loại kho.");
        }
        List<UnitType> types = unitTypeRepository.findAllById(request.unitTypeIds());
        if (types.size() != new LinkedHashSet<>(request.unitTypeIds()).size()) {
            throw new IllegalArgumentException("Có loại kho không tồn tại.");
        }

        Set<StaffAssignment.Shift> shifts = new LinkedHashSet<>(request.shifts());
        if (shifts.isEmpty()) {
            throw new IllegalArgumentException("Chọn ít nhất một ca trực.");
        }

        // Validate hết trước khi ghi — tránh lưu một nửa.
        for (StaffAssignment.Shift shift : shifts) {
            Optional<StaffAssignment> conflict = staffAssignmentRepository
                    .findByStaff_UserIdAndWorkDateAndShift(staff.getUserId(), request.workDate(), shift);
            if (conflict.isPresent()) {
                StaffAssignment existing = conflict.get();
                String typeName = existing.getUnitTypes().isEmpty()
                        ? ""
                        : String.join(", ", existing.getUnitTypes().stream().map(UnitType::getName).toList());
                throw new ShiftConflictException(
                        staff.getUserId(), staff.getFullName(), shift, typeName, request.workDate());
            }
        }

        List<ShiftAssignmentResponse> result = new ArrayList<>();
        for (StaffAssignment.Shift shift : shifts) {
            StaffAssignment assignment = new StaffAssignment();
            assignment.setStaff(staff);
            assignment.setShift(shift);
            assignment.setWorkDate(request.workDate());
            assignment.setUnitTypes(new LinkedHashSet<>(types));

            StaffAssignment saved = staffAssignmentRepository.save(assignment);
            String typeNames = String.join(", ", types.stream().map(UnitType::getName).toList());
            logService.log(actor, "STAFF_ASSIGNMENT", saved.getAssignmentId(), "CREATED",
                    null, saved.getShift().name(),
                    String.format("Phân công ca trực mới: %s - Kho %s (%s)",
                            staff.getFullName(), typeNames, saved.getShift().name()));
            result.add(ShiftAssignmentResponse.fromEntity(saved));
        }

        return result;
    }

    @Override
    public void deleteShiftAssignment(
            String actorEmail,
            Long assignmentId
    ) {
        User actor = actorEmail != null ? userRepository.findByEmailIgnoreCase(actorEmail).orElse(null) : null;

        StaffAssignment assignment = staffAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ShiftNotFoundException("Không tìm thấy phân công ca trực với ID " + assignmentId));

        String typeNames = assignment.getUnitTypes().isEmpty()
                ? "N/A"
                : String.join(", ", assignment.getUnitTypes().stream().map(UnitType::getName).toList());
        logService.log(
                actor,
                "STAFF_ASSIGNMENT",
                assignment.getAssignmentId(),
                "DELETED",
                assignment.getShift().name(),
                null,
                String.format("Hủy phân công ca trực: %s - Kho %s (%s)",
                        assignment.getStaff() != null ? assignment.getStaff().getFullName() : "N/A",
                        typeNames,
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

            long conflicts = staffShifts.stream()
                    .filter(s1 -> staffShifts.stream().anyMatch(s2 ->
                            !s2.assignmentId().equals(s1.assignmentId())
                                    && s2.workDate().equals(s1.workDate())
                                    && s2.shift().equals(s1.shift())
                    ))
                    .count();

            String roleLabel = "Staff · Cơ sở " + (staff.getFacility() != null ? staff.getFacility().getName() : "Tân Bình");
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
