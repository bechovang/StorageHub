import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";
import InternalSidebar from "../Sidebar/InternalSidebar.jsx";
import InternalTopBar from "../InternalTopBar/InternalTopBar.jsx";
import "./AppShell.css";

const INTERNAL_ROLES = [
  "STAFF",
  "FACILITY_MANAGER",
  "BUSINESS_OPS",
  "SYSTEM_ADMIN",
];

const INTERNAL_PATH_PREFIXES = [
  "/tasks",
  "/facility",
  "/overview",
  "/policy",
  "/legal-management",
  "/reports",
  "/users",
  "/login-history",
];

/**
 * Adaptive App Shell duy nhất cho toàn bộ hệ thống StorageHub:
 * - Trang nội bộ (STAFF, FACILITY_MANAGER, BUSINESS_OPS, SYSTEM_ADMIN):
 *   Hiển thị Left Sidebar (Collapsible Rail 64px - 240px) + Slim Utility Topbar (54px)
 * - Trang khách hàng & Public (Browse, Rentals, Payment, Terms...):
 *   Hiển thị Top Header ngang truyền thống (66px) + Footer nếu có
 */
export default function AppShell({
  children,
  brandHref,
  navLinks,
  roleLabel,
  showFooter = false,
  layout = "auto", // "auto" | "internal" | "public"
}) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Đóng drawer di động khi chuyển route
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const currentRole = user?.role || "CUSTOMER";
  const isInternalRole = isAuthenticated && INTERNAL_ROLES.includes(currentRole);

  const isInternalPath =
    INTERNAL_PATH_PREFIXES.some(
      (prefix) =>
        location.pathname === prefix || location.pathname.startsWith(prefix + "/")
    ) ||
    (isInternalRole && location.pathname === "/support");

  const shouldUseInternalLayout =
    layout === "internal" || (layout === "auto" && isInternalRole && isInternalPath);

  if (shouldUseInternalLayout) {
    return (
      <div className="internal-app-shell">
        <InternalSidebar
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <div className="internal-app-shell__body">
          <InternalTopBar
            onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          />
          <main className="internal-app-shell__main">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header brandHref={brandHref} navLinks={navLinks} roleLabel={roleLabel} />
      <main className="app-shell__main">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
