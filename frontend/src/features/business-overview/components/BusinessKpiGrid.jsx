import { ArrowRight } from "@phosphor-icons/react";
import { formatVND } from "../../../utils/formatters.js";

export default function BusinessKpiGrid({
  summary,
  onSelectDrilldown,
}) {
  return (
    <section className="biz-kpi-grid" aria-label="Business Key Performance Indicators">
      {/* Card 1: Revenue (Q3) */}
      <div
        className="biz-kpi-card biz-kpi-card--revenue"
        role="button"
        tabIndex={0}
        onClick={() => onSelectDrilldown("revenue")}
        onKeyDown={(e) => e.key === "Enter" && onSelectDrilldown("revenue")}
        title="Nhấn để xem bảng chi tiết doanh thu từng hợp đồng"
      >
        <div className="kpi-indicator kpi-indicator--green" />
        <div className="biz-kpi-header">
          <span className="kpi-label">Doanh thu kinh doanh</span>
          <span className="kpi-badge kpi-badge--green">{summary.revenueGrowth}</span>
        </div>
        <div className="biz-kpi-value">{formatVND(summary.grossRevenue)}</div>
        <div className="biz-kpi-footer">
          <span className="biz-kpi-footer-text">Thuê cơ bản: {formatVND(summary.baseRentCollected)}</span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>

      {/* Card 2: Deposits Held (Escrow Vaulted) */}
      <div
        className="biz-kpi-card biz-kpi-card--deposits"
        role="button"
        tabIndex={0}
        onClick={() => onSelectDrilldown("deposits")}
        onKeyDown={(e) => e.key === "Enter" && onSelectDrilldown("deposits")}
        title="Nhấn để xem bảng chi tiết tiền cọc đang phong tỏa trong tài khoản Escrow"
      >
        <div className="kpi-indicator kpi-indicator--indigo" />
        <div className="biz-kpi-header">
          <span className="kpi-label">Tiền cọc đang giữ</span>
          <span className="kpi-badge kpi-badge--indigo">Ký quỹ an toàn</span>
        </div>
        <div className="biz-kpi-value">{formatVND(summary.depositsHeld)}</div>
        <div className="biz-kpi-footer">
          <span className="kpi-escrow-highlight" title="Ký quỹ phong tỏa · Không tính vào doanh thu">
            100% Escrow
          </span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>

      {/* Card 3: Surcharges & Fees */}
      <div
        className="biz-kpi-card biz-kpi-card--surcharges"
        role="button"
        tabIndex={0}
        onClick={() => onSelectDrilldown("surcharges")}
        onKeyDown={(e) => e.key === "Enter" && onSelectDrilldown("surcharges")}
        title="Nhấn để xem chi tiết từng khoản phụ thu phát sinh"
      >
        <div className="kpi-indicator kpi-indicator--blue" />
        <div className="biz-kpi-header">
          <span className="kpi-label">Phụ thu & Phí dịch vụ</span>
          <span className="kpi-badge kpi-badge--blue">{summary.surchargeGrowth}</span>
        </div>
        <div className="biz-kpi-value">{formatVND(summary.surcharges)}</div>
        <div className="biz-kpi-footer">
          <span className="biz-kpi-footer-text">Phí quá hạn & Dịch vụ phát sinh</span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>

      {/* Card 4: Utilization / Occupancy */}
      <div
        className="biz-kpi-card biz-kpi-card--utilization"
        role="button"
        tabIndex={0}
        onClick={() => onSelectDrilldown("occupancy")}
        onKeyDown={(e) => e.key === "Enter" && onSelectDrilldown("occupancy")}
        title="Nhấn để xem danh sách 37 kho đang cho thuê"
      >
        <div className="kpi-indicator kpi-indicator--amber" />
        <div className="biz-kpi-header">
          <span className="kpi-label">Tỷ lệ lấp đầy kho</span>
          <span className="kpi-badge kpi-badge--amber">{summary.occupancyStatus}</span>
        </div>
        <div className="biz-kpi-value">
          {summary.occupancyRate}%{" "}
          <span className="text-muted font-normal text-sm">
            ({summary.occupiedUnits}/{summary.totalUnits})
          </span>
        </div>
        <div className="biz-kpi-footer">
          <span className="biz-kpi-footer-text">{summary.occupiedUnits} / {summary.totalUnits} kho đang thuê</span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>
    </section>
  );
}
