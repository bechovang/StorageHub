import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { List, X, SignOut } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLE_BADGE_UPPER } from "../../utils/statusLabels.js";
import NotificationBell from "./NotificationBell.jsx";
import UserAvatarMenu from "./UserAvatarMenu.jsx";
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
      { label: "Điều khoản & Pháp lý", href: "/legal-management" },
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
      { label: "Điều khoản & Pháp lý", href: "/legal-management" },
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

  const [showMobileNav, setShowMobileNav] = useState(false);

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

  const resolvedNavLinks =
    navLinks ||
    (isAuthenticated
      ? roleConfig.links
      : []);

  // Tự động đóng menu di động khi chuyển trang
  useEffect(() => {
    setShowMobileNav(false);
  }, [location.pathname]);

  const handleLogout = () => {
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
              {isAuthenticated && <NotificationBell />}

              {isAuthenticated ? (
                <UserAvatarMenu avatarText={avatarText} />
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
            onClick={() => setShowMobileNav((prev) => !prev)}
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
