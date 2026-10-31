/**
 * StorageHub — Staff & Shifts Management Service (US-26 / FR-27)
 * Quản lý phân công ca trực theo Staff × Zone × Ca × Ngày.
 * Chặn và phát hiện xung đột lịch trực (người-ca-ngày) trước khi lưu.
 * Kết nối API /api/v1/shifts và /api/v1/shifts/roster
 */

import { apiClient, safeParseJson } from "./apiClient.js";

export const SHIFT_WINDOWS = {
  MORNING: {
    key: "MORNING",
    label: "Ca sáng (07:00 – 15:00)",
    shortLabel: "Morning (07:00 – 15:00)",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  AFTERNOON: {
    key: "AFTERNOON",
    label: "Ca chiều (15:00 – 23:00)",
    shortLabel: "Afternoon (15:00 – 23:00)",
    color: "#0284c7",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
  EVENING: {
    key: "EVENING",
    label: "Ca tối (19:00 – 07:00)",
    shortLabel: "Evening (19:00 – 07:00)",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  FULL_DAY: {
    key: "FULL_DAY",
    label: "Cả ngày (07:00 – 23:00)",
    shortLabel: "Full Day (07:00 – 23:00)",
    color: "#334155",
    bg: "#f1f5f9",
    border: "#cbd5e1",
  },
  ON_CALL: {
    key: "ON_CALL",
    label: "Trực khẩn cấp / On-call",
    shortLabel: "On-call · Tech Hotline",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  OFF: {
    key: "OFF",
    label: "Nghỉ ca (Off duty)",
    shortLabel: "Off duty",
    color: "#94a3b8",
    bg: "transparent",
    border: "transparent",
  },
};

export const ZONES = [
  { id: 1, code: "Zone A", name: "Zone A (Climate Controlled)" },
  { id: 2, code: "Zone B", name: "Zone B (Ground Floor Units)" },
  { id: 3, code: "Zone C", name: "Zone C (Drive-Up Units)" },
];

export const DAYS_OF_WEEK = [
  { key: "2026-10-26", dayName: "Thứ 2", label: "Mon 26", fullDate: "26/10/2026", isToday: false },
  { key: "2026-10-27", dayName: "Thứ 3", label: "Tue 27", fullDate: "27/10/2026", isToday: false },
  { key: "2026-10-28", dayName: "Thứ 4", label: "Wed 28", fullDate: "28/10/2026", isToday: false },
  { key: "2026-10-29", dayName: "Thứ 5", label: "Thu 29", fullDate: "29/10/2026", isToday: false },
  { key: "2026-10-30", dayName: "Thứ 6", label: "Fri 30", fullDate: "30/10/2026", isToday: false },
  { key: "2026-10-31", dayName: "Thứ 7", label: "Sat 31", fullDate: "31/10/2026", isToday: true },
  { key: "2026-11-01", dayName: "Chủ nhật", label: "Sun 01", fullDate: "01/11/2026", isToday: false },
];

/**
 * Lấy danh sách ca trực theo khoảng ngày
 */
export async function getShifts({ startDate = "2026-10-26", endDate = "2026-11-01", staffId, zoneId } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (staffId) params.append("staffId", String(staffId));
  if (zoneId) params.append("zoneId", String(zoneId));

  const response = await apiClient(`/api/v1/shifts?${params.toString()}`);
  if (!response.ok) {
    const errorData = await safeParseJson(response);
    throw new Error(errorData.message || "Không thể tải danh sách ca trực.");
  }
  return await safeParseJson(response);
}

/**
 * Lấy danh sách nhân sự trực ca kèm thống kê tuần (FR-27 / F5-03)
 */
export async function getStaffRoster({ startDate = "2026-10-26", endDate = "2026-11-01" } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await apiClient(`/api/v1/shifts/roster?${params.toString()}`);
  if (!response.ok) {
    const errorData = await safeParseJson(response);
    throw new Error(errorData.message || "Không thể tải danh sách nhân sự trực ca.");
  }
  return await safeParseJson(response);
}

/**
 * Phân công ca trực mới kèm phát hiện va chạm tự động (FR-27)
 */
export async function createShiftAssignment({ staffId, zoneId, shift, workDate }) {
  let finalShift = shift;
  if (shift === "FULL_DAY" || shift === "ON_CALL") {
    finalShift = "EVENING";
  }

  const response = await apiClient("/api/v1/shifts", {
    method: "POST",
    body: JSON.stringify({
      staffId: Number(staffId),
      zoneId: Number(zoneId),
      shift: finalShift,
      workDate,
    }),
  });

  if (!response.ok) {
    const errorData = await safeParseJson(response);
    const msg = errorData.message || (response.status === 409
      ? "Phát hiện xung đột lịch trực: Nhân viên đã được phân ca vào ngày này!"
      : "Không thể tạo phân công ca trực.");
    throw new Error(msg);
  }

  return await safeParseJson(response);
}

/**
 * Hủy phân công ca trực (FR-27)
 */
export async function deleteShiftAssignment(assignmentId) {
  const response = await apiClient(`/api/v1/shifts/${assignmentId}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await safeParseJson(response);
    throw new Error(errorData.message || "Không thể hủy ca trực.");
  }

  return true;
}

/**
 * Kiểm tra xem 2 ca có bị xung đột thời gian hay không (FR-27)
 */
export function areShiftsConflicting(shiftA, shiftB) {
  if (shiftA.shiftWindow === "OFF" || shiftB.shiftWindow === "OFF") return false;
  if (shiftA.shiftWindow === "FULL_DAY" || shiftB.shiftWindow === "FULL_DAY") return true;
  if (shiftA.shiftWindow === shiftB.shiftWindow) return true;
  return false;
}

/**
 * Phát hiện xung đột trước khi lưu phân công (Client-side pre-validation)
 */
export function detectShiftConflict({ staffId, date, shiftWindow, shifts = [], staffList = [] }) {
  const staff = staffList.find((s) => s.id === Number(staffId));
  const staffName = staff ? staff.fullName : "Nhân viên";

  const existingShifts = shifts.filter(
    (s) => s.staffId === Number(staffId) && s.date === date
  );

  for (const existing of existingShifts) {
    if (areShiftsConflicting(existing, { shiftWindow })) {
      const windowLabel = SHIFT_WINDOWS[existing.shiftWindow]?.label || existing.shiftWindow;
      const formattedDate = date.split("-").reverse().join("/");
      return {
        hasConflict: true,
        reason: `${staffName} đã được phân công ${windowLabel} tại ${existing.zone} vào ngày ${formattedDate}. Không thể gán thêm ca trùng lịch!`,
        conflictingShift: existing,
      };
    }
  }

  return { hasConflict: false, reason: null, conflictingShift: null };
}
