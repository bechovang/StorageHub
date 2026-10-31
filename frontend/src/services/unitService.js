import { apiClient, safeParseJson } from "./apiClient";

/**
 * Chuẩn hoá Unit Admin DTO từ GET /api/v1/units/admin
 * { id, code, typeName, typeId, zoneCode, zoneId, sizeM2, floor, accessType, status, notes }
 * Lưu ý: DTO quản trị KHÔNG có giá thuê (giá thuộc Policy page).
 */
function normalizeApiUnit(u) {
  return {
    id: u.id ?? u.unitId,
    unitId: u.id ?? u.unitId,
    code: u.code || u.unitCode,
    unitCode: u.code || u.unitCode,
    typeId: u.typeId,
    typeName: u.typeName || "Kho tiêu chuẩn",
    typeCode: u.typeCode,
    sizeM2: Number(u.sizeM2 || 0),
    floor: Number(u.floor || 1),
    zone: u.zoneCode || u.zone || "—",
    zoneCode: u.zoneCode || u.zone || null,
    zoneId: u.zoneId,
    accessType: u.accessType || null,
    status: u.status || "AVAILABLE",
    notes: u.notes || "",
    description: u.notes || "",
  };
}

async function throwApiError(res, defaultMessage) {
  const data = await safeParseJson(res);
  const err = new Error(data?.message || defaultMessage);
  err.code = data?.code;
  err.status = res.status;
  throw err;
}

/**
 * GET /api/v1/units/filter-options
 */
export async function getUnitFilterOptions() {
  const res = await apiClient("/api/v1/units/filter-options");
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tải tuỳ chọn bộ lọc kho.");
  }
  return {
    types: data.types || data.unitTypes || [],
    unitTypes: data.unitTypes || data.types || [],
    sizesM2: data.sizesM2 || data.sizes || [],
    sizes: data.sizes || data.sizesM2 || [],
    facilities: data.facilities || [],
  };
}

/**
 * GET /api/v1/units?type-id=&size-m2=&start-date=&end-date=&sort=&page=&page-size=
 * Flow 1: loại, kích thước, khoảng ngày thuê (theo ngày)
 */
export async function searchUnits({
  typeId = "",
  sizeM2 = "",
  query = "",
  startDate = "",
  endDate = "",
  sort = "price-asc",
  page = 1,
  pageSize = 25,
} = {}) {
  const queryParams = new URLSearchParams();
  if (typeId) queryParams.set("type-id", typeId);
  if (sizeM2) queryParams.set("size-m2", sizeM2);
  if (query) queryParams.set("q", query.trim());
  if (startDate) queryParams.set("start-date", startDate);
  if (endDate) queryParams.set("end-date", endDate);
  if (sort) queryParams.set("sort", sort);
  queryParams.set("page", page);
  queryParams.set("page-size", pageSize);

  const res = await apiClient(`/api/v1/units?${queryParams.toString()}`);
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tải danh sách kho.");
  }
  return data;
}

/**
 * GET /api/v1/units/{unitId}
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
 * GET /api/v1/units/{unitId}/quote?start-date=&end-date=
 * Flow 1 (theo ngày): Tổng tiền thuê = giá thuê ngày × số ngày (end inclusive)
 * Tiền cọc = 10% × tổng tiền thuê (tối thiểu 5.000 ₫)
 */
export async function getUnitQuote(unitId, { startDate, endDate } = {}) {
  if (!startDate || !endDate) {
    throw new Error("Vui lòng chọn ngày bắt đầu và ngày kết thúc thuê.");
  }
  const queryParams = new URLSearchParams();
  queryParams.set("start-date", startDate);
  queryParams.set("end-date", endDate);

  const res = await apiClient(`/api/v1/units/${unitId}/quote?${queryParams.toString()}`);
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tải bảng báo giá.");
  }
  return data;
}

// ============================================================================
// QUẢN LÝ DANH MỤC KHO CƠ SỞ (Flow 5 & Flow 7)
// Toàn bộ thao tác quản trị đã gọi thẳng API backend (UnitAdminController),
// không còn cache trong phiên (session) nữa.
// ============================================================================

/**
 * GET /api/v1/units/admin — danh mục kho cho màn hình quản trị
 */
export async function fetchFacilityUnits() {
  const res = await apiClient("/api/v1/units/admin");
  const data = await safeParseJson(res);
  if (!res.ok) {
    await throwApiError(res, "Không thể tải danh mục kho.");
  }
  const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  return list.map(normalizeApiUnit);
}

export function getUnitActivityLogs() {
  // Nhật ký hoạt động đã chuyển hoàn toàn sang API /api/v1/activity-logs
  return [];
}

/**
 * Guard phía client (tiện ích hiển thị) — quy tắc chặn cuối cùng vẫn do
 * backend enforce tại PATCH /api/v1/units/{id}/status.
 */
