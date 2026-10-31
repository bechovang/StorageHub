/**
 * StorageHub — User Management Service (US-28 / FR-37 / FR-39)
 * Quản trị người dùng cho vai trò SYSTEM_ADMIN:
 * - Xem danh sách người dùng cho cả 5 role (CUSTOMER, STAFF, FACILITY_MANAGER, BUSINESS_OPS, SYSTEM_ADMIN)
 * - Tạo tài khoản mới kèm mật khẩu tạm (đổi ở lần đầu đăng nhập)
 * - Đổi vai trò (PATCH /api/v1/users/{userId}/role)
 * - Kích hoạt / Tạm dừng / Khóa tài khoản (PATCH /api/v1/users/{userId}/status)
 * - Cấp lại mật khẩu tạm (POST /api/v1/users/{userId}/reset-password)
 */

import { apiClient, safeParseJson } from "./apiClient.js";
import { appendActivityLog } from "./activityService.js";

export const USER_ROLES = {
  CUSTOMER: { key: "CUSTOMER", label: "Customer (Khách thuê)", badgeClass: "role-badge--customer" },
  STAFF: { key: "STAFF", label: "Staff (Nhân viên kho)", badgeClass: "role-badge--staff" },
  FACILITY_MANAGER: { key: "FACILITY_MANAGER", label: "Facility Manager (Quản lý cơ sở)", badgeClass: "role-badge--manager" },
  BUSINESS_OPS: { key: "BUSINESS_OPS", label: "Business Ops (Vận hành kinh doanh)", badgeClass: "role-badge--ops" },
  SYSTEM_ADMIN: { key: "SYSTEM_ADMIN", label: "System Admin (Quản trị hệ thống)", badgeClass: "role-badge--admin" },
};

export const USER_STATUSES = {
  ACTIVE: { key: 1, code: "ACTIVE", label: "Hoạt động", class: "status-badge--active" },
  INACTIVE: { key: 0, code: "INACTIVE", label: "Tạm dừng", class: "status-badge--inactive" },
  LOCKED: { key: 2, code: "LOCKED", label: "Đã khóa", class: "status-badge--locked" },
};

function normalizeUser(u) {
  if (!u) return u;
  const targetId = u.id ?? u.userId;
  return {
    ...u,
    id: targetId,
    userId: targetId,
    facilityName:
      u.facilityName ||
      (u.facilityId ? "Cơ sở Tân Bình (VN-SGN-01)" : u.role === "CUSTOMER" ? "Khách thuê cá nhân" : "Toàn hệ thống"),
  };
}


/**
 * Lấy danh sách người dùng từ Backend: GET /api/v1/users
 */
export async function getUsers({ role = "ALL", status = "ALL", searchTerm = "" } = {}) {
  try {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("page-size", "100");
    if (role && role !== "ALL") {
      params.set("role", role);
    }
    if (status !== "ALL" && status !== undefined && status !== "") {
      params.set("status", String(status));
    }
    if (searchTerm && searchTerm.trim()) {
      params.set("query", searchTerm.trim());
    }

    const res = await apiClient(`/api/v1/users?${params.toString()}`);
    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.message || "Không thể tải danh sách người dùng.");
    }

    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return items.map(normalizeUser);
  } catch (err) {
    throw err;
  }
}

/**
 * Tạo tài khoản mới (SYS-01 / FR-37): POST /api/v1/users
 */
export async function createUser({
  fullName,
  email,
  phone,
  role,
  facilityId = 1,
  currentActor = "System Admin",
}) {
  const resolvedFacilityId =
    role === "CUSTOMER" || role === "SYSTEM_ADMIN" || role === "BUSINESS_OPS"
      ? null
      : facilityId;

  const res = await apiClient("/api/v1/users", {
    method: "POST",
    body: JSON.stringify({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : "",
      role,
      facilityId: resolvedFacilityId,
    }),
  });

  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tạo tài khoản người dùng mới.");
  }

  const createdUser = normalizeUser(data.user || data);
  const tempPassword = data.temporaryPassword || data.tempPassword || "";

  appendActivityLog({
    actor: currentActor,
    actorRole: "SYSTEM_ADMIN",
    entityType: "USER",
    entityId: createdUser.userId,
    entityName: createdUser.fullName,
    action: "CREATED",
    fromValue: null,
    toValue: `ROLE_${role}`,
    reason: `Cấp tài khoản mới cho ${createdUser.fullName} (${createdUser.email}) kèm mật khẩu tạm.`,
  });

  return { user: createdUser, tempPassword };
}

/**
 * Cập nhật vai trò người dùng (US-28 / FR-37): PATCH /api/v1/users/{userId}/role
 */
