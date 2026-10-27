/**
 * Bộ từ điển chuẩn hóa Tiếng Việt tập trung cho toàn bộ hệ thống StorageHub
 * Quy tắc thuật ngữ chuẩn:
 * - Facility -> Cơ sở (VD: Cơ sở Tân Bình)
 * - Storage Unit -> Ô kho (VD: Ô kho M-2)
 * - Check-in Pass -> Thẻ nhận kho
 */

export const ROLE_LABELS = {
  CUSTOMER: "Khách hàng",
  STAFF: "Nhân viên cơ sở",
  FACILITY_MANAGER: "Quản lý cơ sở",
  BUSINESS_OPS: "Vận hành kinh doanh",
  SYSTEM_ADMIN: "Quản trị hệ thống",
  GUEST: "Khách vãng lai",
  SYSTEM: "Hệ thống tự động",
};

export const ROLE_BADGE_UPPER = {
  CUSTOMER: "KHÁCH HÀNG",
  STAFF: "NHÂN VIÊN CƠ SỞ",
  FACILITY_MANAGER: "QUẢN LÝ CƠ SỞ",
  BUSINESS_OPS: "VẬN HÀNH KINH DOANH",
  SYSTEM_ADMIN: "QUẢN TRỊ HỆ THỐNG",
  GUEST: "KHÁCH VÃNG LAI",
};

export const UNIT_STATUS_LABELS = {
  AVAILABLE: "Còn trống",
  AVAILABLE_SOON: "Sắp trống",
  RENTED: "Đang thuê",
  RESERVED: "Đã giữ chỗ",
  PREPARING: "Đang chuẩn bị",
  MAINTENANCE: "Đang bảo trì",
  RETIRED: "Ngừng khai thác",
};

export const RESERVATION_STATUS_LABELS = {
  PENDING_PAYMENT: "Chờ thanh toán cọc",
  RESERVED: "Đã giữ chỗ — Chờ nhận kho",
  CHECKED_IN: "Đang thuê",
  CHECKOUT_REQUESTED: "Chờ trả kho",
  PREPARING: "Đang dọn kho",
  CLOSED: "Đã hoàn tất",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
  EXPIRED: "Không hoàn cọc (quá hạn)",
};

export const CONTRACT_STATUS_LABELS = {
  DRAFT: "Bản thảo",
  AWAITING_SIGNATURE: "Chờ ký xác nhận",
  PRINTED: "Đã in hợp đồng",
  SIGNED: "Đã ký xác nhận",
  ACTIVE: "Đang hiệu lực",
  CLOSED: "Đã thanh lý",
  SUPERSEDED: "Đã thay thế",
  CANCELLED: "Đã hủy",
};

export const PAYMENT_STATUS_LABELS = {
  PENDING: "Chờ thanh toán",
  PROCESSING: "Đang xử lý",
  SUCCEEDED: "Đã thanh toán",
  PAID: "Đã thanh toán",
  COMPLETED: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  EXPIRED: "Hết hạn giao dịch",
  REFUNDED: "Đã hoàn tiền",
};

export const DEPOSIT_STATUS_LABELS = {
  PENDING: "Chờ thanh toán cọc",
  HELD: "Đang giữ ký quỹ (10%)",
  SETTLED: "Đã tất toán hoàn cọc",
  FORFEITED: "Không hoàn cọc (quá hạn)",
};

export const TASK_PRIORITY_LABELS = {
  URGENT: "Khẩn cấp",
  HIGH: "Ưu tiên cao",
  NORMAL: "Bình thường",
  MEDIUM: "Trung bình",
  Medium: "Trung bình",
  LOW: "Thấp",
};

export const TASK_TYPE_LABELS = {
  CHECKIN: "Nhận kho",
  CHECK_IN: "Nhận kho",
  CHECKOUT: "Trả kho",
  CHECK_OUT: "Trả kho",
  CLEANING: "Vệ sinh ô kho",
  SUPPORT: "Hỗ trợ sự cố",
  CONTRACT: "Ký phụ lục",
  MAINTENANCE: "Bảo trì ô kho",
};

export const TICKET_STATUS_LABELS = {
  OPEN: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  ESCALATED: "Chờ Quản lý xử lý",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đã đóng",
};

export const AUDIT_ACTION_LABELS = {
  STATUS_CHANGE: "Đổi trạng thái",
  MANUAL_STATUS_FIX: "Điều chỉnh trạng thái",
  FIX_STATUS: "Điều chỉnh trạng thái",
  SET_MAINTENANCE: "Chuyển bảo trì",
  FINISH_MAINTENANCE: "Hoàn tất bảo trì",
  RETIRE_UNIT: "Ngừng khai thác",
  CREATE_UNIT: "Tạo ô kho mới",
  DELETE_UNIT: "Xóa ô kho",
  MERGE_UNITS: "Gộp ô kho",
  CREATED: "Tạo mới",
  UPDATED: "Cập nhật",
  DELETED: "Xóa bỏ",
  EXTENDED: "Gia hạn thuê",
  CONTRACT_SIGNED: "Ký hợp đồng",
  RESOLVED: "Đã giải quyết",
  ESCALATED: "Chuyển cấp Quản lý",
  LOGIN: "Đăng nhập",
  LOGIN_FAILED: "Đăng nhập thất bại",
  LOGOUT: "Đăng xuất",
  ROLE_CHANGED: "Đổi vai trò",
  PASSWORD_RESET: "Đặt lại mật khẩu",
};

