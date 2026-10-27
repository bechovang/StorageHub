import { apiClient, safeParseJson } from "./apiClient";

/**
 * Lấy danh sách options cho bộ lọc (loại kho và kích thước m²)
 */
export async function getUnitFilterOptions() {
  const res = await apiClient("/api/v1/units/filter-options");
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tải danh mục bộ lọc kho.");
  }
  return data;
}

/**
 * Tìm kiếm kho theo bộ lọc
 * @param {object} params
 * @param {number|string} [params.typeId]
 * @param {number|string} [params.sizeM2]
 * @param {string} [params.startDate]
 * @param {number|string} [params.durationMonths]
 * @param {string} [params.sort] "price-asc" | "price-desc"
 * @param {number} [params.page]
 * @param {number} [params.pageSize]
 */
export async function searchUnits({
  typeId = "",
  sizeM2 = "",
  startDate = "",
  facilityId = "",
  durationMonths = "",
  sort = "price-asc",
  page = 1,
  pageSize = 25,
} = {}) {
  const queryParams = new URLSearchParams();
  if (typeId) queryParams.set("type-id", typeId);
  if (sizeM2) queryParams.set("size-m2", sizeM2);
  if (startDate) queryParams.set("start-date", startDate);
  if (facilityId) queryParams.set("facility-id", facilityId);
  if (durationMonths) queryParams.set("duration-months", durationMonths);
  if (sort) queryParams.set("sort", sort);
  queryParams.set("page", page);
  queryParams.set("page-size", pageSize);

  const res = await apiClient(`/api/v1/units?${queryParams.toString()}`);
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tìm kiếm danh sách kho.");
  }
  return data;
}

/**
 * Lấy chi tiết thông tin kho (FR-6)
 * @param {number|string} unitId
 */
export async function getUnitDetail(unitId) {
  const res = await apiClient(`/api/v1/units/${unitId}`);
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không tìm thấy thông tin chi tiết kho.");
  }
  return data;
}

/**
 * Lấy bảng giá minh bạch tính toán từ PricingEngine theo Rental Policy active (FR-6, AD-11)
 * @param {number|string} unitId
 * @param {object} params
 * @param {string} params.startDate YYYY-MM-DD
 * @param {number} params.durationMonths
 */
export async function getUnitQuote(unitId, { startDate, durationMonths = 3 } = {}) {
  const duration = Math.max(1, parseInt(durationMonths, 10) || 1);
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("start-date", startDate);
  queryParams.set("duration-months", duration);

  const res = await apiClient(`/api/v1/units/${unitId}/quote?${queryParams.toString()}`);
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tính toán báo giá thuê kho.");
  }
  return data;
}

// ============================================================================
// FACILITY UNIT MANAGEMENT & GUARDS (US-25, FR-26, FR-20, Flow 4)
// ============================================================================

const FACILITY_UNITS_STORAGE_KEY = "storagehub_facility_units";
const ACTIVITY_LOGS_STORAGE_KEY = "storagehub_activity_logs";

