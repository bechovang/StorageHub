import {
  Users,
  DotsThreeVertical,
  UserSwitch,
  Key,
  Lock,
  LockOpen,
} from "@phosphor-icons/react";
import { USER_ROLES, USER_STATUSES } from "../../../services/userService.js";
import { getUserInitials } from "../utils.js";

export function UserTable({
  users,
  currentSessionUser,
  openMenuId,
  setOpenMenuId,
  dropdownRef,
  onOpenRoleModal,
  onOpenResetModal,
  onOpenStatusModal,
}) {
  return (
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
          {users.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <div className="empty-state">
                  <Users size={32} className="empty-state__icon" />
                  <div className="empty-state__title">Không tìm thấy tài khoản người dùng</div>
                  <div className="empty-state__desc">
                    Không có tài khoản nào khớp với vai trò, trạng thái hoặc từ khóa tìm kiếm hiện tại.
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            users.map((u, index) => {
              const targetId = u.id || u.userId;
              const roleConfig = USER_ROLES[u.role] || { label: u.role, badgeClass: "" };
              const statusConfig = Object.values(USER_STATUSES).find((s) => s.key === u.status) || USER_STATUSES.ACTIVE;
              const isSelf = (currentSessionUser?.id || currentSessionUser?.userId) === targetId;
              const isMenuOpen = openMenuId === targetId;
              const isNearBottom = index >= users.length - 2 && users.length > 3;

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
                            onClick={() => onOpenRoleModal(u)}
                          >
                            <UserSwitch size={14} />
                            <span>Đổi vai trò</span>
                          </button>

                          <button
                            type="button"
                            className="action-menu-item"
                            onClick={() => onOpenResetModal(u)}
                          >
                            <Key size={14} />
                            <span>Cấp lại mật khẩu tạm</span>
                          </button>

                          <div className="action-menu-divider" />

                          {u.status === 2 ? (
                            <button
                              type="button"
                              className="action-menu-item action-menu-item--unlock"
                              onClick={() => onOpenStatusModal(u, 1)}
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
                                onOpenStatusModal(u, 2);
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
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
