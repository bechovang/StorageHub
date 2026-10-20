/**
 * StorageHub — User Management Service (US-28 / FR-37 / FR-39)
 * Quản trị người dùng cho vai trò SYSTEM_ADMIN:
 * - Xem danh sách người dùng cho cả 5 role (CUSTOMER, STAFF, FACILITY_MANAGER, BUSINESS_OPS, SYSTEM_ADMIN)
 * - Tạo tài khoản mới kèm mật khẩu tạm (đổi ở lần đầu đăng nhập)
 * - Kiểm tra trùng email (inline validation)
 * - Đổi vai trò (kèm ghi Activity Log)
 * - Kích hoạt / Tạm dừng / Khóa tài khoản (ACTIVE: 1, INACTIVE: 0, LOCKED: 2)
 * - Tuyệt đối không xóa người dùng (chỉ thay đổi trạng thái)
 * - Chặn tự khóa chính tài khoản đang đăng nhập
 */

import { apiClient, safeParseJson } from "./apiClient.js";
import { appendActivityLog } from "./activityService.js";

const USERS_STORAGE_KEY = "storagehub_users_v1";

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

/**
 * Danh sách người dùng ban đầu theo chuẩn seed demo (V2__seed_demo.sql)
 */
export const INITIAL_USERS = [
  {
    id: 1,
    userId: 1,
    fullName: "Nguyễn Thị Lan",
    email: "lan@demo.storagehub.vn",
    phone: "0901234567",
    role: "CUSTOMER",
    status: 1,
    facilityId: null,
    facilityName: "Toàn hệ thống",
    lastLogin: "2026-10-18T16:00:00Z",
    createdAt: "2026-04-18T08:00:00Z",
  },
  {
    id: 2,
    userId: 2,
    fullName: "Trần Minh",
    email: "minh@demo.storagehub.vn",
    phone: "0902345678",
    role: "STAFF",
    status: 1,
    facilityId: 1,
    facilityName: "Tân Bình Depot (Zone A, B)",
    lastLogin: "2026-10-19T07:15:00Z",
    createdAt: "2026-01-05T08:00:00Z",
  },
  {
    id: 3,
    userId: 3,
    fullName: "Lê Thị Hằng",
    email: "hang@demo.storagehub.vn",
    phone: "0903456789",
    role: "BUSINESS_OPS",
    status: 1,
    facilityId: null,
    facilityName: "Toàn hệ thống",
    lastLogin: "2026-10-19T08:30:00Z",
    createdAt: "2026-01-05T08:00:00Z",
  },
  {
    id: 4,
    userId: 4,
    fullName: "Phạm Tuấn",
    email: "tuan@demo.storagehub.vn",
    phone: "0904567890",
    role: "FACILITY_MANAGER",
    status: 1,
    facilityId: 1,
    facilityName: "Tân Bình Depot",
    lastLogin: "2026-10-19T08:00:00Z",
    createdAt: "2026-01-05T08:00:00Z",
  },
  {
    id: 5,
    userId: 5,
    fullName: "Hoàng Nam",
    email: "nam@demo.storagehub.vn",
    phone: "0905678901",
    role: "SYSTEM_ADMIN",
    status: 1,
    facilityId: null,
    facilityName: "Toàn hệ thống",
    lastLogin: "2026-10-20T08:15:00Z",
    createdAt: "2026-01-05T08:00:00Z",
  },
  {
    id: 6,
    userId: 6,
    fullName: "Phạm Thị Trang",
    email: "trang@demo.storagehub.vn",
    phone: "0906789012",
    role: "CUSTOMER",
    status: 1,
    facilityId: null,
    facilityName: "Toàn hệ thống",
    lastLogin: "2026-10-19T09:00:00Z",
    createdAt: "2026-07-15T08:00:00Z",
  },
  {
    id: 7,
    userId: 7,
    fullName: "Vũ Văn Vũ",
    email: "vu@demo.storagehub.vn",
    phone: "0907890123",
    role: "STAFF",
    status: 2, // Locked (đã nghỉ việc / thử đăng nhập sai)
    facilityId: 1,
    facilityName: "Tân Bình Depot",
    lastLogin: "2026-10-20T07:59:05Z",
    createdAt: "2026-02-01T08:00:00Z",
  },
];

/**
 * Chuẩn hóa đối tượng người dùng, đảm bảo cả `id` và `userId` đều tồn tại và hợp lệ
 */