export const INITIAL_FACILITY_UNITS = [
  { id: 1, code: "S-1", typeName: "Kho nhỏ (S)", typeId: 2, sizeM2: 5.0, floor: 1, zone: "Zone A", status: "AVAILABLE", baseRentPrice: 345000, tenant: null, contractRef: null, nextEvent: "Khách hẹn xem kho 14:30", notes: "Gần cửa chính lối vào" },
  { id: 2, code: "S-2", typeName: "Kho nhỏ (S)", typeId: 2, sizeM2: 5.0, floor: 1, zone: "Zone A", status: "AVAILABLE", baseRentPrice: 345000, tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Sàn khô ráo, khóa số mới" },
  { id: 3, code: "S-3", typeName: "Kho nhỏ (S)", typeId: 2, sizeM2: 5.0, floor: 1, zone: "Zone A", status: "AVAILABLE", baseRentPrice: 345000, tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Lan đã checkout 10-18, đệm hoàn tất" },
  { id: 4, code: "S-4", typeName: "Kho nhỏ (S)", typeId: 2, sizeM2: 5.0, floor: 1, zone: "Zone A", status: "RENTED", baseRentPrice: 345000, tenant: "Lê Minh Trí", contractRef: "CT-1038", nextEvent: "Sự cố SR-0032 (Cửa kẹt)", notes: "Đã cử staff hỗ trợ bôi trơn bản lề" },
  { id: 5, code: "M-1", typeName: "Kho vừa (M)", typeId: 3, sizeM2: 8.0, floor: 1, zone: "Zone A", status: "RENTED", baseRentPrice: 380000, tenant: "Đỗ Mai Hương", contractRef: "CT-1040", nextEvent: "Vừa nhận kho ca sáng", notes: "Đã bàn giao thẻ từ và mã PIN" },
  { id: 6, code: "M-2", typeName: "Kho vừa (M)", typeId: 3, sizeM2: 8.0, floor: 2, zone: "Zone B", status: "AVAILABLE", baseRentPrice: 380000, tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Đã hoàn tất dọn dẹp" },
  { id: 7, code: "M-3", typeName: "Kho vừa (M)", typeId: 3, sizeM2: 8.0, floor: 2, zone: "Zone B", status: "RENTED", baseRentPrice: 380000, tenant: "Công ty Alpha Logistics", contractRef: "CT-0941", nextEvent: "Gia hạn thêm 6 tháng", notes: "Doanh nghiệp thuê dài hạn" },
  { id: 8, code: "M-4", typeName: "Kho vừa (M)", typeId: 3, sizeM2: 8.0, floor: 2, zone: "Zone B", status: "MAINTENANCE", baseRentPrice: 380000, tenant: null, contractRef: null, nextEvent: "Đang sửa khóa thông minh SmartLock", notes: "Thay pin và cập nhật firmware khóa" },
  { id: 9, code: "M-5", typeName: "Kho vừa (M)", typeId: 3, sizeM2: 8.0, floor: 2, zone: "Zone B", status: "AVAILABLE", baseRentPrice: 380000, tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Góc 2 mặt thoáng" },
  { id: 10, code: "L-1", typeName: "Kho lớn (L)", typeId: 4, sizeM2: 15.0, floor: 2, zone: "Zone B", status: "RENTED", baseRentPrice: 890000, tenant: "Trần Anh Quân", contractRef: "CT-0912", nextEvent: "Hợp đồng dài hạn 12 tháng", notes: "Kho hàng điện tử gia dụng" },
  { id: 11, code: "L-2", typeName: "Kho lớn (L)", typeId: 4, sizeM2: 15.0, floor: 2, zone: "Zone B", status: "RENTED", baseRentPrice: 890000, tenant: "Vũ Bảo Long", contractRef: "CT-0925", nextEvent: "Đóng tiền kỳ kế tiếp 01/11", notes: "Lưu trữ nội thất văn phòng" },
  { id: 12, code: "L-3", typeName: "Kho lớn (L)", typeId: 4, sizeM2: 15.0, floor: 2, zone: "Zone B", status: "PREPARING", baseRentPrice: 890000, tenant: null, contractRef: null, nextEvent: "Đang vệ sinh khử ẩm (Task CL-0102)", notes: "Chờ staff hoàn thành dọn kho" },
  { id: 13, code: "LOCK-1", typeName: "Locker", typeId: 1, sizeM2: 1.5, floor: 1, zone: "Zone C", status: "AVAILABLE", baseRentPrice: 100000, tenant: null, contractRef: null, nextEvent: "Trống sẵn sàng", notes: "Dãy tủ thông minh cạnh quầy lễ tân" },
  { id: 14, code: "LOCK-2", typeName: "Locker", typeId: 1, sizeM2: 1.5, floor: 1, zone: "Zone C", status: "RENTED", baseRentPrice: 100000, tenant: "Trịnh Gia Huy", contractRef: "CT-1011", nextEvent: "Gia hạn theo quý", notes: "Thuê cất tài liệu văn phòng" },
  { id: 15, code: "LOCK-3", typeName: "Locker", typeId: 1, sizeM2: 1.5, floor: 1, zone: "Zone C", status: "RESERVED", baseRentPrice: 100000, tenant: "Bùi Tuyết Mai", contractRef: "BK-1046", nextEvent: "Hạn thanh toán cọc", notes: "Chờ khách xác nhận hợp đồng" },
  { id: 16, code: "LOCK-4", typeName: "Locker", typeId: 1, sizeM2: 1.5, floor: 1, zone: "Zone C", status: "RETIRED", baseRentPrice: 100000, tenant: null, contractRef: null, nextEvent: "Tạm dừng cho thuê quy hoạch lại", notes: "Khung sắt bị rỉ sét chờ thanh lý" },
];

export const INITIAL_UNIT_LOGS = [
  { id: 1, timestamp: "2026-10-18T10:15:00+07:00", actor: "Tuấn (Facility Manager)", unitCode: "M-2", action: "FIX_STATUS", fromStatus: "RENTED", toStatus: "PREPARING", reason: "Khách Hoàng Nam đã dọn xong đồ, chuyển sang chuẩn bị dọn dẹp (Flow 4)" },
  { id: 2, timestamp: "2026-10-17T16:30:00+07:00", actor: "Tuấn (Facility Manager)", unitCode: "M-4", action: "SET_MAINTENANCE", fromStatus: "AVAILABLE", toStatus: "MAINTENANCE", reason: "Khóa số SmartLock bị kẹt chốt, cần bảo dưỡng kỹ thuật" },
  { id: 3, timestamp: "2026-10-16T09:00:00+07:00", actor: "Tuấn (Facility Manager)", unitCode: "LOCK-4", action: "RETIRE_UNIT", fromStatus: "AVAILABLE", toStatus: "RETIRED", reason: "Quy hoạch lại khu vực Locker Zone C" },
];

/**
 * Lấy danh sách toàn bộ Unit trong cơ sở
 */
export function getFacilityUnits() {
  try {
    const raw = localStorage.getItem(FACILITY_UNITS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("Failed to read facility units:", err);
  }
  return [...INITIAL_FACILITY_UNITS];
}

/**
 * Lưu danh sách units vào localStorage
 */
export function saveFacilityUnits(units) {
  try {
    localStorage.setItem(FACILITY_UNITS_STORAGE_KEY, JSON.stringify(units));
  } catch (err) {
    console.error("Failed to save facility units:", err);
  }
}

/**
 * Lấy nhật ký thao tác kiểm toán (Activity Logs)
 */
export function getUnitActivityLogs(unitCode = null) {
  let logs = [...INITIAL_UNIT_LOGS];
  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        logs = parsed;
      }
    }
  } catch (err) {
    console.error("Failed to read activity logs:", err);
  }

  if (unitCode) {
    return logs.filter((l) => l.unitCode === unitCode);
  }
  return logs;
}

/**
 * Ghi 1 bản ghi vào Activity Log
 */
export function addActivityLog({ actor = "Tuấn (Facility Manager)", unitCode, action, fromStatus, toStatus, reason }) {
  const logs = getUnitActivityLogs();
  const newEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    actor,
    unitCode,
    action,
    fromStatus,
    toStatus,
    reason: reason || "Cập nhật quản trị cơ sở",
  };
  const updatedLogs = [newEntry, ...logs];
  try {
    localStorage.setItem(ACTIVITY_LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
  return newEntry;
}

/**
 * Guard kiểm tra khi Cho nghỉ kho (Retire Unit)
 * @returns {{ allowed: boolean, blocker?: { title: string, message: string, contractRef?: string, tenant?: string, nextEvent?: string } }}
 */
export function checkRetireGuard(unit) {
  if (unit.status === "RENTED") {
    return {
      allowed: false,
      blocker: {
        title: "HÀNH ĐỘNG BỊ CHẶN: ĐANG CÓ HỢP ĐỒNG THUÊ HOẠT ĐỘNG",
        message: `Kho ${unit.code} đang có hợp đồng thuê hoạt động (${unit.contractRef || "CT-ACTIVE"}). Không được cho nghỉ kho khi khách đang lưu trữ tài sản.`,
        contractRef: unit.contractRef,
        tenant: unit.tenant,
        nextEvent: unit.nextEvent,
        actionAdvice: "Vui lòng đợi hoặc hoàn tất thủ tục trả kho / thanh lý hợp đồng trước khi cho nghỉ kho.",
      },
    };
  }

  if (unit.status === "RESERVED") {
    return {
      allowed: false,
      blocker: {
        title: "HÀNH ĐỘNG BỊ CHẶN: ĐANG CÓ ĐƠN ĐẶT CHỖ CHỜ NHẬN KHO",
        message: `Kho ${unit.code} đang có khách đặt chỗ (${unit.contractRef || "BK-ACTIVE"}). Không được cho nghỉ kho khi chưa giải quyết đơn đặt chỗ.`,
        contractRef: unit.contractRef,
        tenant: unit.tenant,
        nextEvent: unit.nextEvent,
        actionAdvice: "Vui lòng hủy đơn đặt chỗ hoặc hoàn tiền cọc trước khi cho nghỉ kho.",
      },
    };
  }

  return { allowed: true };
}

/**
 * Thực hiện Cho nghỉ kho (Retire Unit) sau khi Guard và Confirm thành công
 */
export function retireUnit(unitId, actor = "Tuấn (Facility Manager)") {
  const units = getFacilityUnits();
  const idx = units.findIndex((u) => u.id === Number(unitId));
  if (idx === -1) throw new Error("Không tìm thấy kho.");

  const unit = units[idx];
  const guard = checkRetireGuard(unit);
  if (!guard.allowed) {
    throw new Error(guard.blocker.message);
  }

  const prevStatus = unit.status;
  unit.status = "RETIRED";
  unit.nextEvent = "Đã ngừng cho thuê";
  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: unit.code,
    action: "RETIRE_UNIT",
    fromStatus: prevStatus,
    toStatus: "RETIRED",
    reason: "Cho nghỉ kho, rút khỏi danh mục kinh doanh (FR-26)",
  });

  return unit;
}

/**
 * Guard kiểm tra khi Đưa vào bảo trì (Set Maintenance)
 */
export function checkMaintenanceGuard(unit) {
  if (unit.status === "RENTED") {
    return {
      allowed: false,
      blocker: {
        title: "HÀNH ĐỘNG BỊ CHẶN: KHO ĐANG CÓ KHÁCH THUÊ",
        message: `Kho ${unit.code} đang được khách hàng ${unit.tenant} lưu trữ tài sản. Không thể chuyển trạng thái bảo trì trực tiếp.`,
        contractRef: unit.contractRef,
        tenant: unit.tenant,
        actionAdvice: "Nếu phát sinh sự cố, hãy tạo Support Ticket hoặc liên hệ hỗ trợ khách.",
      },
    };
  }
  return { allowed: true };
}

/**
 * Chuyển kho sang trạng thái Bảo trì (Maintenance)
 */
export function setUnitMaintenance(unitId, reason, actor = "Tuấn (Facility Manager)") {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Vui lòng nhập lý do bảo trì cụ thể (tối thiểu 5 ký tự).");
  }

  const units = getFacilityUnits();
  const idx = units.findIndex((u) => u.id === Number(unitId));
  if (idx === -1) throw new Error("Không tìm thấy kho.");

  const unit = units[idx];
  const guard = checkMaintenanceGuard(unit);
  if (!guard.allowed) throw new Error(guard.blocker.message);

  const prevStatus = unit.status;
  unit.status = "MAINTENANCE";
  unit.nextEvent = `Đang bảo trì: ${reason.trim()}`;
  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: unit.code,
    action: "SET_MAINTENANCE",
    fromStatus: prevStatus,
    toStatus: "MAINTENANCE",
    reason: reason.trim(),
  });

  return unit;
}

