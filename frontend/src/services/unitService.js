import { apiClient, safeParseJson } from "./apiClient";
import { appendActivityLog } from "./activityService";
import { getTomorrowDate, addDaysToDateStr } from "../utils/formatters";

const FACILITY_UNITS_STORAGE_KEY = "storagehub_facility_units_v2";
const ACTIVITY_LOGS_STORAGE_KEY = "storagehub_activity_logs";

export const INITIAL_FACILITY_UNITS = [
  { id: 1, code: "S-1", typeName: "Kho nhỏ (S)", typeCode: "S", typeId: 2, sizeM2: 5.0, floor: 1, zone: "Khu A", status: "AVAILABLE", baseRentPrice: 345000, monthlyPrice: 345000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Gần lối vào tầng 1, thuận tiện bốc xếp" },
  { id: 2, code: "S-2", typeName: "Kho nhỏ (S)", typeCode: "S", typeId: 2, sizeM2: 5.0, floor: 1, zone: "Khu A", status: "AVAILABLE", baseRentPrice: 345000, monthlyPrice: 345000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Sàn khô ráo, khóa điện tử mới" },
  { id: 3, code: "S-3", typeName: "Kho nhỏ (S)", typeCode: "S", typeId: 2, sizeM2: 5.0, floor: 1, zone: "Khu A", status: "AVAILABLE", baseRentPrice: 345000, monthlyPrice: 345000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Đã hoàn tất vệ sinh tiêu chuẩn" },
  { id: 4, code: "S-4", typeName: "Kho nhỏ (S)", typeCode: "S", typeId: 2, sizeM2: 5.0, floor: 1, zone: "Khu A", status: "RENTED", baseRentPrice: 345000, monthlyPrice: 345000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: "Nguyễn Thị Lan", contractRef: "CT-2031", nextEvent: "Đang lưu trữ hoạt động", notes: "Khách thuê định kỳ" },
  { id: 5, code: "M-1", typeName: "Kho vừa (M)", typeCode: "M", typeId: 3, sizeM2: 8.0, floor: 1, zone: "Khu A", status: "RENTED", baseRentPrice: 380000, monthlyPrice: 380000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: "Đỗ Mai Hương", contractRef: "CT-1040", nextEvent: "Đang lưu trữ hoạt động", notes: "Đã bàn giao mã truy cập tại quầy" },
  { id: 6, code: "M-2", typeName: "Kho vừa (M)", typeCode: "M", typeId: 3, sizeM2: 8.0, floor: 2, zone: "Khu B", status: "AVAILABLE", baseRentPrice: 380000, monthlyPrice: 380000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Đã hoàn tất dọn dẹp" },
  { id: 7, code: "M-3", typeName: "Kho vừa (M)", typeCode: "M", typeId: 3, sizeM2: 8.0, floor: 2, zone: "Khu B", status: "RENTED", baseRentPrice: 380000, monthlyPrice: 380000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: "Công ty Alpha", contractRef: "CT-0941", nextEvent: "Hợp đồng thuê dài hạn", notes: "Lưu trữ chứng từ doanh nghiệp" },
  { id: 8, code: "M-4", typeName: "Kho vừa (M)", typeCode: "M", typeId: 3, sizeM2: 8.0, floor: 2, zone: "Khu B", status: "MAINTENANCE", baseRentPrice: 380000, monthlyPrice: 380000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: null, contractRef: null, nextEvent: "Đang bảo dưỡng khóa điện tử", notes: "Thay pin và kiểm tra chốt cửa" },
  { id: 9, code: "M-5", typeName: "Kho vừa (M)", typeCode: "M", typeId: 3, sizeM2: 8.0, floor: 2, zone: "Khu B", status: "AVAILABLE", baseRentPrice: 380000, monthlyPrice: 380000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Vị trí góc hai mặt thoáng" },
  { id: 10, code: "L-1", typeName: "Kho lớn (L)", typeCode: "L", typeId: 4, sizeM2: 15.0, floor: 2, zone: "Khu B", status: "RESERVED", baseRentPrice: 890000, monthlyPrice: 890000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: "Nguyễn Thị Lan", contractRef: "BK-2026-0012", nextEvent: "Chờ khách đến nhận kho", notes: "Đã thanh toán cọc giữ chỗ 10%" },
  { id: 11, code: "L-2", typeName: "Kho lớn (L)", typeCode: "L", typeId: 4, sizeM2: 15.0, floor: 2, zone: "Khu B", status: "AVAILABLE", baseRentPrice: 890000, monthlyPrice: 890000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Phù hợp lưu trữ nội thất và hàng kiện" },
  { id: 12, code: "L-3", typeName: "Kho lớn (L)", typeCode: "L", typeId: 4, sizeM2: 15.0, floor: 2, zone: "Khu B", status: "PREPARING", baseRentPrice: 890000, monthlyPrice: 890000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: null, contractRef: null, nextEvent: "Đang vệ sinh khử ẩm", notes: "Chờ nhân viên hoàn thành dọn kho" },
  { id: 13, code: "LOCK-1", typeName: "Tủ lưu trữ nhỏ", typeCode: "LOCKER", typeId: 1, sizeM2: 1.5, floor: 1, zone: "Khu C", status: "AVAILABLE", baseRentPrice: 100000, monthlyPrice: 100000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: null, contractRef: null, nextEvent: "Sẵn sàng bàn giao", notes: "Dãy tủ lưu trữ cạnh quầy tiếp đón" },
  { id: 14, code: "LOCK-2", typeName: "Tủ lưu trữ nhỏ", typeCode: "LOCKER", typeId: 1, sizeM2: 1.5, floor: 1, zone: "Khu C", status: "RENTED", baseRentPrice: 100000, monthlyPrice: 100000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: "Trịnh Gia Huy", contractRef: "CT-1011", nextEvent: "Đang lưu trữ hồ sơ", notes: "Thuê cất tài liệu văn phòng" },
  { id: 15, code: "LOCK-3", typeName: "Tủ lưu trữ nhỏ", typeCode: "LOCKER", typeId: 1, sizeM2: 1.5, floor: 1, zone: "Khu C", status: "RESERVED", baseRentPrice: 100000, monthlyPrice: 100000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: "Bùi Tuyết Mai", contractRef: "BK-1046", nextEvent: "Đã giữ chỗ chờ nhận kho", notes: "Chờ khách đến quầy ký hợp đồng" },
  { id: 16, code: "LOCK-4", typeName: "Tủ lưu trữ nhỏ", typeCode: "LOCKER", typeId: 1, sizeM2: 1.5, floor: 1, zone: "Khu C", status: "RETIRED", baseRentPrice: 100000, monthlyPrice: 100000, facilityId: 1, facilityName: "Cơ sở Tân Bình", tenant: null, contractRef: null, nextEvent: "Ngừng khai thác", notes: "Tạm ngưng cho thuê để nâng cấp bản lề" },
];

export const INITIAL_UNIT_LOGS = [
  { id: 1, timestamp: "2026-10-18T10:15:00+07:00", actor: "Trần Tuấn (Quản lý cơ sở)", unitCode: "M-2", action: "FIX_STATUS", fromStatus: "RENTED", toStatus: "PREPARING", reason: "Khách đã dọn hết tài sản, chuyển sang bước vệ sinh tiêu chuẩn" },
  { id: 2, timestamp: "2026-10-17T16:30:00+07:00", actor: "Trần Tuấn (Quản lý cơ sở)", unitCode: "M-4", action: "SET_MAINTENANCE", fromStatus: "AVAILABLE", toStatus: "MAINTENANCE", reason: "Khóa điện tử bị kẹt chốt, cần bảo dưỡng kỹ thuật" },
  { id: 3, timestamp: "2026-10-16T09:00:00+07:00", actor: "Trần Tuấn (Quản lý cơ sở)", unitCode: "LOCK-4", action: "RETIRE_UNIT", fromStatus: "AVAILABLE", toStatus: "RETIRED", reason: "Tạm ngừng khai thác để nâng cấp dãy tủ Khu C" },
];

function buildPublicFallbackFilterOptions() {
  const types = [
    { id: 1, code: "LOCKER", name: "Tủ lưu trữ nhỏ (1.5 m²)" },
    { id: 2, code: "S", name: "Kho nhỏ — Hạng S (5 m²)" },
    { id: 3, code: "M", name: "Kho vừa — Hạng M (8 m²)" },
    { id: 4, code: "L", name: "Kho lớn — Hạng L (15 m²)" },
  ];
  return {
    types,
    unitTypes: types,
    sizes: [1.5, 5, 8, 15],
    sizesM2: [1.5, 5, 8, 15],
    facilities: [{ id: 1, name: "Cơ sở Tân Bình" }],
  };
}

function mapLocalUnitToPublicDto(u) {
  return {
    id: u.id,
    unitId: u.id,
    code: u.code,
    unitCode: u.code,
    typeId: u.typeId,
    typeName: u.typeName,
    sizeM2: u.sizeM2,
    floor: u.floor,
    zone: u.zone,
    status: u.status,
    baseRentPrice: u.baseRentPrice,
    monthlyPrice: u.baseRentPrice,
    facilityId: 1,
    facilityName: "Cơ sở Tân Bình",
    description: u.notes || "Kho tự quản tiêu chuẩn, trang bị khóa điện tử riêng và giám sát an ninh 24/7.",
  };
}

/**
 * Lấy danh sách options cho bộ lọc (hỗ trợ cả Khách vãng lai khi máy chủ trả 401)
 */
export async function getUnitFilterOptions() {
  try {
    const res = await apiClient("/api/v1/units/filter-options");
    if (!res.ok || res.status === 401 || res.status === 403) {
      return buildPublicFallbackFilterOptions();
    }
    const data = await safeParseJson(res);
    return {
      types: data.types || data.unitTypes || buildPublicFallbackFilterOptions().types,
      unitTypes: data.unitTypes || data.types || buildPublicFallbackFilterOptions().unitTypes,
      sizesM2: data.sizesM2 || data.sizes || buildPublicFallbackFilterOptions().sizesM2,
      sizes: data.sizes || data.sizesM2 || buildPublicFallbackFilterOptions().sizes,
      facilities: data.facilities || [{ id: 1, name: "Cơ sở Tân Bình" }],
    };
  } catch {
    return buildPublicFallbackFilterOptions();
  }
}

/**
 * Tìm kiếm kho theo bộ lọc (Flow 1: loại, kích thước, ngày bắt đầu, thời hạn thuê)
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
  // Nếu chọn cơ sở chưa khai trương (facilityId !== "" && Number(facilityId) !== 1), trả mảng rỗng trung thực
  if (facilityId && Number(facilityId) !== 1) {
    return { items: [], page: 1, pageSize, total: 0, totalPages: 0 };
  }

  const queryParams = new URLSearchParams();
  if (typeId) queryParams.set("type-id", typeId);
  if (sizeM2) queryParams.set("size-m2", sizeM2);
  if (startDate) queryParams.set("start-date", startDate);
  if (facilityId) queryParams.set("facility-id", facilityId);
  if (durationMonths) queryParams.set("duration-months", durationMonths);
  if (sort) queryParams.set("sort", sort);
  queryParams.set("page", page);
  queryParams.set("page-size", pageSize);

  try {
    const res = await apiClient(`/api/v1/units?${queryParams.toString()}`);
    if (!res.ok || res.status === 401 || res.status === 403) {
      return filterFallbackPublicUnits({ typeId, sizeM2, sort, page, pageSize });
    }
    const data = await safeParseJson(res);
    return data;
  } catch {
    return filterFallbackPublicUnits({ typeId, sizeM2, sort, page, pageSize });
  }
}

function filterFallbackPublicUnits({ typeId, sizeM2, sort, page, pageSize }) {
  let list = getFacilityUnits()
    .filter((u) => u.status !== "RETIRED" && u.status !== "MAINTENANCE")
    .map(mapLocalUnitToPublicDto);

  if (typeId) {
    list = list.filter((u) => Number(u.typeId) === Number(typeId));
  }
  if (sizeM2) {
    list = list.filter((u) => Number(u.sizeM2) === Number(sizeM2));
  }
  if (sort === "price-desc") {
    list.sort((a, b) => b.baseRentPrice - a.baseRentPrice);
  } else {
    list.sort((a, b) => a.baseRentPrice - b.baseRentPrice);
  }

  return {
    items: list.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / pageSize)),
  };
}

/**
 * Lấy chi tiết thông tin kho (hỗ trợ cả Khách vãng lai)
 */
export async function getUnitDetail(unitId) {
  try {
    const res = await apiClient(`/api/v1/units/${unitId}`);
    if (res.status === 401 || res.status === 403) {
      const found = getFacilityUnits().find((u) => Number(u.id) === Number(unitId));
      if (!found) throw new Error("Không tìm thấy thông tin chi tiết kho.");
      return mapLocalUnitToPublicDto(found);
    }
    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.message || "Không tìm thấy thông tin chi tiết kho.");
    }
    return data;
  } catch (err) {
    const found = getFacilityUnits().find((u) => Number(u.id) === Number(unitId));
    if (found) return mapLocalUnitToPublicDto(found);
    throw err;
  }
}

/**
 * Lấy bảng báo giá minh bạch theo Flow 1:
 * Tổng tiền thuê = giá thuê tháng × số tháng
 * Tiền cọc giữ chỗ = 10% × tổng tiền thuê
 */
export async function getUnitQuote(unitId, { startDate, durationMonths = 3 } = {}) {
  const duration = Math.max(1, parseInt(durationMonths, 10) || 1);
  const effectiveStart = startDate || getTomorrowDate();
  const queryParams = new URLSearchParams();
  queryParams.set("start-date", effectiveStart);
  queryParams.set("duration-months", duration);

  try {
    const res = await apiClient(`/api/v1/units/${unitId}/quote?${queryParams.toString()}`);
    if (res.status === 401 || res.status === 403) {
      return buildFallbackQuote(unitId, effectiveStart, duration);
    }
    const data = await safeParseJson(res);
    if (!res.ok) {
      return buildFallbackQuote(unitId, effectiveStart, duration);
    }
    return data;
  } catch {
    return buildFallbackQuote(unitId, effectiveStart, duration);
  }
}

function buildFallbackQuote(unitId, startDate, durationMonths) {
  const unit = getFacilityUnits().find((u) => Number(u.id) === Number(unitId)) || INITIAL_FACILITY_UNITS[0];
  const monthlyRent = Number(unit.baseRentPrice || 345000);
  const totalRent = monthlyRent * durationMonths;
  const depositAmount = Math.round(totalRent * 0.1);
  return {
    unitId: unit.id,
    unitCode: unit.code,
    startDate,
    endDate: addDaysToDateStr(startDate, durationMonths * 30),
    durationMonths,
    monthlyRent,
    totalRent,
    depositPercent: 10,
    depositAmount,
  };
}

// ============================================================================
// QUẢN LÝ DANH MỤC KHO CƠ SỞ & RÀNG BUỘC HỢP ĐỒNG (Flow 5 & Flow 7)
// ============================================================================

export function getFacilityUnits() {
  try {
    const raw = localStorage.getItem(FACILITY_UNITS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Bỏ qua lỗi đọc localStorage
  }
  return [...INITIAL_FACILITY_UNITS];
}

export async function syncFacilityUnitsWithApi() {
  try {
    const res = await apiClient("/api/v1/units?page=1&page-size=50");
    if (!res.ok) return getFacilityUnits();
    const data = await safeParseJson(res);
    const apiItems = Array.isArray(data?.items) ? data.items : [];
    if (apiItems.length === 0) return getFacilityUnits();

    const current = getFacilityUnits();
    const byCode = new Map(current.map((u) => [u.code, u]));

    apiItems.forEach((apiUnit) => {
      const code = apiUnit.code || apiUnit.unitCode;
      if (!code) return;
      const existing = byCode.get(code);
      const zoneLabel = String(apiUnit.zone || existing?.zone || "Khu A").replace(/^Zone\s+/i, "Khu ");
      byCode.set(code, {
        ...(existing || {}),
        id: apiUnit.id || apiUnit.unitId || existing?.id,
        code,
        typeName: apiUnit.typeName || existing?.typeName || "Kho tiêu chuẩn",
        typeId: apiUnit.typeId || existing?.typeId || 2,
        sizeM2: Number(apiUnit.sizeM2 || existing?.sizeM2 || 5),
        floor: Number(apiUnit.floor || existing?.floor || 1),
        zone: zoneLabel,
        status: existing?.localOverride ? existing.status : (apiUnit.status || existing?.status || "AVAILABLE"),
        baseRentPrice: Number(apiUnit.baseRentPrice || apiUnit.monthlyPrice || existing?.baseRentPrice || 345000),
        tenant: existing?.tenant || null,
        contractRef: existing?.contractRef || null,
        nextEvent: existing?.nextEvent || (apiUnit.status === "AVAILABLE" ? "Sẵn sàng bàn giao" : "Theo dõi vận hành"),
        notes: existing?.notes || apiUnit.description || "Kho tiêu chuẩn Cơ sở Tân Bình",
      });
    });

    const merged = Array.from(byCode.values());
    saveFacilityUnits(merged);
    return merged;
  } catch {
    return getFacilityUnits();
  }
}

export function saveFacilityUnits(units) {
  try {
    localStorage.setItem(FACILITY_UNITS_STORAGE_KEY, JSON.stringify(units));
  } catch {
    // Bỏ qua lỗi ghi localStorage
  }
}

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
  } catch {
    // Bỏ qua lỗi đọc nhật ký
  }

  if (unitCode) {
    return logs.filter((l) => l.unitCode === unitCode);
  }
  return logs;
}

export function addActivityLog({
  actor = "Trần Tuấn (Quản lý cơ sở)",
  unitCode,
  action,
  fromStatus,
  toStatus,
  reason,
}) {
  const logs = getUnitActivityLogs();
  const cleanReason = reason || "Cập nhật vận hành cơ sở";
  const newEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    actor,
    unitCode,
    action,
    fromStatus,
    toStatus,
    reason: cleanReason,
  };
  const updatedLogs = [newEntry, ...logs];
  try {
    localStorage.setItem(ACTIVITY_LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch {
    // Ignore storage error
  }

  appendActivityLog({
    actor,
    actorRole: "FACILITY_MANAGER",
    entityType: "UNIT",
    entityId: unitCode,
    entityCode: `Kho ${unitCode}`,
    action,
    fromValue: fromStatus,
    toValue: toStatus,
    reason: cleanReason,
  });

  return newEntry;
}

export function checkRetireGuard(unit) {
  if (unit.status === "RENTED") {
    return {
      allowed: false,
      blocker: {
        title: "Không thể ngừng khai thác: Kho đang có hợp đồng thuê",
        message: `Kho ${unit.code} đang có hợp đồng thuê hiệu lực (${unit.contractRef || "Đang hoạt động"}). Hệ thống không cho phép ngừng khai thác khi khách hàng đang lưu trữ tài sản.`,
        contractRef: unit.contractRef,
        tenant: unit.tenant,
        nextEvent: unit.nextEvent,
        actionAdvice: "Vui lòng hoàn tất thủ tục trả kho và thanh lý hợp đồng trước khi ngừng khai thác kho này.",
      },
    };
  }

  if (unit.status === "RESERVED") {
    return {
      allowed: false,
      blocker: {
        title: "Không thể ngừng khai thác: Kho đang có đơn giữ chỗ",
        message: `Kho ${unit.code} đang được giữ chỗ cho đơn (${unit.contractRef || "Chờ nhận kho"}). Không thể ngừng khai thác khi đơn đặt chỗ chưa được xử lý.`,
        contractRef: unit.contractRef,
        tenant: unit.tenant,
        nextEvent: unit.nextEvent,
        actionAdvice: "Vui lòng bố trí kho thay thế hoặc tất toán hoàn cọc cho khách trước khi ngừng khai thác.",
      },
    };
  }

  return { allowed: true };
}

export function retireUnit(unitId, actor = "Trần Tuấn (Quản lý cơ sở)") {
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
  unit.localOverride = true;
  unit.nextEvent = "Đã ngừng khai thác";
  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: unit.code,
    action: "RETIRE_UNIT",
    fromStatus: prevStatus,
    toStatus: "RETIRED",
    reason: "Ngừng khai thác kho, tạm rút khỏi danh mục cho thuê",
  });

  return unit;
}

export function checkMaintenanceGuard(unit) {
  if (unit.status === "RENTED") {
    return {
      allowed: false,
      blocker: {
        title: "Không thể bảo trì trực tiếp: Kho đang có khách lưu trữ",
        message: `Kho ${unit.code} đang được khách hàng ${unit.tenant || "hiện hữu"} lưu trữ tài sản. Không thể chuyển sang bảo trì khi chưa di dời sang kho thay thế.`,
        contractRef: unit.contractRef,
        tenant: unit.tenant,
        actionAdvice: "Nếu xảy ra sự cố khẩn cấp (Flow 7), vui lòng mở mục Hỗ trợ sự cố để điều phối kho thay thế và chuyển bảo trì an toàn.",
      },
    };
  }
  return { allowed: true };
}

export function setUnitMaintenance(unitId, reason, actor = "Trần Tuấn (Quản lý cơ sở)") {
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
  unit.localOverride = true;
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

export function finishUnitMaintenance(unitId, actor = "Trần Tuấn (Quản lý cơ sở)") {
  const units = getFacilityUnits();
  const idx = units.findIndex((u) => u.id === Number(unitId));
  if (idx === -1) throw new Error("Không tìm thấy kho.");

  const unit = units[idx];
  const prevStatus = unit.status;
  unit.status = "PREPARING";
  unit.localOverride = true;
  unit.nextEvent = "Đang dọn vệ sinh trước khi mở cho thuê lại";
  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: unit.code,
    action: "FINISH_MAINTENANCE",
    fromStatus: prevStatus,
    toStatus: "PREPARING",
    reason: "Hoàn tất sửa chữa kỹ thuật, chuyển sang dọn vệ sinh tiêu chuẩn",
  });

  return unit;
}

export function fixUnitStatus(unitId, newStatus, reason, actor = "Trần Tuấn (Quản lý cơ sở)") {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Vui lòng nhập lý do điều chỉnh trạng thái phục vụ kiểm toán (tối thiểu 5 ký tự).");
  }

  const units = getFacilityUnits();
  const idx = units.findIndex((u) => u.id === Number(unitId));
  if (idx === -1) throw new Error("Không tìm thấy kho.");

  const unit = units[idx];
  const prevStatus = unit.status;
  unit.status = newStatus;
  unit.localOverride = true;
  if (newStatus === "AVAILABLE") {
    unit.tenant = null;
    unit.contractRef = null;
    unit.nextEvent = "Sẵn sàng bàn giao";
  } else if (newStatus === "PREPARING") {
    unit.nextEvent = "Đang kiểm tra và vệ sinh kho";
  } else if (newStatus === "RESERVED") {
    unit.nextEvent = "Đã giữ chỗ chờ khách nhận kho";
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

export function updateUnitSpecs(
  unitId,
  { baseRentPrice, notes, sizeM2, floor, zone },
  actor = "Trần Tuấn (Quản lý cơ sở)"
) {
  const units = getFacilityUnits();
  const idx = units.findIndex((u) => u.id === Number(unitId));
  if (idx === -1) throw new Error("Không tìm thấy kho.");

  const unit = units[idx];
  if (baseRentPrice !== undefined) unit.baseRentPrice = Number(baseRentPrice);
  if (notes !== undefined) unit.notes = notes;
  if (sizeM2 !== undefined) unit.sizeM2 = Number(sizeM2);
  if (floor !== undefined) unit.floor = Number(floor);
  if (zone !== undefined) unit.zone = zone;
  unit.localOverride = true;

  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: unit.code,
    action: "UPDATE_SPECS",
    fromStatus: unit.status,
    toStatus: unit.status,
    reason: `Cập nhật thông số kho (${unit.sizeM2}m², giá thuê ${unit.baseRentPrice.toLocaleString("vi-VN")} ₫/tháng)`,
  });

  return unit;
}

