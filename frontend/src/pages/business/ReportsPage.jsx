import { Link } from "react-router";
import {
  CurrencyCircleDollar,
  Vault,
  Receipt,
  GridFour,
  DownloadSimple,
  Calendar,
  Warehouse,
  ArrowLeft,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  useReports,
  ReportsKpiGrid,
  RevenueTabPane,
  DepositsTabPane,
  SurchargesTabPane,
  OccupancyTabPane,
  DrilldownDrawer,
  CustomRangeModal,
} from "../../features/reports/index.js";
import "./ReportsPage.css";

export default function ReportsPage() {
  const {
    activeTab,
    setActiveTab,
    selectedPeriod,
    setSelectedPeriod,
    showCustomRangeModal,
    setShowCustomRangeModal,
    customRange,
    setCustomRange,
    activeDrilldownKey,
    setActiveDrilldownKey,
    drilldownSearch,
    setDrilldownSearch,
    summary,
    drilldownData,
    filteredDrilldownRows,
    handleExportCSV,
    handleApplyCustomRange,
    handleCloseDrilldown,
    monthlyChartData,
  } = useReports();

  return (
    <AppShell>
      <div className="reports-page">
        {/* ── 1. Telemetry Context Strip ── */}
        <aside className="reports-telemetry">
          <div className="reports-telemetry__inner">
            <div className="reports-telemetry__left">
              <div className="telemetry-item">
                <Warehouse size={15} weight="duotone" className="text-muted" />
                <span className="telemetry-bold">Cơ sở Tân Bình</span>
                <span className="text-muted">(VN-SGN-01)</span>
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

        {/* ── 2. Main Canvas ── */}
        <div className="reports-canvas">
          {/* Page Header & Period Controls */}
          <section className="reports-header">
            <div>
              <div className="reports-breadcrumb">
                <Link to="/overview" className="mgmt-back-link">
                  <ArrowLeft size={14} weight="bold" />
                  <span>Tổng quan</span>
                </Link>
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

          {/* ── 4. Four Summary KPI Cards ── */}
          <ReportsKpiGrid
            summary={summary}
            onDrilldown={setActiveDrilldownKey}
          />

          {/* ── 5. Dynamic Tab Content Based on Active Domain Tab ── */}
          {activeTab === "REVENUE" && (
            <RevenueTabPane
              monthlyData={monthlyChartData}
              onDrilldown={setActiveDrilldownKey}
              onExportCSV={handleExportCSV}
            />
          )}

          {activeTab === "DEPOSITS" && (
            <DepositsTabPane
              onDrilldown={setActiveDrilldownKey}
            />
          )}

          {activeTab === "SURCHARGES" && (
            <SurchargesTabPane
              onExportCSV={handleExportCSV}
            />
          )}

          {activeTab === "OCCUPANCY" && (
            <OccupancyTabPane
              onDrilldown={setActiveDrilldownKey}
            />
          )}
        </div>

        {/* ── 6. Drill-down Drawer ── */}
        <DrilldownDrawer
          drilldownData={drilldownData}
          activeDrilldownKey={activeDrilldownKey}
          onClose={handleCloseDrilldown}
          drilldownSearch={drilldownSearch}
          setDrilldownSearch={setDrilldownSearch}
          filteredDrilldownRows={filteredDrilldownRows}
          onExportCSV={handleExportCSV}
        />

        {/* ── 7. Custom Range Modal ── */}
        <CustomRangeModal
          isOpen={showCustomRangeModal}
          onClose={() => setShowCustomRangeModal(false)}
          customRange={customRange}
          setCustomRange={setCustomRange}
          onSubmit={handleApplyCustomRange}
        />
      </div>
    </AppShell>
  );
}
