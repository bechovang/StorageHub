/**
 * StorageHub — Support Ticket Service (US-23 / FR-23 / FR-24)
 * Quản lý vòng đời ticket hỗ trợ sự cố:
 * - Khách hàng tạo ticket gắn với Unit hợp lệ + IncidentType + Mô tả
 * - Nhân viên trực ca nhận ticket theo Zone/Shift
 * - Xử lý (RESOLVE) kèm phản hồi cụ thể cho khách
 * - Chuyển tiếp (ESCALATE) lên Quản lý cơ sở kèm lý do bắt buộc
 */

import { appendActivityLog } from "./activityService.js";

const TICKETS_STORAGE_KEY = "storagehub_support_tickets_v1";

export const INCIDENT_TYPES = {
  LOST_ACCESS: { key: "LOST_ACCESS", label: "Mất quyền truy cập / Quên mã PIN", badgeClass: "incident--lost" },
  DEVICE_ISSUE: { key: "DEVICE_ISSUE", label: "Lỗi thiết bị (Cửa, khóa thông minh)", badgeClass: "incident--device" },
  SECURITY: { key: "SECURITY", label: "An ninh / Cảnh báo bất thường", badgeClass: "incident--security" },
  CLEANLINESS: { key: "CLEANLINESS", label: "Vệ sinh / Cần dọn dẹp khẩn cấp", badgeClass: "incident--cleanliness" },
  OTHER: { key: "OTHER", label: "Yêu cầu khác", badgeClass: "incident--other" },
};

export const TICKET_STATUSES = {
  OPEN: { key: "OPEN", label: "Chờ tiếp nhận", class: "status-ticket--open" },
  IN_PROGRESS: { key: "IN_PROGRESS", label: "Đang xử lý", class: "status-ticket--progress" },
  RESOLVED: { key: "RESOLVED", label: "Đã xử lý xong", class: "status-ticket--resolved" },
  ESCALATED: { key: "ESCALATED", label: "Đã chuyển quản lý", class: "status-ticket--escalated" },
};

export const INITIAL_TICKETS = [
  {
    ticketId: 1,
    code: "SR-0032",
    customerId: 1,
    customerName: "Nguyễn Thị Lan",
    customerPhone: "0901234567",
    unitCode: "S-3",
    zoneCode: "Zone A",
    reservationId: 1,
    incidentType: "DEVICE_ISSUE",
    status: "RESOLVED",
    assignedStaff: "Trần Minh",
    assignedRole: "STAFF",
    description: "Cửa cuốn ô kho S-3 kéo xuống bị kẹt ở đoạn giữa, phát ra tiếng kêu lớn.",
    resolutionNote: "Đã kiểm tra bảo dưỡng thanh trượt, tra dầu bôi trơn bản lề. Cửa hoạt động trơn tru.",
    escalationReason: null,
    createdAt: "2026-06-30T10:15:00Z",
    resolvedAt: "2026-07-01T09:00:00Z",
  },
  {
    ticketId: 2,
    code: "SR-0033",
    customerId: 6,
    customerName: "Phạm Thị Trang",
    customerPhone: "0906789012",
    unitCode: "S-3",
    zoneCode: "Zone A",
    reservationId: 3,
    incidentType: "LOST_ACCESS",
    status: "OPEN",
    assignedStaff: "Trần Minh",
    assignedRole: "STAFF",
    description: "Tôi quên mã PIN mở khóa kho S-3 sau khi chuyển đồ xong sáng nay.",
    resolutionNote: null,
    escalationReason: null,
    createdAt: "2026-10-20T08:05:00Z",
    resolvedAt: null,
  },
  {
    ticketId: 3,
    code: "SR-0034",
    customerId: 1,
    customerName: "Nguyễn Thị Lan",
    customerPhone: "0901234567",
    unitCode: "M-2",
    zoneCode: "Zone A",
    reservationId: 1,
    incidentType: "SECURITY",
    status: "ESCALATED",
    assignedStaff: "Phạm Tuấn",
    assignedRole: "FACILITY_MANAGER",
    description: "Có hiện tượng rò rỉ nước từ trần phía trên cửa kho M-2, cần kiểm tra chống thấm ngay.",
    resolutionNote: null,
    escalationReason: "Nguy cơ ảnh hưởng đồ đạc khách hàng tại tầng trệt, cần Quản lý duyệt phương án di dời hoặc bảo dưỡng khẩn cấp.",
    createdAt: "2026-10-19T14:20:00Z",
    resolvedAt: null,
  },
];

/**
 * Trích xuất chuẩn hóa thông tin nhân viên tiếp nhận & vai trò
 */
export function parseStaffInfo(ticket) {
  let name = ticket.assignedStaff || "Trần Minh";
  let role = ticket.assignedRole;

  if (!role) {
    if (name.includes("Phạm Tuấn") || ticket.status === "ESCALATED") {
      name = "Phạm Tuấn";
      role = "FACILITY_MANAGER";
    } else {
      name = name.replace(/\s*\(Staff\)/i, "").replace(/Nhân viên trực ca\s*\(?/i, "").replace(/\)/g, "").trim();
      if (!name) name = "Trần Minh";
      role = "STAFF";
    }
  }

  const roleLabel = role === "FACILITY_MANAGER" ? "Quản lý cơ sở" : "Nhân viên kho";
  const roleBadgeClass = role === "FACILITY_MANAGER" ? "staff-role-chip--manager" : "staff-role-chip--staff";

  return {
    name,
    role,
    roleLabel,
    roleBadgeClass,
  };
}

