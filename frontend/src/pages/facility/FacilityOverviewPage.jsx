import { useNavigate } from "react-router";
import {
  Warehouse,
  Clock,
  ShieldCheck,
  FileArrowDown,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  useFacilityOverview,
  FacilityKpiGrid,
  FacilityStatusDistribution,
  TurnoverQueueTable,
  FacilityDrilldownDrawer,
} from "../../features/facility/index.js";
import "./FacilityOverviewPage.css";

export default function FacilityOverviewPage() {
  const navigate = useNavigate();
  const {
    overview,
    drilldownStatus,
    setDrilldownStatus,
    searchUnitTerm,
    setSearchUnitTerm,
    drilldownUnits,
    statusStats,
    occupancyRate,
    turnoverQueue,
    statusConfigs,
    handleOpenDrilldown,
    handleExportCSV,
  } = useFacilityOverview();

  return (
    <AppShell>
      <div className="facility-overview-page">
        {/* ── Subheader Telemetry Context Bar ── */}
        <section className="facility-telemetry" aria-label="Thông tin cơ sở & telemetry">
          <div className="facility-telemetry__inner">
            <div className="facility-telemetry__left">
              <div className="telemetry-item">
                <Warehouse size={16} className="text-muted" />
                <span className="telemetry-bold">Depot:</span>
                <span>Tân Bình Gateway</span>
                <span className="tag-facility">VN-SGN-01</span>
              </div>
              <span className="telemetry-divider">|</span>
              <div className="telemetry-item">
                <span className="dot-pulse-green" />
                <span className="text-success font-semibold">Hệ thống ổn định</span>
                <span className="text-muted">· Cổng ra vào hoạt động tốt</span>
              </div>
            </div>

            <div className="facility-telemetry__right">
              <div className="telemetry-item">
                <Clock size={15} className="text-muted" />
                <span className="tabular-clock font-mono">11:42:08</span>
                <span>(UTC+07 ICT)</span>
              </div>
              <span className="telemetry-divider">|</span>
              <div className="telemetry-item">
                <ShieldCheck size={16} className="text-primary" />
                <span className="telemetry-bold">Ca trực:</span>
                <span>Tuấn (Quản lý trực ca)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Canvas ── */}
        <div className="facility-canvas">
          {/* Page Title & Operational Actions */}
          <header className="facility-header">
            <div>
              <div className="facility-breadcrumb">
                <span>Vận hành cơ sở</span>
                <span className="facility-breadcrumb__sep">/</span>
                <span className="facility-breadcrumb__curr">Tổng quan kho</span>
              </div>
              <h1 className="facility-title">Tổng quan vận hành cơ sở</h1>
              <p className="facility-subtitle">
                Theo dõi tỷ lệ lấp đầy, tình trạng từng kho và các lượt bàn giao trong ngày.
              </p>
            </div>

            <div className="facility-actions">
              <div className="time-selector-pill">
                <Clock size={16} className="text-muted" />
                <span>Hôm nay — Ca sáng</span>
              </div>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleExportCSV}
              >
                <FileArrowDown size={16} weight="bold" />
                <span>Xuất file CSV kiểm kê</span>
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => navigate("/facility/units")}
              >
                <SlidersHorizontal size={16} />
                <span>Quản lý kho</span>
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => navigate("/facility/shifts")}
              >
                <span>Xem lịch ca trực →</span>
              </button>
            </div>
          </header>

          {/* ── 4 KPI Summary Cards (Bấm vào để xem chi tiết) ── */}
          <FacilityKpiGrid
            occupancyRate={occupancyRate}
            statusStats={statusStats}
            overview={overview}
            onOpenDrilldown={handleOpenDrilldown}
            onNavigateShifts={() => navigate("/facility/shifts")}
          />

          {/* ── Units by Status Distribution ── */}
          <FacilityStatusDistribution
            statusStats={statusStats}
            statusConfigs={statusConfigs}
            onOpenDrilldown={handleOpenDrilldown}
          />

          {/* ── Operational Turnover Queue ── */}
          <TurnoverQueueTable
            turnoverQueue={turnoverQueue}
            onNavigateTasks={() => navigate("/tasks")}
          />
        </div>

        {/* ── Interactive Drill-down Drawer (FR-32) ── */}
        <FacilityDrilldownDrawer
          drilldownStatus={drilldownStatus}
          onClose={() => setDrilldownStatus(null)}
          searchUnitTerm={searchUnitTerm}
          setSearchUnitTerm={setSearchUnitTerm}
          drilldownUnits={drilldownUnits}
          statusConfigs={statusConfigs}
          onNavigateUnits={() => {
            const targetStatus = drilldownStatus && drilldownStatus !== "ALL" ? drilldownStatus : "";
            navigate(targetStatus ? `/facility/units?status=${targetStatus}` : "/facility/units");
          }}
        />
      </div>
    </AppShell>
  );
}
