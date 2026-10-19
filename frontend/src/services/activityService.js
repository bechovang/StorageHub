/**
 * StorageHub — Activity Log Service (US-27 / FR-28)
 *
 * Quản lý nhật ký kiểm toán hệ thống (Audit Trail) tuân thủ:
 * - Append-only: Chỉ thêm, tuyệt đối không sửa hay xóa (NFR-6, Flyway V1).
 * - Read-only viewer: Mỗi dòng log gồm timestamp, actor, entity, action, from → to, reason (bắt buộc).
 * - Dữ liệu nghiệp vụ thực tế đồng bộ 100% với Flyway seed (V2__seed_demo.sql).
 */

const STORAGE_KEY = "storagehub_activity_logs_v4";

export const ENTITY_TYPES = {
  ALL: { key: "ALL", label: "Tất cả", badgeClass: "" },
  UNIT: { key: "UNIT", label: "Ô kho", badgeClass: "badge-entity--unit" },
  RESERVATION: { key: "RESERVATION", label: "Đơn thuê", badgeClass: "badge-entity--reservation" },
  CONTRACT: { key: "CONTRACT", label: "Hợp đồng", badgeClass: "badge-entity--contract" },
  TICKET: { key: "TICKET", label: "Sự cố", badgeClass: "badge-entity--ticket" },
  USER: { key: "USER", label: "Tài khoản", badgeClass: "badge-entity--user" },
};

export const ROLE_LABELS = {
  FACILITY_MANAGER: "Quản lý cơ sở",
  STAFF: "Nhân viên vận hành",
  CUSTOMER: "Khách hàng",
  SYSTEM_ADMIN: "Quản trị hệ thống",
};

export const ACTION_BADGES = {
  STATUS_CHANGE: { label: "Đổi trạng thái", class: "badge-action--status" },
  CREATED: { label: "Tạo mới", class: "badge-action--create" },
  EXTENDED: { label: "Gia hạn hợp đồng", class: "badge-action--extend" },
  CONTRACT_SIGNED: { label: "Ký hợp đồng", class: "badge-action--sign" },
  LOGIN_FAILED: { label: "Đăng nhập lỗi", class: "badge-action--fail" },
  LOGIN: { label: "Đăng nhập", class: "badge-action--login" },
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
};

/**
 * Danh sách Activity Log thực tế từ V2__seed_demo.sql với cấu trúc phân loại và mã đối tượng chuẩn xác
 */