export async function updateUserRole({
  userId,
  newRole,
  reason,
  currentActor = "System Admin",
}) {
  if (!reason || !reason.trim()) {
    throw new Error("Lý do thay đổi vai trò là bắt buộc theo quy định kiểm toán.");
  }

  const targetId = userId;
  if (!targetId) {
    throw new Error("Không xác định được ID người dùng cần đổi vai trò.");
  }

  const res = await apiClient(`/api/v1/users/${targetId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role: newRole, reason: reason.trim() }),
  });

  const backendData = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(backendData.message || `Cập nhật vai trò thất bại (Mã lỗi: ${res.status})`);
  }

  const updatedUser = normalizeUser(backendData);

  appendActivityLog({
    actor: currentActor,
    actorRole: "SYSTEM_ADMIN",
    entityType: "USER",
    entityId: targetId,
    entityName: updatedUser.fullName || `User #${targetId}`,
    action: "STATUS_CHANGE",
    fromValue: null,
    toValue: `ROLE_${newRole}`,
    reason: reason.trim(),
  });

  return updatedUser;
}

/**
 * Cập nhật trạng thái người dùng (1 = ACTIVE, 0 = INACTIVE, 2 = LOCKED): PATCH /api/v1/users/{userId}/status
 */
export async function updateUserStatus({
  userId,
  newStatus,
  currentUserId,
  reason,
  currentActor = "System Admin",
}) {
  const targetId = userId;
  if (Number(targetId) === Number(currentUserId) && Number(newStatus) !== 1) {
    throw new Error("Bạn không thể tự vô hiệu hóa hoặc khóa tài khoản của chính mình.");
  }

  if (!reason || !reason.trim()) {
    throw new Error("Lý do thay đổi trạng thái tài khoản là bắt buộc.");
  }

  const res = await apiClient(`/api/v1/users/${targetId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: Number(newStatus),
      reason: reason.trim(),
    }),
  });

  const backendData = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(backendData.message || "Không thể cập nhật trạng thái tài khoản.");
  }

  const updatedUser = normalizeUser(backendData);
  const statusLabelMap = { 1: "ACTIVE", 0: "INACTIVE", 2: "LOCKED" };

  appendActivityLog({
    actor: currentActor,
    actorRole: "SYSTEM_ADMIN",
    entityType: "USER",
    entityId: targetId,
    entityName: updatedUser.fullName || `User #${targetId}`,
    action: "STATUS_CHANGE",
    fromValue: null,
    toValue: statusLabelMap[newStatus] || String(newStatus),
    reason: reason.trim(),
  });

  return updatedUser;
}

/**
 * Cấp lại mật khẩu tạm (Reset Password - FR-37): POST /api/v1/users/{userId}/reset-password
 */
export async function resetUserPassword({
  userId,
  currentActor = "System Admin",
}) {
  const targetId = userId;
  const res = await apiClient(`/api/v1/users/${targetId}/reset-password`, {
    method: "POST",
  });

  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể cấp lại mật khẩu tạm.");
  }

  const tempPassword = data.temporaryPassword || data.tempPassword || "";

  appendActivityLog({
    actor: currentActor,
    actorRole: "SYSTEM_ADMIN",
    entityType: "USER",
    entityId: targetId,
    entityName: data.email || `User #${targetId}`,
    action: "STATUS_CHANGE",
    fromValue: null,
    toValue: "TEMP_PASSWORD_ISSUED",
    reason: "Cấp lại mật khẩu tạm theo yêu cầu hỗ trợ tài khoản.",
  });

  return {
    userId: data.userId || targetId,
    email: data.email,
    tempPassword,
  };
}

/**
 * Định nghĩa 5 vai trò trong hệ thống kèm Persona đại diện từ seed V2__seed_demo.sql
 */
