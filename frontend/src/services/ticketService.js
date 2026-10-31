/**
 * StorageHub — Support Ticket Service (US-23 / FR-23 / FR-24 / Flow 7)
 * Kết nối API yêu cầu hỗ trợ & sự cố (US-23 / FR-23 / FR-24).
 *
 * Lưu ý: Backend hiện CHƯA có TicketController. Service vẫn gọi chuẩn REST
 * /api/v1/tickets và để lỗi surface lên UI thay vì dùng dữ liệu cứng.
 */

import { apiClient, safeParseJson } from "./apiClient.js";
import { TICKET_STATUS_LABELS, ROLE_LABELS } from "../utils/statusLabels.js";

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

function cleanActorName(rawName) {
  if (!rawName) return "";
  return (
    String(rawName)
      .replace(/\s*\(.*?\)/g, "")
      .replace(/Nhân viên trực ca/gi, "")
      .trim() || ""
  );
}

/**
 * Trích xuất chuẩn hóa thông tin nhân sự tiếp nhận & vai trò hiển thị tiếng Việt
 */
export function parseStaffInfo(ticket) {
  let name = cleanActorName(ticket.assignedStaff);
  let role = ticket.assignedRole;

  if (!role) {
    if (ticket.status === "ESCALATED") {
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

function handleTicketResponse(res, defaultMessage) {
  return safeParseJson(res).then((data) => {
    if (!res.ok) {
      throw new Error(data.message || defaultMessage);
    }
    return data;
  });
}

/**
 * GET /api/v1/tickets — danh sách yêu cầu hỗ trợ (có lọc)
 */
export async function getTickets({
  status = "ALL",
  unitCode = "ALL",
  customerId = null,
  customerEmail = null,
} = {}) {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.append("status", status);
  if (unitCode && unitCode !== "ALL") params.append("unit-code", unitCode);
  if (customerId != null) params.append("customer-id", customerId);
  if (customerEmail) params.append("customer-email", customerEmail);

  const res = await apiClient(`/api/v1/tickets?${params.toString()}`);
  const data = await handleTicketResponse(res, "Không thể tải danh sách yêu cầu hỗ trợ.");

  let list = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
  list = [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return list;
}

export const getSupportTickets = getTickets;

/**
 * POST /api/v1/tickets — Khách hàng tạo yêu cầu hỗ trợ mới (FR-23 / Flow 7)
 */
export async function createSupportTicket({
  customerId,
  customerEmail = null,
  customerName,
  customerPhone,
  unitCode,
  reservationId = null,
  incidentType,
  description,
}) {
  if (!unitCode || !unitCode.trim()) {
    throw new Error("Vui lòng chọn kho đang thuê gặp sự cố.");
  }

  if (!description || !description.trim()) {
    throw new Error("Vui lòng nhập mô tả chi tiết sự cố bạn đang gặp phải.");
  }

  const res = await apiClient("/api/v1/tickets", {
    method: "POST",
    body: JSON.stringify({
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      unitCode: unitCode.trim().toUpperCase(),
      reservationId,
      incidentType: incidentType || "DEVICE_ISSUE",
      description: description.trim(),
    }),
  });

  return handleTicketResponse(res, "Không thể tạo yêu cầu hỗ trợ.");
}

/**
 * PATCH /api/v1/tickets/{ticketId}/status — Nhân viên tiếp nhận xử lý (OPEN -> IN_PROGRESS)
 */
export async function acceptSupportTicket({ ticketId, staffName, staffRole = "STAFF" }) {
  const res = await apiClient(`/api/v1/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "IN_PROGRESS",
      assignedStaff: cleanActorName(staffName),
      assignedRole: staffRole,
    }),
  });

  return handleTicketResponse(res, "Không thể tiếp nhận yêu cầu hỗ trợ.");
}

/**
 * PATCH /api/v1/tickets/{ticketId}/status — Quản lý điều phối phương án xử lý (Flow 7)
 */
export async function dispatchSupportTicketByManager({
  ticketId,
  mode = "NORMAL",
  assignedStaff,
  managerPlan = "",
  replacementUnitCode = null,
  managerName,
}) {
  if (!managerPlan || !managerPlan.trim()) {
    throw new Error("Vui lòng nhập phương án xử lý và chỉ đạo kỹ thuật.");
  }
  if (mode === "SEVERE" && (!replacementUnitCode || !replacementUnitCode.trim())) {
    throw new Error("Vui lòng chọn kho trống thay thế để di dời hàng hóa khẩn cấp.");
  }

  const res = await apiClient(`/api/v1/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "IN_PROGRESS",
      assignedStaff: cleanActorName(assignedStaff),
      managerPlan: managerPlan.trim(),
      severityMode: mode,
      relocatedToUnit:
        mode === "SEVERE" ? replacementUnitCode.trim().toUpperCase() : null,
      managerName: cleanActorName(managerName),
    }),
  });

  return handleTicketResponse(res, "Không thể điều phối xử lý sự cố.");
}

/**
 * PATCH /api/v1/tickets/{ticketId}/status — Xử lý hoàn tất yêu cầu (RESOLVE — FR-24)
 */
export async function resolveSupportTicket({
  ticketId,
  resolutionNote,
  staffName,
  actorRole = "STAFF",
}) {
  if (!resolutionNote || !resolutionNote.trim()) {
    throw new Error("Ghi chú kết quả xử lý là bắt buộc để thông báo cho khách hàng.");
  }

  const res = await apiClient(`/api/v1/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "RESOLVED",
      resolutionNote: resolutionNote.trim(),
      assignedStaff: cleanActorName(staffName),
      assignedRole: actorRole === "FACILITY_MANAGER" ? "FACILITY_MANAGER" : "STAFF",
    }),
  });

  return handleTicketResponse(res, "Không thể cập nhật trạng thái xử lý sự cố.");
}

/**
 * PATCH /api/v1/tickets/{ticketId}/status — Chuyển cấp lên Quản lý (ESCALATE — FR-24)
 */
export async function escalateSupportTicket({
  ticketId = null,
  unitCode = null,
  customerName = null,
  customerPhone = "",
  description = "",
  escalationReason,
  staffName,
}) {
  if (!escalationReason || !escalationReason.trim()) {
    throw new Error("Lý do chuyển cấp lên Quản lý cơ sở là bắt buộc theo quy định vận hành.");
  }

  const payload = {
    status: "ESCALATED",
    escalationReason: escalationReason.trim(),
    assignedStaff: cleanActorName(staffName),
  };

  const endpoint = ticketId != null ? `/api/v1/tickets/${ticketId}/status` : "/api/v1/tickets";
  const res = await apiClient(endpoint, {
    method: ticketId != null ? "PATCH" : "POST",
    body: JSON.stringify(
      ticketId != null
        ? payload
        : {
            ...payload,
            unitCode: (unitCode || "").trim().toUpperCase(),
            customerName,
            customerPhone,
            description: description || `Sự cố kỹ thuật phát sinh tại kho ${unitCode || ""}`.trim(),
          }
    ),
  });

  return handleTicketResponse(res, "Không thể chuyển cấp yêu cầu hỗ trợ.");
}
