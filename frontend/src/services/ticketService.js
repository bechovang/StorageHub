/**
 * StorageHub — Support Ticket Service (US-23 / FR-23 / FR-24 / Flow 7)
 * Quản lý vòng đời yêu cầu hỗ trợ & sự cố:
 * - Khách hàng tạo yêu cầu gắn với ô kho đang thuê + phân loại + mô tả
 * - Nhân viên tiếp nhận (OPEN -> IN_PROGRESS), xử lý hoàn tất (RESOLVED) hoặc chuyển cấp Quản lý (ESCALATED)
 * - Quản lý cơ sở điều phối xử lý sự cố thông thường hoặc di dời & bảo trì khẩn cấp (Flow 7)
 */

import { appendActivityLog } from "./activityService.js";
import { TICKET_STATUS_LABELS, ROLE_LABELS } from "../utils/statusLabels.js";

const TICKETS_STORAGE_KEY = "storagehub_support_tickets_v1";

export const INCIDENT_TYPES = {
  LOST_ACCESS: {
    key: "LOST_ACCESS",
    label: "Mất quyền truy cập / Quên mã truy cập",
    badgeClass: "incident--lost",
  },
  DEVICE_ISSUE: {
    key: "DEVICE_ISSUE",
    label: "Lỗi thiết bị (Cửa cuốn, khóa điện tử)",
    badgeClass: "incident--device",
  },
  SECURITY: {
    key: "SECURITY",
    label: "An ninh / Rò rỉ / Cảnh báo bất thường",
    badgeClass: "incident--security",
  },
  CLEANLINESS: {
    key: "CLEANLINESS",
    label: "Vệ sinh / Độ ẩm / Cần dọn dẹp khẩn cấp",
    badgeClass: "incident--cleanliness",
  },
  OTHER: {
    key: "OTHER",
    label: "Yêu cầu hỗ trợ khác",
    badgeClass: "incident--other",
  },
};

export const TICKET_STATUSES = {
  OPEN: {
    key: "OPEN",
    label: TICKET_STATUS_LABELS?.OPEN || "Chờ tiếp nhận",
    class: "status-ticket--open",
  },
  IN_PROGRESS: {
    key: "IN_PROGRESS",
    label: TICKET_STATUS_LABELS?.IN_PROGRESS || "Đang xử lý",
    class: "status-ticket--progress",
  },
  RESOLVED: {
    key: "RESOLVED",
    label: TICKET_STATUS_LABELS?.RESOLVED || "Đã xử lý xong",
    class: "status-ticket--resolved",
  },
  ESCALATED: {
    key: "ESCALATED",
    label: TICKET_STATUS_LABELS?.ESCALATED || "Đã chuyển quản lý",
    class: "status-ticket--escalated",
  },
};