/**
 * Flow 5 (Node 9): Tạo mới Kho (Create Unit)
 */
export function createFacilityUnit(
  { code, typeName = "Kho vừa (M)", typeId = 3, sizeM2 = 8, floor = 1, zone = "Khu A", baseRentPrice = 380000, notes = "" },
  actor = "Trần Tuấn (Quản lý cơ sở)"
) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error("Vui lòng nhập mã định danh kho (ví dụ: M-6, S-5).");
  }

  const units = getFacilityUnits();
  if (units.some((u) => u.code.toUpperCase() === normalizedCode)) {
    throw new Error(`Mã kho ${normalizedCode} đã tồn tại trong cơ sở.`);
  }

  const maxId = units.reduce((m, u) => Math.max(m, Number(u.id) || 0), 0);
  const newUnit = {
    id: maxId + 1,
    code: normalizedCode,
    typeName,
    typeId: Number(typeId) || 3,
    sizeM2: Number(sizeM2) || 5,
    floor: Number(floor) || 1,
    zone: zone || "Khu A",
    status: "AVAILABLE",
    baseRentPrice: Number(baseRentPrice) || 345000,
    monthlyPrice: Number(baseRentPrice) || 345000,
    facilityId: 1,
    facilityName: "Cơ sở Tân Bình",
    tenant: null,
    contractRef: null,
    nextEvent: "Vừa khởi tạo — Sẵn sàng bàn giao",
    notes: notes.trim() || "Kho mới khởi tạo tại Cơ sở Tân Bình",
    localOverride: true,
  };

  units.push(newUnit);
  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: newUnit.code,
    action: "CREATE_UNIT",
    fromStatus: null,
    toStatus: "AVAILABLE",
    reason: `Khởi tạo kho mới ${newUnit.code} (${newUnit.sizeM2}m² · ${newUnit.zone})`,
  });

  return newUnit;
}

