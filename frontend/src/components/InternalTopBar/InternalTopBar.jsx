import { useLocation } from "react-router";
import { List } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import NotificationBell from "../Header/NotificationBell.jsx";
import UserAvatarMenu from "../Header/UserAvatarMenu.jsx";
import "./InternalTopBar.css";

const ROUTE_BREADCRUMBS = {
  "/tasks": { section: "VẬN HÀNH", page: "Bảng công việc" },
  "/support": { section: "HỖ TRỢ", page: "Xử lý sự cố" },
  "/facility": { section: "CƠ SỞ", page: "Tổng quan kho" },
  "/facility/units": { section: "CƠ SỞ", page: "Danh mục kho" },
  "/facility/shifts": { section: "CƠ SỞ", page: "Lịch phân ca" },
  "/facility/activity": { section: "GIÁM SÁT", page: "Nhật ký hoạt động" },
  "/overview": { section: "KINH DOANH", page: "Tổng quan doanh số" },
  "/reports": { section: "KINH DOANH", page: "Báo cáo tài chính" },
  "/policy": { section: "QUY ĐỊNH", page: "Chính sách & Biểu phí" },
  "/legal-management": { section: "PHÁP LÝ", page: "Quản lý Điều khoản & Bảo mật" },
  "/users": { section: "QUẢN TRỊ", page: "Danh sách tài khoản" },
  "/login-history": { section: "QUẢN TRỊ", page: "Lịch sử đăng nhập" },
};

export default function InternalTopBar({ onToggleMobileSidebar = () => {} }) {
  const { user } = useAuth();
  const location = useLocation();

  // Tìm breadcrumb phù hợp theo tuyến đường
  const matchedRoute =
    ROUTE_BREADCRUMBS[location.pathname] || {
      section: "HỆ THỐNG",
      page: "Bảng điều khiển",
    };

  return (
    <header className="internal-topbar" aria-label="Thanh tiện ích nội bộ">
      <div className="internal-topbar__inner">
        {/* Bên trái: Nút Hamburger Mobile + Breadcrumb */}
        <div className="internal-topbar__left">
          <button
            type="button"
            className="internal-topbar__menu-btn"
            onClick={onToggleMobileSidebar}
            aria-label="Mở danh mục điều hướng"
          >
            <List size={20} weight="bold" />
          </button>

          <div className="internal-topbar__breadcrumb" aria-label="Đường dẫn trang">
            <span className="internal-topbar__section">{matchedRoute.section}</span>
            <span className="internal-topbar__separator">/</span>
            <span className="internal-topbar__current">{matchedRoute.page}</span>
          </div>
        </div>

        {/* Bên phải: Trạng thái chi nhánh, Chuông thông báo, Avatar profile */}
        <div className="internal-topbar__right">
          {/* Huy hiệu trạng thái cơ sở */}
          <div className="internal-topbar__facility-pill" title="Hệ thống vận hành trực tuyến">
            <span className="internal-topbar__pulse-dot" />
            <span className="internal-topbar__facility-name">Chi nhánh Quận 7</span>
            <span className="internal-topbar__facility-status">• Online</span>
          </div>

          <div className="internal-topbar__divider" />

          {/* Tiện ích thông báo dùng chung */}
          <NotificationBell />

          {/* Menu hồ sơ cá nhân dùng chung */}
          <UserAvatarMenu />
        </div>
      </div>
    </header>
  );
}
