import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  Bell,
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
  markNotificationRead,
} from "../../services/notificationService.js";
import { translateBackendMessage } from "../../utils/statusLabels.js";
import { parseBackendDate } from "../../utils/formatters.js";

export default function NotificationBell({ className = "" }) {
  const { isAuthenticated } = useAuth();
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const notifMenuRef = useRef(null);

  // Poll unread count (chống gọi lặp qua module cache)
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

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotificationMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotifClick = async (n) => {
    setShowNotificationMenu(false);
    if (n.isRead) return;
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

  if (!isAuthenticated) return null;

  return (
    <div className={`header-notif-wrapper ${className}`} ref={notifMenuRef}>
      <button
        type="button"
        className={`header-tool-btn ${showNotificationMenu ? "is-active" : ""}`}
        onClick={() => setShowNotificationMenu((prev) => !prev)}
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
                <p
                  className="header-notif-item__text"
                  style={{ color: "var(--color-status-danger, #dc2626)" }}
                >
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
  );
}
