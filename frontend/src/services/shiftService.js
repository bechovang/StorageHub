/**
 * StorageHub — Staff & Shifts Management Service (US-26 / FR-27)
 * Quản lý phân công ca trực theo Staff × Zone × Ca (MORNING/AFTERNOON/FULL_DAY/NIGHT) × Ngày.
 * Chặn và phát hiện xung đột lịch trực (người-ca-ngày) trước khi lưu.
 */

const STORAGE_KEY = "storagehub_shifts_v2";

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
  { id: "ZONE_B", code: "Zone B", name: "Zone B (Ground Floor Units)" },
  { id: "ZONE_A", code: "Zone A", name: "Zone A (Climate Controlled)" },
  { id: "ZONE_C", code: "Zone C", name: "Zone C (Drive-Up Units)" },
  { id: "ALL", code: "All zones", name: "All zones (Facility-wide)" },
];

export const DAYS_OF_WEEK = [
  { key: "2026-10-12", dayName: "Thứ 2", label: "Mon 12", fullDate: "12/10/2026", isToday: true },
  { key: "2026-10-13", dayName: "Thứ 3", label: "Tue 13", fullDate: "13/10/2026", isToday: false },
  { key: "2026-10-14", dayName: "Thứ 4", label: "Wed 14", fullDate: "14/10/2026", isToday: false },
  { key: "2026-10-15", dayName: "Thứ 5", label: "Thu 15", fullDate: "15/10/2026", isToday: false },
  { key: "2026-10-16", dayName: "Thứ 6", label: "Fri 16", fullDate: "16/10/2026", isToday: false },
  { key: "2026-10-17", dayName: "Thứ 7", label: "Sat 17", fullDate: "17/10/2026", isToday: false },
  { key: "2026-10-18", dayName: "Chủ nhật", label: "Sun 18", fullDate: "18/10/2026", isToday: false },
];

export const INITIAL_STAFF = [
  {
    id: 2,
    code: "KC-8842",
    fullName: "Minh Nguyễn",
    roleLabel: "Staff · Zones A, B (Ground Floor Warden)",
    rfid: "RFID #KC-8842",
    station: "Station Desk 02",
    status: "ON_DUTY", // ON_DUTY | SCHEDULED | SENIOR
    statusText: "On duty",
  },
  {
    id: 7,
    code: "KC-7721",
    fullName: "Mai Trần",
    roleLabel: "Staff · Zone C (Drive-Up Units)",
    rfid: "RFID #KC-7721",
    station: "Direct climate audit",
    status: "SCHEDULED",
    statusText: "Scheduled (15:00)",
  },
  {
    id: 8,
    code: "KC-9011",
    fullName: "Hùng Lê",
    roleLabel: "Senior staff · All zones (Supervisor)",
    rfid: "RFID #KC-9011",
    station: "Gate automation tech & override",
    status: "SENIOR",
    statusText: "Senior staff",
  },
];

/**
 * Lịch ca trực mẫu ban đầu (khớp mockup F5-03-staff-shifts)
 * Có 1 xung đột có chủ đích: Minh Nguyễn có 2 ca trùng vào Mon 12 (Morning Zone B & Overlap Conflict)
 */
export const INITIAL_SHIFTS = [
  // Minh Nguyễn
  { id: 101, staffId: 2, date: "2026-10-12", shiftWindow: "MORNING", zone: "Zone B", isConflict: true, note: "Trùng ca trực sáng Zone B" },
  { id: 102, staffId: 2, date: "2026-10-12", shiftWindow: "MORNING", zone: "Zone A", isConflict: true, note: "Phân công thứ 2 gây xung đột giờ làm" },
  { id: 103, staffId: 2, date: "2026-10-13", shiftWindow: "MORNING", zone: "Zone A", isConflict: false },
  { id: 104, staffId: 2, date: "2026-10-14", shiftWindow: "MORNING", zone: "Zone B", isConflict: false },
  { id: 105, staffId: 2, date: "2026-10-15", shiftWindow: "MORNING", zone: "Zone A", isConflict: false },
  { id: 106, staffId: 2, date: "2026-10-16", shiftWindow: "MORNING", zone: "Zone B", isConflict: false },

  // Mai Trần
  { id: 201, staffId: 7, date: "2026-10-12", shiftWindow: "AFTERNOON", zone: "Zone C", isConflict: false },
  { id: 202, staffId: 7, date: "2026-10-13", shiftWindow: "AFTERNOON", zone: "Zone C", isConflict: false },
  { id: 203, staffId: 7, date: "2026-10-14", shiftWindow: "AFTERNOON", zone: "Zone C", isConflict: false },
  { id: 204, staffId: 7, date: "2026-10-16", shiftWindow: "AFTERNOON", zone: "Zone C", isConflict: false },
  { id: 205, staffId: 7, date: "2026-10-17", shiftWindow: "MORNING", zone: "Zone C", isConflict: false },

  // Hùng Lê
  { id: 301, staffId: 8, date: "2026-10-12", shiftWindow: "FULL_DAY", zone: "All zones", isConflict: false },
  { id: 302, staffId: 8, date: "2026-10-13", shiftWindow: "MORNING", zone: "Zone B", isConflict: false },
  { id: 303, staffId: 8, date: "2026-10-14", shiftWindow: "AFTERNOON", zone: "Zone A", isConflict: false },
  { id: 304, staffId: 8, date: "2026-10-15", shiftWindow: "MORNING", zone: "Zone C", isConflict: false },
  { id: 305, staffId: 8, date: "2026-10-16", shiftWindow: "MORNING", zone: "All zones", isConflict: false },
  { id: 306, staffId: 8, date: "2026-10-18", shiftWindow: "ON_CALL", zone: "Tech Hotline", isConflict: false },
];