export const ROLE_DEFINITIONS = [
  {
    key: "CUSTOMER",
    title: "Khách thuê kho",
    badgeClass: "role-badge--customer",
    persona: "Nguyễn Thị Lan",
    description: "Khách hàng cá nhân hoặc doanh nghiệp có nhu cầu thuê kho tự quản, đặt phòng, thanh toán và quản lý tài sản.",
  },
  {
    key: "STAFF",
    title: "Nhân viên trực kho",
    badgeClass: "role-badge--staff",
    persona: "Trần Minh",
    description: "Nhân sự trực tại cơ sở kho, phụ trách bảng việc Kanban, bàn giao nhận phòng (Check-in/Checkout), dọn dẹp và xử lý sự cố.",
  },
  {
    key: "FACILITY_MANAGER",
    title: "Quản lý cơ sở",
    badgeClass: "role-badge--manager",
    persona: "Phạm Tuấn",
    description: "Quản lý trưởng cơ sở Tân Bình, phân công ca trực nhân viên, điều chỉnh trạng thái kho và giám sát nhật ký hoạt động.",
  },
  {
    key: "BUSINESS_OPS",
    title: "Vận hành kinh doanh",
    badgeClass: "role-badge--ops",
    persona: "Lê Thị Hằng",
    description: "Chuyên viên quản lý biểu phí thuê, quy chế đặt cọc, đệm vệ sinh kho và báo cáo doanh thu tài chính toàn chuỗi.",
  },
  {
    key: "SYSTEM_ADMIN",
    title: "Quản trị hệ thống",
    badgeClass: "role-badge--admin",
    persona: "Hoàng Nam",
    description: "Quản trị viên hạ tầng kỹ thuật, cấp phát tài khoản nhân sự, kiểm soát mật khẩu tạm và bảo mật ma trận phân quyền.",
  },
];

/**
 * Danh mục quyền hạn phân nhóm theo 4 phân hệ nghiệp vụ thực tế (FR-39)
 */