export function normalizeUser(u) {
  if (!u) return null;
  const idVal = u.id !== undefined && u.id !== null
    ? Number(u.id)
    : (u.userId !== undefined && u.userId !== null ? Number(u.userId) : null);

  let facilityName = u.facilityName;
  if (!facilityName) {
    if (u.role === "CUSTOMER" || u.role === "SYSTEM_ADMIN" || u.role === "BUSINESS_OPS") {
      facilityName = "Toàn hệ thống";
    } else if (u.facilityId === 1 || u.facilityId === "1") {
      facilityName = "Tân Bình Depot";
    } else if (u.facilityId) {
      facilityName = `Cơ sở #${u.facilityId}`;
    } else {
      facilityName = "Toàn hệ thống";
    }
  }

  return {
    ...u,
    id: idVal,
    userId: idVal,
    facilityName,
    status: u.status !== undefined && u.status !== null ? Number(u.status) : 1,
  };
}

/**
 * Lưu danh sách users vào localStorage
 */
export function saveUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Lỗi khi lưu danh sách users:", err);
  }
}

/**
 * Cập nhật một người dùng trong localStorage cache
 */
function updateUserInLocalStorage(updatedUser) {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : INITIAL_USERS;
    const cleanId = Number(updatedUser.id || updatedUser.userId);
    const idx = list.findIndex((u) => Number(u.id || u.userId) === cleanId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedUser };
    } else {
      list.push(updatedUser);
    }
    saveUsers(list);
  } catch (err) {
    console.error("Lỗi cập nhật user cache:", err);
  }
}

/**
 * Thêm người dùng mới vào đầu danh sách localStorage cache
 */
function prependUserInLocalStorage(newUser) {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : INITIAL_USERS;
    list = [newUser, ...list];
    saveUsers(list);
  } catch (err) {
    console.error("Lỗi chèn user cache:", err);
  }
}

/**
 * Lấy danh sách người dùng từ localStorage / Mock (Đồng bộ)
 */
export function getLocalUsers({ role = "ALL", status = "ALL", searchTerm = "" } = {}) {
  let list = INITIAL_USERS.map(normalizeUser);
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed.map(normalizeUser);
      }
    }
  } catch (err) {
    console.error("Lỗi khi đọc danh sách users từ localStorage:", err);
  }

  // Lọc theo Role
  if (role && role !== "ALL") {
    list = list.filter((u) => u.role === role);
  }

  // Lọc theo Status (0, 1, 2)
  if (status !== "ALL" && status !== undefined && status !== "") {
    const statusNum = Number(status);
    list = list.filter((u) => Number(u.status) === statusNum);
  }

  // Lọc theo Search keyword
  if (searchTerm && searchTerm.trim()) {
    const q = searchTerm.trim().toLowerCase();
    list = list.filter(
      (u) =>
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q))
    );
  }

  return list;
}

/**
 * Lấy danh sách người dùng từ Backend API (/api/v1/users) kèm graceful fallback sang localStorage
 */
export async function getUsers({ role = "ALL", status = "ALL", searchTerm = "" } = {}) {
  try {
    const params = new URLSearchParams();
    if (searchTerm && searchTerm.trim()) params.append("query", searchTerm.trim());
    if (role && role !== "ALL") params.append("role", role);
    if (status !== "ALL" && status !== undefined && status !== "") params.append("status", status);
    params.append("page", "1");
    params.append("page-size", "100");

    const res = await apiClient(`/api/v1/users?${params.toString()}`);
    if (res.ok) {
      const data = await safeParseJson(res);
      if (data && Array.isArray(data.items)) {
        const items = data.items.map(normalizeUser);
        if (role === "ALL" && status === "ALL" && (!searchTerm || !searchTerm.trim())) {
          saveUsers(items);
        }
        return items;
      }
    }
  } catch (err) {
    console.warn("Lỗi khi tải users từ API, fallback sang localStorage:", err);
  }

  return getLocalUsers({ role, status, searchTerm });
}

/**
 * Tạo tài khoản mới (SYS-01 / FR-37)
 */
export async function createUser({
  fullName,
  email,
  phone,
  role,
  facilityId = 1,
  facilityName = "Tân Bình Depot",
  currentActor = "Hoàng Nam (System Admin)",
}) {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const body = {
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      role,
      facilityId: role === "CUSTOMER" || role === "SYSTEM_ADMIN" || role === "BUSINESS_OPS" ? null : (facilityId || 1),
    };

    const res = await apiClient("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.message || `Lỗi máy chủ (${res.status}) khi tạo người dùng`);
    }

    const createdUser = normalizeUser(data.user);
    const tempPassword = data.temporaryPassword;
    prependUserInLocalStorage(createdUser);

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
  } catch (err) {
    if (err.message && !err.message.includes("Không thể kết nối") && !err.message.includes("Failed to fetch")) {
      throw err;
    }
    return createLocalUser({ fullName, email, phone, role, facilityId, facilityName, currentActor });
  }
}