/**
 * Flow 5 (Node 9): Xóa Kho không còn sử dụng (Delete Unit — có kiểm tra ràng buộc hợp đồng)
 */
export function deleteFacilityUnit(unitId, reason, actor = "Trần Tuấn (Quản lý cơ sở)") {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Vui lòng nhập lý do xóa kho (tối thiểu 5 ký tự).");
  }
  const units = getFacilityUnits();
  const idx = units.findIndex((u) => u.id === Number(unitId));
  if (idx === -1) throw new Error("Không tìm thấy kho.");

  const unit = units[idx];
  const guard = checkRetireGuard(unit);
  if (!guard.allowed) {
    throw new Error(guard.blocker.message);
  }

  units.splice(idx, 1);
  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: unit.code,
    action: "DELETE_UNIT",
    fromStatus: unit.status,
    toStatus: "DELETED",
    reason: reason.trim(),
  });

  return unit;
}

/**
 * Flow 5 (Node 9): Gộp nhiều kho liền kề thành kho lớn (Merge Units)
 */
export function mergeFacilityUnits(
  unitIds = [],
  { newCode, reason },
  actor = "Trần Tuấn (Quản lý cơ sở)"
) {
  if (!Array.isArray(unitIds) || unitIds.length < 2) {
    throw new Error("Vui lòng chọn ít nhất 2 kho trống cùng tầng/khu vực để gộp.");
  }
  const normalizedCode = String(newCode || "").trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error("Vui lòng nhập mã cho kho mới sau khi gộp (ví dụ: XL-1).");
  }
  if (!reason || reason.trim().length < 5) {
    throw new Error("Vui lòng nhập lý do gộp kho (tối thiểu 5 ký tự).");
  }

  const units = getFacilityUnits();
  const selected = unitIds.map((id) => units.find((u) => u.id === Number(id))).filter(Boolean);
  if (selected.length < 2) {
    throw new Error("Không tìm thấy đủ các kho đã chọn.");
  }

  for (const u of selected) {
    const guard = checkRetireGuard(u);
    if (!guard.allowed) {
      throw new Error(`Không thể gộp vì kho ${u.code} đang bận hợp đồng/đặt chỗ.`);
    }
    if (u.status === "RETIRED") {
      throw new Error(`Kho ${u.code} đã ngừng khai thác, không thể gộp.`);
    }
  }

  const firstZone = selected[0].zone;
  const firstFloor = selected[0].floor;
  if (selected.some((u) => u.zone !== firstZone || u.floor !== firstFloor)) {
    throw new Error("Chỉ được phép gộp các kho nằm cùng Tầng và cùng Khu vực.");
  }

  if (units.some((u) => u.code.toUpperCase() === normalizedCode)) {
    throw new Error(`Mã kho ${normalizedCode} đã tồn tại.`);
  }

  const totalSize = Number(selected.reduce((sum, u) => sum + Number(u.sizeM2 || 0), 0).toFixed(1));
  const totalPrice = selected.reduce((sum, u) => sum + Number(u.baseRentPrice || 0), 0);
  const sourceCodes = selected.map((u) => u.code).join(" + ");

  selected.forEach((u) => {
    u.status = "RETIRED";
    u.localOverride = true;
    u.nextEvent = `Đã gộp vào kho ${normalizedCode}`;
  });

  const maxId = units.reduce((m, u) => Math.max(m, Number(u.id) || 0), 0);
  const mergedUnit = {
    id: maxId + 1,
    code: normalizedCode,
    typeName: totalSize >= 12 ? "Kho lớn (L)" : "Kho vừa (M)",
    typeId: totalSize >= 12 ? 4 : 3,
    sizeM2: totalSize,
    floor: firstFloor,
    zone: firstZone,
    status: "AVAILABLE",
    baseRentPrice: totalPrice,
    monthlyPrice: totalPrice,
    facilityId: 1,
    facilityName: "Cơ sở Tân Bình",
    tenant: null,
    contractRef: null,
    nextEvent: `Gộp từ (${sourceCodes}) — Sẵn sàng bàn giao`,
    notes: `Gộp từ ${sourceCodes}: ${reason.trim()}`,
    localOverride: true,
  };

  units.push(mergedUnit);
  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: normalizedCode,
    action: "MERGE_UNITS",
    fromStatus: sourceCodes,
    toStatus: "AVAILABLE",
    reason: `Gộp (${sourceCodes}) thành ${normalizedCode} (${totalSize}m²): ${reason.trim()}`,
  });

  return mergedUnit;
}

