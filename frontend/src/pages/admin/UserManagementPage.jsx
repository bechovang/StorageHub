import {
  Users,
  UserPlus,
  MagnifyingGlass,
  Check,
  Table,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { USER_ROLES } from "../../services/userService.js";
import {
  useUserManagement,
  UserTable,
  PermissionMatrixView,
  CreateUserModal,
  RoleChangeModal,
  UserStatusModal,
  ResetPasswordModal,
} from "../../features/users/index.js";
import "./UserManagementPage.css";

export default function UserManagementPage() {
  const {
    currentSessionUser,
    activeTab,
    setActiveTab,
    selectedRole,
    setSelectedRole,
    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm,
    selectedMatrixRole,
    setSelectedMatrixRole,
    openMenuId,
    setOpenMenuId,
    dropdownRef,
    users,
    filteredUsers,
    showCreateModal,
    setShowCreateModal,
    createName,
    setCreateName,
    createEmail,
    setCreateEmail,
    createPhone,
    setCreatePhone,
    createRole,
    setCreateRole,
    createError,
    createdSuccessData,
    roleModalUser,
    setRoleModalUser,
    targetRole,
    setTargetRole,
    roleReason,
    setRoleReason,
    roleError,
    isSubmittingRole,
    statusModalUser,
    setStatusModalUser,
    targetStatus,
    statusReason,
    setStatusReason,
    statusError,
    resetModalUser,
    setResetModalUser,
    resetSuccessPass,
    toastMessage,
    copied,
    handleCopy,
    openCreateModal,
    openRoleModal,
    openStatusModal,
    openResetModal,
    handleCreateSubmit,
    handleRoleSubmit,
    handleStatusSubmit,
    handleConfirmReset,
  } = useUserManagement();

  return (
    <AppShell>
      <div className="user-mgmt-page">
        

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
                onClick={openCreateModal}
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
              <UserTable
                users={filteredUsers}
                currentSessionUser={currentSessionUser}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                dropdownRef={dropdownRef}
                onOpenRoleModal={openRoleModal}
                onOpenResetModal={openResetModal}
                onOpenStatusModal={openStatusModal}
              />
            </>
          ) : (
            <PermissionMatrixView
              selectedMatrixRole={selectedMatrixRole}
              setSelectedMatrixRole={setSelectedMatrixRole}
            />
          )}
        </div>

        {/* ── Modal 1: Cấp tài khoản mới ── */}
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSubmit}
          createdSuccessData={createdSuccessData}
          createName={createName}
          setCreateName={setCreateName}
          createEmail={createEmail}
          setCreateEmail={setCreateEmail}
          createPhone={createPhone}
          setCreatePhone={setCreatePhone}
          createRole={createRole}
          setCreateRole={setCreateRole}
          createError={createError}
          copied={copied}
          onCopy={handleCopy}
        />

        {/* ── Modal 2: Đổi vai trò ── */}
        <RoleChangeModal
          user={roleModalUser}
          onClose={() => setRoleModalUser(null)}
          onSubmit={handleRoleSubmit}
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          roleReason={roleReason}
          setRoleReason={setRoleReason}
          roleError={roleError}
          isSubmitting={isSubmittingRole}
        />

        {/* ── Modal 3: Khóa / Mở khóa tài khoản ── */}
        <UserStatusModal
          user={statusModalUser}
          targetStatus={targetStatus}
          onClose={() => setStatusModalUser(null)}
          onSubmit={handleStatusSubmit}
          statusReason={statusReason}
          setStatusReason={setStatusReason}
          statusError={statusError}
        />

        {/* ── Modal 4: Reset Password ── */}
        <ResetPasswordModal
          user={resetModalUser}
          onClose={() => setResetModalUser(null)}
          onConfirmReset={handleConfirmReset}
          resetSuccessPass={resetSuccessPass}
          copied={copied}
          onCopy={handleCopy}
        />

        {/* ── Toast notification nổi ── */}
        {toastMessage && (
          <div className="toast-banner toast-banner--success" role="status">
            <Check size={18} weight="bold" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </AppShell>
  );
}
