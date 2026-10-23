import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  Bell,
  SignOut,
  CaretDown,
  CheckCircle,
  WarningCircle,
  Info,
  Check,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "../../services/notificationService.js";
import "./Header.css";

const ROLE_CONFIGS = {
  CUSTOMER: {
    label: "CUSTOMER",
    landing: "/browse",
    links: [
      { label: "Tìm thuê kho", href: "/browse" },
      { label: "Kho của tôi", href: "/rentals" },
      { label: "Thanh toán", href: "/payment" },
      { label: "Hỗ trợ", href: "/support" },
    ],
  },
  STAFF: {
    label: "STAFF",
    landing: "/tasks",
    links: [
      { label: "Bảng công việc", href: "/tasks" },
      { label: "Hỗ trợ sự cố", href: "/support" },
    ],
  },
  FACILITY_MANAGER: {
    label: "FACILITY MANAGER",
    landing: "/facility",
    links: [
      { label: "Tổng quan", href: "/facility" },
      { label: "Quản lý kho", href: "/facility/units" },
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
      { label: "Quản lý người dùng", href: "/users" },
      { label: "Lịch sử đăng nhập", href: "/login-history" },
      { label: "Nhật ký hệ thống", href: "/facility/activity" },
      { label: "Chính sách & Giá", href: "/policy" },
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
        ]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Poll unread count (FR-33)
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    async function fetchUnread() {
      try {
        const data = await getUnreadNotificationCount();
        if (isMounted && data) {
          setUnreadCount(Number(data.count || 0));
        }
      } catch {
        // Fallback im lặng khi chưa có dữ liệu
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // 15s poll nhẹ
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Fetch notification list when dropdown opens (FR-34)
  useEffect(() => {
    if (!showNotificationMenu || !isAuthenticated) return;

    let isMounted = true;
    async function fetchList() {
      setLoadingNotifs(true);
      try {
        const data = await getNotifications({ page: 1, pageSize: 20 });
        if (isMounted && data?.items) {
          setNotifications(data.items);
        }
      } catch (err) {
        console.warn("Could not load notifications:", err);
      } finally {
        if (isMounted) setLoadingNotifs(false);
      }
    }

    fetchList();
    return () => {
      isMounted = false;
    };
  }, [showNotificationMenu, isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
    }
  };

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
                    {unreadCount > 0 && (
                      <span className="header-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                    )}
                  </button>

                  {showNotificationMenu && (
                    <div className="header-dropdown header-dropdown--notif">
                      <div className="header-dropdown__header">
                        <span className="header-dropdown__title">Thông báo hệ thống</span>
                        <div className="header-dropdown__actions">
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              className="header-dropdown__mark-read-btn"
                              onClick={handleMarkAllRead}
                              title="Đánh dấu đã đọc tất cả"
                            >
                              <Check size={12} weight="bold" />
                              Đã đọc
                            </button>
                          )}
                          <span className="header-dropdown__tag">
                            {unreadCount > 0 ? `${unreadCount} mới` : "Tất cả đã đọc"}
                          </span>
                        </div>
                      </div>
                      <div className="header-dropdown__list">
                        {loadingNotifs ? (
                          <div className="header-notif-item header-notif-item--empty">
                            <p className="header-notif-item__text">Đang tải thông báo...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="header-notif-item header-notif-item--empty">
                            <p className="header-notif-item__text">Chưa có thông báo nào.</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`header-notif-item ${!n.isRead ? "is-unread" : ""}`}
                            >
                              {n.type?.includes("CONFIRMED") || n.type?.includes("COMPLETED") || n.type?.includes("SIGNED") ? (
                                <CheckCircle size={16} className="header-notif-item__icon--success" weight="fill" />
                              ) : n.type?.includes("EXPIRED") || n.type?.includes("FAILED") ? (
                                <WarningCircle size={16} className="header-notif-item__icon--danger" weight="fill" />
                              ) : (
                                <Info size={16} className="header-notif-item__icon--warning" weight="fill" />
                              )}
                              <div className="header-notif-item__content">
                                {n.deepLink ? (
                                  <Link
                                    to={n.deepLink}
                                    className="header-notif-item__link"
                                    onClick={() => setShowNotificationMenu(false)}
                                  >
                                    <p className="header-notif-item__text">{n.title}</p>
                                  </Link>
                                ) : (
                                  <p className="header-notif-item__text">{n.title}</p>
                                )}
                                <span className="header-notif-item__time">
                                  {n.createdAt ? new Date(n.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Vừa xong"}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
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
