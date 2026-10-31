/**
 * StorageHub — Activity Log Service (Audit Trail)
 * Kết nối trực tiếp API Backend `/api/v1/activity-logs` kết hợp đồng bộ các bản ghi kiểm toán nội bộ.
 */

import { apiClient, safeParseJson } from "./apiClient.js";
import { ENTITY_TYPE_LABELS } from "../utils/statusLabels.js";

// Chỉ chứa các nhóm lọc thực thể duy nhất (đã loại bỏ khóa trùng lặp STAFF_ASSIGNMENT gây lặp 2 nút "Ca trực")
export const ENTITY_TYPES = {
  ALL: { key: "ALL", label: "Tất cả", badgeClass: "" },
  UNIT: { key: "UNIT", label: "Kho", badgeClass: "badge-entity--unit" },
  RESERVATION: { key: "RESERVATION", label: "Đơn thuê", badgeClass: "badge-entity--reservation" },
  CONTRACT: { key: "CONTRACT", label: "Hợp đồng", badgeClass: "badge-entity--contract" },
  PAYMENT: { key: "PAYMENT", label: "Thanh toán", badgeClass: "badge-entity--payment" },
  TASK: { key: "TASK", label: "Công việc", badgeClass: "badge-entity--task" },
  SHIFT: { key: "SHIFT", label: "Ca trực", badgeClass: "badge-entity--shift" },
  POLICY: { key: "POLICY", label: "Chính sách", badgeClass: "badge-entity--policy" },
  TICKET: { key: "TICKET", label: "Sự cố", badgeClass: "badge-entity--ticket" },
  USER: { key: "USER", label: "Tài khoản", badgeClass: "badge-entity--user" },
};

export const ENTITY_META_FALLBACK = {
  ...ENTITY_TYPES,
  STAFF_ASSIGNMENT: { key: "STAFF_ASSIGNMENT", label: "Ca trực", badgeClass: "badge-entity--shift" },
  AUTH: { key: "AUTH", label: "Phiên đăng nhập", badgeClass: "badge-entity--user" },
};

export const ROLE_LABELS = {
  FACILITY_MANAGER: "Quản lý cơ sở",
  STAFF: "Nhân viên cơ sở",
  CUSTOMER: "Khách hàng",
  SYSTEM_ADMIN: "Quản trị hệ thống",
  BUSINESS_OPS: "Vận hành kinh doanh",
  SYSTEM: "Hệ thống tự động",
};

export const ACTION_BADGES = {
  STATUS_CHANGE: { label: "Đổi trạng thái", class: "badge-action--status" },
  CREATED: { label: "Tạo mới", class: "badge-action--create" },
  CREATE_UNIT: { label: "Tạo kho", class: "badge-action--create" },
  DELETED: { label: "Xóa bỏ", class: "badge-action--fail" },
  DELETE_UNIT: { label: "Xóa kho", class: "badge-action--fail" },
  MERGE_UNITS: { label: "Gộp kho", class: "badge-action--extend" },
  UPDATED: { label: "Cập nhật", class: "badge-action--fix" },
  UPDATE_SPECS: { label: "Cập nhật thông số", class: "badge-action--fix" },
  EXTENDED: { label: "Gia hạn hợp đồng", class: "badge-action--extend" },
  CONTRACT_SIGNED: { label: "Ký hợp đồng", class: "badge-action--sign" },
  LOGIN_FAILED: { label: "Đăng nhập thất bại", class: "badge-action--fail" },
  LOGIN: { label: "Đăng nhập", class: "badge-action--login" },
  LOGOUT: { label: "Đăng xuất", class: "badge-action--login" },
  FIX_STATUS: { label: "Điều chỉnh trạng thái", class: "badge-action--fix" },
  MANUAL_STATUS_FIX: { label: "Điều chỉnh trạng thái", class: "badge-action--fix" },
  SET_MAINTENANCE: { label: "Chuyển bảo trì", class: "badge-action--maintenance" },
  FINISH_MAINTENANCE: { label: "Hoàn tất bảo trì", class: "badge-action--resolve" },
  RETIRE_UNIT: { label: "Ngừng khai thác", class: "badge-action--retire" },
  RELOCATE_UNIT: { label: "Đổi kho sự cố", class: "badge-action--maintenance" },
  RESOLVED: { label: "Đã giải quyết", class: "badge-action--resolve" },
  ESCALATED: { label: "Chuyển cấp Quản lý", class: "badge-action--escalate" },
  ROLE_CHANGED: { label: "Đổi vai trò", class: "badge-action--fix" },
};

