import {
  TrendUp,
  Wrench,
  Warning,
} from "@phosphor-icons/react";

export default function FacilityKpiGrid({
  occupancyRate,
  statusStats,
  onOpenDrilldown,
  onNavigateShifts,
}) {
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
            <TrendUp size={12} weight="bold" /> +1.4%
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
            {statusStats.TOTAL - statusStats.RETIRED} / {statusStats.TOTAL}
          </span>
          <span className="kpi-card__meta">93.8% sẵn sàng</span>
        </div>
        <div className="kpi-card__alert-line text-warning">
          <Wrench size={14} weight="bold" />
          <span>{statusStats.MAINTENANCE} kho đang bảo trì khóa (Unit M-4)</span>
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
          <span className="badge badge--primary">Mục tiêu ca: 8</span>
        </div>
        <div className="kpi-card__main-metric">
          <span className="kpi-card__val">8</span>
          <span className="kpi-card__meta">ca đang phụ trách</span>
        </div>
        <div className="kpi-card__breakdown">
          <span className="text-success">3 hoàn thành</span> ·{" "}
          <span className="text-info">2 đang làm</span> ·{" "}
          <span className="text-warning">3 chờ nhận</span>
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
          <span className="badge badge--danger">Ưu tiên cao</span>
        </div>
        <div className="kpi-card__main-metric">
          <span className="kpi-card__val text-error">1</span>
          <span className="kpi-card__meta">cần quản lý can thiệp</span>
        </div>
        <div className="kpi-card__alert-line text-error">
          <Warning size={14} weight="fill" />
          <span className="font-mono font-bold">SR-0032:</span>
          <span>Cửa cuốn bị kẹt tại Unit S-4</span>
        </div>
        <div className="kpi-card__footer-hint text-error">
          <span>Xem chi tiết kho bị sự cố →</span>
        </div>
      </article>
    </section>
  );
}
