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
  List,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService.js";
import {
  ROLE_BADGE_UPPER,
  getRoleLabel,
  translateBackendMessage,
} from "../../utils/statusLabels.js";
import { parseBackendDate } from "../../utils/formatters.js";
import "./Header.css";

function getShortDisplayName(fullName) {
  if (!fullName || typeof fullName !== "string") return "Quý khách";
  const trimmed = fullName.trim();
  if (!trimmed) return "Quý khách";
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] || "Quý khách";
}

const ROLE_CONFIGS = {
  CUSTOMER: {
    label: ROLE_BADGE_UPPER.CUSTOMER,
    landing: "/",
    links: [
      { label: "Khám phá kho", href: "/browse" },
      { label: "Kho của tôi", href: "/rentals" },
      { label: "Hỗ trợ", href: "/support" },
    ],
  },
  STAFF: {
    label: ROLE_BADGE_UPPER.STAFF,
    landing: "/tasks",
    links: [
      { label: "Bảng công việc", href: "/tasks" },
      { label: "Hỗ trợ sự cố", href: "/support" },
    ],
  },
  FACILITY_MANAGER: {
    label: ROLE_BADGE_UPPER.FACILITY_MANAGER,
    landing: "/facility",
    links: [
      { label: "Tổng quan", href: "/facility" },
      { label: "Danh mục kho", href: "/facility/units" },
      { label: "Lịch phân ca", href: "/facility/shifts" },
      { label: "Hỗ trợ sự cố", href: "/support" },
      { label: "Nhật ký", href: "/facility/activity" },
    ],
  },
  BUSINESS_OPS: {
    label: ROLE_BADGE_UPPER.BUSINESS_OPS,
    landing: "/overview",
    links: [
      { label: "Tổng quan", href: "/overview" },
      { label: "Chính sách & Biểu phí", href: "/policy" },
      { label: "Báo cáo tài chính", href: "/reports" },
    ],
  },
  SYSTEM_ADMIN: {
    label: ROLE_BADGE_UPPER.SYSTEM_ADMIN,
    landing: "/users",
    links: [
      { label: "Tài khoản", href: "/users" },
      { label: "Lịch sử đăng nhập", href: "/login-history" },
      { label: "Nhật ký hệ thống", href: "/facility/activity" },
      { label: "Chính sách & Biểu phí", href: "/policy" },
      { label: "Khám phá kho", href: "/browse" },
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
  const [showMobileNav, setShowMobileNav] = useState(false);
  const avatarMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const currentRole = user?.role || "CUSTOMER";
  const roleConfig = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.CUSTOMER;

  const resolvedHome =
    brandHref || (isAuthenticated && roleConfig.landing ? roleConfig.landing : "/");
  const resolvedRoleLabel =
    roleLabel !== undefined
      ? ROLE_BADGE_UPPER[roleLabel] || roleLabel
      : isAuthenticated
      ? roleConfig.label
      : ROLE_BADGE_UPPER.GUEST;

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
      : []);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifError, setNotifError] = useState(null);

  // Tự động đóng menu di động khi chuyển trang
  useEffect(() => {
    setShowMobileNav(false);
    setShowAvatarMenu(false);
    setShowNotificationMenu(false);
  }, [location.pathname]);

  // Poll unread count (chống gọi lặp qua module cache 12s)
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    async function fetchUnread() {
      try {
        const data = await getUnreadNotificationCount();
        if (isMounted && data) {
          setUnreadCount(Number(data.count || 0));
        }
      } catch (err) {
        console.warn("Poll unread notifications notice:", err?.message || err);
      }
    }

    fetchUnread();
    const interval = setInterval(() => fetchUnread(), 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Fetch notification list when dropdown opens
  useEffect(() => {
    if (!showNotificationMenu || !isAuthenticated) return;

    let isMounted = true;
    async function fetchList() {
      setLoadingNotifs(true);
      setNotifError(null);
      try {
        const data = await getNotifications({ page: 1, pageSize: 20 });
        if (isMounted) {
          setNotifications(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load notifications:", err);
          setNotifError(err?.message || "Không thể tải danh sách thông báo.");
        }
      } finally {
        if (isMounted) setLoadingNotifs(false);
      }
    }

    fetchList();
    return () => {
      isMounted = false;
    };
  }, [showNotificationMenu, isAuthenticated]);

  // Bấm vào 1 thông báo → đánh dấu đã đọc ngay (idempotent) + cập nhật badge
  const handleNotifClick = async (n) => {
    setShowNotificationMenu(false);
    if (n.isRead) return;
    // Optimistic: gỡ trạng thái chưa đọc trên UI trước, gọi API sau
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(n.id);
    } catch {
      await getUnreadNotificationCount({ force: true }).catch(() => {});
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Bỏ qua lỗi đánh dấu đã đọc
    }
  };

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
    setShowMobileNav(false);
    logout();
  };

  const computeIsLinkActive = (link) => {
    if (link.active !== undefined) return link.active;
    if (location.pathname === link.href) return true;
    if (link.href === "/") return false;
    const hasMoreSpecificSibling = resolvedNavLinks.some(
      (other) =>
        other.href !== link.href &&
        other.href.startsWith(link.href + "/") &&
        (location.pathname === other.href || location.pathname.startsWith(other.href + "/"))
    );
    if (hasMoreSpecificSibling) return false;
    return location.pathname.startsWith(link.href + "/");
  };

  return (
    <header className={`app-header ${className}`}>
      <div className="app-header__inner">
        <Link className="brand" to={resolvedHome} aria-label={`Trang chủ ${brandName}`}>
          <span className="brand__mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>{brandName}</span>
        </Link>

        {resolvedNavLinks && resolvedNavLinks.length > 0 ? (
          <nav className="main-nav" aria-label="Điều hướng chính">
            {resolvedNavLinks.map((link) => {
              const isActive = computeIsLinkActive(link);
              return (
                <Link
                  key={link.href + link.label}
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
          {isAuthenticated ? (
            <span className="header-greeting">
              <span className="header-greeting__prefix">Xin chào,</span>
              <strong className="header-greeting__name">
                {getShortDisplayName(user?.fullName)}
              </strong>
            </span>
          ) : null}
          {rightContent ? (
            rightContent
          ) : (
            <>
              {isAuthenticated && (
                <div className="header-notif-wrapper" ref={notifMenuRef}>
                  <button
                    type="button"
                    className={`header-tool-btn ${showNotificationMenu ? "is-active" : ""}`}
                    onClick={() => {
                      setShowNotificationMenu((prev) => !prev);
                      setShowAvatarMenu(false);
                      setShowMobileNav(false);
                    }}
                    aria-label="Thông báo"
                    aria-expanded={showNotificationMenu}
                  >
                    <Bell size={18} weight="bold" />
                    {unreadCount > 0 && (
                      <span className="header-notif-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotificationMenu && (
                    <div className="header-dropdown header-dropdown--notif">
                      <div className="header-dropdown__header">
                        <span className="header-dropdown__title">Thông báo</span>
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
                            {unreadCount > 0 ? `${unreadCount} mới` : "Đã xem hết"}
                          </span>
                        </div>
                      </div>
                      <div className="header-dropdown__list">
                        {loadingNotifs ? (
                          <div className="header-notif-item header-notif-item--empty">
                            <p className="header-notif-item__text">Đang tải thông báo...</p>
                          </div>
                        ) : notifError ? (
                          <div className="header-notif-item header-notif-item--empty header-notif-item--error">
                            <p className="header-notif-item__text" style={{ color: "var(--color-status-danger, #dc2626)" }}>
                              {notifError}
                            </p>
                            <button
                              type="button"
                              className="header-dropdown__mark-read-btn"
                              style={{ marginTop: 6 }}
                              onClick={() => {
                                setLoadingNotifs(true);
                                setNotifError(null);
                                getNotifications({ page: 1, pageSize: 20 })
                                  .then((d) => setNotifications(d?.items || []))
                                  .catch((e) => setNotifError(e?.message || "Lỗi khi tải lại."))
                                  .finally(() => setLoadingNotifs(false));
                              }}
                            >
                              Thử lại
                            </button>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="header-notif-item header-notif-item--empty">
                            <p className="header-notif-item__text">Chưa có thông báo nào.</p>
                          </div>
                        ) : (
                          notifications.map((n) => {
                            const displayTitle = translateBackendMessage(n.title || "");
                            return (
                              <div
                                key={n.id}
                                className={`header-notif-item ${!n.isRead ? "is-unread" : ""}`}
                              >
                                {n.type?.includes("CONFIRMED") ||
                                n.type?.includes("COMPLETED") ||
                                n.type?.includes("SIGNED") ? (
                                  <CheckCircle
                                    size={16}
                                    className="header-notif-item__icon--success"
                                    weight="fill"
                                  />
                                ) : n.type?.includes("EXPIRED") || n.type?.includes("FAILED") ? (
                                  <WarningCircle
                                    size={16}
                                    className="header-notif-item__icon--danger"
                                    weight="fill"
                                  />
                                ) : (
                                  <Info
                                    size={16}
                                    className="header-notif-item__icon--warning"
                                    weight="fill"
                                  />
                                )}
                                <div className="header-notif-item__content">
                                  {n.deepLink ? (
                                    <Link
                                      to={n.deepLink}
                                      className="header-notif-item__link"
                                      onClick={() => handleNotifClick(n)}
                                    >
                                      <p className="header-notif-item__text">{displayTitle}</p>
                                    </Link>
                                  ) : (
                                    <p
                                      className="header-notif-item__text"
                                      role="button"
                                      tabIndex={0}
                                      style={{ cursor: n.isRead ? "default" : "pointer" }}
                                      onClick={() => handleNotifClick(n)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleNotifClick(n);
                                      }}
                                    >
                                      {displayTitle}
                                    </p>
                                  )}
                                  <span className="header-notif-item__time">
                                    {n.createdAt
                                      ? parseBackendDate(n.createdAt).toLocaleString("vi-VN", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Vừa xong"}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isAuthenticated ? (
                <div className="header-avatar-wrapper" ref={avatarMenuRef}>
                  <button
                    type="button"
                    className="avatar-btn"
                    onClick={() => {
                      setShowAvatarMenu((prev) => !prev);
                      setShowNotificationMenu(false);
                      setShowMobileNav(false);
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
                        <span className="header-user-info__role">
                          {getRoleLabel(currentRole)}
                        </span>
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
                <div className="header-guest-actions">
                  <Link to="/register" className="header-register-btn">
                    Đăng ký
                  </Link>
                  <Link to="/login" className="header-login-btn">
                    Đăng nhập
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            className={`header-mobile-toggle ${showMobileNav ? "is-active" : ""}`}
            onClick={() => {
              setShowMobileNav((prev) => !prev);
              setShowAvatarMenu(false);
              setShowNotificationMenu(false);
            }}
            aria-label={showMobileNav ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            aria-expanded={showMobileNav}
          >
            {showMobileNav ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileNav && (
        <nav className="mobile-nav" aria-label="Menu điều hướng di động">
          <div className="mobile-nav__meta">
            <span className="mobile-nav__role">{resolvedRoleLabel}</span>
            {isAuthenticated && user?.fullName && (
              <span className="mobile-nav__user">{user.fullName}</span>
            )}
          </div>
          <div className="mobile-nav__links">
            {resolvedNavLinks.map((link) => {
              const isActive = computeIsLinkActive(link);
              return (
                <Link
                  key={`mobile-${link.href}-${link.label}`}
                  to={link.href}
                  className={`mobile-nav__link ${isActive ? "is-active" : ""}`}
                  onClick={() => setShowMobileNav(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="mobile-nav__footer">
            {isAuthenticated ? (
              <button
                type="button"
                className="mobile-nav__logout"
                onClick={handleLogout}
              >
                <SignOut size={16} weight="bold" />
                <span>Đăng xuất</span>
              </button>
            ) : (
              <div className="mobile-nav__auth-btns">
                <Link
                  to="/login"
                  className="mobile-nav__login"
                  onClick={() => setShowMobileNav(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="mobile-nav__register"
                  onClick={() => setShowMobileNav(false)}
                >
                  Đăng ký tài khoản
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
