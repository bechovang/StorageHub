import { useState, useMemo, useEffect, useRef } from "react";
import {
  Users,
  UserPlus,
  MagnifyingGlass,
  Funnel,
  ShieldCheck,
  LockKey,
  Key,
  ArrowsClockwise,
  UserSwitch,
  Lock,
  LockOpen,
  Copy,
  Check,
  Shield,
  Table,
  CaretDown,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  USER_ROLES,
  USER_STATUSES,
  ROLE_DEFINITIONS,
  PERMISSION_GROUPS,
  PERMISSION_MATRIX,
} from "../../services/userService.js";
import "./UserManagementPage.css";

function getUserInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserManagementPage() {
  const { user: currentSessionUser } = useAuth();

  const [activeTab, setActiveTab] = useState("USERS"); // "USERS" | "MATRIX"
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatrixRole, setSelectedMatrixRole] = useState("ALL");

  // Dropdown action menu đang mở
  const [openMenuId, setOpenMenuId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  // Dữ liệu users
  const [users, setUsers] = useState(() => getUsers());

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return getUsers({
      role: selectedRole,
      status: selectedStatus,
      searchTerm,
    });
  }, [selectedRole, selectedStatus, searchTerm, users]);

  // Modals state
  // 1. Tạo tài khoản mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createRole, setCreateRole] = useState("STAFF");
  const [createError, setCreateError] = useState("");
  const [createdSuccessData, setCreatedSuccessData] = useState(null);

  // 2. Đổi vai trò
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [targetRole, setTargetRole] = useState("CUSTOMER");
  const [roleReason, setRoleReason] = useState("");
  const [roleError, setRoleError] = useState("");

  // 3. Đổi trạng thái (Khóa / Mở khóa)
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [targetStatus, setTargetStatus] = useState(1);
  const [statusReason, setStatusReason] = useState("");
  const [statusError, setStatusError] = useState("");

  // 4. Reset Password
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetSuccessPass, setResetSuccessPass] = useState(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit tạo tài khoản
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setCreateError("");
    try {
      const res = createUser({
        fullName: createName,
        email: createEmail,
        phone: createPhone,
        role: createRole,
        currentActor: currentSessionUser?.fullName || "System Admin",
      });
      setUsers(getUsers());
      setCreatedSuccessData(res);
      showToast(`Đã cấp tài khoản cho ${res.user.fullName} thành công.`);
    } catch (err) {
      setCreateError(err.message);
    }
  };

  // Submit đổi vai trò (US-28 / FR-37)
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setRoleError("");
    const targetId = roleModalUser?.id || roleModalUser?.userId;
    try {
      await updateUserRole({
        userId: targetId,
        newRole: targetRole,
        reason: roleReason,
        currentActor: currentSessionUser?.fullName || "System Admin",
      });
      // Set filter về "ALL" (Tất cả vai trò) để Admin thấy ngay người dùng với badge vai trò mới
      setSelectedRole("ALL");
      setUsers(getUsers());
      setRoleModalUser(null);
      showToast(`Đã chuyển vai trò của ${roleModalUser.fullName} sang ${targetRole}.`);
    } catch (err) {
      setRoleError(err.message || "Không thể cập nhật vai trò người dùng");
    }
  };

  // Submit đổi trạng thái
  const handleStatusSubmit = (e) => {
    e.preventDefault();
    setStatusError("");
    const targetId = statusModalUser?.id || statusModalUser?.userId;
    try {
      updateUserStatus({
        userId: targetId,
        newStatus: targetStatus,
        currentUserId: currentSessionUser?.id,
        reason: statusReason,
        currentActor: currentSessionUser?.fullName || "System Admin",
      });
      setUsers(getUsers());
      setStatusModalUser(null);
      showToast(`Đã cập nhật trạng thái của ${statusModalUser.fullName}.`);
    } catch (err) {
      setStatusError(err.message);
    }
  };

  // Submit Reset Mật khẩu
  const handleConfirmReset = () => {
    const targetId = resetModalUser?.id || resetModalUser?.userId;
    try {
      const res = resetUserPassword({
        userId: targetId,
        currentActor: currentSessionUser?.fullName || "System Admin",
      });
      setResetSuccessPass(res.tempPassword);
      setUsers(getUsers());
      showToast(`Đã cấp mật khẩu tạm mới cho ${resetModalUser.fullName}.`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <AppShell>
      <div className="user-mgmt-page">
        {/* Top Status Bar */}
        <div className="mgmt-telemetry">
          <div className="mgmt-telemetry__left">
            <span className="mgmt-telemetry__dot" />
            <span style={{ fontWeight: 600 }}>Quản trị hệ thống:</span>
            <span>Cấp tài khoản & Phân quyền</span>
            <span>|</span>
            <span>Cơ sở: Toàn hệ thống</span>
          </div>
          <div className="mgmt-telemetry__right">
            <span>SYS_ADMIN_WORKSPACE</span>
          </div>
        </div>

        <div className="user-mgmt-container">
          {/* Header */}
          <header className="user-mgmt-header">
            <div className="user-mgmt-header__titles">
              <span className="user-mgmt-header__super">QUẢN TRỊ HỆ THỐNG · TÀI KHOẢN & PHÂN QUYỀN</span>
              <h1 className="user-mgmt-header__title">QUẢN LÝ NGƯỜI DÙNG</h1>
              <p className="user-mgmt-header__desc">
                Quản lý danh sách tài khoản 5 vai trò, cấp phát mật khẩu tạm, kích hoạt hoặc khóa tài khoản nhân sự và tra cứu ma trận phân quyền.
              </p>
            </div>
            <div className="user-mgmt-header__actions">
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => {
                  setCreateName("");
                  setCreateEmail("");
                  setCreatePhone("");
                  setCreateRole("STAFF");
                  setCreateError("");
                  setCreatedSuccessData(null);
                  setShowCreateModal(true);
                }}
              >
                <UserPlus size={16} weight="bold" />
                <span>Cấp tài khoản mới</span>
              </button>
            </div>
          </header>

          {/* Quick Stats Grid */}
          <div className="user-mgmt-stats">
            <div className="user-stat-card">
              <span className="user-stat-card__label">Tổng người dùng</span>
              <span className="user-stat-card__val">{users.length}</span>
            </div>
            <div className="user-stat-card">
              <span className="user-stat-card__label">Nhân sự kho & quản lý</span>
              <span className="user-stat-card__val">
                {users.filter((u) => u.role === "STAFF" || u.role === "FACILITY_MANAGER").length}
              </span>
            </div>
            <div className="user-stat-card">
              <span className="user-stat-card__label">Khách thuê (Customer)</span>
              <span className="user-stat-card__val">
                {users.filter((u) => u.role === "CUSTOMER").length}
              </span>
            </div>
            <div className="user-stat-card">
              <span className="user-stat-card__label">Tài khoản bị khóa</span>
              <span className="user-stat-card__val" style={{ color: "var(--color-accent)" }}>
                {users.filter((u) => u.status === 2).length}
              </span>
            </div>
          </div>

          {/* View Switch Tabs */}
          <div className="mgmt-view-tabs">
            <button
              type="button"
              className={`mgmt-view-tab ${activeTab === "USERS" ? "mgmt-view-tab--active" : ""}`}
              onClick={() => setActiveTab("USERS")}
            >
              <Users size={16} />
              <span>Danh sách người dùng ({filteredUsers.length})</span>
            </button>
            <button
              type="button"
              className={`mgmt-view-tab ${activeTab === "MATRIX" ? "mgmt-view-tab--active" : ""}`}
              onClick={() => setActiveTab("MATRIX")}
            >
              <Table size={16} />
              <span>Ma trận phân quyền (Role Matrix)</span>
            </button>
          </div>

          {activeTab === "USERS" ? (
            <>
              {/* Toolbar */}
              <div className="user-mgmt-toolbar">
                <div className="user-mgmt-toolbar__top">
                  <div className="user-search-box">
                    <MagnifyingGlass size={16} className="user-search-box__icon" />
                    <input
                      type="text"
                      className="user-search-box__input"
                      placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="user-filter-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="1">Đang hoạt động (Active)</option>
                    <option value="0">Tạm dừng (Inactive)</option>
                    <option value="2">Đã khóa (Locked)</option>
                  </select>
                </div>

                {/* Role Pill Filters */}
                <div className="role-pill-tabs">
                  <button
                    type="button"
                    className={`role-pill-btn ${selectedRole === "ALL" ? "role-pill-btn--active" : ""}`}
                    onClick={() => setSelectedRole("ALL")}
                  >
                    Tất cả vai trò
                  </button>
                  {Object.values(USER_ROLES).map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      className={`role-pill-btn ${selectedRole === r.key ? "role-pill-btn--active" : ""}`}
                      onClick={() => setSelectedRole(r.key)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="user-table-wrapper">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "190px" }}>Họ và tên</th>
                      <th style={{ minWidth: "190px" }}>Email đăng nhập</th>
                      <th style={{ width: "120px" }}>Số điện thoại</th>
                      <th style={{ width: "120px" }}>Vai trò</th>
                      <th style={{ width: "170px" }}>Cơ sở phụ trách</th>
                      <th style={{ width: "130px" }}>Trạng thái</th>
                      <th style={{ width: "70px", textAlign: "center" }} title="Tùy chọn"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, index) => {
                      const roleConfig = USER_ROLES[u.role] || { label: u.role, badgeClass: "" };
                      const statusConfig = Object.values(USER_STATUSES).find((s) => s.key === u.status) || USER_STATUSES.ACTIVE;
                      const targetId = u.id || u.userId;
                      const isSelf = currentSessionUser && (currentSessionUser.id === targetId || currentSessionUser.email === u.email);
                      const isMenuOpen = openMenuId === targetId;
                      const isNearBottom = index >= filteredUsers.length - 2 && filteredUsers.length > 3;

                      return (
                        <tr key={targetId}>
                          <td className="user-name-cell">
                            <div className="user-name-wrapper">
                              <span className="user-avatar-tag">{getUserInitials(u.fullName)}</span>
                              <span className="user-name-text">{u.fullName}</span>
                              {isSelf && <span className="user-self-tag">(Bạn)</span>}
                            </div>
                          </td>
                          <td className="user-email-cell">{u.email}</td>
                          <td>{u.phone || "—"}</td>
                          <td>
                            <span className={`role-chip ${roleConfig.badgeClass}`}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ color: "var(--color-secondary)", fontSize: "0.78rem" }}>
                            {u.facilityName || "Toàn hệ thống"}
                          </td>
                          <td>
                            <span className={`status-badge ${statusConfig.class}`}>
                              <span className="status-dot" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div
                              className="action-dropdown-wrapper"
                              ref={isMenuOpen ? dropdownRef : null}
                            >
                              <button
                                type="button"
                                className={`btn-action-trigger ${isMenuOpen ? "btn-action-trigger--active" : ""}`}
                                title="Tùy chọn thao tác"
                                aria-label="Tùy chọn thao tác"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(isMenuOpen ? null : targetId);
                                }}
                              >
                                <DotsThreeVertical size={16} weight="bold" />
                              </button>

                              {isMenuOpen && (
                                <div className={`action-menu-dropdown ${isNearBottom ? "action-menu-dropdown--up" : ""}`}>
                                  <button
                                    type="button"
                                    className="action-menu-item"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setRoleModalUser(u);
                                      setTargetRole(u.role);
                                      setRoleReason("");
                                      setRoleError("");
                                    }}
                                  >
                                    <UserSwitch size={14} />
                                    <span>Đổi vai trò</span>
                                  </button>

                                  <button
                                    type="button"
                                    className="action-menu-item"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setResetModalUser(u);
                                      setResetSuccessPass(null);
                                    }}
                                  >
                                    <Key size={14} />
                                    <span>Cấp lại mật khẩu tạm</span>
                                  </button>

                                  <div className="action-menu-divider" />

                                  {u.status === 2 ? (
                                    <button
                                      type="button"
                                      className="action-menu-item action-menu-item--unlock"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setStatusModalUser(u);
                                        setTargetStatus(1);
                                        setStatusReason("");
                                        setStatusError("");
                                      }}
                                    >
                                      <LockOpen size={14} />
                                      <span>Mở khóa tài khoản</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="action-menu-item action-menu-item--danger"
                                      disabled={isSelf}
                                      title={isSelf ? "Không thể tự khóa chính mình" : ""}
                                      onClick={() => {
                                        if (isSelf) return;
                                        setOpenMenuId(null);
                                        setStatusModalUser(u);
                                        setTargetStatus(2);
                                        setStatusReason("");
                                        setStatusError("");
                                      }}
                                    >
                                      <Lock size={14} />
                                      <span>{isSelf ? "Không thể tự khóa" : "Khóa tài khoản"}</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Ma trận phân quyền (Quy chuẩn phân quyền 5 vai trò) */
            <div className="matrix-view-container">
              {/* Header giải thích */}
              <div className="matrix-hero-card">
                <div className="matrix-hero-card__header">
                  <div>
                    <span className="matrix-hero-super">QUY CHUẨN THẨM QUYỀN VẬN HÀNH</span>
                    <h2 className="matrix-hero-title">MA TRẬN PHÂN QUYỀN 5 VAI TRÒ</h2>
                    <p className="matrix-hero-desc">
                      Bảng đối chiếu thẩm quyền và giới hạn truy cập chức năng của từng nhóm người dùng tại StorageHub. Mọi phân quyền được kiểm soát chặt chẽ ở máy chủ (Server-side Enforced) nhằm bảo mật dữ liệu cơ sở.
                    </p>
                  </div>
                  <div className="matrix-badge-readonly">CHẾ ĐỘ CHỈ ĐỌC (READ-ONLY)</div>
                </div>

                {/* 5 Thẻ vai trò giải thích Persona */}
                <div className="matrix-role-cards">
                  {ROLE_DEFINITIONS.map((r) => {
                    const isSelected = selectedMatrixRole === r.key;
                    return (
                      <div
                        key={r.key}
                        className={`matrix-role-card ${isSelected ? "matrix-role-card--selected" : ""}`}
                        onClick={() => setSelectedMatrixRole(isSelected ? "ALL" : r.key)}
                      >
                        <div className="matrix-role-card__top">
                          <span className={`role-chip ${r.badgeClass}`}>{r.key}</span>
                          <span className="matrix-role-persona">Mẫu: {r.persona}</span>
                        </div>
                        <h4 className="matrix-role-title">{r.title}</h4>
                        <p className="matrix-role-desc">{r.description}</p>
                        <div className="matrix-role-action">
                          {isSelected ? "Đang lọc xem riêng ✓" : "Nhấn để xem riêng →"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedMatrixRole !== "ALL" && (
                  <div className="matrix-filter-banner">
                    <span>Đang làm nổi bật quyền hạn của: <strong>{ROLE_DEFINITIONS.find((r) => r.key === selectedMatrixRole)?.title}</strong></span>
                    <button
                      type="button"
                      className="btn-clear-matrix-filter"
                      onClick={() => setSelectedMatrixRole("ALL")}
                    >
                      ✕ Xem lại tất cả vai trò
                    </button>
                  </div>
                )}
              </div>

              {/* Bảng phân quyền theo 4 nhóm nghiệp vụ */}
              <div className="matrix-groups-wrapper">
                {PERMISSION_GROUPS.map((group, gIdx) => (
                  <div key={gIdx} className="matrix-group-section">
                    <div className="matrix-group-header">
                      <h3 className="matrix-group-title">{group.category}</h3>
                      <p className="matrix-group-desc">{group.description}</p>
                    </div>

                    <div className="matrix-table-responsive">
                      <table className="matrix-table">
                        <thead>
                          <tr>
                            <th style={{ width: "36%" }}>Chức năng & Mô tả thẩm quyền</th>
                            <th className={selectedMatrixRole === "CUSTOMER" ? "th--highlight" : ""}>
                              Khách thuê<br /><span className="th-sub">(Customer)</span>
                            </th>
                            <th className={selectedMatrixRole === "STAFF" ? "th--highlight" : ""}>
                              Nhân viên kho<br /><span className="th-sub">(Staff)</span>
                            </th>
                            <th className={selectedMatrixRole === "FACILITY_MANAGER" ? "th--highlight" : ""}>
                              Quản lý cơ sở<br /><span className="th-sub">(Facility Mgr)</span>
                            </th>
                            <th className={selectedMatrixRole === "BUSINESS_OPS" ? "th--highlight" : ""}>
                              Kinh doanh<br /><span className="th-sub">(Business Ops)</span>
                            </th>
                            <th className={selectedMatrixRole === "SYSTEM_ADMIN" ? "th--highlight" : ""}>
                              Quản trị HT<br /><span className="th-sub">(Sys Admin)</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.permissions.map((p) => (
                            <tr key={p.id}>
                              <td className="matrix-perm-info">
                                <div className="matrix-perm-name">{p.name}</div>
                                <div className="matrix-perm-desc">{p.desc}</div>
                              </td>

                              {/* Customer */}
                              <td className={`matrix-cell ${selectedMatrixRole === "CUSTOMER" ? "cell--highlight" : ""}`}>
                                {p.CUSTOMER ? (
                                  <span className="perm-badge perm-badge--allow">
                                    <Check size={14} weight="bold" /> Cho phép
                                  </span>
                                ) : (
                                  <span className="perm-badge perm-badge--deny">—</span>
                                )}
                              </td>

                              {/* Staff */}
                              <td className={`matrix-cell ${selectedMatrixRole === "STAFF" ? "cell--highlight" : ""}`}>
                                {p.STAFF ? (
                                  <span className="perm-badge perm-badge--allow">
                                    <Check size={14} weight="bold" /> Cho phép
                                  </span>
                                ) : (
                                  <span className="perm-badge perm-badge--deny">—</span>
                                )}
                              </td>

                              {/* Facility Manager */}
                              <td className={`matrix-cell ${selectedMatrixRole === "FACILITY_MANAGER" ? "cell--highlight" : ""}`}>
                                {p.FACILITY_MANAGER ? (
                                  <span className="perm-badge perm-badge--allow">
                                    <Check size={14} weight="bold" /> Cho phép
                                  </span>
                                ) : (
                                  <span className="perm-badge perm-badge--deny">—</span>
                                )}
                              </td>

                              {/* Business Ops */}
                              <td className={`matrix-cell ${selectedMatrixRole === "BUSINESS_OPS" ? "cell--highlight" : ""}`}>
                                {p.BUSINESS_OPS ? (
                                  <span className="perm-badge perm-badge--allow">
                                    <Check size={14} weight="bold" /> Cho phép
                                  </span>
                                ) : (
                                  <span className="perm-badge perm-badge--deny">—</span>
                                )}
                              </td>

                              {/* System Admin */}
                              <td className={`matrix-cell ${selectedMatrixRole === "SYSTEM_ADMIN" ? "cell--highlight" : ""}`}>
                                {p.SYSTEM_ADMIN ? (
                                  <span className="perm-badge perm-badge--admin">
                                    <Check size={14} weight="bold" /> Toàn quyền
                                  </span>
                                ) : (
                                  <span className="perm-badge perm-badge--deny">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Modal 1: Cấp tài khoản mới ── */}
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="CẤP TÀI KHOẢN MỚI CHO HỆ THỐNG"
          >
            {createdSuccessData ? (
              <div>
                <div style={{ color: "var(--color-status-success)", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={20} />
                  <span>Tài khoản đã được tạo thành công!</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--color-secondary)", marginBottom: "16px" }}>
                  Vui lòng sao chép thông tin đăng nhập dưới đây để bàn giao cho nhân sự. Mật khẩu tạm này sẽ yêu cầu đổi trong lần đăng nhập đầu tiên.
                </p>

                <div className="temp-password-box">
                  <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: 700 }}>MẬT KHẨU TẠM (CHỈ HIỂN THỊ MỘT LẦN):</div>
                  <div className="temp-password-val">{createdSuccessData.tempPassword}</div>
                  <div style={{ fontSize: "0.78rem", color: "#854d0e" }}>
                    Email: <strong>{createdSuccessData.user.email}</strong> | Vai trò: <strong>{createdSuccessData.user.role}</strong>
                  </div>
                </div>

                <div style={{ marginTop: "24px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => handleCopy(`Email: ${createdSuccessData.user.email}\nMật khẩu tạm: ${createdSuccessData.tempPassword}`)}
                  >
                    <Copy size={14} />
                    <span>{copied ? "Đã sao chép!" : "Sao chép thông tin"}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Xong
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="modal-form-grid">
                {createError && (
                  <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
                    {createError}
                  </div>
                )}
                <div className="form-field">
                  <label className="form-field__label">Họ và tên nhân sự / khách hàng *</label>
                  <input
                    type="text"
                    required
                    className="form-field__input"
                    placeholder="Nguyễn Văn A"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-field__label">Email đăng nhập *</label>
                  <input
                    type="email"
                    required
                    className="form-field__input"
                    placeholder="ten@demo.storagehub.vn"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-field__label">Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    required
                    className="form-field__input"
                    placeholder="0901234567"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-field__label">Vai trò hệ thống *</label>
                  <select
                    className="form-field__select"
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value)}
                  >
                    <option value="STAFF">Staff (Nhân viên kho)</option>
                    <option value="FACILITY_MANAGER">Facility Manager (Quản lý cơ sở)</option>
                    <option value="BUSINESS_OPS">Business Ops (Vận hành kinh doanh)</option>
                    <option value="SYSTEM_ADMIN">System Admin (Quản trị hệ thống)</option>
                    <option value="CUSTOMER">Customer (Khách thuê)</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button type="button" className="btn btn--outline" onClick={() => setShowCreateModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn--primary">
                    Tạo tài khoản & Cấp pass tạm
                  </button>
                </div>
              </form>
            )}
          </Modal>
        )}

        {/* ── Modal 2: Đổi vai trò ── */}
        {roleModalUser && (
          <Modal
            isOpen={!!roleModalUser}
            onClose={() => setRoleModalUser(null)}
            title="ĐỔI VAI TRÒ NGƯỜI DÙNG"
          >
            <form onSubmit={handleRoleSubmit} className="modal-form-grid">
              {roleError && (
                <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
                  {roleError}
                </div>
              )}
              <div>
                Đổi vai trò cho tài khoản: <strong>{roleModalUser.fullName}</strong> ({roleModalUser.email})
              </div>

              <div className="form-field">
                <label className="form-field__label">Vai trò mới *</label>
                <select
                  className="form-field__select"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="STAFF">Staff (Nhân viên kho)</option>
                  <option value="FACILITY_MANAGER">Facility Manager (Quản lý cơ sở)</option>
                  <option value="BUSINESS_OPS">Business Ops (Vận hành kinh doanh)</option>
                  <option value="SYSTEM_ADMIN">System Admin (Quản trị hệ thống)</option>
                  <option value="CUSTOMER">Customer (Khách thuê)</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-field__label">Lý do thay đổi (Bắt buộc kiểm toán) *</label>
                <textarea
                  required
                  rows={3}
                  className="form-field__textarea"
                  placeholder="Ghi rõ lý do điều chuyển hoặc phân quyền bổ sung..."
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button type="button" className="btn btn--outline" onClick={() => setRoleModalUser(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary">
                  Lưu & Ghi nhận kiểm toán
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Modal 3: Khóa / Mở khóa tài khoản ── */}
        {statusModalUser && (
          <Modal
            isOpen={!!statusModalUser}
            onClose={() => setStatusModalUser(null)}
            title={targetStatus === 2 ? "KHÓA TÀI KHOẢN NGƯỜI DÙNG" : "MỞ KHÓA TÀI KHOẢN"}
          >
            <form onSubmit={handleStatusSubmit} className="modal-form-grid">
              {statusError && (
                <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
                  {statusError}
                </div>
              )}
              <p style={{ fontSize: "0.85rem", color: "var(--color-secondary)", margin: 0 }}>
                {targetStatus === 2
                  ? `Bạn đang thực hiện khóa tài khoản của ${statusModalUser.fullName} (${statusModalUser.email}). Tài khoản này sẽ không thể đăng nhập vào hệ thống ngay lập tức.`
                  : `Bạn đang mở khóa tài khoản cho ${statusModalUser.fullName} (${statusModalUser.email}).`}
              </p>

              <div className="form-field">
                <label className="form-field__label">Lý do thay đổi trạng thái (Bắt buộc) *</label>
                <textarea
                  required
                  rows={3}
                  className="form-field__textarea"
                  placeholder="Nhân viên đã nghỉ việc / Yêu cầu bảo mật / Hết thời hạn kỷ luật..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button type="button" className="btn btn--outline" onClick={() => setStatusModalUser(null)}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className={targetStatus === 2 ? "btn btn--danger" : "btn btn--primary"}
                >
                  {targetStatus === 2 ? "Xác nhận khóa" : "Xác nhận mở khóa"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Modal 4: Reset Password ── */}
        {resetModalUser && (
          <Modal
            isOpen={!!resetModalUser}
            onClose={() => setResetModalUser(null)}
            title="CẤP LẠI MẬT KHẨU TẠM"
          >
            {resetSuccessPass ? (
              <div>
                <div style={{ color: "var(--color-status-success)", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={20} />
                  <span>Đã cấp mật khẩu tạm mới thành công!</span>
                </div>
                <div className="temp-password-box">
                  <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: 700 }}>MẬT KHẨU TẠM MỚI:</div>
                  <div className="temp-password-val">{resetSuccessPass}</div>
                </div>

                <div style={{ marginTop: "24px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => handleCopy(resetSuccessPass)}
                  >
                    <Copy size={14} />
                    <span>{copied ? "Đã sao chép!" : "Sao chép mật khẩu"}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setResetModalUser(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "0.85rem", color: "var(--color-secondary)" }}>
                  Bạn có chắc chắn muốn cấp lại mật khẩu tạm cho người dùng <strong>{resetModalUser.fullName}</strong> ({resetModalUser.email})? Mật khẩu cũ sẽ bị vô hiệu hóa ngay lập tức.
                </p>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                  <button type="button" className="btn btn--outline" onClick={() => setResetModalUser(null)}>
                    Hủy
                  </button>
                  <button type="button" className="btn btn--primary" onClick={handleConfirmReset}>
                    Cấp mật khẩu tạm mới
                  </button>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
