import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  CurrencyCircleDollar,
  Vault,
  Receipt,
  GridFour,
  TrendUp,
  DownloadSimple,
  Calendar,
  CheckCircle,
  MagnifyingGlass,
  ArrowRight,
  ShieldCheck,
  X,
  Warehouse,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Drawer from "../../components/Drawer/Drawer.jsx";
import { formatVND } from "../../utils/formatters.js";
import {
  ZONE_PERFORMANCE,
  getFinancialSummary,
  getDrilldownItems,
  exportFinancialAuditCSV,
} from "../../services/reportService.js";
import "./ReportsPage.css";

export default function ReportsPage() {
  // 4 Tab báo cáo cốt lõi (US-31)
  const [activeTab, setActiveTab] = useState("REVENUE"); // REVENUE | DEPOSITS | SURCHARGES | OCCUPANCY
  // Kỳ báo cáo (Có sẵn hoặc Tự chọn khoảng ngày)
  const [selectedPeriod, setSelectedPeriod] = useState("THIS_QUARTER");
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
  const [customRange, setCustomRange] = useState({
    startDate: "2026-07-01",
    endDate: "2026-09-30",
  });

  // State Drill-down Drawer khi click vào 4 KPI hoặc "Xem chi tiết"
  const [activeDrilldownKey, setActiveDrilldownKey] = useState(null);
  const [drilldownSearch, setDrilldownSearch] = useState("");

  // Dữ liệu tổng hợp theo kỳ được chọn
  const summary = useMemo(() => {
    return getFinancialSummary(selectedPeriod, customRange);
  }, [selectedPeriod, customRange]);

  // Dữ liệu Drill-down
  const drilldownData = useMemo(() => {
    if (!activeDrilldownKey) return null;
    return getDrilldownItems(activeDrilldownKey);
  }, [activeDrilldownKey]);

  // Lọc dòng trong drilldown
  const filteredDrilldownRows = useMemo(() => {
    if (!drilldownData || !drilldownData.rows) return [];
    if (!drilldownSearch.trim()) return drilldownData.rows;
    const q = drilldownSearch.toLowerCase();
    return drilldownData.rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    );
  }, [drilldownData, drilldownSearch]);

  const handleExportCSV = () => {
    exportFinancialAuditCSV(summary.periodLabel);
  };

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    setSelectedPeriod("CUSTOM");
    setShowCustomRangeModal(false);
  };

  return (
    <AppShell brandHref="/overview" roleLabel="BUSINESS OPS">
      <div className="reports-page">
        {/* ── 1. Telemetry Context Strip ── */}
        <aside className="reports-telemetry">
          <div className="reports-telemetry__inner">
            <div className="reports-telemetry__left">
              <div className="telemetry-item">
                <Warehouse size={15} weight="duotone" className="text-muted" />
                <span className="telemetry-bold">Facility VN-SGN-01</span>
                <span className="text-muted">(Tân Bình Gateway)</span>
              </div>
              <span className="telemetry-divider">|</span>
              <div className="telemetry-item">
                <span className="dot-pulse-green" />
                <span className="text-success font-medium">Dữ liệu vận hành & sổ cái: Đã đồng bộ</span>
              </div>
            </div>
            <div className="reports-telemetry__right">
              <span className="tabular-clock">MÚI GIỜ: TP. HỒ CHÍ MINH (UTC+07)</span>
            </div>
          </div>
        </aside>

        {/* ── Sub Navigation Links for Business Ops ── */}
        <nav className="reports-subnav">
          <div className="reports-subnav__inner">
            <Link to="/overview" className="reports-subnav__link">
              Tổng quan
            </Link>
            <Link to="/policy" className="reports-subnav__link">
              Chính sách & Biểu giá
            </Link>
            <Link to="/reports" className="reports-subnav__link reports-subnav__link--active">
              Báo cáo tài chính
            </Link>
          </div>
        </nav>

        {/* ── 2. Main Canvas ── */}
        <main className="reports-canvas">
          {/* Page Header & Period Controls */}
          <section className="reports-header">
            <div>
              <div className="reports-breadcrumb">
                <span>StorageHub VN</span>
                <span>/</span>
                <span>Quản lý kinh doanh</span>
                <span>/</span>
                <span className="reports-breadcrumb__active">Báo cáo tài chính & Đối soát</span>
              </div>
              <h1 className="reports-title">Báo cáo tài chính & Vận hành</h1>
              <p className="reports-subtitle">
                Tổng hợp doanh thu, đối chiếu sổ cái và theo dõi quỹ tiền cọc.
              </p>
            </div>

            {/* Period Selector Toolbar (US-31: Chọn kỳ có sẵn hoặc tự chọn khoảng ngày) */}
            <div className="reports-period-toolbar">
              <div className="period-chips-group">
                <button
                  type="button"
                  className={`period-chip ${selectedPeriod === "THIS_MONTH" ? "period-chip--active" : ""}`}
                  onClick={() => setSelectedPeriod("THIS_MONTH")}
                >
                  Tháng này
                </button>
                <button
                  type="button"
                  className={`period-chip ${selectedPeriod === "LAST_MONTH" ? "period-chip--active" : ""}`}
                  onClick={() => setSelectedPeriod("LAST_MONTH")}
                >
                  Tháng trước
                </button>
                <button
                  type="button"
                  className={`period-chip ${selectedPeriod === "THIS_QUARTER" ? "period-chip--active" : ""}`}
                  onClick={() => setSelectedPeriod("THIS_QUARTER")}
                >
                  Quý này
                </button>
                <button
                  type="button"
                  className={`period-chip ${selectedPeriod === "YTD" ? "period-chip--active" : ""}`}
                  onClick={() => setSelectedPeriod("YTD")}
                >
                  YTD 2026
                </button>
              </div>

              {/* Button mở modal tự chọn khoảng ngày */}
              <button
                type="button"
                className={`btn-custom-range ${selectedPeriod === "CUSTOM" ? "btn-custom-range--active" : ""}`}
                onClick={() => setShowCustomRangeModal(true)}
              >
                <Calendar size={15} weight="bold" />
                <span>
                  {selectedPeriod === "CUSTOM"
                    ? `${customRange.startDate} → ${customRange.endDate}`
                    : "+ Khoảng ngày tùy chọn"}
                </span>
              </button>

              <button
                type="button"
                className="reports-btn reports-btn--primary"
                onClick={handleExportCSV}
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Xuất CSV</span>
              </button>
            </div>
          </section>

          {/* Current Period Label Strip */}
          <div className="period-status-strip">
            <span className="period-span-text">
              Kỳ đang chọn: <strong>{summary.periodLabel}</strong>
            </span>
            <span className="badge-comparison">So với kỳ trước (+6.4%)</span>
          </div>

          {/* ── 3. Four Domain Navigation Sub-Tabs (US-31: Có 4 tab báo cáo) ── */}
          <div className="domain-tabs-bar">
            <button
              type="button"
              className={`domain-tab ${activeTab === "REVENUE" ? "domain-tab--active" : ""}`}
              onClick={() => setActiveTab("REVENUE")}
            >
              <CurrencyCircleDollar size={18} weight={activeTab === "REVENUE" ? "bold" : "regular"} />
              <span>Doanh thu theo kỳ</span>
              {activeTab === "REVENUE" && <span className="tab-pill">Đang xem</span>}
            </button>
            <button
              type="button"
              className={`domain-tab ${activeTab === "DEPOSITS" ? "domain-tab--active" : ""}`}
              onClick={() => setActiveTab("DEPOSITS")}
            >
              <Vault size={18} weight={activeTab === "DEPOSITS" ? "bold" : "regular"} />
              <span>Tiền cọc & Ký quỹ</span>
              {activeTab === "DEPOSITS" && <span className="tab-pill">Đang xem</span>}
            </button>
            <button
              type="button"
              className={`domain-tab ${activeTab === "SURCHARGES" ? "domain-tab--active" : ""}`}
              onClick={() => setActiveTab("SURCHARGES")}
            >
              <Receipt size={18} weight={activeTab === "SURCHARGES" ? "bold" : "regular"} />
              <span>Phụ thu & Phí dịch vụ</span>
              {activeTab === "SURCHARGES" && <span className="tab-pill">Đang xem</span>}
            </button>
            <button
              type="button"
              className={`domain-tab ${activeTab === "OCCUPANCY" ? "domain-tab--active" : ""}`}
              onClick={() => setActiveTab("OCCUPANCY")}
            >
              <GridFour size={18} weight={activeTab === "OCCUPANCY" ? "bold" : "regular"} />
              <span>Công suất & Zone</span>
              {activeTab === "OCCUPANCY" && <span className="tab-pill">Đang xem</span>}
            </button>
          </div>

          {/* ── 4. Four Summary KPI Cards (Clickable Drill-down, Deposit strictly NOT in revenue) ── */}
          <section className="reports-kpi-grid" aria-label="Quarterly KPIs">
            {/* KPI 1: Gross Revenue */}
            <div
              className="reports-kpi-card reports-kpi-card--primary"
              role="button"
              tabIndex={0}
              onClick={() => setActiveDrilldownKey("revenue")}
              onKeyDown={(e) => e.key === "Enter" && setActiveDrilldownKey("revenue")}
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
              onClick={() => setActiveDrilldownKey("deposits")}
              onKeyDown={(e) => e.key === "Enter" && setActiveDrilldownKey("deposits")}
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
              onClick={() => setActiveDrilldownKey("surcharges")}
              onKeyDown={(e) => e.key === "Enter" && setActiveDrilldownKey("surcharges")}
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
              onClick={() => setActiveDrilldownKey("occupancy")}
              onKeyDown={(e) => e.key === "Enter" && setActiveDrilldownKey("occupancy")}
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

          {/* ── 5. Dynamic Tab Content Based on Active Domain Tab ── */}

          {/* TAB 1: REVENUE (Doanh thu theo kỳ) */}
          {activeTab === "REVENUE" && (
            <div className="tab-pane space-y-6">
              {/* Bento Grid: Chart & Settlement Status */}
              <div className="bento-grid">
                {/* SVG Revenue Curve Chart (8 Cols) */}
                <div className="bento-chart-card">
                  <div className="bento-chart-header">
                    <div>
                      <div className="bento-title-cluster">
                        <h2 className="bento-title">Biểu đồ đối soát doanh thu</h2>
                        <span className="badge-audited">Đã kiểm toán</span>
                      </div>
                      <p className="bento-subtitle">
                        Phân tích chi tiết tiền thuê cơ bản, tiền cọc ký quỹ và phụ thu phát sinh
                      </p>
                    </div>
                    <div className="bento-legend">
                      <div className="legend-item">
                        <span className="legend-indicator legend-indicator--primary" />
                        <span>Tiền thuê kho</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-indicator legend-indicator--deposit" />
                        <span>Tiền cọc (Ký quỹ)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-indicator legend-indicator--surcharge" />
                        <span>Phụ thu</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="svg-chart-container">
                    <div className="svg-y-labels">
                      <span>15M ₫</span>
                      <span>12M ₫</span>
                      <span>9M ₫</span>
                      <span>6M ₫</span>
                      <span>3M ₫</span>
                      <span>0 ₫</span>
                    </div>
                    <div className="svg-chart-plot">
                      <svg className="svg-curves" viewBox="0 0 600 220" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area */}
                        <path d="M 60,58 L 300,66 L 540,75 L 540,220 L 60,220 Z" fill="url(#primaryAreaGrad)" />
                        {/* Gross Rent Line */}
                        <path d="M 60,58 C 180,62 180,62 300,66 C 420,70 420,70 540,75" fill="none" stroke="#DC2626" strokeWidth="2.5" />
                        {/* Deposits Line (Dashed) */}
                        <path d="M 60,193 C 180,193 180,193 300,193 C 420,193 420,198 540,201" fill="none" stroke="#0284C7" strokeDasharray="4,4" strokeWidth="2" />
                        {/* Surcharges Line */}
                        <path d="M 60,213 C 180,212 180,212 300,212 C 420,212 420,214 540,215" fill="none" stroke="#F59E0B" strokeWidth="2" />

                        {/* Jul Data Points */}
                        <circle cx="60" cy="58" r="4" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2" />
                        <circle cx="60" cy="193" r="3" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
                        <circle cx="60" cy="213" r="3" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />

                        {/* Aug Data Points */}
                        <circle cx="300" cy="66" r="4" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2" />
                        <circle cx="300" cy="193" r="3" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
                        <circle cx="300" cy="212" r="3" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />

                        {/* Sep Data Points */}
                        <circle cx="540" cy="75" r="5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2.5" />
                        <circle cx="540" cy="201" r="4" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
                        <circle cx="540" cy="215" r="4" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                      </svg>

                      {/* Month X Labels */}
                      <div className="svg-x-labels">
                        <span>Tháng 7/2026</span>
                        <span>Tháng 8/2026</span>
                        <span className="text-primary font-bold">Tháng 9/2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settlement Gateway & VAS Compliance (4 Cols) */}
                <div className="bento-side-column">
                  <div className="side-card">
                    <div className="side-card-header">
                      <span className="side-card-title">Cổng thanh toán & Đối soát</span>
                      <span className="badge-sync">
                        <span className="dot-pulse-green" /> Đã đồng bộ
                      </span>
                    </div>
                    <div className="side-card-body">
                      <div className="side-metric-row">
                        <span className="side-metric-label">VietQR / NAPAS</span>
                        <span className="side-metric-val">92.4% (34.60M ₫)</span>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: "92.4%" }} />
                      </div>
                      <div className="side-metric-row side-metric-row--sub">
                        <span className="side-metric-label">Chuyển khoản trực tiếp</span>
                        <span className="side-metric-val">7.6% (2.85M ₫)</span>
                      </div>
                    </div>
                    <div className="side-card-footer">
                      <span className="side-card-footer-label">Lần quét tự động gần nhất:</span>
                      <span className="side-card-footer-val">23:59:58 UTC+7</span>
                    </div>
                  </div>

                  <div className="side-card">
                    <div className="side-card-header">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-primary" weight="duotone" />
                        <span className="side-card-title">Tuân thủ kiểm toán VN VAS</span>
                      </div>
                      <span className="compliance-badge">
                        <CheckCircle size={13} weight="fill" /> 100% VAT
                      </span>
                    </div>
                    <div className="side-card-body">
                      <p className="side-card-desc">
                        Toàn bộ hóa đơn điện tử được ký số VNPT-CA và đồng bộ trực tiếp lên hệ thống Tổng cục Thuế.
                      </p>
                    </div>
                    <div className="side-card-footer-action">
                      <button
                        type="button"
                        className="btn-cert-download"
                        onClick={handleExportCSV}
                      >
                        <DownloadSimple size={14} weight="bold" />
                        <span>Tải chứng thư kiểm toán (CSV)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Ledger Summary Table */}
              <div className="reports-table-card">
                <div className="reports-table-header">
                  <div>
                    <h2 className="reports-table-title">Sổ cái tổng hợp theo tháng (Monthly Ledger)</h2>
                    <p className="reports-table-subtitle">
                      Đối soát tài chính từng tháng đã được chốt sổ kiểm toán
                    </p>
                  </div>
                  <button
                    type="button"
                    className="reports-btn reports-btn--secondary reports-btn--sm"
                    onClick={handleExportCSV}
                  >
                    <DownloadSimple size={14} weight="bold" />
                    <span>Xuất CSV</span>
                  </button>
                </div>

                <div className="reports-table-responsive">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Tháng</th>
                        <th className="text-right">Tiền thuê</th>
                        <th className="text-right">Cọc giữ (Escrow)</th>
                        <th className="text-right">Phụ thu</th>
                        <th className="text-right">Tổng thực thu</th>
                        <th className="text-center">Trạng thái</th>
                        <th className="text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className="period-cell">
                            <span className="dot-period-active" />
                            <span className="font-semibold text-ink">Tháng 9/2026</span>
                            <span className="period-tag-closed">(Chốt sổ)</span>
                          </div>
                        </td>
                        <td className="text-right font-mono text-secondary">9.860.000 ₫</td>
                        <td className="text-right font-mono text-secondary">1.240.000 ₫</td>
                        <td className="text-right font-mono text-secondary">310.000 ₫</td>
                        <td className="text-right font-mono font-bold text-ink">11.410.000 ₫</td>
                        <td className="text-center">
                          <span className="badge-reconciled">
                            <CheckCircle size={12} weight="fill" /> Đã đối soát
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="reports-btn-breakdown"
                            onClick={() => setActiveDrilldownKey("revenue")}
                          >
                            Xem chi tiết →
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="period-cell">
                            <span className="dot-period-past" />
                            <span className="font-semibold text-ink">Tháng 8/2026</span>
                          </div>
                        </td>
                        <td className="text-right font-mono text-secondary">10.450.000 ₫</td>
                        <td className="text-right font-mono text-secondary">1.820.000 ₫</td>
                        <td className="text-right font-mono text-secondary">480.000 ₫</td>
                        <td className="text-right font-mono font-bold text-ink">12.750.000 ₫</td>
                        <td className="text-center">
                          <span className="badge-reconciled">
                            <CheckCircle size={12} weight="fill" /> Đã đối soát
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="reports-btn-breakdown"
                            onClick={() => setActiveDrilldownKey("revenue")}
                          >
                            Xem chi tiết →
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="period-cell">
                            <span className="dot-period-past" />
                            <span className="font-semibold text-ink">Tháng 7/2026</span>
                          </div>
                        </td>
                        <td className="text-right font-mono text-secondary">11.010.000 ₫</td>
                        <td className="text-right font-mono text-secondary">1.830.000 ₫</td>
                        <td className="text-right font-mono text-secondary">450.000 ₫</td>
                        <td className="text-right font-mono font-bold text-ink">13.290.000 ₫</td>
                        <td className="text-center">
                          <span className="badge-reconciled">
                            <CheckCircle size={12} weight="fill" /> Đã đối soát
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="reports-btn-breakdown"
                            onClick={() => setActiveDrilldownKey("revenue")}
                          >
                            Xem chi tiết →
                          </button>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="tfoot-summary">
                        <td className="font-bold">Tổng cộng Q3 2026</td>
                        <td className="text-right font-mono font-bold">31.320.000 ₫</td>
                        <td className="text-right font-mono font-bold text-secondary">4.890.000 ₫</td>
                        <td className="text-right font-mono font-bold text-secondary">1.240.000 ₫</td>
                        <td className="text-right font-mono font-bold text-primary text-base">37.450.000 ₫</td>
                        <td className="text-center text-xs text-muted">Đã kiểm toán & khóa sổ</td>
                        <td className="text-right text-xs text-muted">3/3 tháng chốt</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEPOSITS & ESCROW (Tiền cọc & Ký quỹ) */}
          {activeTab === "DEPOSITS" && (
            <div className="tab-pane space-y-6">
              <div className="drilldown-warning-banner">
                <ShieldCheck size={20} weight="duotone" className="text-primary flex-shrink-0" />
                <div>
                  <strong>Nguyên tắc Kế toán StorageHub:</strong> Tiền cọc (Security Deposits) được quản lý trong tài khoản Escrow phong tỏa,
                  tuyệt đối <strong>KHÔNG</strong> tính gộp vào doanh thu kinh doanh. Tiền cọc chỉ được giải phóng hoặc cấn trừ hư hại khi có biên bản tất toán hợp đồng (Checkout Task).
                </div>
              </div>

              <div className="reports-table-card">
                <div className="reports-table-header">
                  <div>
                    <h2 className="reports-table-title">Danh bạ quỹ tiền cọc (Escrow Deposit Vault)</h2>
                    <p className="reports-table-subtitle">
                      Chi tiết 8 khoản cọc bảo lãnh đang được phong tỏa bảo đảm tài sản kho
                    </p>
                  </div>
                  <button
                    type="button"
                    className="reports-btn reports-btn--secondary reports-btn--sm"
                    onClick={() => setActiveDrilldownKey("deposits")}
                  >
                    Xem toàn màn hình →
                  </button>
                </div>

                <div className="reports-table-responsive">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Mã cọc</th>
                        <th>Hợp đồng</th>
                        <th>Khách hàng</th>
                        <th>Kho</th>
                        <th className="text-right">Số tiền cọc</th>
                        <th>Mã Escrow</th>
                        <th>Trạng thái</th>
                        <th>Dự kiến hoàn trả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDrilldownItems("deposits").rows.map((row) => (
                        <tr key={row.id}>
                          <td className="font-mono font-semibold text-ink">{row.id}</td>
                          <td className="font-mono text-secondary">{row.contractRef}</td>
                          <td className="font-medium text-ink">{row.tenant}</td>
                          <td>
                            <span className="badge-unit">{row.unitCode}</span>
                          </td>
                          <td className="text-right font-mono font-bold text-ink">
                            {formatVND(row.depositAmount)}
                          </td>
                          <td className="font-mono text-xs text-muted">{row.escrowRef}</td>
                          <td>
                            <span className={`badge-vault ${row.vaultStatus === "ESCROW_LOCKED" ? "badge-vault--locked" : "badge-vault--pending"}`}>
                              {row.vaultStatus === "ESCROW_LOCKED" ? "Đã khóa Escrow" : "Chờ tất toán"}
                            </span>
                          </td>
                          <td className="text-secondary">{row.expectedRelease}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SURCHARGES (Phụ thu & Phí dịch vụ) */}
          {activeTab === "SURCHARGES" && (
            <div className="tab-pane space-y-6">
              <div className="reports-table-card">
                <div className="reports-table-header">
                  <div>
                    <h2 className="reports-table-title">Sổ theo dõi phụ thu phát sinh (Surcharge Ledger)</h2>
                    <p className="reports-table-subtitle">
                      Các khoản phí quá giờ, xử lý vệ sinh và bồi hoàn hao mòn cơ sở vật chất
                    </p>
                  </div>
                  <button
                    type="button"
                    className="reports-btn reports-btn--secondary reports-btn--sm"
                    onClick={handleExportCSV}
                  >
                    <DownloadSimple size={14} weight="bold" />
                    <span>Xuất CSV</span>
                  </button>
                </div>

                <div className="reports-table-responsive">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Mã biên lai</th>
                        <th>Mã sự vụ / Task</th>
                        <th>Khách hàng</th>
                        <th>Kho</th>
                        <th>Hạng mục phụ thu</th>
                        <th className="text-right">Số tiền</th>
                        <th>Lý do phát sinh</th>
                        <th>Ngày thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDrilldownItems("surcharges").rows.map((item) => (
                        <tr key={item.id}>
                          <td className="font-mono font-semibold text-ink">{item.id}</td>
                          <td className="font-mono text-secondary">{item.refCode}</td>
                          <td className="font-medium text-ink">{item.tenant}</td>
                          <td>
                            <span className="badge-unit">{item.unitCode}</span>
                          </td>
                          <td className="font-medium text-ink">{item.type}</td>
                          <td className="text-right font-mono font-bold text-amber-700">
                            {formatVND(item.amount)}
                          </td>
                          <td className="text-secondary text-xs">{item.reason}</td>
                          <td className="text-secondary">{item.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OCCUPANCY & ZONE PERFORMANCE */}
          {activeTab === "OCCUPANCY" && (
            <div className="tab-pane space-y-6">
              <div className="reports-table-card">
                <div className="reports-table-header">
                  <div>
                    <h2 className="reports-table-title">Hiệu suất khai thác theo Zone</h2>
                    <p className="reports-table-subtitle">
                      Tỷ lệ lấp đầy, doanh thu bình quân và thời hạn thuê trung bình từng khu vực
                    </p>
                  </div>
                  <button
                    type="button"
                    className="reports-btn reports-btn--secondary reports-btn--sm"
                    onClick={() => setActiveDrilldownKey("occupancy")}
                  >
                    Xem 37 kho đang thuê →
                  </button>
                </div>

                <div className="reports-table-responsive">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Phân khu (Zone)</th>
                        <th className="text-center">Số kho</th>
                        <th className="text-center">Đang thuê</th>
                        <th className="text-center">Tỷ lệ lấp đầy</th>
                        <th className="text-right">Doanh thu cơ bản</th>
                        <th className="text-right">Phụ thu</th>
                        <th className="text-right">Tổng thu</th>
                        <th className="text-center">Thời gian TB</th>
                        <th className="text-center">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ZONE_PERFORMANCE.map((zp) => (
                        <tr key={zp.zone}>
                          <td className="font-semibold text-ink">{zp.zone}</td>
                          <td className="text-center font-mono">{zp.unitCount}</td>
                          <td className="text-center font-mono font-semibold text-primary">{zp.rentedCount}</td>
                          <td className="text-center">
                            <span className="badge-occupancy">{zp.rate}</span>
                          </td>
                          <td className="text-right font-mono text-secondary">{formatVND(zp.baseRev)}</td>
                          <td className="text-right font-mono text-secondary">{formatVND(zp.surcharge)}</td>
                          <td className="text-right font-mono font-bold text-ink">{formatVND(zp.total)}</td>
                          <td className="text-center text-xs text-secondary">{zp.avgDuration}</td>
                          <td className="text-center">
                            <span className="badge-zone-health">
                              {zp.status === "HIGH_DEMAND" ? "Cầu vượt cung" : "Ổn định"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── 6. Drill-down Drawer (US-31: Bấm vào KPI phải xem được danh sách dữ liệu tạo ra KPI đó) ── */}
        <Drawer
          open={Boolean(activeDrilldownKey)}
          headerLabel={drilldownData?.title || "CHI TIẾT CHỈ SỐ"}
          onClose={() => {
            setActiveDrilldownKey(null);
            setDrilldownSearch("");
          }}
        >
          {drilldownData && (
            <div className="drilldown-drawer-content">
              {drilldownData.warningNotice && (
                <div className="drilldown-warning-banner">
                  <ShieldCheck size={20} weight="duotone" className="text-primary flex-shrink-0" />
                  <div>
                    <strong>Quy định kiểm toán tài chính:</strong> {drilldownData.warningNotice}
                  </div>
                </div>
              )}

              <div className="drilldown-toolbar">
                <div className="search-box">
                  <MagnifyingGlass size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã, tên khách hàng, kho..."
                    value={drilldownSearch}
                    onChange={(e) => setDrilldownSearch(e.target.value)}
                  />
                  {drilldownSearch && (
                    <button
                      type="button"
                      aria-label="Xóa bộ lọc tìm kiếm"
                      className="btn-clear-search"
                      onClick={() => setDrilldownSearch("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="drilldown-count">
                  Hiển thị <strong>{filteredDrilldownRows.length}</strong> chứng từ
                </div>
              </div>

              <div className="drilldown-table-wrapper">
                <table className="drilldown-table">
                  <thead>
                    <tr>
                      {drilldownData.columns.map((col) => (
                        <th
                          key={col.key}
                          className={col.isMoney ? "text-right" : "text-left"}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrilldownRows.map((row, idx) => (
                      <tr key={row.id || row.unitCode || idx}>
                        {drilldownData.columns.map((col) => {
                          const val = row[col.key];
                          if (col.isMoney) {
                            return (
                              <td
                                key={col.key}
                                className={`text-right font-mono ${col.isHighlight ? "font-bold text-ink" : "text-secondary"}`}
                              >
                                {formatVND(val)}
                              </td>
                            );
                          }
                          if (col.key === "vaultStatus") {
                            return (
                              <td key={col.key}>
                                <span className={`badge-vault ${val === "ESCROW_LOCKED" ? "badge-vault--locked" : "badge-vault--pending"}`}>
                                  {val === "ESCROW_LOCKED" ? "Đã khóa Escrow" : "Chờ tất toán"}
                                </span>
                              </td>
                            );
                          }
                          if (col.key === "status") {
                            return (
                              <td key={col.key}>
                                <span className={`badge-unit-status badge-unit-status--${String(val).toLowerCase()}`}>
                                  {val}
                                </span>
                              </td>
                            );
                          }
                          return (
                            <td key={col.key} className="text-ink">
                              {val || "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="drilldown-footer">
                <div className="drilldown-meta">
                  Dữ liệu được cập nhật từ sổ cái cơ sở VN-SGN-01
                </div>
                <button
                  type="button"
                  className="reports-btn reports-btn--secondary reports-btn--sm"
                  onClick={handleExportCSV}
                >
                  <DownloadSimple size={14} weight="bold" />
                  <span>Xuất file chi tiết</span>
                </button>
              </div>
            </div>
          )}
        </Drawer>

        {/* ── 7. Custom Range Modal (US-31: Tự chọn khoảng ngày) ── */}
        {showCustomRangeModal && (
          <div className="custom-range-backdrop" onClick={() => setShowCustomRangeModal(false)}>
            <div className="custom-range-card" onClick={(e) => e.stopPropagation()}>
              <div className="custom-range-header">
                <h3 className="font-bold text-ink text-base">Tự chọn khoảng ngày báo cáo</h3>
                <button
                  type="button"
                  aria-label="Đóng cửa sổ"
                  className="btn-close-modal"
                  onClick={() => setShowCustomRangeModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleApplyCustomRange}>
                <div className="custom-range-body">
                  <div className="form-group">
                    <label htmlFor="custom-start-date" className="form-label">Từ ngày (Start Date)</label>
                    <input
                      id="custom-start-date"
                      type="date"
                      className="form-input"
                      value={customRange.startDate}
                      onChange={(e) =>
                        setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="custom-end-date" className="form-label">Đến ngày (End Date)</label>
                    <input
                      id="custom-end-date"
                      type="date"
                      className="form-input"
                      value={customRange.endDate}
                      onChange={(e) =>
                        setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="custom-range-footer">
                  <button
                    type="button"
                    className="reports-btn reports-btn--secondary"
                    onClick={() => setShowCustomRangeModal(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="reports-btn reports-btn--primary">
                    Áp dụng kỳ báo cáo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
