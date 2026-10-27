import {
  TrendUp,
  Wrench,
  Warning,
} from "@phosphor-icons/react";

export default function FacilityKpiGrid({
  occupancyRate,
  statusStats,
  overview,
  onOpenDrilldown,
  onNavigateShifts,
}) {
  const trend = overview?.occupancy?.trend || "+1.4%";
  const unitsInService = overview?.unitsInService;
  const operationalUnits = unitsInService
    ? unitsInService.operationalUnits
    : statusStats.TOTAL - statusStats.RETIRED;
  const operationalRate = unitsInService
    ? unitsInService.operationalRate
    : (statusStats.TOTAL > 0 ? (((statusStats.TOTAL - statusStats.RETIRED) / statusStats.TOTAL) * 100).toFixed(1) : "0");
  const maintenanceCount = unitsInService
    ? unitsInService.maintenanceUnits
    : statusStats.MAINTENANCE;

  const tasksToday = overview?.tasksToday || {
    totalTasks: 8,
    completed: 3,
    inProgress: 2,
    pending: 3,
  };

  const escalations = overview?.escalations || {
    openCount: 1,
    highPriorityCount: 1,
    highlight: "Cửa cuốn bị kẹt tại Unit S-4",
  };

  return (
    <section className="facility-kpi-grid">
      {/* KPI 1: Occupancy */}
      <article
        className="kpi-card kpi-card--interactive"
        onClick={() => onOpenDrilldown("RENTED")}
        title="Nhấp để xem danh sách các phòng đang được thuê"
        tabIndex={0}
        role="button"
      >
        <div className="kpi-card__head">
          <span className="kpi-card__label">TỶ LỆ LẤP ĐẦY KHO</span>
          <span className="badge badge--success">
            <TrendUp size={12} weight="bold" /> {trend}
          </span>
        </div>
        <div className="kpi-card__main-metric">
          <span className="kpi-card__val">{occupancyRate}%</span>
          <span className="kpi-card__meta">
            {statusStats.RENTED} / {statusStats.TOTAL} kho đã thuê
          </span>
        </div>
        <div className="progress-bar-wrap">
          <div
            className="progress-bar-fill progress-bar-fill--primary"
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
        <div className="kpi-card__footer-hint">
          <span>Xem danh sách kho đang thuê →</span>
        </div>
      </article>

      {/* KPI 2: Units in Service */}
      <article
        className="kpi-card kpi-card--interactive"
        onClick={() => onOpenDrilldown("ALL")}
        title="Nhấp để xem toàn bộ danh mục kho vận hành (Drill-down)"
        tabIndex={0}
        role="button"
      >
        <div className="kpi-card__head">
          <span className="kpi-card__label">KHO ĐANG VẬN HÀNH</span>
          <span className="dot-pulse-green" />
        </div>
        <div className="kpi-card__main-metric">
          <span className="kpi-card__val">
            {operationalUnits} / {statusStats.TOTAL}
          </span>
          <span className="kpi-card__meta">{operationalRate}% sẵn sàng</span>
        </div>
        <div className="kpi-card__alert-line text-warning">
          <Wrench size={14} weight="bold" />
          <span>{maintenanceCount} kho đang bảo trì khóa / thiết bị</span>
        </div>
        <div className="kpi-card__footer-hint">
          <span>Xem danh mục toàn bộ kho →</span>
        </div>
      </article>

      {/* KPI 3: Turnover Tasks Today */}
      <article
        className="kpi-card kpi-card--interactive"
        onClick={onNavigateShifts}
        title="Nhấp để xem phân bổ ca trực và nhiệm vụ (Drill-down)"
        tabIndex={0}
        role="button"
      >
        <div className="kpi-card__head">
          <span className="kpi-card__label">NHIỆM VỤ CA TRỰC HÔM NAY</span>
          <span className="badge badge--primary">Tổng việc: {tasksToday.totalTasks}</span>
        </div>
        <div className="kpi-card__main-metric">
          <span className="kpi-card__val">{tasksToday.totalTasks}</span>
          <span className="kpi-card__meta">công việc vận hành</span>
        </div>
        <div className="kpi-card__breakdown">
          <span className="text-success">{tasksToday.completed} hoàn thành</span> ·{" "}
          <span className="text-info">{tasksToday.inProgress} đang làm</span> ·{" "}
          <span className="text-warning">{tasksToday.pending} chờ nhận</span>
        </div>
        <div className="kpi-card__footer-hint">
          <span>Điều phối bảng phân ca →</span>
        </div>
      </article>

      {/* KPI 4: Open Escalations */}
      <article
        className="kpi-card kpi-card--alert"
        onClick={() => onOpenDrilldown("MAINTENANCE")}
        title="Nhấp để xem chi tiết sự cố cần xử lý (Drill-down)"
        tabIndex={0}
        role="button"
      >
        <div className="kpi-card__head">
          <span className="kpi-card__label text-error">SỰ CỐ KHẨN CẤP</span>
          <span className="badge badge--danger">
            {escalations.highPriorityCount > 0 ? "Ưu tiên cao" : "Bình thường"}
          </span>
        </div>
        <div className="kpi-card__main-metric">
          <span className="kpi-card__val text-error">{escalations.openCount}</span>
          <span className="kpi-card__meta">cần quản lý can thiệp</span>
        </div>
        <div className="kpi-card__alert-line text-error">
          <Warning size={14} weight="fill" />
          <span>{escalations.highlight}</span>
        </div>
        <div className="kpi-card__footer-hint text-error">
          <span>Xem chi tiết kho bị sự cố →</span>
        </div>
      </article>
    </section>
  );
}
