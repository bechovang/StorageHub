import { useLocation, Link } from "react-router";
import { ArrowLeft } from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  useActivityLogs,
  ActivityTelemetry,
  ActivityStatsGrid,
  ActivityLogTable,
} from "../../features/activity/index.js";
import "./ActivityLogPage.css";

export default function ActivityLogPage() {
  const location = useLocation();
  const isLoginHistory = location.pathname.includes("login-history");

  const {
    selectedEntity,
    setSelectedEntity,
    searchTerm,
    setSearchTerm,
    logs,
    totalEntries,
    statusChangeCount,
    securityEventCount,
  } = useActivityLogs({ isLoginHistory });

  return (
    <AppShell>
      <div className="activity-log-page">
        {/* Top Status Bar */}
        <ActivityTelemetry />

        <div className="activity-container">
          {/* Subbar navigation */}
          <div className="mgmt-subbar">
            <Link to={isLoginHistory ? "/users" : "/facility"} className="mgmt-back-link">
              <ArrowLeft size={14} weight="bold" />
              <span>{isLoginHistory ? "Quản lý người dùng" : "Tổng quan cơ sở"}</span>
            </Link>
            <span className="mgmt-subbar__sep">/</span>
            <span className="mgmt-subbar__current">
              {isLoginHistory ? "Lịch sử đăng nhập" : "Nhật ký kiểm toán"}
            </span>
          </div>

          {/* Header section */}
          <header className="activity-header">
            <span className="activity-header__super">
              {isLoginHistory
                ? "QUẢN TRỊ HỆ THỐNG · LỊCH SỬ ĐĂNG NHẬP & BẢO MẬT"
                : "QUẢN TRỊ CƠ SỞ · BẢO MẬT & KIỂM TOÁN"}
            </span>
            <h1 className="activity-header__title">
              {isLoginHistory
                ? "LỊCH SỬ ĐĂNG NHẬP & BẢO MẬT TÀI KHOẢN"
                : "NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG"}
            </h1>
            <p className="activity-header__desc">
              {isLoginHistory
                ? "Ghi nhận toàn bộ biến động tài khoản người dùng, các lượt đăng nhập và sự kiện xác thực bảo mật."
                : "Ghi nhận toàn bộ biến động trạng thái kho, hợp đồng thuê, đặt chỗ và các sự kiện bảo mật tại cơ sở."}
            </p>
          </header>

          {/* Quick stats cards */}
          <ActivityStatsGrid
            totalEntries={totalEntries}
            statusChangeCount={statusChangeCount}
            securityEventCount={securityEventCount}
          />

          {/* Toolbar & Activity Logs Table */}
          <ActivityLogTable
            logs={logs}
            selectedEntity={selectedEntity}
            onSelectEntity={setSelectedEntity}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      </div>
    </AppShell>
  );
}