export const STATUS_LABELS = {
  AVAILABLE: "Còn trống",
  RESERVED: "Đã giữ chỗ",
  RENTED: "Đang thuê",
  MAINTENANCE: "Đang bảo trì",
  PREPARING: "Đang chuẩn bị",
  RETIRED: "Ngừng khai thác",
  CHECKED_IN: "Đang thuê",
  CHECKOUT_REQUESTED: "Chờ trả kho",
  CLOSED: "Đã hoàn tất",
  COMPLETED: "Đã hoàn tất",
  AWAITING_SIGNATURE: "Chờ ký xác nhận",
  PRINTED: "Đã in hợp đồng",
  SIGNED: "Đã ký xác nhận",
  DRAFT: "Bản thảo",
  ACTIVE: "Đang hiệu lực",
  OPEN: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  ESCALATED: "Chờ Quản lý xử lý",
  RESOLVED: "Đã giải quyết",
  MORNING: "Ca sáng",
  AFTERNOON: "Ca chiều",
  EVENING: "Ca tối",
  FULL_DAY: "Ca hành chính",
  ON_CALL: "Trực dự phòng",
  SUCCESS: "Thành công",
  SUCCEEDED: "Đã thanh toán",
  FAILED: "Thất bại",
};

function formatEntityCode(entityType, entityId, actorEmail) {
  if (entityType === "USER" && actorEmail) return actorEmail;
  const viPrefix = ENTITY_TYPE_LABELS[entityType] || entityType || "Bản ghi";
  return `${viPrefix} #${entityId}`;
}

export async function fetchActivityLogs({
  entityType = "ALL",
  searchTerm = "",
  startDate,
  endDate,
  page = 1,
  pageSize = 50,
  signal,
} = {}) {
  const params = new URLSearchParams();
  if (entityType && entityType !== "ALL") {
    params.append("entityType", entityType);
  }
  if (searchTerm && searchTerm.trim()) params.append("query", searchTerm.trim());
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  params.append("page", String(page));
  params.append("pageSize", String(pageSize));

  const response = await apiClient(`/api/v1/activity-logs?${params.toString()}`, { signal });
  const errorData = await safeParseJson(response).catch(() => ({}));
  if (!response.ok) {
    throw new Error(errorData.message || "Không thể tải nhật ký hoạt động hệ thống.");
  }

  const data = await safeParseJson(response);
  const items = Array.isArray(data.items) ? data.items : [];

  const mapped = items.map((item) => {
    const normalizedEntity = item.entityType === "STAFF_ASSIGNMENT" ? "SHIFT" : item.entityType;
    return {
      id: item.logId,
      timestamp: item.createdAt,
      actor: item.actorName || "Hệ thống",
      actorEmail: item.actorEmail || null,
      actorRole: item.actorRole || "SYSTEM",
      entityType: normalizedEntity,
      entityId: String(item.entityId || item.logId),
      entityCode: formatEntityCode(normalizedEntity, item.entityId || item.logId, item.actorEmail),
      action: item.action,
      fromValue: item.fromValue,
      toValue: item.toValue,
      reason: item.reason || "Ghi nhận nghiệp vụ hệ thống",
    };
  });

  return {
    items: mapped,
    page: data.page || page,
    pageSize: data.pageSize || pageSize,
    total: data.total || mapped.length,
    totalPages: data.totalPages || 1,
  };
}

/**
 * Ghi nhận log kiểm toán phía client (fire-and-forget).
 * Backend chưa có endpoint POST activity-logs nên không persist; trả về bản ghi để UI dùng ngay.
 */
export function appendActivityLog({
  actor,
  actorRole = "FACILITY_MANAGER",
  entityType,
  entityId,
  entityCode,
  entityName,
  action,
  fromValue = null,
  toValue = null,
  reason,
}) {
  return {
    id: `LOC-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: actor || "Hệ thống",
    actorRole,
    entityType: entityType || "UNIT",
    entityId: String(entityId || ""),
    entityCode: entityCode || entityName || String(entityId || ""),
    action: action || "UPDATED",
    fromValue,
    toValue,
    reason: (reason || "Cập nhật nghiệp vụ hệ thống").trim(),
  };
}
