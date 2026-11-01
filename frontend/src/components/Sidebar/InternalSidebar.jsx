import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  Kanban,
  Lifebuoy,
  Buildings,
  Package,
  CalendarCheck,
  ClockCounterClockwise,
  ChartPieSlice,
  ChartLineUp,
  FileText,
  ShieldCheck,
  UsersThree,
  Key,
  ArrowSquareOut,
  CaretLeft,
  CaretRight,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRoleLabel } from "../../utils/statusLabels.js";
import "./InternalSidebar.css";

const SIDEBAR_NAV_BY_ROLE = {
  STAFF: [
    {
      groupTitle: "VẬN HÀNH",
      items: [
        { label: "Bảng công việc", href: "/tasks", icon: Kanban },
        { label: "Hỗ trợ sự cố", href: "/support", icon: Lifebuoy },
      ],
    },
  ],
  FACILITY_MANAGER: [
    {
      groupTitle: "CƠ SỞ & VẬN HÀNH",
      items: [
        { label: "Tổng quan cơ sở", href: "/facility", icon: Buildings },
        { label: "Danh mục kho", href: "/facility/units", icon: Package },
        { label: "Lịch phân ca", href: "/facility/shifts", icon: CalendarCheck },
      ],
    },
    {
      groupTitle: "GIÁM SÁT & HỖ TRỢ",
      items: [
        { label: "Hỗ trợ sự cố", href: "/support", icon: Lifebuoy },
        { label: "Nhật ký hoạt động", href: "/facility/activity", icon: ClockCounterClockwise },
      ],
    },
  ],
  BUSINESS_OPS: [
    {
      groupTitle: "KINH DOANH & PHÂN TÍCH",
      items: [
        { label: "Tổng quan kinh doanh", href: "/overview", icon: ChartPieSlice },
        { label: "Báo cáo tài chính", href: "/reports", icon: ChartLineUp },
      ],
    },
    {
      groupTitle: "CHÍNH SÁCH & PHÁP LÝ",
      items: [
        { label: "Chính sách & Biểu phí", href: "/policy", icon: FileText },
        { label: "Điều khoản & Pháp lý", href: "/legal-management", icon: ShieldCheck },
      ],
    },
  ],
  SYSTEM_ADMIN: [
    {
      groupTitle: "HỆ THỐNG & TÀI KHOẢN",
      items: [
        { label: "Quản lý người dùng", href: "/users", icon: UsersThree },
        { label: "Lịch sử đăng nhập", href: "/login-history", icon: Key },
        { label: "Nhật ký hệ thống", href: "/facility/activity", icon: ClockCounterClockwise },
      ],
    },
    {
      groupTitle: "CẤU HÌNH DOANH NGHIỆP",
      items: [
        { label: "Chính sách & Biểu phí", href: "/policy", icon: FileText },
        { label: "Điều khoản & Pháp lý", href: "/legal-management", icon: ShieldCheck },
      ],
    },
    {
      groupTitle: "CHẾ ĐỘ XEM",
      items: [
        { label: "Trang khách hàng", href: "/browse", icon: ArrowSquareOut },
      ],
    },
  ],
};

export default function InternalSidebar({
  isOpenMobile = false,
  onCloseMobile = () => {},
}) {
  const { user } = useAuth();
  const location = useLocation();

  // Đọc trạng thái co giãn từ localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("storagehub_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("storagehub_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const currentRole = user?.role || "STAFF";
  const navGroups = SIDEBAR_NAV_BY_ROLE[currentRole] || SIDEBAR_NAV_BY_ROLE.STAFF;

  // Thu gọn so khớp đường dẫn active chính xác
  const isLinkActive = (href) => {
    if (location.pathname === href) return true;
    if (href === "/" || href === "/facility" || href === "/overview") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Backdrop trên màn hình di động khi mở Drawer */}
      <div
        className={`internal-sidebar-backdrop ${isOpenMobile ? "is-visible" : ""}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`internal-sidebar ${isCollapsed ? "is-collapsed" : ""} ${
          isOpenMobile ? "is-open-mobile" : ""
        }`}
        aria-label="Thanh điều hướng nội bộ"
      >
        {/* Header của Sidebar: Logo & Nút đóng Mobile */}
        <div className="internal-sidebar__header">
          <Link
            to={
              currentRole === "FACILITY_MANAGER"
                ? "/facility"
                : currentRole === "BUSINESS_OPS"
                ? "/overview"
                : currentRole === "SYSTEM_ADMIN"
                ? "/users"
                : "/tasks"
            }
            className="internal-sidebar__brand"
            title="StorageHub Nội Bộ"
          >
            <span className="internal-sidebar__mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {!isCollapsed && (
              <div className="internal-sidebar__brand-text">
                <span className="internal-sidebar__title">STORAGEHUB</span>
                <span className="internal-sidebar__badge">
                  {getRoleLabel(currentRole)}
                </span>
              </div>
            )}
          </Link>

          {/* Nút đóng trên mobile */}
          <button
            type="button"
            className="internal-sidebar__close-btn"
            onClick={onCloseMobile}
            aria-label="Đóng bảng điều hướng"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Nội dung danh sách điều hướng theo phân nhóm */}
        <nav className="internal-sidebar__nav">
          {navGroups.map((group, groupIdx) => (
            <div key={group.groupTitle || groupIdx} className="internal-sidebar__group">
              {/* Tiêu đề nhóm */}
              {!isCollapsed ? (
                <div className="internal-sidebar__group-title">
                  {group.groupTitle}
                </div>
              ) : (
                <div className="internal-sidebar__group-divider" />
              )}

              {/* Danh sách mục trong nhóm */}
              <ul className="internal-sidebar__list">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <li key={item.href} className="internal-sidebar__item">
                      <Link
                        to={item.href}
                        className={`internal-sidebar__link ${active ? "is-active" : ""}`}
                        onClick={onCloseMobile}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <span className="internal-sidebar__icon-wrap">
                          <Icon
                            size={19}
                            weight={active ? "bold" : "regular"}
                            className="internal-sidebar__icon"
                          />
                        </span>
                        {!isCollapsed && (
                          <span className="internal-sidebar__label">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Chân Sidebar: Nút co giãn Rail Desktop */}
        <div className="internal-sidebar__footer">
          <button
            type="button"
            className="internal-sidebar__collapse-btn"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            title={isCollapsed ? "Mở rộng (240px)" : "Thu gọn (64px)"}
          >
            {isCollapsed ? (
              <CaretRight size={18} weight="bold" />
            ) : (
              <>
                <CaretLeft size={18} weight="bold" />
                <span className="internal-sidebar__collapse-text">Thu gọn thanh bên</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
