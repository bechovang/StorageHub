import { Link } from "react-router";
import {
  CheckCircle,
  ArrowClockwise,
  FloppyDisk,
  FileText,
  ShieldCheck,
  PencilSimple,
  ArrowSquareOut,
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
    policyError,
    policyLoading,
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

  if (policyLoading && !persistedPolicy) {
    return (
      <AppShell>
        <div className="policy-page">
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <p style={{ font: "600 0.95rem var(--font-mono)", color: "var(--color-muted)" }}>
              ĐANG TẢI DỮ LIỆU CHÍNH SÁCH VÀ BIỂU GIÁ...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="policy-page">
        

        {/* ── 2. Toast Notification ── */}
        {toastMessage && (
          <div className="policy-toast" role="alert">
            <CheckCircle size={18} weight="fill" className="text-success" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="policy-canvas">
          {/* ── Trạng thái tải / lỗi chính sách ── */}
          {policyLoading && (
            <p style={{ padding: "24px 0", color: "var(--color-secondary)" }}>
              Đang tải chính sách thuê kho hiện hành...
            </p>
          )}
          {!policyLoading && policyError && (
            <div className="policy-validation-banner" role="alert" style={{ marginBottom: "16px" }}>
              {policyError}
            </div>
          )}
          {/* ── 3. Page Header / Title Row ── */}
          <section className="policy-header">
            <div className="policy-header__left">
              <div className="policy-breadcrumb">
                <span>StorageHub VN</span>
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
                      Chính sách cho thuê {persistedPolicy?.version || "—"} · Hiệu lực từ {persistedPolicy?.effectiveDate || "—"}
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
                      Thiết lập đơn giá cơ sở theo từng phân loại kho, tỷ lệ phụ thu trả trễ và tham số vận hành vệ sinh kho.
                    </p>
                  </div>
                  <div className="policy-card__tags">
                    <span className="policy-tag policy-tag--facility">Phạm vi: Cơ sở Tân Bình</span>
                    <span className="policy-tag policy-tag--status">
                      {hasChanges ? "Bản thảo chưa lưu" : "Đang áp dụng"}
                    </span>
                  </div>
                </div>

                <div className="policy-card__body">
                  {/* ── SECTION 1: BASE RENT PER MONTH ── */}
                  <BaseRentTable
                    draftBaseRates={draftBaseRates}
                    persistedPolicy={persistedPolicy || {}}
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
              persistedPolicy={persistedPolicy || {}}
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

          {/* ── 6. Văn bản Pháp lý & Quy chế Dịch vụ Công khai (Terms & Privacy) ── */}
          <section className="policy-legal-card">
            <div className="policy-legal-card__header">
              <div>
                <h2 className="policy-legal-card__title">Văn bản Pháp lý & Quy chế Dịch vụ Công khai</h2>
                <p className="policy-legal-card__subtitle">
                  Quản lý nội dung Điều khoản Dịch vụ và Chính sách Bảo mật hiển thị trực tiếp cho khách hàng trên website và hợp đồng điện tử.
                </p>
              </div>
              <span className="policy-tag policy-tag--status">Hiển thị công khai</span>
            </div>

            <div className="policy-legal-grid">
              {/* Thẻ Điều khoản dịch vụ */}
              <div className="policy-legal-box">
                <div className="policy-legal-box__head">
                  <div className="policy-legal-box__identity">
                    <FileText size={22} weight="bold" color="var(--color-accent, #ea580c)" />
                    <div>
                      <h3 className="policy-legal-box__title">Điều khoản Dịch vụ Thuê kho</h3>
                      <span className="policy-legal-box__url font-mono">/terms (alias /term)</span>
                    </div>
                  </div>
                  <span className="policy-legal-badge">8 Điều khoản</span>
                </div>
                <p className="policy-legal-box__desc">
                  Quy định ký quỹ cọc 10%, thủ tục nhận kho đối chiếu CCCD, mã PIN ra vào 24/7, danh mục hàng hóa cấm cháy nổ, bảo quản sàn Epoxy và biên bản nghiệm thu 4 bước khi trả kho.
                </p>
                <div className="policy-legal-box__actions">
                  <Link to="/terms" className="policy-btn policy-btn--secondary policy-btn--sm">
                    <PencilSimple size={14} weight="bold" />
                    <span>Mở & Chỉnh sửa Điều khoản</span>
                  </Link>
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="policy-legal-view-link">
                    <ArrowSquareOut size={14} />
                    <span>Xem trang</span>
                  </a>
                </div>
              </div>

              {/* Thẻ Chính sách bảo mật */}
              <div className="policy-legal-box">
                <div className="policy-legal-box__head">
                  <div className="policy-legal-box__identity">
                    <ShieldCheck size={22} weight="bold" color="#16a34a" />
                    <div>
                      <h3 className="policy-legal-box__title">Chính sách Bảo mật & Quyền Riêng tư</h3>
                      <span className="policy-legal-box__url font-mono">/privacy</span>
                    </div>
                  </div>
                  <span className="policy-legal-badge">7 Điều khoản</span>
                </div>
                <p className="policy-legal-box__desc">
                  Quy định thu thập CCCD/SĐT phục vụ hợp đồng, phạm vi camera an ninh 24/7 tại hành lang chung, bảo mật nhật ký mở khóa số, chuẩn mã hóa TLS/BCrypt và cam kết không chia sẻ bên thứ ba.
                </p>
                <div className="policy-legal-box__actions">
                  <Link to="/privacy" className="policy-btn policy-btn--secondary policy-btn--sm">
                    <PencilSimple size={14} weight="bold" />
                    <span>Mở & Chỉnh sửa Chính sách</span>
                  </Link>
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="policy-legal-view-link">
                    <ArrowSquareOut size={14} />
                    <span>Xem trang</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
