import { useState, useMemo, useRef } from "react";
import { Link } from "react-router";
import {
  CheckCircle,
  XCircle,
  ArrowClockwise,
  FloppyDisk,
  Warehouse,
  Info,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getCurrentPolicy,
  savePolicy,
  resetPolicyToDefault,
  validatePolicy,
  HARD_CAPS,
} from "../../services/policyService.js";
import { formatVND } from "../../utils/formatters.js";
import "./PolicyManagementPage.css";

export default function PolicyManagementPage() {
  const { user } = useAuth();
  const currentActorName = user?.fullName
    ? `${user.fullName} (${user.role === "SYSTEM_ADMIN" ? "System Admin" : "Business Ops"})`
    : "Lê Thị Hằng (Business Ops)";

  // Bản lưu trữ hiện tại trên hệ thống
  const [persistedPolicy, setPersistedPolicy] = useState(() => getCurrentPolicy());

  // Bản nháp đang thao tác (Form Draft)
  const [draftBaseRates, setDraftBaseRates] = useState(() =>
    persistedPolicy.baseRates.map((r) => ({ ...r }))
  );
  const [draftLateFee, setDraftLateFee] = useState(
    persistedPolicy.surcharges.lateCheckoutPercent
  );
  const [draftDeposit, setDraftDeposit] = useState(
    persistedPolicy.surcharges.depositPercent
  );
  const [draftBufferDays, setDraftBufferDays] = useState(
    persistedPolicy.surcharges.turnoverBufferDays
  );

  // Lỗi validation & Banner cảnh báo
  const [validationBanner, setValidationBanner] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const capRulesRef = useRef(null);

  // Khi persistedPolicy đổi, đồng bộ form draft
  const syncDraftFromPersisted = (policy) => {
    setDraftBaseRates(policy.baseRates.map((r) => ({ ...r })));
    setDraftLateFee(policy.surcharges.lateCheckoutPercent);
    setDraftDeposit(policy.surcharges.depositPercent);
    setDraftBufferDays(policy.surcharges.turnoverBufferDays);
    setValidationBanner(null);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Tính danh sách thay đổi (Pending Modifications) so với bản persisted
  const pendingModifications = useMemo(() => {
    const list = [];

    // Kiểm tra giá thuê
    draftBaseRates.forEach((draftRate) => {
      const origRate = persistedPolicy.baseRates.find((r) => r.id === draftRate.id);
      if (origRate && Number(draftRate.rateVnd) !== Number(origRate.rateVnd)) {
        const val = Number(draftRate.rateVnd);
        const isValid = !isNaN(val) && val > 0;
        list.push({
          id: `rate-${draftRate.id}`,
          title: `${draftRate.code} · ${draftRate.typeName} Đơn giá`,
          from: formatVND(origRate.rateVnd),
          to: isNaN(val) ? "Không hợp lệ" : formatVND(val),
          isValid,
          blockReason: !isValid ? "Đơn giá phải lớn hơn 0 ₫" : null,
        });
      }
    });

    // Kiểm tra phí phạt trả trễ
    if (Number(draftLateFee) !== Number(persistedPolicy.surcharges.lateCheckoutPercent)) {
      const lateNum = Number(draftLateFee);
      const isBlocked = isNaN(lateNum) || lateNum > HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT;
      list.push({
        id: "late-fee",
        title: "Phí phạt trả kho trễ",
        from: `${persistedPolicy.surcharges.lateCheckoutPercent}%`,
        to: `${draftLateFee}%`,
        isValid: !isBlocked,
        blockReason: isBlocked
          ? `Vượt mức trần tối đa cho phép (Tối đa ${HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT}%)`
          : null,
      });
    }

    // Kiểm tra tỷ lệ đặt cọc
    if (Number(draftDeposit) !== Number(persistedPolicy.surcharges.depositPercent)) {
      const depNum = Number(draftDeposit);
      const isBlocked = isNaN(depNum) || depNum < HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT;
      list.push({
        id: "deposit-percent",
        title: "Tỷ lệ cọc bảo đảm tối thiểu",
        from: `${persistedPolicy.surcharges.depositPercent}%`,
        to: `${draftDeposit}%`,
        isValid: !isBlocked,
        blockReason: isBlocked
          ? `Thấp hơn mức sàn tối thiểu theo quy định (Tối thiểu ${HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT}%)`
          : null,
      });
    }

    // Kiểm tra thời gian đệm vệ sinh
    if (Number(draftBufferDays) !== Number(persistedPolicy.surcharges.turnoverBufferDays)) {
      const bufNum = Number(draftBufferDays);
      const isBlocked =
        isNaN(bufNum) ||
        bufNum < HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS ||
        bufNum > HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS;
      list.push({
        id: "turnover-buffer",
        title: "Thời gian đệm vệ sinh kho",
        from: `${persistedPolicy.surcharges.turnoverBufferDays} ngày`,
        to: `${draftBufferDays} ngày`,
        isValid: !isBlocked,
        blockReason: isBlocked
          ? `Thời gian đệm xoay vòng kho phải từ ${HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS} đến ${HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS} ngày`
          : null,
      });
    }

    return list;
  }, [draftBaseRates, draftLateFee, draftDeposit, draftBufferDays, persistedPolicy]);

  const hasChanges = pendingModifications.length > 0;

  // Tổng hợp đối tượng Draft hoàn chỉnh để validate
  const currentDraftObject = useMemo(() => {
    return {
      ...persistedPolicy,
      baseRates: draftBaseRates,
      surcharges: {
        ...persistedPolicy.surcharges,
        lateCheckoutPercent: Number(draftLateFee),
        depositPercent: Number(draftDeposit),
        turnoverBufferDays: Number(draftBufferDays),
      },
    };
  }, [persistedPolicy, draftBaseRates, draftLateFee, draftDeposit, draftBufferDays]);

  // Kiểm tra vi phạm các điều kiện trần cứng
  const activeValidationErrors = useMemo(() => {
    return validatePolicy(currentDraftObject);
  }, [currentDraftObject]);

  const isLateFeeViolated = Number(draftLateFee) > HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT;
  const isDepositViolated = Number(draftDeposit) < HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT;
  const isBufferViolated =
    Number(draftBufferDays) < HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS ||
    Number(draftBufferDays) > HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS;

  const isLateFeeModified =
    Number(draftLateFee) !== Number(persistedPolicy.surcharges.lateCheckoutPercent);
  const isDepositModified =
    Number(draftDeposit) !== Number(persistedPolicy.surcharges.depositPercent);
  const isBufferModified =
    Number(draftBufferDays) !== Number(persistedPolicy.surcharges.turnoverBufferDays);

  // Xử lý chỉnh sửa đơn giá loại kho
  const handleRateChange = (id, newRawValue) => {
    const cleanNum = newRawValue.replace(/[^0-9]/g, "");
    setDraftBaseRates((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rateVnd: cleanNum === "" ? "" : Number(cleanNum) } : item
      )
    );
  };

  // Lưu chính sách (EXACTLY ONE Primary Action)
  const handleSavePolicy = () => {
    setValidationBanner(null);

    const errors = validatePolicy(currentDraftObject);
    if (errors.length > 0) {
      // Cắm cờ lỗi và hiển thị đúng thông điệp theo luật UJ-3
      setValidationBanner(errors[0].message);
      // Cuộn lên đầu trang hoặc tới banner
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const saved = savePolicy(currentDraftObject, currentActorName);
      setPersistedPolicy(saved);
      syncDraftFromPersisted(saved);
      showToast(
        `Đã ban hành thành công Rental Policy ${saved.version}! Ngày hiệu lực: ${saved.effectiveDate}`
      );
    } catch (err) {
      setValidationBanner(err.message);
    }
  };

  // Hủy chỉnh sửa (Discard changes)
  const handleDiscardChanges = () => {
    syncDraftFromPersisted(persistedPolicy);
    setValidationBanner(null);
    showToast("Đã hủy bỏ toàn bộ các thay đổi chưa lưu.");
  };

  // Khôi phục về mặc định gốc v3.0.4
  const handleResetToBaseline = () => {
    if (
      window.confirm(
        "Bạn có chắc muốn khôi phục chính sách về phiên bản mặc định chuẩn v3.0.4 không? Thao tác này sẽ ghi nhật ký kiểm toán."
      )
    ) {
      const reset = resetPolicyToDefault(currentActorName);
      setPersistedPolicy(reset);
      syncDraftFromPersisted(reset);
      showToast("Đã khôi phục chính sách về bản gốc v3.0.4.");
    }
  };

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
          {(validationBanner || activeValidationErrors.length > 0) && (
            <div className="policy-banner policy-banner--error" role="alert">
              <div className="policy-banner__content">
                <div className="policy-banner__icon">
                  <XCircle size={22} weight="fill" />
                </div>
                <div className="policy-banner__text">
                  <strong className="policy-banner__title">Chính sách chưa thể lưu.</strong>
                  <span className="policy-banner__desc">
                    {validationBanner || activeValidationErrors[0]?.message}
                  </span>
                </div>
              </div>
              <a
                href="#cap-rules"
                className="policy-banner__link"
                onClick={(e) => {
                  e.preventDefault();
                  capRulesRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Xem quy định hạn mức an toàn →
              </a>
            </div>
          )}

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
                  <div className="policy-section">
                    <div className="policy-section__header">
                      <div className="policy-section__title-wrap">
                        <span className="policy-section__title">Đơn giá thuê cơ sở theo tháng</span>
                        <span className="policy-section__sub">(Đơn giá cơ bản)</span>
                      </div>
                      <span className="policy-section__currency">Đơn vị: Đồng Việt Nam (VND)</span>
                    </div>

                    <div className="policy-table-container">
                      <table className="policy-table">
                        <thead>
                          <tr>
                            <th className="w-20">Mã cỡ</th>
                            <th>Loại ô kho</th>
                            <th className="text-right">Đơn giá niêm yết</th>
                            <th className="text-center w-28">Chu kỳ</th>
                            <th className="text-right w-36">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draftBaseRates.map((rate) => {
                            const orig = persistedPolicy.baseRates.find((r) => r.id === rate.id);
                            const isModified = orig && Number(orig.rateVnd) !== Number(rate.rateVnd);

                            return (
                              <tr
                                key={rate.id}
                                className={isModified ? "policy-row--modified" : ""}
                              >
                                <td className="policy-cell--mono font-bold text-ink-secondary">
                                  {rate.code}
                                </td>
                                <td>
                                  <div className="policy-cell-content">
                                    <span className="policy-cell-title">{rate.typeName}</span>
                                    <span className="policy-cell-sub">{rate.fullName}</span>
                                  </div>
                                </td>
                                <td className="text-right">
                                  <div className="policy-input-currency-wrap">
                                    <input
                                      type="text"
                                      className={`policy-input policy-input--currency ${
                                        isModified ? "policy-input--modified" : ""
                                      }`}
                                      value={
                                        rate.rateVnd === ""
                                          ? ""
                                          : Number(rate.rateVnd).toLocaleString("vi-VN")
                                      }
                                      onChange={(e) => handleRateChange(rate.id, e.target.value)}
                                    />
                                    <span className="policy-input__suffix">₫</span>
                                  </div>
                                  {isModified && (
                                    <div className="policy-input-hint">Đã sửa đổi trong bản nháp</div>
                                  )}
                                </td>
                                <td className="text-center text-muted text-xs">
                                  / {rate.billingInterval}
                                </td>
                                <td className="text-right">
                                  {isModified ? (
                                    <span className="status-badge status-badge--drafting">
                                      Bản thảo
                                    </span>
                                  ) : (
                                    <span className="status-badge status-badge--active">
                                      Hiệu lực
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── SECTION 2: SURCHARGES & OPERATIONAL PARAMETERS ── */}
                  <div className="policy-section">
                    <div className="policy-section__header">
                      <div className="policy-section__title-wrap">
                        <span className="policy-section__title">Phụ thu & Tham số vận hành</span>
                        <span className="policy-section__sub">(Phụ phí & Quy định ràng buộc)</span>
                      </div>
                      <span className="policy-section__currency text-error font-medium">
                        Tuân thủ trần quy chế nghiêm ngặt
                      </span>
                    </div>

                    <div className="policy-table-container">
                      <table className="policy-table">
                        <thead>
                          <tr>
                            <th>Hạng mục quy chế</th>
                            <th>Hình thức</th>
                            <th className="w-48">Giá trị thiết lập</th>
                            <th>Hạn mức trần an toàn</th>
                            <th className="text-right w-32">Thi hành</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Row 1: Late Checkout Fee (Trần 10%) */}
                          <tr
                            className={`${
                              isLateFeeViolated
                                ? "policy-row--error"
                                : isLateFeeModified
                                ? "policy-row--modified"
                                : ""
                            }`.trim()}
                          >
                            <td>
                              <div className="policy-cell-content">
                                <span className="policy-cell-title">Phí phạt trả kho trễ</span>
                                <span className="policy-cell-sub">
                                  <span className="policy-code-badge">#SUR-001</span> Late Checkout
                                </span>
                              </div>
                            </td>
                            <td className="text-muted text-xs">Tỷ lệ cộng thêm / ngày</td>
                            <td>
                              <div className="policy-input-percent-wrap">
                                <input
                                  type="number"
                                  min="1"
                                  max="30"
                                  className={`policy-input policy-input--percent ${
                                    isLateFeeViolated
                                      ? "policy-input--error"
                                      : isLateFeeModified
                                      ? "policy-input--modified"
                                      : ""
                                  }`.trim()}
                                  value={draftLateFee}
                                  onChange={(e) => setDraftLateFee(e.target.value)}
                                />
                                <span className="policy-input__suffix">%</span>
                              </div>
                              {isLateFeeViolated && (
                                <div className="policy-field-error">
                                  Vượt trần cứng 10% tại v3 (#CAP-04)
                                </div>
                              )}
                              {!isLateFeeViolated && isLateFeeModified && (
                                <div className="policy-input-hint">Đã sửa đổi trong bản nháp</div>
                              )}
                            </td>
                            <td>
                              <div className="policy-cap-cell">
                                <span className="policy-cap-limit">Tối đa 10.0%</span>
                                <span className="policy-cap-note">Trần hệ thống cấp cao</span>
                              </div>
                            </td>
                            <td className="text-right">
                              {isLateFeeViolated ? (
                                <span className="status-badge status-badge--blocked">
                                  Bị chặn
                                </span>
                              ) : isLateFeeModified ? (
                                <span className="status-badge status-badge--drafting">
                                  Bản thảo
                                </span>
                              ) : (
                                <span className="status-badge status-badge--active">
                                  Áp dụng
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Row 2: Security Deposit % (Sàn 10%) */}
                          <tr
                            className={`${
                              isDepositViolated
                                ? "policy-row--error"
                                : isDepositModified
                                ? "policy-row--modified"
                                : ""
                            }`.trim()}
                          >
                            <td>
                              <div className="policy-cell-content">
                                <span className="policy-cell-title">Tỷ lệ tiền cọc tối thiểu</span>
                                <span className="policy-cell-sub">
                                  <span className="policy-code-badge">#SUR-003</span> Security Deposit
                                </span>
                              </div>
                            </td>
                            <td className="text-muted text-xs">% trên tổng tiền hợp đồng</td>
                            <td>
                              <div className="policy-input-percent-wrap">
                                <input
                                  type="number"
                                  min="5"
                                  max="50"
                                  className={`policy-input policy-input--percent ${
                                    isDepositViolated
                                      ? "policy-input--error"
                                      : isDepositModified
                                      ? "policy-input--modified"
                                      : ""
                                  }`.trim()}
                                  value={draftDeposit}
                                  onChange={(e) => setDraftDeposit(e.target.value)}
                                />
                                <span className="policy-input__suffix">%</span>
                              </div>
                              {isDepositViolated && (
                                <div className="policy-field-error">
                                  Không được dưới sàn 10% (#CAP-08)
                                </div>
                              )}
                              {!isDepositViolated && isDepositModified && (
                                <div className="policy-input-hint">Đã sửa đổi trong bản nháp</div>
                              )}
                            </td>
                            <td>
                              <div className="policy-cap-cell">
                                <span className="policy-cap-limit">Tối thiểu 10%</span>
                                <span className="policy-cap-note">Sàn bảo đảm thanh toán</span>
                              </div>
                            </td>
                            <td className="text-right">
                              {isDepositViolated ? (
                                <span className="status-badge status-badge--blocked">
                                  Bị chặn
                                </span>
                              ) : isDepositModified ? (
                                <span className="status-badge status-badge--drafting">
                                  Bản thảo
                                </span>
                              ) : (
                                <span className="status-badge status-badge--active">
                                  Áp dụng
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Row 3: Turnover Buffer Days (1 - 5 ngày) */}
                          <tr
                            className={`${
                              isBufferViolated
                                ? "policy-row--error"
                                : isBufferModified
                                ? "policy-row--modified"
                                : ""
                            }`.trim()}
                          >
                            <td>
                              <div className="policy-cell-content">
                                <span className="policy-cell-title">Thời gian đệm vệ sinh kho</span>
                                <span className="policy-cell-sub">
                                  <span className="policy-code-badge">#OPS-012</span> Turnover Buffer
                                </span>
                              </div>
                            </td>
                            <td className="text-muted text-xs">Số ngày giữa 2 hợp đồng</td>
                            <td>
                              <div className="policy-input-wrap">
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  className={`policy-input policy-input--days ${
                                    isBufferViolated
                                      ? "policy-input--error"
                                      : isBufferModified
                                      ? "policy-input--modified"
                                      : ""
                                  }`.trim()}
                                  value={draftBufferDays}
                                  onChange={(e) => setDraftBufferDays(e.target.value)}
                                />
                                <span className="policy-input__suffix">ngày</span>
                              </div>
                              {isBufferViolated && (
                                <div className="policy-field-error">
                                  Thời gian đệm từ 1 đến 5 ngày (#OPS-012)
                                </div>
                              )}
                              {!isBufferViolated && isBufferModified && (
                                <div className="policy-input-hint">Đã sửa đổi trong bản nháp</div>
                              )}
                            </td>
                            <td>
                              <div className="policy-cap-cell">
                                <span className="policy-cap-limit">1 - 5 ngày</span>
                                <span className="policy-cap-note">Quy trình vệ sinh tiêu chuẩn</span>
                              </div>
                            </td>
                            <td className="text-right">
                              {isBufferViolated ? (
                                <span className="status-badge status-badge--blocked">
                                  Bị chặn
                                </span>
                              ) : isBufferModified ? (
                                <span className="status-badge status-badge--drafting">
                                  Bản thảo
                                </span>
                              ) : (
                                <span className="status-badge status-badge--active">
                                  Áp dụng
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Row 4: Damage Handling */}
                          <tr>
                            <td>
                              <div className="policy-cell-content">
                                <span className="policy-cell-title">Bồi thường hư hại ô kho</span>
                                <span className="policy-cell-sub">
                                  <span className="policy-code-badge">#SUR-002</span> Damage Assessment
                                </span>
                              </div>
                            </td>
                            <td className="text-muted text-xs">Thẩm định hiện trường</td>
                            <td className="font-medium text-ink">
                              Tại quầy (bắt buộc lý do & biên bản)
                            </td>
                            <td>
                              <div className="policy-cap-cell">
                                <span className="policy-cap-limit">Bàn giao trả kho</span>
                                <span className="policy-cap-note">Cấn trừ cọc hoặc thu thêm</span>
                              </div>
                            </td>
                            <td className="text-right">
                              <span className="status-badge status-badge--active">
                                Áp dụng
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

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
            <div className="policy-col-side" id="cap-rules" ref={capRulesRef}>
              <div className="policy-side-card">
                {/* Header */}
                <div className="policy-side-header">
                  <div>
                    <h3 className="policy-side-title">Chu trình chính sách & Tuân thủ</h3>
                    <p className="policy-side-subtitle font-mono text-xs">
                      {persistedPolicy.version} · {persistedPolicy.status}
                    </p>
                  </div>
                  <span className="policy-side-time">
                    {new Date(persistedPolicy.updatedAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    bởi {persistedPolicy.updatedBy.split(" ")[0]}
                  </span>
                </div>

                {/* 1. Automated Compliance Checklist */}
                <div className="policy-side-section">
                  <div className="policy-side-label">Danh mục kiểm tra tuân thủ tự động</div>
                  <div className="policy-checklist">
                    <div className="policy-checklist__item policy-checklist__item--pass">
                      <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
                      <span>Chiết khấu cam kết thanh toán 3 tháng hợp lệ (7.5%)</span>
                    </div>

                    <div className="policy-checklist__item policy-checklist__item--pass">
                      <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
                      <span>Ngưỡng đền bù sơn sàn epoxy 15% đồng bộ phụ lục hợp đồng</span>
                    </div>

                    <div
                      className={`policy-checklist__item ${
                        isLateFeeViolated
                          ? "policy-checklist__item--fail"
                          : "policy-checklist__item--pass"
                      }`}
                    >
                      {isLateFeeViolated ? (
                        <XCircle size={18} weight="fill" className="text-error shrink-0" />
                      ) : (
                        <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
                      )}
                      <span className={isLateFeeViolated ? "font-bold text-error" : ""}>
                        {isLateFeeViolated
                          ? `Phí trả trễ vượt trần tối đa (${draftLateFee}% > ${HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT}%)`
                          : "Phí phạt trả trễ tuân thủ trần quy định (≤ 10%)"}
                      </span>
                    </div>

                    <div
                      className={`policy-checklist__item ${
                        isDepositViolated
                          ? "policy-checklist__item--fail"
                          : "policy-checklist__item--pass"
                      }`}
                    >
                      {isDepositViolated ? (
                        <XCircle size={18} weight="fill" className="text-error shrink-0" />
                      ) : (
                        <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
                      )}
                      <span className={isDepositViolated ? "font-bold text-error" : ""}>
                        {isDepositViolated
                          ? `Tỷ lệ cọc dưới sàn tối thiểu (${draftDeposit}% < ${HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT}%)`
                          : "Tỷ lệ cọc bảo đảm tuân thủ sàn tối thiểu (≥ 10%)"}
                      </span>
                    </div>

                    <div
                      className={`policy-checklist__item ${
                        isBufferViolated
                          ? "policy-checklist__item--fail"
                          : "policy-checklist__item--pass"
                      }`}
                    >
                      {isBufferViolated ? (
                        <XCircle size={18} weight="fill" className="text-error shrink-0" />
                      ) : (
                        <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
                      )}
                      <span className={isBufferViolated ? "font-bold text-error" : ""}>
                        {isBufferViolated
                          ? `Thời gian đệm vi phạm khung 1 - 7 ngày (${draftBufferDays} ngày)`
                          : "Thời gian đệm vệ sinh hợp lệ (1 - 7 ngày)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Hard Caps Reference */}
                <div className="policy-side-section">
                  <div className="policy-side-label">Bảng tra cứu trần quy chế cứng (#CAPS)</div>
                  <div className="policy-cap-box">
                    <div className="policy-cap-row">
                      <span className="policy-cap-name">Trần phụ thu trả trễ:</span>
                      <span className="policy-cap-value policy-cap-value--error">
                        {HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT}.0%{" "}
                        <span className="text-muted text-[10px] font-normal">(#CAP-04)</span>
                      </span>
                    </div>
                    <div className="policy-cap-row">
                      <span className="policy-cap-name">Sàn cọc bảo đảm:</span>
                      <span className="policy-cap-value text-ink">
                        {HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT}% / 100.000 ₫{" "}
                        <span className="text-muted text-[10px] font-normal">(#CAP-08)</span>
                      </span>
                    </div>
                    <div className="policy-cap-row">
                      <span className="policy-cap-name">Khung đệm vệ sinh:</span>
                      <span className="policy-cap-value text-ink">
                        {HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS} - {HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS} ngày{" "}
                        <span className="text-muted text-[10px] font-normal">(#OPS-012)</span>
                      </span>
                    </div>
                    <div className="policy-cap-row">
                      <span className="policy-cap-name">Hạn ký phụ lục quầy:</span>
                      <span className="policy-cap-value text-ink">
                        7 ngày{" "}
                        <span className="text-muted text-[10px] font-normal">(#CAP-14)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Pending Modifications List */}
                <div className="policy-side-section">
                  <div className="policy-side-section__header">
                    <span className="policy-side-label">Thay đổi chờ lưu ({pendingModifications.length})</span>
                    {hasChanges && (
                      <button
                        type="button"
                        className="policy-link-clear"
                        onClick={handleDiscardChanges}
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>

                  {pendingModifications.length === 0 ? (
                    <div className="policy-empty-diff">
                      Chưa có thay đổi nào so với bản chính sách đang lưu.
                    </div>
                  ) : (
                    <div className="policy-diff-list">
                      {pendingModifications.map((item) => (
                        <div
                          key={item.id}
                          className={`policy-diff-item ${
                            item.isValid ? "policy-diff-item--valid" : "policy-diff-item--invalid"
                          }`}
                        >
                          <div className="policy-diff-item__head">
                            <span className="font-semibold">{item.title}</span>
                            <span
                              className={`policy-diff-status ${
                                item.isValid
                                  ? "policy-diff-status--valid"
                                  : "policy-diff-status--blocked"
                              }`}
                            >
                              {item.isValid ? "Hợp lệ" : "Bị chặn"}
                            </span>
                          </div>
                          <div className="policy-diff-item__values">
                            <span className="text-muted">{item.from}</span>
                            <span className="text-muted">→</span>
                            <span className={item.isValid ? "font-bold text-ink" : "font-bold text-error"}>
                              {item.to}
                            </span>
                          </div>
                          {item.blockReason && (
                            <div className="policy-diff-item__reason">{item.blockReason}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Guidance Note */}
                <div className="policy-guidance-note">
                  <Info size={16} className="text-muted shrink-0 mt-0.5" />
                  <span>
                    Để nâng các mức trần quy chuẩn vượt quá khung Rental Policy v3, cần có văn bản phê chuẩn ngoại lệ từ Ban Điều Hành Khu Vực.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