export function getTickets({ status = "ALL", unitCode = "ALL", customerId = null } = {}) {
  let list = [...INITIAL_TICKETS];
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
    }
  } catch (err) {
    console.error("Failed to read tickets:", err);
  }

  if (customerId) {
    list = list.filter((t) => t.customerId === Number(customerId));
  }

  if (status && status !== "ALL") {
    list = list.filter((t) => t.status === status);
  }

  if (unitCode && unitCode !== "ALL") {
    list = list.filter((t) => t.unitCode === unitCode);
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function saveTickets(tickets) {
  try {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.error("Failed to save tickets:", err);
  }
}

/**
 * Khách hàng tạo ticket mới (FR-23)
 */
export function createSupportTicket({
  customerId,
  customerName,
  customerPhone,
  unitCode,
  zoneCode = "Zone A",
  reservationId = null,
  incidentType,
  description,
}) {
  if (!unitCode || !unitCode.trim()) {
    throw new Error("Yêu cầu hỗ trợ bắt buộc phải gắn với ô kho hợp lệ (Unit Code).");
  }

  if (!description || !description.trim()) {
    throw new Error("Vui lòng nhập mô tả chi tiết sự cố bạn đang gặp phải.");
  }

  const tickets = getTickets();
  const nextNum = tickets.length + 35;
  const newTicket = {
    ticketId: Date.now(),
    code: `SR-00${nextNum}`,
    customerId: Number(customerId),
    customerName,
    customerPhone,
    unitCode: unitCode.trim().toUpperCase(),
    zoneCode,
    reservationId,
    incidentType,
    status: "OPEN",
    assignedStaff: "Trần Minh",
    assignedRole: "STAFF",
    description: description.trim(),
    resolutionNote: null,
    escalationReason: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  const updated = [newTicket, ...tickets];
  saveTickets(updated);

  appendActivityLog({
    actor: `${customerName} (Customer)`,
    actorRole: "CUSTOMER",
    entityType: "TICKET",
    entityId: newTicket.code,
    entityName: `Sự cố kho ${newTicket.unitCode}`,
    action: "CREATED",
    fromValue: null,
    toValue: "OPEN",
    reason: `Khách báo sự cố ${INCIDENT_TYPES[incidentType]?.label || incidentType} trên kho ${newTicket.unitCode}`,
  });

  return newTicket;
}

/**
 * Xử lý hoàn tất ticket (RESOLVE — FR-24)
 */
export function resolveSupportTicket({ ticketId, resolutionNote, staffName = "Trần Minh" }) {
  if (!resolutionNote || !resolutionNote.trim()) {
    throw new Error("Ghi chú xử lý (Resolution Note) là bắt buộc để thông báo kết quả cho khách hàng.");
  }

  const tickets = getTickets();
  const index = tickets.findIndex((t) => t.ticketId === Number(ticketId));
  if (index === -1) throw new Error("Không tìm thấy ticket.");

  const t = tickets[index];
  t.status = "RESOLVED";
  t.resolutionNote = resolutionNote.trim();
  t.resolvedAt = new Date().toISOString();
  t.assignedStaff = staffName.replace(/\s*\(.*?\)/, "").trim();
  t.assignedRole = "STAFF";
  tickets[index] = t;
  saveTickets(tickets);

  appendActivityLog({
    actor: `${t.assignedStaff} (Staff)`,
    actorRole: "STAFF",
    entityType: "TICKET",
    entityId: t.code,
    entityName: `Sự cố kho ${t.unitCode}`,
    action: "RESOLVED",
    fromValue: "IN_PROGRESS",
    toValue: "RESOLVED",
    reason: resolutionNote.trim(),
  });

  return t;
}

/**
 * Chuyển tiếp ticket lên Quản lý (ESCALATE — FR-24)
 */
export function escalateSupportTicket({ ticketId, escalationReason, staffName = "Trần Minh" }) {
  if (!escalationReason || !escalationReason.trim()) {
    throw new Error("Lý do chuyển tiếp lên quản lý là bắt buộc theo quy định vận hành.");
  }

  const tickets = getTickets();
  const index = tickets.findIndex((t) => t.ticketId === Number(ticketId));
  if (index === -1) throw new Error("Không tìm thấy ticket.");

  const t = tickets[index];
  t.status = "ESCALATED";
  t.escalationReason = escalationReason.trim();
  t.assignedStaff = "Phạm Tuấn";
  t.assignedRole = "FACILITY_MANAGER";
  tickets[index] = t;
  saveTickets(tickets);

  appendActivityLog({
    actor: `${staffName.replace(/\s*\(.*?\)/, "").trim()} (Staff)`,
    actorRole: "STAFF",
    entityType: "TICKET",
    entityId: t.code,
    entityName: `Sự cố kho ${t.unitCode}`,
    action: "ESCALATED",
    fromValue: t.status,
    toValue: "ESCALATED",
    reason: escalationReason.trim(),
  });

  return t;
}