/**
 * Hoàn tất bảo trì -> Tự động chuyển qua PREPARING và tạo Cleaning Task theo Buffer (Rule FR-26/20)
 */
export function finishUnitMaintenance(unitId, actor = "Tuấn (Facility Manager)") {
  const units = getFacilityUnits();
  const idx = units.findIndex((u) => u.id === Number(unitId));
  if (idx === -1) throw new Error("Không tìm thấy kho.");

  const unit = units[idx];
  const prevStatus = unit.status;
  unit.status = "PREPARING";
  unit.nextEvent = "Đang dọn dẹp vệ sinh trước khi mở lại (Turnover Buffer)";
  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: unit.code,
    action: "FINISH_MAINTENANCE",
    fromStatus: prevStatus,
    toStatus: "PREPARING",
    reason: "Hoàn tất sửa chữa kỹ thuật; chuyển sang dọn vệ sinh khử khuẩn bàn giao (FR-26/20)",
  });

  return unit;
}

/**
 * Sửa trạng thái trực tiếp (Fix status) - Bắt buộc nhập lý do kiểm toán
 */
export function fixUnitStatus(unitId, newStatus, reason, actor = "Tuấn (Facility Manager)") {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Lý do điều chỉnh trạng thái là bắt buộc để phục vụ kiểm toán (tối thiểu 5 ký tự).");
  }

  const units = getFacilityUnits();
  const idx = units.findIndex((u) => u.id === Number(unitId));
  if (idx === -1) throw new Error("Không tìm thấy kho.");

  const unit = units[idx];
  const prevStatus = unit.status;
  unit.status = newStatus;
  if (newStatus === "AVAILABLE") {
    unit.tenant = null;
    unit.contractRef = null;
    unit.nextEvent = "Sẵn sàng bàn giao";
  } else if (newStatus === "PREPARING") {
    unit.nextEvent = "Đang kiểm tra và chuẩn bị kho";
  }
  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: unit.code,
    action: "FIX_STATUS",
    fromStatus: prevStatus,
    toStatus: newStatus,
    reason: reason.trim(),
  });

  return unit;
}

/**
 * Sửa thông số cơ bản của kho (Specs)
 */
export function updateUnitSpecs(unitId, { baseRentPrice, notes, sizeM2, floor, zone }, actor = "Tuấn (Facility Manager)") {
  const units = getFacilityUnits();
  const idx = units.findIndex((u) => u.id === Number(unitId));
  if (idx === -1) throw new Error("Không tìm thấy kho.");

  const unit = units[idx];
  if (baseRentPrice !== undefined) unit.baseRentPrice = Number(baseRentPrice);
  if (notes !== undefined) unit.notes = notes;
  if (sizeM2 !== undefined) unit.sizeM2 = Number(sizeM2);
  if (floor !== undefined) unit.floor = Number(floor);
  if (zone !== undefined) unit.zone = zone;

  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: unit.code,
    action: "UPDATE_SPECS",
    fromStatus: unit.status,
    toStatus: unit.status,
    reason: `Cập nhật thông số kho (Giá: ${unit.baseRentPrice}đ, Ghi chú: ${unit.notes || "Không"})`,
  });

  return unit;
}