/**
 * Flow 7 (Node f7_maint): Đưa kho sự cố nghiêm trọng vào Bảo trì & Chuẩn bị kho thay thế cho khách
 */
export function emergencyRelocateUnit(
  damagedUnitCode,
  replacementUnitCode,
  reason,
  actor = "Trần Tuấn (Quản lý cơ sở)"
) {
  const units = getFacilityUnits();
  const damaged = units.find((u) => u.code.toUpperCase() === String(damagedUnitCode || "").trim().toUpperCase());
  const replacement = units.find((u) => u.code.toUpperCase() === String(replacementUnitCode || "").trim().toUpperCase());

  if (!replacement || replacement.status !== "AVAILABLE") {
    throw new Error("Vui lòng chọn một kho đang Còn trống để bố trí thay thế cho khách hàng.");
  }

  const tenantName = damaged?.tenant || "Khách hàng hiện hữu";
  const contractRef = damaged?.contractRef || "Hợp đồng đang thuê";

  if (damaged) {
    const prevDamagedStatus = damaged.status;
    damaged.status = "MAINTENANCE";
    damaged.tenant = null;
    damaged.contractRef = null;
    damaged.localOverride = true;
    damaged.nextEvent = `Bảo trì sự cố khẩn — Khách đã chuyển sang ${replacement.code}`;

    addActivityLog({
      actor,
      unitCode: damaged.code,
      action: "SET_MAINTENANCE",
      fromStatus: prevDamagedStatus,
      toStatus: "MAINTENANCE",
      reason: `Sự cố nghiêm trọng, chuyển khách sang ${replacement.code}: ${reason || "Xử lý sự cố"}`,
    });
  }

  replacement.status = "RENTED";
  replacement.tenant = tenantName;
  replacement.contractRef = contractRef;
  replacement.localOverride = true;
  replacement.nextEvent = `Tiếp nhận thay thế cho kho ${damagedUnitCode}`;

  saveFacilityUnits(units);

  addActivityLog({
    actor,
    unitCode: replacement.code,
    action: "RELOCATE_UNIT",
    fromStatus: "AVAILABLE",
    toStatus: "RENTED",
    reason: `Bố trí kho thay thế cho khách (${tenantName}) từ kho ${damagedUnitCode}`,
  });

  return { damaged, replacement };
}