export function checkRetireGuard(unit) {
  if (unit.status === "RENTED") {
    return {
      allowed: false,
      blocker: {
        title: "Không thể ngừng khai thác: Kho đang có hợp đồng thuê",
        message: `Kho ${unit.code} đang có hợp đồng thuê hiệu lực. Hệ thống không cho phép ngừng khai thác khi khách hàng đang lưu trữ tài sản.`,
        actionAdvice: "Vui lòng hoàn tất thủ tục trả kho và thanh lý hợp đồng trước khi ngừng khai thác kho này.",
      },
    };
  }

  if (unit.status === "RESERVED") {
    return {
      allowed: false,
      blocker: {
        title: "Không thể ngừng khai thác: Kho đang có đơn giữ chỗ",
        message: `Kho ${unit.code} đang được giữ chỗ cho một đơn đặt chỗ chưa xử lý.`,
        actionAdvice: "Vui lòng bố trí kho thay thế hoặc tất toán hoàn cọc cho khách trước khi ngừng khai thác.",
      },
    };
  }

  return { allowed: true };
}

export function checkMaintenanceGuard(unit) {
  if (unit.status === "RENTED") {
    return {
      allowed: false,
      blocker: {
        title: "Không thể bảo trì trực tiếp: Kho đang có khách lưu trữ",
        message: `Kho ${unit.code} đang được khách hàng lưu trữ tài sản. Không thể chuyển sang bảo trì khi chưa di dời sang kho thay thế.`,
        actionAdvice: "Nếu xảy ra sự cố khẩn cấp (Flow 7), vui lòng mở mục Hỗ trợ sự cố để điều phối kho thay thế và chuyển bảo trì an toàn.",
      },
    };
  }
  return { allowed: true };
}

/** PATCH /api/v1/units/{id}/status — đổi trạng thái (dùng chung cho mọi thao tác trạng thái) */
async function changeUnitStatus(unitId, status, reason) {
  const res = await apiClient(`/api/v1/units/${unitId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
  const data = await safeParseJson(res);
  if (!res.ok) {
    await throwApiError(res, "Không thể cập nhật trạng thái kho.");
  }
  return normalizeApiUnit(data);
}

/** Cho nghỉ kho: PATCH status = RETIRED (kèm lý do kiểm toán) */
export async function retireUnit(unitId, reason = "Ngừng khai thác kho, tạm rút khỏi danh mục cho thuê") {
  return changeUnitStatus(unitId, "RETIRED", reason);
}

/** Đưa vào bảo trì: PATCH status = MAINTENANCE */
export async function setUnitMaintenance(unitId, reason) {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Vui lòng nhập lý do bảo trì cụ thể (tối thiểu 5 ký tự).");
  }
  return changeUnitStatus(unitId, "MAINTENANCE", reason.trim());
}

/** Hoàn tất bảo trì: PATCH status = AVAILABLE (mở cho thuê lại) */
export async function finishUnitMaintenance(unitId) {
  return changeUnitStatus(
    unitId,
    "AVAILABLE",
    "Hoàn tất sửa chữa & vệ sinh, mở kho cho thuê lại"
  );
}

/** Sửa trạng thái trực tiếp (Fix Status) — bắt buộc lý do kiểm toán */
export async function fixUnitStatus(unitId, newStatus, reason) {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Vui lòng nhập lý do điều chỉnh trạng thái phục vụ kiểm toán (tối thiểu 5 ký tự).");
  }
  return changeUnitStatus(unitId, newStatus, reason.trim());
}

/**
 * PATCH /api/v1/units/{id} — cập nhật thông số kho.
 * Giá thuê (baseDailyRent) đã bị loại khỏi form: giá thuộc Policy page.
 */
export async function updateUnitSpecs(unitId, { notes, sizeM2, floor }) {
  const body = {};
  if (sizeM2 !== undefined && sizeM2 !== null && sizeM2 !== "") body.sizeM2 = Number(sizeM2);
  if (floor !== undefined && floor !== null && floor !== "") body.floor = Number(floor);
  if (notes !== undefined) body.notes = notes;

  const res = await apiClient(`/api/v1/units/${unitId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = await safeParseJson(res);
  if (!res.ok) {
    await throwApiError(res, "Không thể cập nhật thông số kho.");
  }
  return normalizeApiUnit(data);
}

/**
 * POST /api/v1/units — tạo kho mới
 * body { code?, typeId, zoneId, sizeM2?, floor?, accessType?, notes?, reason? }
 */
export async function createUnit(payload) {
  const res = await apiClient("/api/v1/units", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await safeParseJson(res);
  if (!res.ok) {
    await throwApiError(res, "Không thể tạo kho mới.");
  }
  return normalizeApiUnit(data);
}

/**
 * DELETE /api/v1/units/{id} — cho nghỉ kho (soft-retire), body tuỳ chọn { reason }
 */
export async function deleteUnit(unitId, reason) {
  const res = await apiClient(`/api/v1/units/${unitId}`, {
    method: "DELETE",
    body: JSON.stringify(reason ? { reason } : {}),
  });
  const data = await safeParseJson(res);
  if (!res.ok) {
    await throwApiError(res, "Không thể cho nghỉ kho này.");
  }
  return data;
}
