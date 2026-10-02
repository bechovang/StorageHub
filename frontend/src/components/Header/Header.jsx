import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  Bell,
  SignOut,
  User as UserIcon,
  CaretDown,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Header.css";

const ROLE_CONFIGS = {
  CUSTOMER: {
    label: "CUSTOMER",
    landing: "/browse",
    links: [
      { label: "Browse Units", href: "/browse" },
      { label: "My Rentals", href: "/rentals" },
      { label: "Thanh toán", href: "/payment" },
    ],
  },
  STAFF: {
    label: "STAFF",
    landing: "/tasks",
    links: [
      { label: "Task Board", href: "/tasks" },
      { label: "Hỗ trợ sự cố", href: "/support" },
    ],
  },
  FACILITY_MANAGER: {
    label: "FACILITY MANAGER",
    landing: "/facility",
    links: [
      { label: "Tổng quan", href: "/facility" },
      { label: "Quản lý Unit", href: "/facility/units" },
      { label: "Ca trực", href: "/facility/shifts" },
      { label: "Nhật ký", href: "/facility/activity" },
    ],
  },
  BUSINESS_OPS: {
    label: "BUSINESS OPS",
    landing: "/overview",
    links: [
      { label: "Tổng quan", href: "/overview" },
      { label: "Chính sách & Giá", href: "/policy" },
      { label: "Báo cáo", href: "/reports" },
    ],
  },
  SYSTEM_ADMIN: {
    label: "SYSTEM ADMIN",
    landing: "/users",
    links: [
      { label: "Quản lý Users", href: "/users" },
      { label: "Lịch sử đăng nhập", href: "/login-history" },
    ],
  },
};

export default function Header({
  brandName = "STORAGEHUB",
  brandHref,
  roleLabel,
  avatarText,
  navLinks,
  rightContent = null,
  className = "",
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const avatarMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const currentRole = user?.role || "CUSTOMER";
  const roleConfig = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.CUSTOMER;

  const resolvedHome = brandHref || roleConfig.landing;
  const resolvedRoleLabel =
    roleLabel !== undefined
      ? roleLabel
      : isAuthenticated
      ? roleConfig.label
      : "GUEST";

  const resolvedAvatarText =
    avatarText ||
    (user?.fullName
      ? user.fullName
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(-2)
          .toUpperCase()
      : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : "SH");

  const resolvedNavLinks =
    navLinks ||
    (isAuthenticated
      ? roleConfig.links
      : [
          { label: "Khám phá kho", href: "/browse" },
          { label: "Bảng giá & Demo", href: "/demo" },
        ]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setShowAvatarMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotificationMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowAvatarMenu(false);
    logout();
  };

  return (
    <header className={`app-header ${className}`}>
      <div className="app-header__inner">
        <Link className="brand" to={resolvedHome} aria-label={`${brandName} home`}>
          <span className="brand__mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>{brandName}</span>
        </Link>

        {resolvedNavLinks && resolvedNavLinks.length > 0 ? (
          <nav className="main-nav" aria-label="Main navigation">
            {resolvedNavLinks.map((link) => {
              const isActive =
                link.active !== undefined
                  ? link.active
                  : location.pathname === link.href ||
                    (link.href !== "/" && location.pathname.startsWith(link.href + "/"));
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`main-nav__link ${isActive ? "is-active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <div />
        )}

        <div className="account-tools">
          {resolvedRoleLabel && (
            <span className="role-label role-label--adaptive">
              {resolvedRoleLabel}
            </span>
          )}
          {rightContent ? (
            rightContent
          ) : (
            <>
              {/* Bell Notifications */}
              {isAuthenticated && (
                <div className="header-notif-wrapper" ref={notifMenuRef}>
                  <button
                    type="button"
                    className={`header-tool-btn ${showNotificationMenu ? "is-active" : ""}`}
                    onClick={() => {
                      setShowNotificationMenu((prev) => !prev);
                      setShowAvatarMenu(false);
                    }}
                    aria-label="Thông báo"
                    aria-expanded={showNotificationMenu}
                  >
                    <Bell size={18} weight="bold" />
                    <span className="header-notif-badge">2</span>
                  </button>

                  {showNotificationMenu && (
                    <div className="header-dropdown header-dropdown--notif">
                      <div className="header-dropdown__header">
                        <span className="header-dropdown__title">Thông báo hệ thống</span>
                        <span className="header-dropdown__tag">2 mới</span>
                      </div>
                      <div className="header-dropdown__list">
                        <div className="header-notif-item">
                          <CheckCircle size={16} className="header-notif-item__icon--success" weight="fill" />
                          <div className="header-notif-item__content">
                            <p className="header-notif-item__text">
                              Cổng thanh toán Card / MoMo / VNPay QR sẵn sàng.
                            </p>
                            <span className="header-notif-item__time">Vừa xong</span>
                          </div>
                        </div>
                        <div className="header-notif-item">
                          <WarningCircle size={16} className="header-notif-item__icon--warning" weight="fill" />
                          <div className="header-notif-item__content">
                            <p className="header-notif-item__text">
                              Đơn đặt chỗ RSV-1 tại kho Tân Bình đang chờ thanh toán cọc.
                            </p>
                            <span className="header-notif-item__time">5 phút trước</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Avatar & User Dropdown */}
              {isAuthenticated ? (
                <div className="header-avatar-wrapper" ref={avatarMenuRef}>
                  <button
                    type="button"
                    className="avatar-btn"
                    onClick={() => {
                      setShowAvatarMenu((prev) => !prev);
                      setShowNotificationMenu(false);
                    }}
                    aria-label="Tài khoản cá nhân"
                    aria-expanded={showAvatarMenu}
                  >
                    <span className="avatar">{resolvedAvatarText}</span>
                    <CaretDown
                      size={12}
                      weight="bold"
                      className={`avatar-btn__caret ${showAvatarMenu ? "is-open" : ""}`}
                    />
                  </button>

                  {showAvatarMenu && (
                    <div className="header-dropdown header-dropdown--avatar">
                      <div className="header-user-info">
                        <p className="header-user-info__name">
                          {user?.fullName || "Người dùng StorageHub"}
                        </p>
                        <p className="header-user-info__email">{user?.email || ""}</p>
                        <span className="header-user-info__role">{currentRole}</span>
                      </div>
                      <div className="header-dropdown__divider" />
                      <Link
                        to={roleConfig.landing}
                        className="header-dropdown__item"
                        onClick={() => setShowAvatarMenu(false)}
                      >
                        <UserIcon size={16} />
                        <span>Trang chủ vai trò</span>
                      </Link>
                      <button
                        type="button"
                        className="header-dropdown__item header-dropdown__item--danger"
                        onClick={handleLogout}
                      >
                        <SignOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="header-login-btn">
                  Đăng nhập
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
