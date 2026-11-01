import { useNavigate, Link } from "react-router";
import {
  DownloadSimple,
  CaretDown,
  } from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  useBusinessOverview,
  BusinessKpiGrid,
  MonthlyRevenueChart,
  PolicyVersionsTable,
  BusinessDrilldownDrawer,
  PolicyDiffModal,
} from "../../features/business/index.js";
import "./BusinessOverviewPage.css";

export default function BusinessOverviewPage() {
  const navigate = useNavigate();
  const {
    selectedPeriod,
    setSelectedPeriod,
    activeDrilldownKey,
    setActiveDrilldownKey,
    drilldownSearch,
    setDrilldownSearch,
    diffModalVersion,
    setDiffModalVersion,
    summary,
    monthlyData,
    drilldownData,
    filteredDrilldownRows,
    policyVersions,
    handleExportCSV,
  } = useBusinessOverview();

  return (
    <AppShell>
      <div className="biz-overview-page">
        

        {/* ── 2. Main Canvas ── */}
        <div className="biz-canvas">
          {/* Page Header */}
          <section className="biz-header">
            <div>
              <div className="biz-breadcrumb">
                <span>StorageHub VN</span>
                <span>/</span>
                <span>Quản lý kinh doanh</span>
                <span>/</span>
                <span className="biz-breadcrumb__active">Tổng quan số liệu</span>
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
                  <option value="THIS_QUARTER">Quý này (Q4 2026: 01/10 – 31/12)</option>
                  <option value="THIS_MONTH">Tháng này (10/2026)</option>
                  <option value="LAST_MONTH">Tháng trước (09/2026)</option>
                  <option value="YTD">YTD 2026 (01/01 – Hiện tại)</option>
                </select>
                <CaretDown size={14} className="biz-select-icon" />
              </div>

              <button
                type="button"
                className="biz-btn biz-btn--primary"
                onClick={handleExportCSV}
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Xuất file CSV tài chính</span>
              </button>
            </div>
          </section>

          {/* ── 3. Four KPI Cards ── */}
          <BusinessKpiGrid
            summary={summary}
            onSelectDrilldown={(key) => setActiveDrilldownKey(key)}
          />

          {/* ── 4. Wide Chart Card ── */}
          <MonthlyRevenueChart monthlyData={monthlyData} />

          {/* ── 5. Compact Table Card ── */}
          <PolicyVersionsTable
            policyVersions={policyVersions}
            onNavigatePolicy={() => navigate("/policy")}
            onOpenDiff={(pv) => setDiffModalVersion(pv)}
          />
        </div>

        {/* ── 6. Drill-down Drawer (US-31) ── */}
        <BusinessDrilldownDrawer
          activeDrilldownKey={activeDrilldownKey}
          onClose={() => {
            setActiveDrilldownKey(null);
            setDrilldownSearch("");
          }}
          drilldownData={drilldownData}
          drilldownSearch={drilldownSearch}
          setDrilldownSearch={setDrilldownSearch}
          filteredDrilldownRows={filteredDrilldownRows}
          onExportCSV={handleExportCSV}
        />

        {/* ── 7. Policy Diff Modal ── */}
        <PolicyDiffModal
          diffModalVersion={diffModalVersion}
          onClose={() => setDiffModalVersion(null)}
        />
      </div>
    </AppShell>
  );
}
