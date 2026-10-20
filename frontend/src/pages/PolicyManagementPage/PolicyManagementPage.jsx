import { Link } from "react-router";
import {
  CheckCircle,
  ArrowClockwise,
  FloppyDisk,
  Warehouse,
  ArrowLeft,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  usePolicyManagement,
  BaseRentTable,
  SurchargesTable,
  PolicyCompliancePanel,
  PolicyValidationBanner,
} from "../../features/policy/index.js";
import "./PolicyManagementPage.css";

export default function PolicyManagementPage() {
  const {
    user,
    persistedPolicy,
    draftBaseRates,
    draftLateFee,
    setDraftLateFee,
    draftDeposit,
    setDraftDeposit,
    draftBufferDays,
    setDraftBufferDays,
    validationBanner,
    toastMessage,
    capRulesRef,
    pendingModifications,
    hasChanges,
    activeValidationErrors,
    isLateFeeViolated,
    isDepositViolated,
    isBufferViolated,
    isLateFeeModified,
    isDepositModified,
    isBufferModified,
    handleRateChange,
    handleSavePolicy,
    handleDiscardChanges,
    handleResetToBaseline,
  } = usePolicyManagement();

  return (
    <AppShell brandHref="/overview" roleLabel={user?.role || "BUSINESS OPS"}>
      <div className="policy-page">
        {/* ── 1. Telemetry Context Strip (Swiss Architecture) ── */}
        <aside className="policy-telemetry">
          <div className="policy-telemetry__inner">
            <div className="policy-telemetry__left">
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
            <div className="policy-telemetry__right">
              <span className="tabular-clock">MÚI GIỜ: TP. HỒ CHÍ MINH (UTC+07)</span>
            </div>
          </div>
        </aside>

        {/* ── Sub Navigation Links for Business Ops ── */}
        <nav className="policy-subnav">
          <div className="policy-subnav__inner">
            <Link to="/overview" className="policy-subnav__link">
              Tổng quan
            </Link>
            <Link to="/policy" className="policy-subnav__link policy-subnav__link--active">
              Chính sách & Biểu giá
            </Link>
            <Link to="/reports" className="policy-subnav__link">
              Báo cáo tài chính
            </Link>
          </div>
        </nav>

        {/* ── 2. Toast Notification ── */}
        {toastMessage && (
          <div className="policy-toast" role="alert">
            <CheckCircle size={18} weight="fill" className="text-success" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="policy-canvas">
          {/* ── 3. Page Header / Title Row ── */}
          <section className="policy-header">
            <div className="policy-header__left">
              <div className="policy-breadcrumb">
                <Link to="/overview" className="mgmt-back-link">
                  <ArrowLeft size={14} weight="bold" />
                  <span>Tổng quan</span>
                </Link>
                <span>/</span>
                <span>Quản lý kinh doanh</span>
                <span>/</span>
                <span className="policy-breadcrumb__active">Chính sách & Biểu phí</span>
              </div>
              <div className="policy-title-row">
                <h1 className="policy-title">Chính sách & Biểu giá</h1>
                <div className="policy-badge-cluster">
                  <span className="policy-version-badge">
                    <span
                      className={`policy-version-badge__dot ${
                        hasChanges ? "policy-version-badge__dot--warning" : "policy-version-badge__dot--active"
                      }`}
                    />
                    <span>
                      Rental Policy {persistedPolicy.version} · Hiệu lực từ {persistedPolicy.effectiveDate}
                    </span>
                  </span>
                  {hasChanges && (
                    <span className="policy-draft-badge">Bản nháp đang chỉnh sửa</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Cluster: Exact ONE Primary Button */}
            <div className="policy-header__actions">
              <button
                type="button"
                className="policy-btn policy-btn--secondary"
                onClick={handleDiscardChanges}
                disabled={!hasChanges}
              >
                Hủy thay đổi
              </button>
              <button
                type="button"
                className="policy-btn policy-btn--ghost"
                onClick={handleResetToBaseline}
                title="Khôi phục lại phiên bản gốc"
              >
                <ArrowClockwise size={15} weight="bold" />
                <span>Mặc định gốc</span>
              </button>
              <button
                type="button"
                className="policy-btn policy-btn--primary"
                onClick={handleSavePolicy}
              >
                <FloppyDisk size={16} weight="bold" />
                <span>Lưu chính sách</span>
              </button>
            </div>
          </section>

          {/* ── 4. Validation Banner (Khớp UJ-3 & FR-30) ── */}
          <PolicyValidationBanner
            validationBanner={validationBanner}
            activeValidationErrors={activeValidationErrors}
            capRulesRef={capRulesRef}
          />

          {/* ── 5. Main Grid Layout (8 cols Left / 4 cols Right) ── */}
          <div className="policy-grid">
            {/* ── LEFT 8-COLUMN: RULES AND MATRIX TABLES ── */}
            <div className="policy-col-main">
              <div className="policy-card">
                {/* 3px Left Accent Status Bar */}
                <div className="policy-card__accent" />

                {/* Card Header */}
                <div className="policy-card__header">
                  <div>
                    <h2 className="policy-card__title">Chính sách vận hành & Bảng giá thuê</h2>
                    <p className="policy-card__subtitle">
                      Thiết lập đơn giá cơ sở theo từng phân loại ô kho, tỷ lệ phụ thu trả trễ và tham số vận hành vệ sinh kho.
                    </p>
                  </div>
                  <div className="policy-card__tags">
                    <span className="policy-tag policy-tag--facility">Phạm vi: Tân Bình Gateway</span>
                    <span className="policy-tag policy-tag--status">
                      {hasChanges ? "Bản thảo chưa lưu" : "Đang áp dụng"}
                    </span>
                  </div>
                </div>

                <div className="policy-card__body">
                  {/* ── SECTION 1: BASE RENT PER MONTH ── */}
                  <BaseRentTable
                    draftBaseRates={draftBaseRates}
                    persistedPolicy={persistedPolicy}
                    onRateChange={handleRateChange}
                  />

                  {/* ── SECTION 2: SURCHARGES & OPERATIONAL PARAMETERS ── */}
                  <SurchargesTable
                    draftLateFee={draftLateFee}
                    setDraftLateFee={setDraftLateFee}
                    isLateFeeViolated={isLateFeeViolated}
                    isLateFeeModified={isLateFeeModified}
                    draftDeposit={draftDeposit}
                    setDraftDeposit={setDraftDeposit}
                    isDepositViolated={isDepositViolated}
                    isDepositModified={isDepositModified}
                    draftBufferDays={draftBufferDays}
                    setDraftBufferDays={setDraftBufferDays}
                    isBufferViolated={isBufferViolated}
                    isBufferModified={isBufferModified}
                  />

                  {/* Footer Meta Details */}
                  <div className="policy-card__footer">
                    <span className="text-muted text-xs">
                      Mọi sửa đổi đều được kiểm toán viên theo dõi qua Activity Log. Giá mới chỉ áp dụng cho hợp đồng ký mới hoặc gia hạn kế tiếp.
                    </span>
                    <Link to="/facility/activity" className="policy-link-audit">
                      Xem nhật ký kiểm toán →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT 4-COLUMN: COMPANION PANEL & AUDIT CHECKLIST ── */}
            <PolicyCompliancePanel
              persistedPolicy={persistedPolicy}
              draftLateFee={draftLateFee}
              isLateFeeViolated={isLateFeeViolated}
              draftDeposit={draftDeposit}
              isDepositViolated={isDepositViolated}
              draftBufferDays={draftBufferDays}
              isBufferViolated={isBufferViolated}
              pendingModifications={pendingModifications}
              hasChanges={hasChanges}
              onDiscardChanges={handleDiscardChanges}
              capRulesRef={capRulesRef}
            />
          </div>
        </main>
      </div>
    </AppShell>
  );
}
