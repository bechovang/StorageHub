import {
  CurrencyCircleDollar,
  Vault,
  Receipt,
  GridFour,
  TrendUp,
  ArrowRight,
} from "@phosphor-icons/react";
import { formatVND } from "../../../utils/formatters.js";

export function ReportsKpiGrid({ summary, onDrilldown }) {
  return (
    <section className="reports-kpi-grid" aria-label="Quarterly KPIs">
      {/* KPI 1: Gross Revenue */}
      <div
        className="reports-kpi-card reports-kpi-card--primary"
        role="button"
        tabIndex={0}
        onClick={() => onDrilldown("revenue")}
        onKeyDown={(e) => e.key === "Enter" && onDrilldown("revenue")}
        title="Nhấn để xem danh sách chứng từ doanh thu"
      >
        <div className="kpi-indicator kpi-indicator--primary" />
        <div className="reports-kpi-top">
          <span className="reports-kpi-title">Doanh thu kinh doanh</span>
          <CurrencyCircleDollar size={18} className="text-muted" />
        </div>
        <div className="reports-kpi-amount">{formatVND(summary.grossRevenue)}</div>
        <div className="reports-kpi-bottom">
          <span className="badge-growth badge-growth--positive">
            <TrendUp size={12} weight="bold" />
            {summary.revenueGrowth}
          </span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>

      {/* KPI 2: Deposits Held (Escrow) */}
      <div
        className="reports-kpi-card reports-kpi-card--deposits"
        role="button"
        tabIndex={0}
        onClick={() => onDrilldown("deposits")}
        onKeyDown={(e) => e.key === "Enter" && onDrilldown("deposits")}
        title="Nhấn để xem danh sách tài khoản tiền cọc ký quỹ"
      >
        <div className="kpi-indicator kpi-indicator--indigo" />
        <div className="reports-kpi-top">
          <span className="reports-kpi-title">Tiền cọc đang giữ</span>
          <Vault size={18} className="text-muted" />
        </div>
        <div className="reports-kpi-amount">{formatVND(summary.depositsHeld)}</div>
        <div className="reports-kpi-bottom">
          <span className="kpi-escrow-highlight" title="100% Escrow · Ký quỹ phong tỏa (Không tính vào doanh thu)">
            100% Escrow
          </span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>

      {/* KPI 3: Surcharges & Fees */}
      <div
        className="reports-kpi-card reports-kpi-card--surcharges"
        role="button"
        tabIndex={0}
        onClick={() => onDrilldown("surcharges")}
        onKeyDown={(e) => e.key === "Enter" && onDrilldown("surcharges")}
        title="Nhấn để xem chi tiết phụ thu phát sinh"
      >
        <div className="kpi-indicator kpi-indicator--amber" />
        <div className="reports-kpi-top">
          <span className="reports-kpi-title">Phụ thu phát sinh</span>
          <Receipt size={18} className="text-muted" />
        </div>
        <div className="reports-kpi-amount">{formatVND(summary.surcharges)}</div>
        <div className="reports-kpi-bottom">
          <span className="badge-growth badge-growth--positive">
            <TrendUp size={12} weight="bold" />
            {summary.surchargeGrowth}
          </span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>

      {/* KPI 4: Active Leased Units */}
      <div
        className="reports-kpi-card reports-kpi-card--occupancy"
        role="button"
        tabIndex={0}
        onClick={() => onDrilldown("occupancy")}
        onKeyDown={(e) => e.key === "Enter" && onDrilldown("occupancy")}
        title="Nhấn để xem danh sách unit đang cho thuê"
      >
        <div className="kpi-indicator kpi-indicator--green" />
        <div className="reports-kpi-top">
          <span className="reports-kpi-title">Tỷ lệ lấp đầy kho</span>
          <GridFour size={18} className="text-muted" />
        </div>
        <div className="reports-kpi-amount">
          {summary.occupiedUnits}{" "}
          <span className="text-sm font-normal text-muted">/ {summary.totalUnits} kho</span>
        </div>
        <div className="reports-kpi-bottom">
          <span className="badge-occupancy">{summary.occupancyRate}% công suất</span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>
    </section>
  );
}
