package com.storagehub.exception;

import com.storagehub.entity.StaffAssignment;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Ném ra khi phát hiện xung đột lịch trực người - ca - ngày (FR-27, 409 Conflict).
 */
public class ShiftConflictException extends RuntimeException {

    private final Long staffId;
    private final String staffName;
    private final StaffAssignment.Shift shift;
    private final String zoneCode;
    private final LocalDate workDate;

    public ShiftConflictException(String staffName, StaffAssignment.Shift shift, String zoneCode, LocalDate workDate) {
        super(formatMessage(staffName, shift, zoneCode, workDate));
        this.staffId = null;
        this.staffName = staffName;
        this.shift = shift;
        this.zoneCode = zoneCode;
        this.workDate = workDate;
    }

    public ShiftConflictException(Long staffId, String staffName, StaffAssignment.Shift shift, String zoneCode, LocalDate workDate) {
        super(formatMessage(staffName, shift, zoneCode, workDate));
        this.staffId = staffId;
        this.staffName = staffName;
        this.shift = shift;
        this.zoneCode = zoneCode;
        this.workDate = workDate;
    }

    private static String formatMessage(String staffName, StaffAssignment.Shift shift, String zoneCode, LocalDate workDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String formattedDate = workDate != null ? workDate.format(formatter) : "";
        return String.format("%s đã được phân công ca %s tại kho %s vào ngày %s. Vui lòng chọn nhân viên khác hoặc ca khác.",
                staffName, shift != null ? shift.name() : "", zoneCode != null ? zoneCode : "", formattedDate);
    }

    public Long getStaffId() {
        return staffId;
    }

    public String getStaffName() {
        return staffName;
    }

    public StaffAssignment.Shift getShift() {
        return shift;
    }

    public String getZoneCode() {
        return zoneCode;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }
}
