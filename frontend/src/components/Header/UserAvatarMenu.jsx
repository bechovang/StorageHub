import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { CaretDown, FileText, ShieldCheck, SignOut } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRoleLabel } from "../../utils/statusLabels.js";

export default function UserAvatarMenu({ className = "", avatarText = null }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarMenuRef = useRef(null);

  const currentRole = user?.role || "CUSTOMER";

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

  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setShowAvatarMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowAvatarMenu(false);
    logout();
  };

  if (!isAuthenticated) return null;

  return (
    <div className={`header-avatar-wrapper ${className}`} ref={avatarMenuRef}>
      <button
        type="button"
        className="avatar-btn"
        onClick={() => setShowAvatarMenu((prev) => !prev)}
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
          <Link
            to="/terms"
            className="header-dropdown__item"
            onClick={() => setShowAvatarMenu(false)}
          >
            <FileText size={16} />
            <span>Điều khoản Dịch vụ</span>
          </Link>
          <Link
            to="/privacy"
            className="header-dropdown__item"
            onClick={() => setShowAvatarMenu(false)}
          >
            <ShieldCheck size={16} />
            <span>Chính sách Bảo mật</span>
          </Link>
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
  );
}
