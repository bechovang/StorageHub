/**
 * StorageHub — Activity Log Service (US-27 / FR-28 / NFR-6)
 *
 * Quản lý nhật ký kiểm toán hệ thống (Audit Trail):
 * - Append-only: Chỉ thêm, tuyệt đối không sửa hay xóa (NFR-6).
 * - Read-only viewer: Mỗi dòng log gồm timestamp, actor, entity, action, from → to, reason.
 * - Kết nối trực tiếp API Backend: /api/v1/activity-logs
 */

import { apiClient, safeParseJson } from "./apiClient.js";

const STORAGE_KEY = "storagehub_activity_logs_v4";

export const ENTITY_TYPES = {
  ALL: { key: "ALL", label: "Tất cả", badgeClass: "" },
  UNIT: { key: "UNIT", label: "Ô kho", badgeClass: "badge-entity--unit" },
  RESERVATION: { key: "RESERVATION", label: "Đơn thuê", badgeClass: "badge-entity--reservation" },
  CONTRACT: { key: "CONTRACT", label: "Hợp đồng", badgeClass: "badge-entity--contract" },
  PAYMENT: { key: "PAYMENT", label: "Thanh toán", badgeClass: "badge-entity--payment" },
  TASK: { key: "TASK", label: "Nhiệm vụ", badgeClass: "badge-entity--task" },
  STAFF_ASSIGNMENT: { key: "STAFF_ASSIGNMENT", label: "Ca trực", badgeClass: "badge-entity--shift" },
  SHIFT: { key: "SHIFT", label: "Ca trực", badgeClass: "badge-entity--shift" },
  USER: { key: "USER", label: "Tài khoản", badgeClass: "badge-entity--user" },
  TICKET: { key: "TICKET", label: "Sự cố", badgeClass: "badge-entity--ticket" },
};

export const ROLE_LABELS = {
  FACILITY_MANAGER: "Quản lý cơ sở",
  STAFF: "Nhân viên vận hành",
  CUSTOMER: "Khách hàng",
  SYSTEM_ADMIN: "Quản trị hệ thống",
  BUSINESS_OPS: "Vận hành kinh doanh",
  SYSTEM: "Hệ thống tự động",
};

export const ACTION_BADGES = {
  STATUS_CHANGE: { label: "Đổi trạng thái", class: "badge-action--status" },
  CREATED: { label: "Tạo mới", class: "badge-action--create" },
  DELETED: { label: "Hủy bỏ", class: "badge-action--fail" },
  UPDATED: { label: "Cập nhật", class: "badge-action--fix" },
  EXTENDED: { label: "Gia hạn hợp đồng", class: "badge-action--extend" },
  CONTRACT_SIGNED: { label: "Ký hợp đồng", class: "badge-action--sign" },
  LOGIN_FAILED: { label: "Đăng nhập lỗi", class: "badge-action--fail" },
  LOGIN: { label: "Đăng nhập", class: "badge-action--login" },
  LOGOUT: { label: "Đăng xuất", class: "badge-action--login" },
  FIX_STATUS: { label: "Điều chỉnh trạng thái", class: "badge-action--fix" },
  SET_MAINTENANCE: { label: "Chuyển bảo trì", class: "badge-action--maintenance" },
  RETIRE_UNIT: { label: "Ngừng khai thác", class: "badge-action--retire" },
  RESOLVED: { label: "Đã giải quyết", class: "badge-action--resolve" },
  ESCALATED: { label: "Chuyển cấp trên", class: "badge-action--escalate" },
};

export const STATUS_LABELS = {
  AVAILABLE: "Sẵn sàng",
  RESERVED: "Đã giữ chỗ",
  RENTED: "Đang thuê",
  MAINTENANCE: "Bảo trì",
  PREPARING: "Đệm vệ sinh",
  RETIRED: "Ngừng khai thác",
  PENDING_PAYMENT: "Chờ thanh toán",
  CHECKED_IN: "Đã nhận kho",
  CHECKOUT_REQUESTED: "Chờ trả kho",
  CLOSED: "Đã tất toán",
  PRINTED: "Bản in",
  SIGNED: "Đã ký kết",
  DRAFT: "Bản nháp",
  OPEN: "Tiếp nhận",
  RESOLVED: "Đã giải quyết",
  MORNING: "Ca sáng",
  AFTERNOON: "Ca chiều",
  EVENING: "Ca tối",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

/**
 * Lấy danh sách nhật ký kiểm toán từ máy chủ Backend (FR-28 / NFR-6)
 * @param {Object} params
 * @param {string} [params.entityType="ALL"]
 * @param {string} [params.searchTerm=""]
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=50]
 * @returns {Promise<{ items: Array, page: number, pageSize: number, total: number, totalPages: number }>}
 */
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
  if (entityType && entityType !== "ALL") params.append("entityType", entityType);
  if (searchTerm && searchTerm.trim()) params.append("query", searchTerm.trim());
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  params.append("page", String(page));
  params.append("pageSize", String(pageSize));

  const response = await apiClient(`/api/v1/activity-logs?${params.toString()}`, { signal });
  if (!response.ok) {
    const errorData = await safeParseJson(response);
    throw new Error(errorData.message || "Không thể tải nhật ký hoạt động hệ thống.");
  }

  const data = await safeParseJson(response);
  const items = Array.isArray(data.items) ? data.items : [];

  const mapped = items.map((item) => ({
    id: item.logId,
    timestamp: item.createdAt,
    actor: item.actorName || "Hệ thống",
    actorEmail: item.actorEmail || null,
    actorRole: item.actorRole || "SYSTEM",
    entityType: item.entityType,
    entityId: String(item.entityId || item.logId),
    entityCode:
      item.entityType === "USER" && item.actorEmail
        ? item.actorEmail
        : `${item.entityType} #${item.entityId || item.logId}`,
    action: item.action,
    fromValue: item.fromValue,
    toValue: item.toValue,
    reason: item.reason || "Ghi nhận nghiệp vụ hệ thống",
  }));

  return {
    items: mapped,
    page: data.page || page,
    pageSize: data.pageSize || pageSize,
    total: data.total || mapped.length,
    totalPages: data.totalPages || 1,
  };
}

/**
 * Fallback đọc local / cache
 */
export function getActivityLogs({ entityType = "ALL", searchTerm = "" } = {}) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        let logs = parsed;
        if (entityType && entityType !== "ALL") {
          logs = logs.filter((log) => log.entityType === entityType);
        }
        if (searchTerm && searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase();
          logs = logs.filter(
            (log) =>
              (log.actor && log.actor.toLowerCase().includes(q)) ||
              (log.entityCode && log.entityCode.toLowerCase().includes(q)) ||
              (log.reason && log.reason.toLowerCase().includes(q))
          );
        }
        return logs;
      }
    }
  } catch (err) {
    console.error("Failed to read cached logs:", err);
  }
  return [];
}

/**
 * Lưu bổ sung log vào local cache (phục vụ offline/fallback nếu cần)
 */
export function appendActivityLog({
  actor,
  actorRole = "FACILITY_MANAGER",
  entityType,
  entityId,
  entityCode,
  action,
  fromValue = null,
  toValue = null,
  reason,
}) {
  const newLog = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    actor: actor || "Hệ thống",
    actorRole,
    entityType,
    entityId: String(entityId),
    entityCode: entityCode || String(entityId),
    action,
    fromValue,
    toValue,
    reason: (reason || "").trim(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // Ignore cache save error
  }

  return newLog;
}
