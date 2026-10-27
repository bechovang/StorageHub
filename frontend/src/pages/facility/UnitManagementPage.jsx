import {
  Warehouse,
  MagnifyingGlass,
  ShieldCheck,
  CheckCircle,
  X,
  ArrowLeft,
} from "@phosphor-icons/react";
import { Link } from "react-router";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  useUnitManagement,
  UnitTable,
  UnitDrawer,
  BlockerModal,
  RetireConfirmModal,
  MaintenanceModal,
  FixStatusModal,
  STATUS_TABS,
} from "../../features/units/index.js";
import "./UnitManagementPage.css";

export default function UnitManagementPage() {
  const {
    activeStatusTab,
    searchTerm,
    setSearchTerm,
    selectedZone,
    setSelectedZone,
    selectedUnit,
    drawerTab,
    setDrawerTab,
    editPrice,
    setEditPrice,
    editNotes,
    setEditNotes,
    editSizeM2,
    setEditSizeM2,
    blockerModalData,
    setBlockerModalData,
    retireTargetUnit,
    setRetireTargetUnit,
    maintenanceTargetUnit,
    setMaintenanceTargetUnit,
    maintenanceReason,
    setMaintenanceReason,
    fixStatusTargetUnit,
    setFixStatusTargetUnit,
    fixStatusValue,
    setFixStatusValue,
    fixStatusReason,
    setFixStatusReason,
    fixStatusError,
    setFixStatusError,
    toastMessage,
    statusCounts,
    filteredUnits,
    unitLogs,
    handleSelectTab,
    handleOpenDrawer,
    handleCloseDrawer,
    handleSaveSpecs,
    handleInitiateRetire,
    handleConfirmRetire,
    handleInitiateMaintenance,
    handleConfirmMaintenance,
    handleFinishMaintenance,
    handleInitiateFixStatus,
    handleConfirmFixStatus,
    handleClearFilters,
  } = useUnitManagement();

  return (
    <AppShell>
      <div className="unit-mgmt-page">
        {/* ── 1. Telemetry Context Strip ── */}
        <section className="mgmt-telemetry" aria-label="Thông tin cơ sở & kiểm toán">
          <div className="mgmt-telemetry__inner">
            <div className="mgmt-telemetry__left">
              <div className="telemetry-item">
                <Warehouse size={16} className="text-muted" />
                <span className="telemetry-bold">Cơ sở:</span>
                <span>Cơ sở Tân Bình (VN-SGN-01)</span>
              </div>
              <span className="telemetry-divider">|</span>
              <div className="telemetry-item">
                <ShieldCheck size={16} className="text-success" />
                <span>Quy chuẩn vận hành:</span>
                <span className="font-mono font-semibold">Chế độ bảo vệ: Đang bật</span>
              </div>
            </div>

            <div className="mgmt-telemetry__right">
              <div className="telemetry-item">
                <span className="telemetry-badge-count">
                  Tổng: <strong>{statusCounts.ALL} kho</strong>
                </span>
                <span className="telemetry-badge-count text-success">
                  Thuê: <strong>{statusCounts.RENTED}</strong> ({((statusCounts.RENTED / (statusCounts.ALL || 1)) * 100).toFixed(0)}%)
                </span>
                <span className="telemetry-badge-count">
                  Trống: <strong>{statusCounts.AVAILABLE}</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Header & Breadcrumbs ── */}
        <header className="mgmt-header">
          <div className="mgmt-subbar">
            <Link to="/facility" className="mgmt-back-link">
              <ArrowLeft size={14} weight="bold" />
              <span>Tổng quan cơ sở</span>
            </Link>
            <span className="mgmt-subbar__sep">/</span>
            <span className="mgmt-subbar__current">Quản lý danh mục kho</span>
          </div>

          <div className="mgmt-header__titles">
            <span className="mgmt-header__eyebrow">TRUNG TÂM ĐIỀU HÀNH KHO CƠ SỞ</span>
            <h1 className="mgmt-header__title">QUẢN LÝ DANH MỤC KHO & TRẠNG THÁI</h1>
            <p className="mgmt-header__desc">
              Kiểm soát trạng thái vật lý, điều chỉnh thông số, đưa vào bảo trì hoặc cho nghỉ kho. Mọi thay đổi trạng thái đều được giám sát và lưu nhật ký kiểm toán.
            </p>
          </div>
        </header>

        {/* ── 3. Controls & Filter Bar ── */}
        <div className="mgmt-controls">
          <div className="mgmt-controls__search">
            <MagnifyingGlass size={16} className="mgmt-search-icon" />
            <input
              type="text"
              className="mgmt-search-input"
              placeholder="Tìm theo mã kho (S-1, M-2), loại kho, khách thuê, hợp đồng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="mgmt-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mgmt-controls__filters">
            <div className="zone-select-wrap">
              <label htmlFor="zone-filter" className="zone-label">Khu vực:</label>
              <select
                id="zone-filter"
                className="zone-select"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="ALL">Tất cả khu vực</option>
                <option value="Zone A">Zone A (Tầng 1)</option>
                <option value="Zone B">Zone B (Tầng 2)</option>
                <option value="Zone C">Zone C (Locker)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 4. Status Tabs ── */}
        <nav className="mgmt-status-tabs" aria-label="Lọc theo trạng thái kho">
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            const isActive = activeStatusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`mgmt-status-tab ${isActive ? "mgmt-status-tab--active" : ""}`}
                onClick={() => handleSelectTab(tab.key)}
              >
                <span className="mgmt-tab-label">{tab.label}</span>
                <span className={`mgmt-tab-count ${isActive ? "mgmt-tab-count--active" : ""}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── 5. Main Table ── */}
        <UnitTable
          units={filteredUnits}
          onOpenDrawer={handleOpenDrawer}
          onFinishMaintenance={handleFinishMaintenance}
          onInitiateMaintenance={handleInitiateMaintenance}
          onInitiateFixStatus={handleInitiateFixStatus}
          onInitiateRetire={handleInitiateRetire}
          onClearFilters={handleClearFilters}
        />

        {/* ── 6. Drawer Chi tiết & Chỉnh sửa kho (FR-26) ── */}
        <UnitDrawer
          selectedUnit={selectedUnit}
          drawerTab={drawerTab}
          setDrawerTab={setDrawerTab}
          editPrice={editPrice}
          setEditPrice={setEditPrice}
          editSizeM2={editSizeM2}
          setEditSizeM2={setEditSizeM2}
          editNotes={editNotes}
          setEditNotes={setEditNotes}
          unitLogs={unitLogs}
          onSaveSpecs={handleSaveSpecs}
          onClose={handleCloseDrawer}
          onInitiateMaintenance={handleInitiateMaintenance}
          onInitiateFixStatus={handleInitiateFixStatus}
          onInitiateRetire={handleInitiateRetire}
        />

        {/* ── 7. Blocker Modal (Khi Guard từ chối thao tác) ── */}
        <BlockerModal
          blockerModalData={blockerModalData}
          onClose={() => setBlockerModalData(null)}
        />

        {/* ── 8. Retire Confirm Modal (Khi Guard cho phép) ── */}
        <RetireConfirmModal
          unit={retireTargetUnit}
          onConfirm={handleConfirmRetire}
          onClose={() => setRetireTargetUnit(null)}
        />

        {/* ── 9. Maintenance Reason Modal ── */}
        <MaintenanceModal
          unit={maintenanceTargetUnit}
          reason={maintenanceReason}
          setReason={setMaintenanceReason}
          onConfirm={handleConfirmMaintenance}
          onClose={() => setMaintenanceTargetUnit(null)}
        />

        {/* ── 10. Fix Status Modal (Bắt buộc lý do kiểm toán) ── */}
        <FixStatusModal
          unit={fixStatusTargetUnit}
          statusValue={fixStatusValue}
          setStatusValue={setFixStatusValue}
          reason={fixStatusReason}
          setReason={setFixStatusReason}
          error={fixStatusError}
          setError={setFixStatusError}
          onConfirm={handleConfirmFixStatus}
          onClose={() => setFixStatusTargetUnit(null)}
        />

        {/* ── Toast Feedback ── */}
        {toastMessage && (
          <aside className="mgmt-toast" role="status" aria-live="polite">
            <CheckCircle size={18} className="text-success flex-shrink-0" />
            <span>{toastMessage}</span>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