export const INITIAL_ACTIVITY_LOGS = [
  {
    id: 1,
    timestamp: "2026-10-20T07:59:05Z",
    actor: "Vũ Văn Vũ",
    actorRole: "STAFF",
    entityType: "USER",
    entityId: "7",
    entityCode: "vu.van@storagehub.vn",
    action: "LOGIN_FAILED",
    fromValue: null,
    toValue: null,
    reason: "Khóa tài khoản do nhập sai mật khẩu quá 3 lần liên tiếp",
  },
  {
    id: 2,
    timestamp: "2026-10-20T07:58:40Z",
    actor: "Vũ Văn Vũ",
    actorRole: "STAFF",
    entityType: "USER",
    entityId: "7",
    entityCode: "vu.van@storagehub.vn",
    action: "LOGIN_FAILED",
    fromValue: null,
    toValue: null,
    reason: "Sai mật khẩu đăng nhập (lần 2)",
  },
  {
    id: 3,
    timestamp: "2026-10-20T07:58:12Z",
    actor: "Vũ Văn Vũ",
    actorRole: "STAFF",
    entityType: "USER",
    entityId: "7",
    entityCode: "vu.van@storagehub.vn",
    action: "LOGIN_FAILED",
    fromValue: null,
    toValue: null,
    reason: "Sai mật khẩu đăng nhập (lần 1)",
  },
  {
    id: 4,
    timestamp: "2026-10-19T17:55:00Z",
    actor: "Phạm Tuấn",
    actorRole: "FACILITY_MANAGER",
    entityType: "UNIT",
    entityId: "8",
    entityCode: "M-8",
    action: "STATUS_CHANGE",
    fromValue: "MAINTENANCE",
    toValue: "PREPARING",
    reason: "Hoàn tất bảo trì cửa cuốn, kích hoạt đệm xử lý vệ sinh",
  },
  {
    id: 5,
    timestamp: "2026-10-19T09:06:00Z",
    actor: "Trần Minh",
    actorRole: "STAFF",
    entityType: "UNIT",
    entityId: "3",
    entityCode: "S-3",
    action: "STATUS_CHANGE",
    fromValue: "PREPARING",
    toValue: "RENTED",
    reason: "Khách nhận kho thành công theo đơn thuê BK-1044",
  },
  {
    id: 6,
    timestamp: "2026-10-19T09:05:00Z",
    actor: "Trần Minh",
    actorRole: "STAFF",
    entityType: "RESERVATION",
    entityId: "3",
    entityCode: "BK-1044",
    action: "STATUS_CHANGE",
    fromValue: "RESERVED",
    toValue: "CHECKED_IN",
    reason: "Check-in đơn BK-1044, đã thu phí thuê 690.000 ₫",
  },
  {
    id: 7,
    timestamp: "2026-10-18T16:05:00Z",
    actor: "Trần Minh",
    actorRole: "STAFF",
    entityType: "RESERVATION",
    entityId: "1",
    entityCode: "BK-1042",
    action: "STATUS_CHANGE",
    fromValue: "CHECKOUT_REQUESTED",
    toValue: "CLOSED",
    reason: "Tất toán thanh lý TL-0042: hoàn tiền cọc thừa 132.500 ₫",
  },
  {
    id: 8,
    timestamp: "2026-10-18T16:05:00Z",
    actor: "Trần Minh",
    actorRole: "STAFF",
    entityType: "UNIT",
    entityId: "3",
    entityCode: "S-3",
    action: "STATUS_CHANGE",
    fromValue: "RENTED",
    toValue: "PREPARING",
    reason: "Khách trả kho đơn BK-1042, bắt đầu thời gian đệm 1 ngày",
  },
  {
    id: 9,
    timestamp: "2026-10-10T15:40:00Z",
    actor: "Nguyễn Thị Lan",
    actorRole: "CUSTOMER",
    entityType: "RESERVATION",
    entityId: "1",
    entityCode: "BK-1042",
    action: "STATUS_CHANGE",
    fromValue: "CHECKED_IN",
    toValue: "CHECKOUT_REQUESTED",
    reason: "Khách hẹn lịch trả kho vào ngày 18/10/2026",
  },
  {
    id: 10,
    timestamp: "2026-10-08T09:30:00Z",
    actor: "Phạm Tuấn",
    actorRole: "FACILITY_MANAGER",
    entityType: "UNIT",
    entityId: "11",
    entityCode: "L-11",
    action: "STATUS_CHANGE",
    fromValue: "AVAILABLE",
    toValue: "MAINTENANCE",
    reason: "Thay thế cụm máy hút ẩm công nghiệp buồng kho",
  },
  {
    id: 11,
    timestamp: "2026-09-02T14:00:00Z",
    actor: "Phạm Tuấn",
    actorRole: "FACILITY_MANAGER",
    entityType: "UNIT",
    entityId: "15",
    entityCode: "C-15",
    action: "STATUS_CHANGE",
    fromValue: "AVAILABLE",
    toValue: "RETIRED",
    reason: "Quy hoạch cải tạo nâng cấp lại cụm tủ đồ Locker C",
  },
  {
    id: 12,
    timestamp: "2026-08-05T11:22:00Z",
    actor: "Nguyễn Thị Lan",
    actorRole: "CUSTOMER",
    entityType: "RESERVATION",
    entityId: "1",
    entityCode: "BK-1042",
    action: "EXTENDED",
    fromValue: "2026-08-18",
    toValue: "2026-10-18",
    reason: "Gia hạn thuê: thu phí 690.000 ₫ + bổ sung cọc 69.000 ₫",
  },
  {
    id: 13,
    timestamp: "2026-07-01T09:00:00Z",
    actor: "Trần Minh",
    actorRole: "STAFF",
    entityType: "TICKET",
    entityId: "1",
    entityCode: "TK-001",
    action: "STATUS_CHANGE",
    fromValue: "OPEN",
    toValue: "RESOLVED",
    reason: "Bảo dưỡng tra dầu khóa số, cửa vận hành trơn tru bình thường",
  },
  {
    id: 14,
    timestamp: "2026-05-18T08:52:00Z",
    actor: "Trần Minh",
    actorRole: "STAFF",
    entityType: "CONTRACT",
    entityId: "1",
    entityCode: "CT-1042",
    action: "STATUS_CHANGE",
    fromValue: "PRINTED",
    toValue: "SIGNED",
    reason: "Tải lên ảnh chụp hợp đồng có chữ ký trực tiếp tại quầy",
  },
  {
    id: 15,
    timestamp: "2026-05-18T08:52:00Z",
    actor: "Trần Minh",
    actorRole: "STAFF",
    entityType: "UNIT",
    entityId: "3",
    entityCode: "S-3",
    action: "STATUS_CHANGE",
    fromValue: "RESERVED",
    toValue: "RENTED",
    reason: "Khách nhận bàn giao kho theo đơn BK-1042",
  },
  {
    id: 16,
    timestamp: "2026-05-18T08:50:00Z",
    actor: "Trần Minh",
    actorRole: "STAFF",
    entityType: "RESERVATION",
    entityId: "1",
    entityCode: "BK-1042",
    action: "STATUS_CHANGE",
    fromValue: "RESERVED",
    toValue: "CHECKED_IN",
    reason: "Check-in đơn BK-1042, đã thu tiền thuê 1.035.000 ₫",
  },
  {
    id: 17,
    timestamp: "2026-04-20T09:13:00Z",
    actor: "Nguyễn Thị Lan",
    actorRole: "CUSTOMER",
    entityType: "CONTRACT",
    entityId: "1",
    entityCode: "CT-1042",
    action: "CREATED",
    fromValue: null,
    toValue: "DRAFT",
    reason: "Tự động tạo dự thảo hợp đồng từ đơn đặt BK-1042 theo quy chế v3",
  },
  {
    id: 18,
    timestamp: "2026-04-20T09:12:00Z",
    actor: "Nguyễn Thị Lan",
    actorRole: "CUSTOMER",
    entityType: "UNIT",
    entityId: "3",
    entityCode: "S-3",
    action: "STATUS_CHANGE",
    fromValue: "AVAILABLE",
    toValue: "RESERVED",
    reason: "Khách đã nộp cọc giữ chỗ cho đơn đặt BK-1042",
  },
  {
    id: 19,
    timestamp: "2026-04-20T09:12:00Z",
    actor: "Nguyễn Thị Lan",
    actorRole: "CUSTOMER",
    entityType: "RESERVATION",
    entityId: "1",
    entityCode: "BK-1042",
    action: "CREATED",
    fromValue: null,
    toValue: "PENDING_PAYMENT",
    reason: "Đăng ký thuê kho S-3 thời hạn 18/05/2026 đến 18/08/2026",
  },
];

