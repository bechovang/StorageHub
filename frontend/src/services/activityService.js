/**
 * StorageHub — Activity Log Service (Audit Trail)
 * Kết nối trực tiếp API Backend `/api/v1/activity-logs` kết hợp đồng bộ các bản ghi kiểm toán nội bộ.
 */

import { apiClient, safeParseJson } from "./apiClient.js";
import { ENTITY_TYPE_LABELS } from "../utils/statusLabels.js";

export const ENTITY_TYPES = {
  ALL: { key: "ALL", label: "Tất cả", badgeClass: "" },
  UNIT: { key: "UNIT", label: "Kho", badgeClass: "badge-entity--unit" },
  RESERVATION: { key: "RESERVATION", label: "Đơn thuê", badgeClass: "badge-entity--reservation" },
  CONTRACT: { key: "CONTRACT", label: "Hợp đồng", badgeClass: "badge-entity--contract" },
  ADDENDUM: { key: "ADDENDUM", label: "Phụ lục", badgeClass: "badge-entity--contract" },
  PAYMENT: { key: "PAYMENT", label: "Thanh toán", badgeClass: "badge-entity--payment" },
  TASK: { key: "TASK", label: "Công việc", badgeClass: "badge-entity--task" },
  SHIFT: { key: "SHIFT", label: "Ca trực", badgeClass: "badge-entity--shift" },
  EXTENSION: { key: "EXTENSION", label: "Gia hạn", badgeClass: "badge-entity--extend" },
  LATE_CHECKOUT_CASE: { key: "LATE_CHECKOUT_CASE", label: "Trả muộn", badgeClass: "badge-entity--late" },
  POLICY: { key: "POLICY", label: "Chính sách", badgeClass: "badge-entity--policy" },
  TICKET: { key: "TICKET", label: "Sự cố", badgeClass: "badge-entity--ticket" },
  USER: { key: "USER", label: "Tài khoản", badgeClass: "badge-entity--user" },
};

/**
 * Chip trên UI gom nhiều entity_type ở backend (1 chip = nhiều giá trị).
 * Backend nhận `entityType` dạng danh sách phân tách bằng dấu phẩy.
 */
const ENTITY_FILTER_QUERY = {
  SHIFT: "STAFF_ASSIGNMENT",
  ADDENDUM: "ADDENDUM,CONTRACT_ADDENDUM",
};

/** entity_type lưu trong DB → key hiển thị trên UI. */
const ENTITY_DISPLAY_TYPE = {
  STAFF_ASSIGNMENT: "SHIFT",
  CONTRACT_ADDENDUM: "ADDENDUM",
};

export const ENTITY_META_FALLBACK = {
  ...ENTITY_TYPES,
  STAFF_ASSIGNMENT: { key: "STAFF_ASSIGNMENT", label: "Ca trực", badgeClass: "badge-entity--shift" },
  CONTRACT_ADDENDUM: { key: "CONTRACT_ADDENDUM", label: "Phụ lục", badgeClass: "badge-entity--contract" },
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
  STATUS_CHANGED: { label: "Đổi trạng thái", class: "badge-action--status" },
  CREATED: { label: "Tạo mới", class: "badge-action--create" },
  CREATE_UNIT: { label: "Tạo kho", class: "badge-action--create" },
  DELETED: { label: "Xóa bỏ", class: "badge-action--fail" },
  DELETE_UNIT: { label: "Xóa kho", class: "badge-action--fail" },
  MERGE_UNITS: { label: "Gộp kho", class: "badge-action--extend" },
  UPDATED: { label: "Cập nhật", class: "badge-action--fix" },
  UPDATE_SPECS: { label: "Cập nhật thông số", class: "badge-action--fix" },
  EXTENDED: { label: "Gia hạn hợp đồng", class: "badge-action--extend" },
  DEPOSIT_CONFIRMED: { label: "Xác nhận cọc gia hạn", class: "badge-action--payment" },
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
  ROLE_ASSIGNED: { label: "Gán vai trò", class: "badge-action--fix" },
  AUTO_HANDOFF: { label: "Tự động bàn giao", class: "badge-action--status" },
  MANAGER_INSTRUCT: { label: "Quản lý chỉ đạo", class: "badge-action--escalate" },
  MANAGER_RELOCATE: { label: "Quản lý điều chuyển", class: "badge-action--maintenance" },
  MANAGER_CHECKOUT_REFUND: { label: "Quản lý hoàn tiền", class: "badge-action--payment" },
  TRANSFER_CREATED: { label: "Tạo đơn chuyển kho", class: "badge-action--create" },
  PAYMENT_SUCCEEDED: { label: "Thanh toán thành công", class: "badge-action--payment" },
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
  pageSize = 25,
  signal,
} = {}) {
  const params = new URLSearchParams();
  if (entityType && entityType !== "ALL") {
    params.append("entityType", ENTITY_FILTER_QUERY[entityType] || entityType);
  }
  if (searchTerm && searchTerm.trim()) params.append("query", searchTerm.trim());
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  params.append("page", String(page));
  params.append("pageSize", String(pageSize));

  const response = await apiClient(`/api/v1/activity-logs?${params.toString()}`, { signal });
  // Đọc body đúng MỘT lần — response.text() lần thứ hai trả rỗng và làm mất toàn bộ items.
  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Không thể tải nhật ký hoạt động hệ thống.");
  }

  const items = Array.isArray(data.items) ? data.items : [];

  const mapped = items.map((item) => {
    const normalizedEntity = ENTITY_DISPLAY_TYPE[item.entityType] || item.entityType;
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

  const summary = data.summary || {};

  return {
    items: mapped,
    page: data.page || page,
    pageSize: data.pageSize || pageSize,
    total: data.total ?? mapped.length,
    totalPages: data.totalPages ?? 1,
    summary: {
      totalEntries: summary.totalEntries ?? data.total ?? 0,
      statusChanges: summary.statusChanges ?? 0,
      securityEvents: summary.securityEvents ?? 0,
    },
  };
}