export const ENTITY_TYPE_LABELS = {
  ALL: "Tất cả",
  UNIT: "Ô kho",
  RESERVATION: "Đơn thuê",
  CONTRACT: "Hợp đồng",
  PAYMENT: "Thanh toán",
  TASK: "Công việc",
  SHIFT: "Ca trực",
  STAFF_ASSIGNMENT: "Ca trực",
  USER: "Tài khoản",
  AUTH: "Phiên đăng nhập",
  TICKET: "Sự cố",
  POLICY: "Chính sách",
};

export function getRoleLabel(role) {
  if (!role) return ROLE_LABELS.GUEST;
  return ROLE_LABELS[role] || String(role).replace(/_/g, " ");
}

export function getUnitStatusLabel(status) {
  if (!status) return "—";
  return (
    UNIT_STATUS_LABELS[status] ||
    RESERVATION_STATUS_LABELS[status] ||
    PAYMENT_STATUS_LABELS[status] ||
    CONTRACT_STATUS_LABELS[status] ||
    TICKET_STATUS_LABELS[status] ||
    String(status)
  );
}

export function getPriorityLabel(priority) {
  if (!priority) return "Bình thường";
  return TASK_PRIORITY_LABELS[priority] || TASK_PRIORITY_LABELS[String(priority).toUpperCase()] || String(priority);
}

export function getAuditActionLabel(action) {
  if (!action) return "Cập nhật";
  return AUDIT_ACTION_LABELS[action] || String(action).replace(/_/g, " ");
}

/**
 * Chuẩn hóa tên cơ sở — xóa bỏ từ ngoại lai "Depot", "Gateway", "Station Desk"
 */
export function normalizeFacilityLabel(rawName = "") {
  if (!rawName) return "Cơ sở Tân Bình";
  return String(rawName)
    .replace(/Facility\s+VN-SGN-01\s*\(?Tân Bình Gateway\)?/gi, "Cơ sở Tân Bình (VN-SGN-01)")
    .replace(/Depot:\s*Tân Bình Gateway/gi, "Cơ sở Tân Bình")
    .replace(/Tân Bình Gateway/gi, "Cơ sở Tân Bình")
    .replace(/Tân Bình Depot/gi, "Cơ sở Tân Bình")
    .replace(/Depot Tân Bình/gi, "Cơ sở Tân Bình")
    .replace(/Depot SGN-01/gi, "Cơ sở Tân Bình (VN-SGN-01)")
    .replace(/Station Desk Tân Bình/gi, "Quầy trực Cơ sở Tân Bình");
}

/**
 * Dịch tự động thông báo hoặc thông điệp tiếng Anh từ Backend sang tiếng Việt tự nhiên
 */
export function translateBackendMessage(raw = "") {
  if (!raw) return "";
  let text = String(raw).trim();

  if (/If an account exists for that email/i.test(text)) {
    return "Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi tới hộp thư của bạn.";
  }
  if (/Invalid email or password|Bad credentials/i.test(text)) {
    return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
  }
  if (/Account is locked|disabled/i.test(text)) {
    return "Tài khoản hiện đang tạm khóa. Vui lòng liên hệ Quản trị hệ thống.";
  }

  // Notification translations
  text = text
    .replace(/^Booking confirmed\s*[—–-]\s*([A-Z0-9-]+)\s+reserved\.?$/i, "Đặt chỗ thành công — Ô kho $1 đã được giữ chỗ.")
    .replace(/^Reservation\s+([A-Z0-9-]+)\s+confirmed\.?$/i, "Đơn giữ chỗ $1 đã được xác nhận.")
    .replace(/^Deposit paid\s*[—–-]\s*(.+)$/i, "Đã nhận tiền cọc giữ chỗ — $1")
    .replace(/^Check-in completed\s*[—–-]\s*(.+)$/i, "Hoàn tất bàn giao nhận kho — $1")
    .replace(/^Checkout requested\s*[—–-]\s*(.+)$/i, "Đã ghi nhận yêu cầu trả kho — $1")
    .replace(/^Checkout closed\.\s*Refund\s+(.+)$/i, "Đã tất toán trả kho. Hoàn trả tiền cọc: $1")
    .replace(/^Checkout closed\.?$/i, "Đã hoàn tất thủ tục trả kho và đóng hợp đồng.")
    .replace(/^(SR-\d+)\s+resolved\s*[—–-]\s*(.+)$/i, "Yêu cầu hỗ trợ $1 đã xử lý xong — $2")
    .replace(/^(SR-\d+)\s+escalated\s*[—–-]\s*(.+)$/i, "Yêu cầu hỗ trợ $1 đã chuyển lên Quản lý cơ sở — $2")
    .replace(/sticky door fixed\.?/gi, "đã khắc phục kẹt cửa kho.")
    .replace(/\b(\d+)\s+unit\s+tương tự\b/gi, "$1 ô kho tương tự")
    .replace(/\bUnit\s+([A-Z0-9-]+)\b/g, "Ô kho $1");

  return text;
}