export const INITIAL_TICKETS = [
  {
    ticketId: 1,
    code: "SR-0032",
    customerId: 1,
    customerEmail: "customer@storagehub.vn",
    customerName: "Nguyễn Thị Lan",
    customerPhone: "0901234567",
    unitCode: "S-3",
    zoneCode: "Zone A",
    reservationId: 1,
    incidentType: "DEVICE_ISSUE",
    status: "RESOLVED",
    assignedStaff: "Minh Nguyễn",
    assignedRole: "STAFF",
    description: "Cửa cuốn ô kho S-3 kéo xuống bị kẹt ở đoạn giữa, phát ra tiếng kêu lớn.",
    resolutionNote: "Đã kiểm tra bảo dưỡng thanh trượt, tra dầu bôi trơn bản lề. Cửa hoạt động trơn tru.",
    escalationReason: null,
    managerPlan: null,
    managerApproved: false,
    severityMode: null,
    relocatedFromUnit: null,
    relocatedToUnit: null,
    createdAt: "2026-06-30T10:15:00Z",
    resolvedAt: "2026-07-01T09:00:00Z",
  },
  {
    ticketId: 2,
    code: "SR-0033",
    customerId: 6,
    customerEmail: "trang.pham@storagehub.vn",
    customerName: "Phạm Thị Trang",
    customerPhone: "0906789012",
    unitCode: "S-3",
    zoneCode: "Zone A",
    reservationId: 3,
    incidentType: "LOST_ACCESS",
    status: "OPEN",
    assignedStaff: "Minh Nguyễn",
    assignedRole: "STAFF",
    description: "Tôi quên mã mở khóa ô kho S-3 sau khi chuyển đồ xong sáng nay.",
    resolutionNote: null,
    escalationReason: null,
    managerPlan: null,
    managerApproved: false,
    severityMode: null,
    relocatedFromUnit: null,
    relocatedToUnit: null,
    createdAt: "2026-10-20T08:05:00Z",
    resolvedAt: null,
  },
  {
    ticketId: 3,
    code: "SR-0034",
    customerId: 1,
    customerEmail: "customer@storagehub.vn",
    customerName: "Nguyễn Thị Lan",
    customerPhone: "0901234567",
    unitCode: "M-2",
    zoneCode: "Zone B",
    reservationId: 1,
    incidentType: "SECURITY",
    status: "ESCALATED",
    assignedStaff: "Phạm Tuấn",
    assignedRole: "FACILITY_MANAGER",
    description: "Có hiện tượng thấm nước từ trần phía trên cửa kho M-2, cần kiểm tra chống thấm ngay.",
    resolutionNote: null,
    escalationReason:
      "Nguy cơ ảnh hưởng tài sản lưu trữ của khách hàng tại tầng trệt, cần Quản lý cơ sở phê duyệt phương án di dời hoặc bảo trì khẩn cấp.",
    managerPlan: null,
    managerApproved: false,
    severityMode: null,
    relocatedFromUnit: null,
    relocatedToUnit: null,
    createdAt: "2026-10-19T14:20:00Z",
    resolvedAt: null,
  },
];

function cleanActorName(rawName, fallback = "Minh Nguyễn") {
  if (!rawName) return fallback;
  const cleaned = String(rawName)
    .replace(/\s*\(.*?\)/g, "")
    .replace(/Nhân viên trực ca/gi, "")
    .trim();
  return cleaned || fallback;
}

/**
 * Trích xuất chuẩn hóa thông tin nhân sự tiếp nhận & vai trò hiển thị tiếng Việt
 */
export function parseStaffInfo(ticket) {
  let name = cleanActorName(ticket.assignedStaff, "Minh Nguyễn");
  let role = ticket.assignedRole;

  if (!role) {
    if (name.includes("Phạm Tuấn") || ticket.status === "ESCALATED") {
      name = "Phạm Tuấn";
      role = "FACILITY_MANAGER";
    } else {
      role = "STAFF";
    }
  }

  const roleLabel =
    role === "FACILITY_MANAGER"
      ? ROLE_LABELS?.FACILITY_MANAGER || "Quản lý cơ sở"
      : role === "SYSTEM_ADMIN"
        ? ROLE_LABELS?.SYSTEM_ADMIN || "Quản trị hệ thống"
        : ROLE_LABELS?.STAFF || "Nhân viên vận hành";

  const roleBadgeClass =
    role === "FACILITY_MANAGER" || role === "SYSTEM_ADMIN"
      ? "staff-role-chip--manager"
      : "staff-role-chip--staff";

  return {
    name,
    role,
    roleLabel,
    roleBadgeClass,
  };
}

function loadRawTickets() {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t) =>
          t.code === "SR-0032" && !t.resolvedAt
            ? { ...t, status: "RESOLVED", resolvedAt: "2026-07-01T09:00:00Z" }
            : t
        );
      }
    }
  } catch (err) {
    console.error("Failed to read tickets:", err);
  }
  return [...INITIAL_TICKETS];
}

function saveTickets(tickets) {
  try {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.error("Failed to save tickets:", err);
  }
}