export function getLocalShifts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read shifts:", err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHIFTS));
  return INITIAL_SHIFTS;
}

export function saveLocalShifts(shifts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
  } catch (err) {
    console.error("Failed to save shifts:", err);
  }
}

export function resetLocalShifts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHIFTS));
  return INITIAL_SHIFTS;
}

/**
 * Kiểm tra xem 2 ca có bị xung đột thời gian hay không (FR-27)
 */
export function areShiftsConflicting(shiftA, shiftB) {
  if (shiftA.shiftWindow === "OFF" || shiftB.shiftWindow === "OFF") return false;
  // Cả ngày đụng mọi ca trong ngày
  if (shiftA.shiftWindow === "FULL_DAY" || shiftB.shiftWindow === "FULL_DAY") return true;
  // Trùng cùng ca sáng hoặc cùng ca chiều
  if (shiftA.shiftWindow === shiftB.shiftWindow) return true;
  return false;
}

/**
 * Phát hiện xung đột trước khi lưu phân công (FR-27)
 * Không lưu phân công trùng người - ca - ngày — chặn trước khi SAVE, báo lỗi cụ thể.
 *
 * @param {Object} params
 * @param {number} params.staffId
 * @param {string} params.date YYYY-MM-DD
 * @param {string} params.shiftWindow MORNING | AFTERNOON | FULL_DAY | ON_CALL
 * @param {string} params.zone
 * @param {number} [params.excludeShiftId]
 * @returns {{ hasConflict: boolean, reason: string | null, conflictingShift: Object | null }}
 */
export function detectShiftConflict({ staffId, date, shiftWindow, excludeShiftId = null }) {
  const shifts = getLocalShifts();
  const staff = INITIAL_STAFF.find((s) => s.id === Number(staffId));
  const staffName = staff ? staff.fullName : "Nhân viên";

  const existingShifts = shifts.filter(
    (s) => s.staffId === Number(staffId) && s.date === date && s.id !== excludeShiftId
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

/**
 * Thêm hoặc cập nhật phân công ca trực
 */
export function addShiftAssignment({ staffId, date, shiftWindow, zone }) {
  const conflict = detectShiftConflict({ staffId, date, shiftWindow, zone });
  if (conflict.hasConflict) {
    throw new Error(conflict.reason);
  }

  const shifts = getLocalShifts();
  const newShift = {
    id: Date.now(),
    staffId: Number(staffId),
    date,
    shiftWindow,
    zone,
    isConflict: false,
  };

  shifts.push(newShift);
  saveLocalShifts(shifts);
  return newShift;
}

/**
 * Xóa một ca trực (dùng để giải quyết xung đột hoặc gỡ phân công)
 */
export function removeShiftAssignment(shiftId) {
  let shifts = getLocalShifts();
  shifts = shifts.filter((s) => s.id !== Number(shiftId));

  // Tái đánh giá cờ isConflict cho các ca còn lại
  const reEvaluated = shifts.map((s) => {
    const hasOverlap = shifts.some(
      (other) => other.id !== s.id && other.staffId === s.staffId && other.date === s.date && areShiftsConflicting(s, other)
    );
    return { ...s, isConflict: hasOverlap };
  });

  saveLocalShifts(reEvaluated);
  return reEvaluated;
}

/**
 * Lấy danh sách phân công được gom nhóm theo Staff ID
 */
export function getRosterWithShifts() {
  const shifts = getLocalShifts();

  // Đánh dấu động các ca xung đột trong danh sách hiện tại
  const markedShifts = shifts.map((s) => {
    const hasOverlap = shifts.some(
      (other) => other.id !== s.id && other.staffId === s.staffId && other.date === s.date && areShiftsConflicting(s, other)
    );
    return { ...s, isConflict: hasOverlap };
  });

  const staffRoster = INITIAL_STAFF.map((staff) => {
    const staffShifts = markedShifts.filter((s) => s.staffId === staff.id);
    const conflicts = staffShifts.filter((s) => s.isConflict);
    const shiftCount = staffShifts.length;

    return {
      ...staff,
      shifts: staffShifts,
      hasConflict: conflicts.length > 0,
      conflictCount: conflicts.length,
      shiftCount,
    };
  });

  return {
    staffRoster,
    allShifts: markedShifts,
    totalConflicts: markedShifts.filter((s) => s.isConflict).length,
  };
}