function createLocalUser({ fullName, email, phone, role, facilityId, facilityName, currentActor }) {
  const users = getLocalUsers({ role: "ALL", status: "ALL" });
  const cleanEmail = email.trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error(`Email "${cleanEmail}" đã tồn tại trong hệ thống.`);
  }

  const tempPassword = "SH@" + Math.random().toString(36).substring(2, 7).toUpperCase();
  const newUserId = Date.now();
  const newUser = normalizeUser({
    id: newUserId,
    userId: newUserId,
    fullName: fullName.trim(),
    email: cleanEmail,
    phone: phone ? phone.trim() : "",
    role,
    status: 1,
    facilityId: role === "CUSTOMER" || role === "SYSTEM_ADMIN" || role === "BUSINESS_OPS" ? null : facilityId,
    facilityName: role === "CUSTOMER" || role === "SYSTEM_ADMIN" || role === "BUSINESS_OPS" ? "Toàn hệ thống" : facilityName,
    lastLogin: null,
    createdAt: new Date().toISOString(),
    tempPassword,
  });

  prependUserInLocalStorage(newUser);

  appendActivityLog({
    actor: currentActor,
    actorRole: "SYSTEM_ADMIN",
    entityType: "USER",
    entityId: newUser.userId,
    entityName: newUser.fullName,
    action: "CREATED",
    fromValue: null,
    toValue: `ROLE_${role}`,
    reason: `Cấp tài khoản mới cho ${newUser.fullName} (${newUser.email}) kèm mật khẩu tạm.`,
  });

  return { user: newUser, tempPassword };
}

/**
 * Cập nhật vai trò người dùng (FR-37)
 */
export async function updateUserRole({ userId, newRole, reason, currentActor = "Hoàng Nam (System Admin)" }) {
  if (!reason || !reason.trim()) {
    throw new Error("Lý do thay đổi vai trò là bắt buộc theo quy định kiểm toán.");
  }
  const cleanUserId = Number(userId);

  try {
    const res = await apiClient(`/api/v1/users/${cleanUserId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole }),
    });
    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.message || `Lỗi máy chủ (${res.status}) khi cập nhật vai trò`);
    }

    const updatedUser = normalizeUser(data);
    updateUserInLocalStorage(updatedUser);

    appendActivityLog({
      actor: currentActor,
      actorRole: "SYSTEM_ADMIN",
      entityType: "USER",
      entityId: cleanUserId,
      entityName: updatedUser.fullName,
      action: "STATUS_CHANGE",
      fromValue: null,
      toValue: `ROLE_${newRole}`,
      reason: reason.trim(),
    });

    return updatedUser;
  } catch (err) {
    if (err.message && !err.message.includes("Không thể kết nối") && !err.message.includes("Failed to fetch")) {
      throw err;
    }
    return updateLocalUserRole({ userId: cleanUserId, newRole, reason, currentActor });
  }
}

function updateLocalUserRole({ userId, newRole, reason, currentActor }) {
  const users = getLocalUsers({ role: "ALL", status: "ALL" });
  const index = users.findIndex((u) => Number(u.id || u.userId) === Number(userId));
  if (index === -1) {
    throw new Error("Không tìm thấy người dùng này trong hệ thống.");
  }

  const user = users[index];
  const oldRole = user.role;
  if (oldRole === newRole) return user;

  user.role = newRole;
  users[index] = user;
  saveUsers(users);

  appendActivityLog({
    actor: currentActor,
    actorRole: "SYSTEM_ADMIN",
    entityType: "USER",
    entityId: user.userId,
    entityName: user.fullName,
    action: "STATUS_CHANGE",
    fromValue: `ROLE_${oldRole}`,
    toValue: `ROLE_${newRole}`,
    reason: reason.trim(),
  });

  return user;
}

/**
 * Cập nhật trạng thái người dùng: 1 = ACTIVE, 0 = INACTIVE, 2 = LOCKED (FR-37)
 */
export async function updateUserStatus({
  userId,
  newStatus,
  currentUserId,
  reason,
  currentActor = "Hoàng Nam (System Admin)",
}) {
  const cleanUserId = Number(userId);
  if (cleanUserId === Number(currentUserId) && Number(newStatus) === 2) {
    throw new Error("Bạn không thể tự khóa tài khoản của chính mình.");
  }

  if (!reason || !reason.trim()) {
    throw new Error("Lý do thay đổi trạng thái tài khoản là bắt buộc.");
  }

  try {
    const res = await apiClient(`/api/v1/users/${cleanUserId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: Number(newStatus), reason: reason.trim() }),
    });
    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.message || `Lỗi máy chủ (${res.status}) khi cập nhật trạng thái`);
    }

    const updatedUser = normalizeUser(data);
    updateUserInLocalStorage(updatedUser);

    const statusLabelMap = { 1: "ACTIVE", 0: "INACTIVE", 2: "LOCKED" };
    appendActivityLog({
      actor: currentActor,
      actorRole: "SYSTEM_ADMIN",
      entityType: "USER",
      entityId: cleanUserId,
      entityName: updatedUser.fullName,
      action: "STATUS_CHANGE",
      fromValue: null,
      toValue: statusLabelMap[newStatus] || String(newStatus),
      reason: reason.trim(),
    });

    return updatedUser;
  } catch (err) {
    if (err.message && !err.message.includes("Không thể kết nối") && !err.message.includes("Failed to fetch")) {
      throw err;
    }
    return updateLocalUserStatus({ userId: cleanUserId, newStatus, currentUserId, reason, currentActor });
  }
}

