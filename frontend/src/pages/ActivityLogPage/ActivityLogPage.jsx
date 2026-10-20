import { useState, useMemo } from "react";
import { useLocation, Link } from "react-router";
import {
  MagnifyingGlass,
  Funnel,
  ArrowRight,
  Database,
  ArrowLeft,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  getActivityLogs,
  ENTITY_TYPES,
  ROLE_LABELS,
  ACTION_BADGES,
  STATUS_LABELS,
} from "../../services/activityService.js";
import "./ActivityLogPage.css";

/**
 * Định dạng thời gian UTC sang chuỗi hiển thị chuẩn (font mono)
 */
function formatLogTimestamp(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  } catch {
    return isoString;
  }
}

export default function ActivityLogPage() {
  const location = useLocation();
  const isLoginHistory = location.pathname.includes("login-history");
  const [selectedEntity, setSelectedEntity] = useState(() => (isLoginHistory ? "USER" : "ALL"));
  const [searchTerm, setSearchTerm] = useState("");

  // Lấy dữ liệu logs theo bộ lọc
  const logs = useMemo(() => {
    return getActivityLogs({
      entityType: selectedEntity,
      searchTerm: searchTerm,
    });
  }, [selectedEntity, searchTerm]);

  // Thống kê nhanh
  const totalEntries = logs.length;
  const statusChangeCount = useMemo(
    () => logs.filter((l) => l.action.includes("STATUS") || l.action.includes("MAINTENANCE") || l.action.includes("RETIRE")).length,
    [logs]
  );
  const securityEventCount = useMemo(
    () => logs.filter((l) => l.action.includes("LOGIN") || l.action.includes("FAIL")).length,
    [logs]
  );

  return (
    <AppShell>
      <div className="activity-log-page">
        {/* Top Status Bar */}
        <div className="activity-telemetry">
          <div className="activity-telemetry__left">
            <span className="activity-telemetry__dot" />
            <span className="telemetry-bold">Cơ sở:</span>
            <span>Tân Bình Depot (VN-SGN-01)</span>
            <span className="telemetry-divider">|</span>
            <span>Chế độ:</span>
            <span>Nhật ký chỉ đọc (Toàn thời gian)</span>
          </div>
          <div className="activity-telemetry__right">
            <span>CẬP NHẬT TRỰC TIẾP</span>
          </div>
        </div>

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
          <div className="activity-stats">
            <div className="stat-card">
              <span className="stat-card__label">Tổng số bản ghi</span>
              <span className="stat-card__value">{totalEntries}</span>
              <span className="stat-card__desc">Toàn bộ log được lưu trữ</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Chuyển trạng thái</span>
              <span className="stat-card__value">{statusChangeCount}</span>
              <span className="stat-card__desc">Kho, hợp đồng và đặt chỗ</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Sự kiện bảo mật</span>
              <span className="stat-card__value">{securityEventCount}</span>
              <span className="stat-card__desc">Đăng nhập và xác thực</span>
            </div>
          </div>

          {/* Toolbar: Search input & Entity filter tabs */}
          <div className="activity-toolbar">
            <div className="activity-toolbar__row">
              <div className="activity-search-box">
                <MagnifyingGlass size={16} className="activity-search-box__icon" />
                <input
                  type="text"
                  className="activity-search-box__input"
                  placeholder="Lọc theo nhân sự, mã kho/hợp đồng, hành động hoặc lý do..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "var(--color-secondary)" }}>
                <Funnel size={14} />
                <span>Lọc thực thể:</span>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="activity-tabs">
              {Object.values(ENTITY_TYPES).map((entity) => {
                const isActive = selectedEntity === entity.key;
                return (
                  <button
                    key={entity.key}
                    type="button"
                    className={`activity-tab-btn ${isActive ? "activity-tab-btn--active" : ""}`}
                    onClick={() => setSelectedEntity(entity.key)}
                  >
                    {entity.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="activity-table-wrapper">
            {logs.length === 0 ? (
              <div className="activity-empty">
                <Database size={40} className="activity-empty__icon" />
                <div className="activity-empty__title">Không có bản ghi nhật ký</div>
                <div className="activity-empty__desc">
                  Không tìm thấy hoạt động nào phù hợp với bộ lọc hiện tại.
                </div>
              </div>
            ) : (
              <table className="activity-table">
                <thead>
                  <tr>
                    <th style={{ width: "135px" }}>Thời gian</th>
                    <th style={{ width: "150px" }}>Người thực hiện</th>
                    <th style={{ width: "175px" }}>Hạng mục kiểm toán</th>
                    <th style={{ width: "115px" }}>Hành động</th>
                    <th style={{ width: "185px" }}>Thay đổi trạng thái</th>
                    <th>Lý do / Diễn giải</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const actionInfo = ACTION_BADGES[log.action] || {
                      label: log.action,
                      class: "badge-action--status",
                    };
                    const entityInfo = ENTITY_TYPES[log.entityType];
                    const roleLabel = ROLE_LABELS[log.actorRole] || log.actorRole;
                    const fromLabel = STATUS_LABELS[log.fromValue] || log.fromValue;
                    const toLabel = STATUS_LABELS[log.toValue] || log.toValue;

                    return (
                      <tr key={log.id}>
                        {/* 1. Thời gian */}
                        <td className="td-time">{formatLogTimestamp(log.timestamp)}</td>

                        {/* 2. Người thực hiện & Vai trò */}
                        <td className="td-actor">
                          <div className="actor-name">{log.actor}</div>
                          {roleLabel && (
                            <span className={`actor-role-badge role-badge--${(log.actorRole || "").toLowerCase().replace(/_/g, '-')}`}>
                              {roleLabel}
                            </span>
                          )}
                        </td>

                        {/* 3. Hạng mục kiểm toán: [Loại] Mã số */}
                        <td className="td-item">
                          <div className="audit-item">
                            <span className={`audit-item__tag ${entityInfo?.badgeClass || ""}`}>
                              {entityInfo?.label || log.entityType}
                            </span>
                            <span className="audit-item__code">{log.entityCode || log.entityId}</span>
                          </div>
                        </td>

                        {/* 4. Hành động */}
                        <td className="td-action">
                          <span className={`action-badge ${actionInfo.class}`}>
                            {actionInfo.label}
                          </span>
                        </td>

                        {/* 6. Thay đổi trạng thái */}
                        <td className="td-transition">
                          {log.fromValue || log.toValue ? (
                            <div className="transition-flow">
                              <span className="transition-val">{fromLabel || "Khởi tạo"}</span>
                              <ArrowRight size={12} className="transition-arrow" />
                              <span className="transition-val transition-val--to">{toLabel || "—"}</span>
                            </div>
                          ) : (
                            <span className="td-empty-dash">—</span>
                          )}
                        </td>

                        {/* 7. Lý do / Diễn giải */}
                        <td className="td-reason">
                          {log.reason ? (
                            <span className="reason-text">{log.reason}</span>
                          ) : (
                            <span className="reason-empty">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