export const PERMISSION_GROUPS = [
  {
    category: "1. Phân hệ Khách hàng & Thuê kho",
    description: "Các chức năng phục vụ khách tìm kiếm, đặt chỗ và quản lý hợp đồng thuê",
    permissions: [
      {
        id: "P-BROWSE",
        name: "Tìm kiếm & Đặt giữ chỗ kho",
        desc: "Tra cứu danh mục kho trống theo kích thước, tầng, xem biểu giá và thanh toán tiền cọc giữ chỗ.",
        CUSTOMER: true, STAFF: false, FACILITY_MANAGER: false, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
      {
        id: "P-RENTALS",
        name: "Quản lý hợp đồng & Thẻ nhận kho",
        desc: "Xem danh sách kho đang thuê, chuỗi hợp đồng ký kết, mã nhận kho Check-in Pass và gửi yêu cầu trả kho.",
        CUSTOMER: true, STAFF: false, FACILITY_MANAGER: false, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
      {
        id: "P-TICKET-CREATE",
        name: "Gửi yêu cầu hỗ trợ sự cố",
        desc: "Tạo phiếu báo cáo sự cố kỹ thuật (khóa số, máy hút ẩm, thẻ từ) gắn trực tiếp với mã kho đang thuê.",
        CUSTOMER: true, STAFF: true, FACILITY_MANAGER: true, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
    ],
  },
  {
    category: "2. Phân hệ Vận hành cơ sở kho (Cơ sở Tân Bình)",
    description: "Các chức năng dành cho đội ngũ nhân viên trực tiếp quản lý cơ sở vật chất và tiếp đón khách",
    permissions: [
      {
        id: "P-TASKS",
        name: "Bảng phân việc vận hành (Kanban Board)",
        desc: "Tiếp nhận và xử lý 5 loại thẻ công việc trong ca trực: Check-in, Checkout, Vệ sinh, Ký hợp đồng, Xử lý sự cố.",
        CUSTOMER: false, STAFF: true, FACILITY_MANAGER: false, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
      {
        id: "P-CHECKIN-OUT",
        name: "Thực hiện thủ tục Check-in & Trả kho",
        desc: "Đối chiếu mã đơn, thu tiền thuê đủ 100%, chụp ảnh lưu hợp đồng đã ký và tất toán hoàn cọc khi khách trả.",
        CUSTOMER: false, STAFF: true, FACILITY_MANAGER: false, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
      {
        id: "P-FACILITY-VIEW",
        name: "Theo dõi tổng quan cơ sở kho",
        desc: "Xem sơ đồ mặt bằng các tầng kho, tỷ lệ phòng đang khai thác, kho đang bảo trì và kho cần dọn dẹp.",
        CUSTOMER: false, STAFF: false, FACILITY_MANAGER: true, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
      {
        id: "P-UNIT-MGMT",
        name: "Điều chỉnh trạng thái & Bảo trì kho",
        desc: "Chuyển kho vào bảo trì, đưa kho ra khỏi khai thác (Retire) hoặc sửa trạng thái khẩn cấp kèm lý do kiểm toán.",
        CUSTOMER: false, STAFF: false, FACILITY_MANAGER: true, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
      {
        id: "P-SHIFTS",
        name: "Phân công lịch trực nhân viên",
        desc: "Lập lịch tuần cho nhân sự theo từng khu vực (Zone A, B, C) và ca trực (Sáng, Chiều, Tối), chặn trùng ca.",
        CUSTOMER: false, STAFF: false, FACILITY_MANAGER: true, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
      {
        id: "P-ACTIVITY",
        name: "Xem nhật ký kiểm toán hoạt động",
        desc: "Truy cứu toàn bộ lịch sử biến động trạng thái kho, hợp đồng và sự kiện bảo mật theo thời gian thực (chỉ đọc).",
        CUSTOMER: false, STAFF: false, FACILITY_MANAGER: true, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
    ],
  },
  {
    category: "3. Phân hệ Quản trị Kinh doanh & Biểu phí",
    description: "Các chức năng thiết lập chính sách giá, phụ thu và phân tích hiệu quả kinh doanh",
    permissions: [
      {
        id: "P-POLICY",
        name: "Ban hành chính sách giá & Biểu phí thuê",
        desc: "Chỉnh sửa giá thuê cơ bản theo cỡ kho, quy định tỷ lệ cọc %, thời gian đệm và trần phụ thu tối đa.",
        CUSTOMER: false, STAFF: false, FACILITY_MANAGER: false, BUSINESS_OPS: true, SYSTEM_ADMIN: true,
      },
      {
        id: "P-REPORTS",
        name: "Báo cáo doanh thu & Dòng tiền ký quỹ",
        desc: "Theo dõi 4 chỉ số tài chính cốt lõi, tách bạch tiền cọc giữ riêng Escrow và xuất báo cáo kiểm toán CSV.",
        CUSTOMER: false, STAFF: false, FACILITY_MANAGER: false, BUSINESS_OPS: true, SYSTEM_ADMIN: true,
      },
    ],
  },
  {
    category: "4. Phân hệ Quản trị Tài khoản & Bảo mật",
    description: "Các quyền hạn cấp cao nhất nhằm đảm bảo an toàn truy cập và vận hành phần mềm",
    permissions: [
      {
        id: "P-USER-MGMT",
        name: "Quản trị danh sách người dùng toàn hệ thống",
        desc: "Cấp tài khoản mới cho 5 vai trò, cấp phát mật khẩu tạm dùng 1 lần, đổi quyền và khóa/mở khóa tài khoản.",
        CUSTOMER: false, STAFF: false, FACILITY_MANAGER: false, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
      {
        id: "P-LOGIN-HISTORY",
        name: "Kiểm soát lịch sử đăng nhập & Ma trận quyền",
        desc: "Giám sát các lần đăng nhập thành công và thất bại, phát hiện truy cập bất thường và đối chiếu quyền truy cập.",
        CUSTOMER: false, STAFF: false, FACILITY_MANAGER: false, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
    ],
  },
];

export const PERMISSION_MATRIX = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => ({ module: p.name, ...p }))
);

/**
 * Lấy ma trận phân quyền 5 vai trò hệ thống từ Backend API (FR-39)
 * @returns {Promise<{ roles: string[], groups: Array }>}
 */
export async function getPermissionMatrix() {
  try {
    const response = await apiClient("/api/v1/users/permissions");
    if (!response.ok) {
      return { roles: [], groups: PERMISSION_GROUPS };
    }
    const data = await safeParseJson(response);
    if (data && Array.isArray(data.groups) && data.groups.length > 0) {
      const mappedGroups = data.groups.map((g) => ({
        category: g.category,
        description: g.description,
        permissions: (g.permissions || []).map((p) => ({
          id: p.id,
          name: p.name,
          desc: p.description,
          ...(p.roles || {}),
        })),
      }));
      return {
        roles: data.roles || [],
        groups: mappedGroups,
      };
    }
  } catch (err) {
    console.warn("Failed to load permission matrix from API, using default matrix:", err);
  }
  return { roles: [], groups: PERMISSION_GROUPS };
}

/**
 * Lấy lịch sử đăng nhập hệ thống từ Backend API (SYS-02 / FR-38)
 * @param {Object} params
 * @param {number} [params.userId]
 * @param {string} [params.status]
 * @param {string} [params.query]
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=25]
 * @returns {Promise<Object>} LoginHistoryPageResponse
 */
export async function getLoginHistory({
  userId,
  status,
  query,
  startDate,
  endDate,
  page = 1,
  pageSize = 25,
  signal,
} = {}) {
  const params = new URLSearchParams();
  if (userId) params.append("userId", String(userId));
  if (status) params.append("status", status);
  if (query && query.trim()) params.append("query", query.trim());
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  params.append("page", String(page));
  params.append("pageSize", String(pageSize));

  const response = await apiClient(`/api/v1/users/login-history?${params.toString()}`, { signal });
  if (!response.ok) {
    const errorData = await safeParseJson(response);
    throw new Error(errorData.message || "Không thể tải lịch sử đăng nhập.");
  }
  return await safeParseJson(response);
}