function updateLocalUserStatus({ userId, newStatus, currentUserId, reason, currentActor }) {
  if (Number(userId) === Number(currentUserId) && Number(newStatus) === 2) {
    throw new Error("Bạn không thể tự khóa tài khoản của chính mình.");
  }

  const users = getLocalUsers({ role: "ALL", status: "ALL" });
  const index = users.findIndex((u) => Number(u.id || u.userId) === Number(userId));
  if (index === -1) {
    throw new Error("Không tìm thấy người dùng.");
  }

  const user = users[index];
  const oldStatus = user.status;
  user.status = Number(newStatus);
  users[index] = user;
  saveUsers(users);

  const statusLabelMap = { 1: "ACTIVE", 0: "INACTIVE", 2: "LOCKED" };

  appendActivityLog({
    actor: currentActor,
    actorRole: "SYSTEM_ADMIN",
    entityType: "USER",
    entityId: user.userId,
    entityName: user.fullName,
    action: "STATUS_CHANGE",
    fromValue: statusLabelMap[oldStatus] || String(oldStatus),
    toValue: statusLabelMap[newStatus] || String(newStatus),
    reason: reason.trim(),
  });

  return user;
}

/**
 * Cấp lại mật khẩu tạm (Reset Password - FR-37)
 */
export async function resetUserPassword({ userId, currentActor = "Hoàng Nam (System Admin)" }) {
  const cleanUserId = Number(userId);

  try {
    const res = await apiClient(`/api/v1/users/${cleanUserId}/reset-password`, {
      method: "POST",
    });
    const data = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(data.message || `Lỗi máy chủ (${res.status}) khi cấp lại mật khẩu tạm`);
    }

    appendActivityLog({
      actor: currentActor,
      actorRole: "SYSTEM_ADMIN",
      entityType: "USER",
      entityId: cleanUserId,
      entityName: data.email || `User #${cleanUserId}`,
      action: "STATUS_CHANGE",
      fromValue: null,
      toValue: "TEMP_PASSWORD_ISSUED",
      reason: "Cấp lại mật khẩu tạm theo yêu cầu hỗ trợ tài khoản.",
    });

    return {
      userId: data.userId,
      email: data.email,
      tempPassword: data.temporaryPassword,
    };
  } catch (err) {
    if (err.message && !err.message.includes("Không thể kết nối") && !err.message.includes("Failed to fetch")) {
      throw err;
    }
    return resetLocalUserPassword({ userId: cleanUserId, currentActor });
  }
}

function resetLocalUserPassword({ userId, currentActor }) {
  const users = getLocalUsers({ role: "ALL", status: "ALL" });
  const index = users.findIndex((u) => Number(u.id || u.userId) === Number(userId));
  if (index === -1) {
    throw new Error("Không tìm thấy người dùng.");
  }

  const user = users[index];
  const newTempPassword = "SH@" + Math.random().toString(36).substring(2, 7).toUpperCase();
  user.tempPassword = newTempPassword;
  users[index] = user;
  saveUsers(users);

  appendActivityLog({
    actor: currentActor,
    actorRole: "SYSTEM_ADMIN",
    entityType: "USER",
    entityId: user.userId,
    entityName: user.fullName,
    action: "STATUS_CHANGE",
    fromValue: null,
    toValue: "TEMP_PASSWORD_ISSUED",
    reason: "Cấp lại mật khẩu tạm theo yêu cầu hỗ trợ tài khoản.",
  });

  return { user, tempPassword: newTempPassword };
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
    description: "Quản lý trưởng cơ sở Tân Bình, phân công ca trực nhân viên, điều chỉnh trạng thái ô kho và giám sát nhật ký hoạt động.",
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
        name: "Tìm kiếm & Đặt giữ chỗ ô kho",
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
        desc: "Tạo phiếu báo cáo sự cố kỹ thuật (khóa số, máy hút ẩm, thẻ từ) gắn trực tiếp với mã ô kho đang thuê.",
        CUSTOMER: true, STAFF: true, FACILITY_MANAGER: true, BUSINESS_OPS: false, SYSTEM_ADMIN: true,
      },
    ],
  },
  {
    category: "2. Phân hệ Vận hành cơ sở kho (Tân Bình Depot)",
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
        name: "Điều chỉnh trạng thái & Bảo trì ô kho",
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