export function getTickets({
  status = "ALL",
  unitCode = "ALL",
  customerId = null,
  customerEmail = null,
} = {}) {
  let list = loadRawTickets();

  if (customerId != null || customerEmail) {
    const targetId = customerId != null ? Number(customerId) : null;
    const targetEmail = customerEmail ? String(customerEmail).trim().toLowerCase() : null;
    list = list.filter((t) => {
      const matchId = targetId != null && !Number.isNaN(targetId) && Number(t.customerId) === targetId;
      const matchMail =
        targetEmail && t.customerEmail && String(t.customerEmail).trim().toLowerCase() === targetEmail;
      return matchId || matchMail;
    });
  }

  if (status && status !== "ALL") {
    list = list.filter((t) => t.status === status);
  }

  if (unitCode && unitCode !== "ALL") {
    list = list.filter((t) => t.unitCode === unitCode);
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const getSupportTickets = getTickets;

/**
 * Khách hàng tạo yêu cầu hỗ trợ mới (FR-23 / Flow 7 f7_chooseunit)
 */
export function createSupportTicket({
  customerId,
  customerEmail = null,
  customerName,
  customerPhone,
  unitCode,
  zoneCode = "Zone A",
  reservationId = null,
  incidentType,
  description,
}) {
  if (!unitCode || !unitCode.trim()) {
    throw new Error("Vui lòng chọn ô kho đang thuê gặp sự cố.");
  }

  if (!description || !description.trim()) {
    throw new Error("Vui lòng nhập mô tả chi tiết sự cố bạn đang gặp phải.");
  }

  const tickets = loadRawTickets();
  const maxNum = tickets.reduce((max, item) => {
    const m = String(item.code || "").match(/SR-0*(\d+)/i);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 34);
  const nextCode = `SR-${String(maxNum + 1).padStart(4, "0")}`;

  const newTicket = {
    ticketId: Date.now(),
    code: nextCode,
    customerId: Number(customerId) || 1,
    customerEmail: customerEmail || null,
    customerName: customerName || "Khách thuê",
    customerPhone: customerPhone || "",
    unitCode: unitCode.trim().toUpperCase(),
    zoneCode: zoneCode || "Zone A",
    reservationId,
    incidentType: incidentType || "DEVICE_ISSUE",
    status: "OPEN",
    assignedStaff: "Minh Nguyễn",
    assignedRole: "STAFF",
    description: description.trim(),
    resolutionNote: null,
    escalationReason: null,
    managerPlan: null,
    managerApproved: false,
    severityMode: null,
    relocatedFromUnit: null,
    relocatedToUnit: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  const updated = [newTicket, ...tickets];
  saveTickets(updated);

  appendActivityLog({
    actor: customerName || "Khách thuê",
    actorRole: "CUSTOMER",
    entityType: "TICKET",
    entityId: newTicket.code,
    entityName: `Sự cố kho ${newTicket.unitCode}`,
    action: "CREATED",
    fromValue: null,
    toValue: "OPEN",
    reason: `Khách báo sự cố "${INCIDENT_TYPES[incidentType]?.label || incidentType}" tại ô kho ${newTicket.unitCode}`,
  });

  return newTicket;
}

/**
 * Nhân viên tiếp nhận xử lý yêu cầu (OPEN -> IN_PROGRESS)
 */
export function acceptSupportTicket({
  ticketId,
  code = null,
  staffName = "Minh Nguyễn",
  staffRole = "STAFF",
}) {
  const tickets = loadRawTickets();
  const index = tickets.findIndex(
    (t) =>
      (ticketId != null && t.ticketId === Number(ticketId)) ||
      (code && t.code === code)
  );
  if (index === -1) throw new Error("Không tìm thấy yêu cầu hỗ trợ.");

  const current = tickets[index];
  if (current.status === "ESCALATED" && staffRole === "STAFF") {
    throw new Error(
      "Sự cố đã chuyển cấp Quản lý cơ sở. Nhân viên chỉ thực hiện sau khi Quản lý giao phương án xử lý."
    );
  }

  const prevStatus = current.status;
  const cleanedStaff = cleanActorName(staffName, "Minh Nguyễn");
  const updatedTicket = {
    ...current,
    status: "IN_PROGRESS",
    assignedStaff: cleanedStaff,
    assignedRole: staffRole,
  };
  tickets[index] = updatedTicket;
  saveTickets(tickets);

  appendActivityLog({
    actor: cleanedStaff,
    actorRole: staffRole,
    entityType: "TICKET",
    entityId: updatedTicket.code,
    entityName: `Sự cố kho ${updatedTicket.unitCode}`,
    action: "STATUS_CHANGED",
    fromValue: prevStatus,
    toValue: "IN_PROGRESS",
    reason: `Tiếp nhận xử lý yêu cầu hỗ trợ tại ô kho ${updatedTicket.unitCode}`,
  });

  return updatedTicket;
}

/**
 * Quản lý cơ sở điều phối phương án xử lý (Flow 7: f7_manager -> f7_affect -> f7_maint -> f7_follow)
 */
export function dispatchSupportTicketByManager({
  ticketId,
  mode = "NORMAL",
  assignedStaff = "Minh Nguyễn",
  managerPlan = "",
  replacementUnitCode = null,
  managerName = "Phạm Tuấn",
}) {
  if (!managerPlan || !managerPlan.trim()) {
    throw new Error("Vui lòng nhập phương án xử lý và chỉ đạo kỹ thuật.");
  }
  if (mode === "SEVERE" && (!replacementUnitCode || !replacementUnitCode.trim())) {
    throw new Error("Vui lòng chọn ô kho trống thay thế để di dời hàng hóa khẩn cấp.");
  }

  const tickets = loadRawTickets();
  const index = tickets.findIndex((t) => t.ticketId === Number(ticketId));
  if (index === -1) throw new Error("Không tìm thấy yêu cầu hỗ trợ.");

  const current = tickets[index];
  const prevStatus = current.status;
  const cleanedStaff = cleanActorName(assignedStaff, "Minh Nguyễn");
  const cleanedManager = cleanActorName(managerName, "Phạm Tuấn");
  const targetReplacement =
    mode === "SEVERE" ? replacementUnitCode.trim().toUpperCase() : null;

  const formattedPlan =
    mode === "SEVERE"
      ? `Di dời khẩn cấp từ ô kho ${current.unitCode} sang ô kho thay thế ${targetReplacement}: ${managerPlan.trim()}`
      : managerPlan.trim();

  const updatedTicket = {
    ...current,
    status: "IN_PROGRESS",
    assignedStaff: cleanedStaff,
    assignedRole: "STAFF",
    managerPlan: formattedPlan,
    managerApproved: true,
    severityMode: mode,
    relocatedFromUnit: mode === "SEVERE" ? current.unitCode : current.relocatedFromUnit,
    relocatedToUnit: mode === "SEVERE" ? targetReplacement : current.relocatedToUnit,
  };

  tickets[index] = updatedTicket;
  saveTickets(tickets);

  appendActivityLog({
    actor: cleanedManager,
    actorRole: "FACILITY_MANAGER",
    entityType: "TICKET",
    entityId: updatedTicket.code,
    entityName: `Sự cố kho ${updatedTicket.unitCode}`,
    action: "STATUS_CHANGED",
    fromValue: prevStatus,
    toValue: "IN_PROGRESS",
    reason: `Điều phối cho ${cleanedStaff}: ${formattedPlan}`,
  });

  return updatedTicket;
}

/**
 * Xử lý hoàn tất yêu cầu hỗ trợ (RESOLVE — FR-24)
 */
export function resolveSupportTicket({
  ticketId,
  code = null,
  resolutionNote,
  staffName = "Minh Nguyễn",
  actorRole = "STAFF",
}) {
  if (!resolutionNote || !resolutionNote.trim()) {
    throw new Error("Ghi chú kết quả xử lý là bắt buộc để thông báo cho khách hàng.");
  }

  const tickets = loadRawTickets();
  const index = tickets.findIndex(
    (t) =>
      (ticketId != null && t.ticketId === Number(ticketId)) ||
      (code && t.code === code)
  );
  if (index === -1) throw new Error("Không tìm thấy yêu cầu hỗ trợ.");

  const current = tickets[index];
  if (current.status === "ESCALATED" && actorRole === "STAFF") {
    throw new Error(
      "Sự cố đang ở cấp Quản lý cơ sở. Nhân viên không thể đóng yêu cầu khi Quản lý chưa phê duyệt phương án xử lý."
    );
  }

  const prevStatus = current.status;
  const cleanedStaff = cleanActorName(staffName, "Minh Nguyễn");
  const updatedTicket = {
    ...current,
    status: "RESOLVED",
    resolutionNote: resolutionNote.trim(),
    resolvedAt: new Date().toISOString(),
    assignedStaff: cleanedStaff,
    assignedRole: actorRole === "FACILITY_MANAGER" ? "FACILITY_MANAGER" : "STAFF",
  };
  tickets[index] = updatedTicket;
  saveTickets(tickets);

  appendActivityLog({
    actor: cleanedStaff,
    actorRole: actorRole || "STAFF",
    entityType: "TICKET",
    entityId: updatedTicket.code,
    entityName: `Sự cố kho ${updatedTicket.unitCode}`,
    action: "RESOLVED",
    fromValue: prevStatus,
    toValue: "RESOLVED",
    reason: resolutionNote.trim(),
  });

  return updatedTicket;
}

/**
 * Chuyển cấp yêu cầu hỗ trợ lên Quản lý cơ sở (ESCALATE — FR-24)
 */
export function escalateSupportTicket({
  ticketId = null,
  code = null,
  unitCode = null,
  customerName = "Khách thuê",
  customerPhone = "",
  description = "",
  escalationReason,
  staffName = "Minh Nguyễn",
  actorRole = "STAFF",
}) {
  if (actorRole === "FACILITY_MANAGER") {
    throw new Error("Quản lý cơ sở trực tiếp điều phối xử lý sự cố, không chuyển cấp cho chính mình.");
  }

  if (!escalationReason || !escalationReason.trim()) {
    throw new Error("Lý do chuyển cấp lên Quản lý cơ sở là bắt buộc theo quy định vận hành.");
  }

  const tickets = loadRawTickets();
  let index = tickets.findIndex(
    (t) =>
      (ticketId != null && t.ticketId === Number(ticketId)) ||
      (code && t.code === code)
  );

  const cleanedStaff = cleanActorName(staffName, "Minh Nguyễn");
  let prevStatus = "OPEN";
  let targetTicket;

  if (index === -1) {
    // Đồng bộ nếu nhân viên chuyển cấp từ bảng công việc (/tasks) với mã SR chưa lưu cục bộ
    targetTicket = {
      ticketId: Date.now(),
      code: code || `SR-${String(tickets.length + 35).padStart(4, "0")}`,
      customerId: 1,
      customerEmail: null,
      customerName: customerName || "Khách thuê",
      customerPhone: customerPhone || "",
      unitCode: (unitCode || "S-1").trim().toUpperCase(),
      zoneCode: "Zone A",
      reservationId: null,
      incidentType: "DEVICE_ISSUE",
      status: "ESCALATED",
      assignedStaff: "Phạm Tuấn",
      assignedRole: "FACILITY_MANAGER",
      description: description || `Sự cố kỹ thuật phát sinh tại ô kho ${unitCode || "S-1"}`,
      resolutionNote: null,
      escalationReason: escalationReason.trim(),
      managerPlan: null,
      managerApproved: false,
      severityMode: null,
      relocatedFromUnit: null,
      relocatedToUnit: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    tickets.unshift(targetTicket);
  } else {
    const current = tickets[index];
    prevStatus = current.status;
    targetTicket = {
      ...current,
      status: "ESCALATED",
      escalationReason: escalationReason.trim(),
      managerApproved: false,
      assignedStaff: "Phạm Tuấn",
      assignedRole: "FACILITY_MANAGER",
    };
    tickets[index] = targetTicket;
  }

  saveTickets(tickets);

  appendActivityLog({
    actor: cleanedStaff,
    actorRole: "STAFF",
    entityType: "TICKET",
    entityId: targetTicket.code,
    entityName: `Sự cố kho ${targetTicket.unitCode}`,
    action: "ESCALATED",
    fromValue: prevStatus,
    toValue: "ESCALATED",
    reason: escalationReason.trim(),
  });

  return targetTicket;
}