/**
 * Lấy danh sách nhật ký kiểm toán (Activity Log)
 */
export function getActivityLogs({ entityType = "ALL", searchTerm = "" } = {}) {
  let logs = [...INITIAL_ACTIVITY_LOGS];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        logs = parsed;
      }
    }
  } catch (err) {
    console.error("Lỗi khi đọc Activity Logs từ LocalStorage:", err);
  }

  // Lọc theo thực thể
  if (entityType && entityType !== "ALL") {
    logs = logs.filter((log) => log.entityType === entityType);
  }

  // Lọc theo từ khóa tìm kiếm
  if (searchTerm && searchTerm.trim()) {
    const q = searchTerm.trim().toLowerCase();
    logs = logs.filter(
      (log) =>
        (log.actor && log.actor.toLowerCase().includes(q)) ||
        (log.entityCode && log.entityCode.toLowerCase().includes(q)) ||
        (log.entityId && String(log.entityId).toLowerCase().includes(q)) ||
        (log.reason && log.reason.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.fromValue && log.fromValue.toLowerCase().includes(q)) ||
        (log.toValue && log.toValue.toLowerCase().includes(q))
    );
  }

  // Sắp xếp thời gian mới nhất lên đầu
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return logs;
}

/**
 * Ghi thêm 1 bản ghi mới vào nhật ký (Append-only)
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
  if (!reason || !reason.trim()) {
    throw new Error("Lý do là bắt buộc đối với mọi bản ghi nhật ký kiểm toán.");
  }

  const currentLogs = getActivityLogs({ entityType: "ALL" });
  const newLog = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    actor: actor || "Phạm Tuấn",
    actorRole,
    entityType,
    entityId: String(entityId),
    entityCode: entityCode || String(entityId),
    action,
    fromValue,
    toValue,
    reason: reason.trim(),
  };

  const updated = [newLog, ...currentLogs];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Lỗi khi ghi thêm Activity Log:", err);
  }

  return newLog;
}
