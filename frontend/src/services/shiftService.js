/**
 * StorageHub — Staff & Shifts Management Service (US-26 / FR-27)
 * Quản lý phân công ca trực theo Staff × Loại kho × Ca × Ngày.
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
    label: "Ca tối (15:00 – 23:00)",
    shortLabel: "Tối (15:00 – 23:00)",
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

export const UNIT_TYPES = [
  { id: 1, code: "LOCK", name: "Kho LOCK" },
  { id: 2, code: "S", name: "Kho S" },
  { id: 3, code: "M", name: "Kho M" },
  { id: 4, code: "L", name: "Kho L" },
];

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfWeek(base = new Date()) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7; // Mon=1..Sun=7
  d.setDate(d.getDate() - day + 1);
  return d;
}

export function getWeekDays(weekOffset = 0, base = new Date()) {
  const monday = startOfWeek(base);
  if (typeof weekOffset === 'number' && weekOffset !== 0) {
    monday.setDate(monday.getDate() + weekOffset * 7);
  } else if (weekOffset instanceof Date) {
    // backward compatibility if called with date
    return getWeekDays(0, weekOffset);
  }
  const today = new Date();
  const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
  const shortLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const enPrefixes = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      key: ymd(d),
      dayName: dayNames[i],
      shortName: shortLabels[i],
      label: `${enPrefixes[i]} ${d.getDate()}`,
      dayNum: String(d.getDate()).padStart(2, "0"),
      monthNum: String(d.getMonth() + 1).padStart(2, "0"),
      fullDate: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
      isToday: ymd(d) === ymd(today),
    };
  });
}

export function getWeekRange(weekOffset = 0, base = new Date()) {
  const days = getWeekDays(weekOffset, base);
  return {
    startDate: days[0].key,
    endDate: days[6].key,
    weekLabel: `${days[0].fullDate.slice(0, 5)} – ${days[6].fullDate}`,
  };
}

export const DAYS_OF_WEEK = getWeekDays();

/**
 * Lấy danh sách ca trực theo khoảng ngày
 */
export async function getShifts({ startDate, endDate, staffId, unitTypeId } = {}) {
  const range = getWeekRange();
  const params = new URLSearchParams();
  params.append("startDate", startDate || range.startDate);
  params.append("endDate", endDate || range.endDate);
  if (staffId) params.append("staffId", String(staffId));
  if (unitTypeId) params.append("unitTypeId", String(unitTypeId));

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
export async function getStaffRoster({ startDate, endDate } = {}) {
  const range = getWeekRange();
  const params = new URLSearchParams();
  params.append("startDate", startDate || range.startDate);
  params.append("endDate", endDate || range.endDate);

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
export async function createShiftAssignment({ staffId, unitTypeIds, shifts, workDate }) {
  const response = await apiClient("/api/v1/shifts", {
    method: "POST",
    body: JSON.stringify({
      staffId: Number(staffId),
      unitTypeIds: (unitTypeIds || []).map(Number),
      shifts: (shifts || []).filter((s) => s !== "FULL_DAY" && s !== "ON_CALL"),
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
export function detectShiftConflict({ staffId, date, shiftWindows = [], shifts = [], staffList = [] }) {
  const staff = staffList.find((s) => s.id === Number(staffId));
  const staffName = staff ? staff.fullName : "Nhân viên";

  const existingShifts = shifts.filter(
    (s) => s.staffId === Number(staffId) && s.date === date
  );

  for (const window of shiftWindows) {
    for (const existing of existingShifts) {
      if (areShiftsConflicting(existing, { shiftWindow: window })) {
        const windowLabel = SHIFT_WINDOWS[existing.shiftWindow]?.label || existing.shiftWindow;
        const formattedDate = date.split("-").reverse().join("/");
        return {
          hasConflict: true,
          reason: `${staffName} đã được phân công ${windowLabel} tại ${existing.typeName || "kho"} vào ngày ${formattedDate}. Không thể gán thêm ca trùng lịch!`,
          conflictingShift: existing,
        };
      }
    }
  }

  return { hasConflict: false, reason: null, conflictingShift: null };
}

/**
 * Sao chép ca trực tuần trước sang tuần hiện tại
 */
export async function copyShiftsFromPreviousWeek({ weekOffset = 0 } = {}) {
  const prevDays = getWeekDays(weekOffset - 1);
  const currentDays = getWeekDays(weekOffset);

  const prevShifts = await getShifts({
    startDate: prevDays[0].key,
    endDate: prevDays[6].key,
  });

  if (!Array.isArray(prevShifts) || prevShifts.length === 0) {
    throw new Error("Không tìm thấy ca trực nào ở tuần trước để sao chép.");
  }

  let copiedCount = 0;
  let skippedCount = 0;

  for (const prev of prevShifts) {
    const dayIndex = prevDays.findIndex((d) => d.key === prev.workDate);
    if (dayIndex === -1) continue;

    const targetDate = currentDays[dayIndex].key;
    const typeIds = prev.unitTypeIds || (prev.unitTypeId ? [prev.unitTypeId] : [1, 2]);

    try {
      await createShiftAssignment({
        staffId: prev.staffId,
        unitTypeIds: typeIds,
        shifts: [prev.shift],
        workDate: targetDate,
      });
      copiedCount++;
    } catch {
      skippedCount++;
    }
  }

  return { copiedCount, skippedCount, total: prevShifts.length };
}
