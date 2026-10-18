import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import {
  DownloadSimple,
  CaretDown,
  Warehouse,
  MagnifyingGlass,
  ArrowRight,
  ShieldCheck,
  X,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Drawer from "../../components/Drawer/Drawer.jsx";
import { formatVND } from "../../utils/formatters.js";
import {
  POLICY_VERSIONS,
  getFinancialSummary,
  getMonthlyRevenueChartData,
  getDrilldownItems,
  exportFinancialAuditCSV,
} from "../../services/reportService.js";
import "./BusinessOverviewPage.css";

export default function BusinessOverviewPage() {
  const navigate = useNavigate();

  // State lọc kỳ báo cáo
  const [selectedPeriod, setSelectedPeriod] = useState("THIS_QUARTER");
  // State drill-down drawer khi click vào 4 KPI
  const [activeDrilldownKey, setActiveDrilldownKey] = useState(null);
  const [drilldownSearch, setDrilldownSearch] = useState("");
  // State diff modal cho Rental Policy
  const [diffModalVersion, setDiffModalVersion] = useState(null);

  // Dữ liệu tài chính theo kỳ
  const summary = useMemo(() => {
    return getFinancialSummary(selectedPeriod);
  }, [selectedPeriod]);

  // Dữ liệu biểu đồ 6 tháng
  const monthlyData = useMemo(() => {
    return getMonthlyRevenueChartData();
  }, []);

  // Dữ liệu danh sách drill-down khi bấm KPI
  const drilldownData = useMemo(() => {
    if (!activeDrilldownKey) return null;
    return getDrilldownItems(activeDrilldownKey);
  }, [activeDrilldownKey]);

  // Lọc dữ liệu trong drill-down drawer theo ô tìm kiếm
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

  return (
    <AppShell brandHref="/overview" roleLabel="BUSINESS OPS">
      <div className="biz-overview-page">
        {/* ── 1. Telemetry Context Strip ── */}
        <aside className="biz-telemetry">
          <div className="biz-telemetry__inner">
            <div className="biz-telemetry__left">
              <div className="telemetry-item">
                <Warehouse size={15} weight="duotone" className="text-muted" />
                <span className="telemetry-bold">Facility VN-SGN-01</span>
                <span className="text-muted">(Tân Bình Gateway)</span>
              </div>
              <span className="telemetry-divider">|</span>
              <div className="telemetry-item">
                <span className="dot-pulse-green" />
                <span className="text-success font-medium">Dữ liệu kế toán: Đã đồng bộ</span>
              </div>
            </div>
            <div className="biz-telemetry__right">
              <span className="tabular-clock">MÚI GIỜ: TP. HỒ CHÍ MINH (UTC+07)</span>
            </div>
          </div>
        </aside>

        {/* ── Sub Navigation Links for Business Ops ── */}
        <nav className="biz-subnav">
          <div className="biz-subnav__inner">
            <Link to="/overview" className="biz-subnav__link biz-subnav__link--active">
              Tổng quan
            </Link>
            <Link to="/policy" className="biz-subnav__link">
              Chính sách & Biểu giá
            </Link>
            <Link to="/reports" className="biz-subnav__link">
              Báo cáo tài chính
            </Link>
          </div>
        </nav>

        {/* ── 2. Main Canvas ── */}
        <main className="biz-canvas">
          {/* Page Header */}
          <section className="biz-header">
            <div>
              <div className="biz-breadcrumb">
                <span>StorageHub VN</span>
                <span>/</span>
                <span className="biz-breadcrumb__active">Quản lý kinh doanh</span>
                <span>/</span>
                <span className="text-muted">Số liệu tài chính</span>
              </div>
              <h1 className="biz-title">Tổng quan kinh doanh</h1>
            </div>

            {/* Action Controls */}
            <div className="biz-actions">
              <div className="biz-select-wrapper">
                <select
                  aria-label="Chọn kỳ báo cáo"
                  className="biz-period-select"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="THIS_QUARTER">Quý này (Q3 2026: 01/07 – 30/09)</option>
                  <option value="THIS_MONTH">Tháng này (10/2026)</option>
                  <option value="LAST_MONTH">Tháng trước (09/2026)</option>
                  <option value="YTD">YTD 2026 (01/01 – Hiện tại)</option>
                </select>
                <CaretDown size={14} className="biz-select-icon" />
              </div>

              <button
                type="button"
                className="btn-export-csv"
                onClick={handleExportCSV}
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Xuất file CSV tài chính</span>
              </button>
            </div>
          </section>

          {/* ── 3. Four KPI Cards (With 3px Signature Indicator Bar & Clickable Drill-down) ── */}
          <section className="biz-kpi-grid" aria-label="Business Key Performance Indicators">
            {/* Card 1: Revenue (Q3) */}
            <div
              className="biz-kpi-card biz-kpi-card--revenue"
              role="button"
              tabIndex={0}
              onClick={() => setActiveDrilldownKey("revenue")}
              onKeyDown={(e) => e.key === "Enter" && setActiveDrilldownKey("revenue")}
              title="Nhấn để xem bảng chi tiết doanh thu từng hợp đồng"
            >
              <div className="kpi-indicator kpi-indicator--green" />
              <div className="biz-kpi-header">
                <span className="kpi-label">Doanh thu kinh doanh</span>
                <span className="kpi-badge kpi-badge--green">{summary.revenueGrowth}</span>
              </div>
              <div className="biz-kpi-value">{formatVND(summary.grossRevenue)}</div>
              <div className="biz-kpi-footer">
                <span>Thuê cơ bản: {formatVND(summary.baseRentCollected)}</span>
                <span className="kpi-drill-hint">
                  Chi tiết <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* Card 2: Deposits Held (Escrow Vaulted) */}
            <div
              className="biz-kpi-card biz-kpi-card--deposits"
              role="button"
              tabIndex={0}
              onClick={() => setActiveDrilldownKey("deposits")}
              onKeyDown={(e) => e.key === "Enter" && setActiveDrilldownKey("deposits")}
              title="Nhấn để xem bảng chi tiết tiền cọc đang phong tỏa trong tài khoản Escrow"
            >
              <div className="kpi-indicator kpi-indicator--indigo" />
              <div className="biz-kpi-header">
                <span className="kpi-label">Tiền cọc đang giữ</span>
                <span className="kpi-badge kpi-badge--indigo">Ký quỹ an toàn</span>
              </div>
              <div className="biz-kpi-value">{formatVND(summary.depositsHeld)}</div>
              <div className="biz-kpi-footer">
                <span className="text-muted-dark">Giữ an toàn qua cổng thanh toán (Không tính vào doanh thu)</span>
                <span className="kpi-drill-hint">
                  Chi tiết <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* Card 3: Surcharges & Fees */}
            <div
              className="biz-kpi-card biz-kpi-card--surcharges"
              role="button"
              tabIndex={0}
              onClick={() => setActiveDrilldownKey("surcharges")}
              onKeyDown={(e) => e.key === "Enter" && setActiveDrilldownKey("surcharges")}
              title="Nhấn để xem chi tiết từng khoản phụ thu phát sinh"
            >
              <div className="kpi-indicator kpi-indicator--blue" />
              <div className="biz-kpi-header">
                <span className="kpi-label">Phụ thu & Phí dịch vụ</span>
                <span className="kpi-badge kpi-badge--blue">{summary.surchargeGrowth}</span>
              </div>
              <div className="biz-kpi-value">{formatVND(summary.surcharges)}</div>
              <div className="biz-kpi-footer">
                <span>Phí gia hạn muộn & phí vệ sinh (nếu có)</span>
                <span className="kpi-drill-hint">
                  Chi tiết <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* Card 4: Utilization / Occupancy */}
            <div
              className="biz-kpi-card biz-kpi-card--utilization"
              role="button"
              tabIndex={0}
              onClick={() => setActiveDrilldownKey("occupancy")}
              onKeyDown={(e) => e.key === "Enter" && setActiveDrilldownKey("occupancy")}
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
                <span>{summary.occupiedUnits} kho đang thuê / 42 kho tổng</span>
                <span className="kpi-drill-hint">
                  Chi tiết <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </section>

          {/* ── 4. Wide Chart Card ('Revenue by month') ── */}
          <section className="biz-chart-card">
            <div className="biz-chart-header">
              <div>
                <h2 className="biz-chart-title">Doanh thu theo tháng</h2>
                <p className="biz-chart-subtitle">
                  Số liệu tiền thuê thực thu và phụ thu sổ cái kế toán (6 tháng gần nhất)
                </p>
              </div>
              <div className="biz-chart-legend">
                <div className="legend-item">
                  <span className="legend-color legend-color--primary" />
                  <span className="legend-text">Tiền thuê kho</span>
                </div>
                <div className="legend-item">
                  <span className="legend-line-dashed" />
                  <span className="legend-text text-muted">Mục tiêu: 12.000.000 ₫/tháng</span>
                </div>
              </div>
            </div>

            {/* Responsive Chart Surface */}
            <div className="biz-chart-body">
              <div className="chart-canvas-wrapper">
                {/* Y-Axis Labels */}
                <div className="chart-y-axis">
                  <span>15M ₫</span>
                  <span>12M ₫</span>
                  <span>9M ₫</span>
                  <span>6M ₫</span>
                  <span>3M ₫</span>
                  <span>0 ₫</span>
                </div>

                {/* Bars & Guides Container */}
                <div className="chart-plot-area">
                  {/* Grid Lines */}
                  <div className="chart-gridlines">
                    <div className="gridline" />
                    <div className="gridline gridline--target">
                      <span className="target-tag">MỤC TIÊU 12.0M</span>
                    </div>
                    <div className="gridline" />
                    <div className="gridline" />
                    <div className="gridline" />
                    <div className="gridline" />
                  </div>

                  {/* Monthly Bars */}
                  <div className="chart-bars-row">
                    {monthlyData.map((bar) => (
                      <div key={bar.month} className="chart-bar-col group">
                        <div className="chart-bar-tooltip">
                          <strong>{bar.month}</strong>: {formatVND(bar.total)}
                          <div className="tooltip-sub">Thuê: {formatVND(bar.rent)}</div>
                          <div className="tooltip-sub">Phụ thu: {formatVND(bar.surcharge)}</div>
                        </div>

                        <div
                          className={`chart-bar-pillar ${bar.isProjected ? "chart-bar-pillar--projected" : ""}`}
                          style={{ height: `${bar.heightPct}%` }}
                        >
                          <div className="chart-bar-fill" />
                        </div>

                        <span className={`chart-bar-label ${bar.isProjected ? "text-primary font-bold" : ""}`}>
                          {bar.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="chart-footnote">
                <span>* Tháng 10 thể hiện số liệu hợp đồng thực tế đang chạy và dự kiến gia hạn.</span>
                <span className="font-mono">Đơn vị: Việt Nam Đồng (VND ₫)</span>
              </div>
            </div>
          </section>

          {/* ── 5. Compact Table Card ('Recent policy versions') ── */}
          <section className="biz-table-card">
            <div className="biz-table-header">
              <div>
                <h2 className="biz-table-title">Chính sách vận hành & Biểu giá</h2>
                <p className="biz-table-subtitle">
                  Lịch sử các phiên bản chính sách thuê, mức cọc và biểu phí quy định
                </p>
              </div>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => navigate("/policy")}
              >
                Quản lý chính sách →
              </button>
            </div>

            <div className="biz-table-responsive">
              <table className="biz-table">
                <thead>
                  <tr>
                    <th className="th-version">Phiên bản</th>
                    <th className="th-date">Ngày hiệu lực</th>
                    <th className="th-author">Người sửa đổi</th>
                    <th className="th-status">Trạng thái</th>
                    <th className="th-scope">Nội dung thay đổi (Changelog)</th>
                    <th className="th-action text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {POLICY_VERSIONS.map((pv) => (
                    <tr key={pv.version}>
                      <td>
                        <span className="badge-version">{pv.version}</span>
                      </td>
                      <td className="text-secondary whitespace-nowrap">{pv.effectiveDate}</td>
                      <td>
                        <div className="author-cell">
                          <div className="author-avatar">{pv.changedBy.slice(0, 1)}</div>
                          <span className="font-medium text-ink">{pv.changedBy}</span>
                        </div>
                      </td>
                      <td>
                        {pv.status === "ACTIVE" && (
                          <span className="badge-status-active">Đang áp dụng</span>
                        )}
                        {pv.status === "SUPERSEDED" && (
                          <span className="badge-status-superseded">Đã thay thế</span>
                        )}
                        {pv.status === "ARCHIVED" && (
                          <span className="badge-status-archived">Lưu trữ</span>
                        )}
                      </td>
                      <td className="text-secondary">{pv.scope}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn-view-diff"
                          onClick={() => setDiffModalVersion(pv)}
                        >
                          So sánh thay đổi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
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
              {/* Alert nếu xem Tiền cọc: Nhấn mạnh nguyên tắc kế toán không gộp cọc vào doanh thu */}
              {drilldownData.warningNotice && (
                <div className="drilldown-warning-banner">
                  <ShieldCheck size={20} weight="duotone" className="text-primary flex-shrink-0" />
                  <div>
                    <strong>Quy định kiểm toán tài chính:</strong> {drilldownData.warningNotice}
                  </div>
                </div>
              )}

              {/* Toolbar: Tìm kiếm & Đếm số dòng */}
              <div className="drilldown-toolbar">
                <div className="search-box">
                  <MagnifyingGlass size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã, tên khách hàng, unit..."
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

              {/* Bảng dữ liệu chi tiết */}
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

              {/* Drawer Footer Actions */}
              <div className="drilldown-footer">
                <div className="drilldown-meta">
                  Dữ liệu được cập nhật từ sổ cái cơ sở VN-SGN-01
                </div>
                <button
                  type="button"
                  className="btn-export-sub-csv"
                  onClick={handleExportCSV}
                >
                  <DownloadSimple size={14} weight="bold" />
                  <span>Xuất file chi tiết</span>
                </button>
              </div>
            </div>
          )}
        </Drawer>

        {/* ── 7. Policy Diff Modal ── */}
        {diffModalVersion && (
          <div className="diff-modal-backdrop" onClick={() => setDiffModalVersion(null)}>
            <div className="diff-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="diff-modal-header">
                <div>
                  <h3 className="diff-modal-title">
                    Chi tiết thay đổi chính sách — {diffModalVersion.version}
                  </h3>
                  <p className="diff-modal-subtitle">
                    Hiệu lực từ ngày {diffModalVersion.effectiveDate} · Thực hiện bởi {diffModalVersion.changedBy}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Đóng bảng so sánh"
                  className="diff-modal-close"
                  onClick={() => setDiffModalVersion(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="diff-modal-body">
                <div className="diff-scope-box">
                  <strong>Phạm vi sửa đổi:</strong> {diffModalVersion.scope}
                </div>

                <div className="diff-table-wrapper">
                  <table className="diff-table">
                    <thead>
                      <tr>
                        <th>Hạng mục quy định</th>
                        <th>Nội dung trước đây</th>
                        <th>Nội dung mới có hiệu lực</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diffModalVersion.diff.map((item, i) => (
                        <tr key={i}>
                          <td className="font-semibold text-ink">{item.field}</td>
                          <td className="diff-old-val">{item.oldVal}</td>
                          <td className="diff-new-val">{item.newVal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="diff-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDiffModalVersion(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
