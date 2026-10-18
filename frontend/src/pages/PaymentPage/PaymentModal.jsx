import {
  CreditCard,
  Wallet,
  QrCode as QrCodeIcon,
  DeviceMobile,
  CheckCircle,
  XCircle,
  Clock,
  ArrowCounterClockwise,
  Lock,
  WarningCircle,
  Copy,
  Check,
  CircleNotch,
  X,
  Eye,
  ListDashes,
} from "@phosphor-icons/react";
import Badge from "../../components/Badge/Badge.jsx";
import Button from "../../components/Button/Button.jsx";

/**
 * Thẻ tóm tắt hóa đơn cọc hiển thị trước khi thanh toán để người dùng xác nhận
 */
function PaymentInvoiceSummary({ unit, reservation, formatVND }) {
  const deposit = reservation?.depositAmount || 103500;
  return (
    <div className="payment-invoice-summary">
      <div className="payment-invoice-summary__header">
        <span className="payment-invoice-summary__title">Hóa đơn thanh toán</span>
        <span className="payment-invoice-summary__ref">
          REF: {reservation?.code || "RSV-2026-S3"}
        </span>
      </div>
      <div className="payment-invoice-summary__body">
        <div className="payment-invoice-summary__row">
          <span className="payment-invoice-summary__label">Kho thuê:</span>
          <span className="payment-invoice-summary__value">
            {unit.code || "S-3"} · {unit.depot || "Tân Bình Gateway"}
          </span>
        </div>
        <div className="payment-invoice-summary__row">
          <span className="payment-invoice-summary__label">Thời hạn thuê:</span>
          <span className="payment-invoice-summary__value">
            {reservation?.durationMonths || 3} tháng ({reservation?.startDate || "03/10/2026"})
          </span>
        </div>
        <div className="payment-invoice-summary__row payment-invoice-summary__row--total">
          <span className="payment-invoice-summary__label">Tiền cọc cần thanh toán (10%):</span>
          <span className="payment-invoice-summary__total">{formatVND(deposit)}</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentModal({
  open,
  onClose,
  reservation,
  selectedMethod,
  onSelectMethod,
  cardForm,
  onCardNumberChange,
  onExpiryChange,
  onCardFormChange,
  onApplyCardPreset,
  momoPhone,
  onMomoPhoneChange,
  otp,
  onOtpChange,
  paymentSession,
  paymentResult,
  qrDataUrl,
  countdown,
  formatCountdown,
  submitting,
  polling,
  checkingStatus,
  onCheckPaymentStatus,
  onSimulateVNPaySuccess,
  formErrors,
  apiError,
  notificationToast,
  onInitiatePayment,
  onConfirmOtp,
  onResetOrSwitch,
  copiedCode,
  onCopyReceipt,
  onNavigateRentals,
  onNavigateRentalDetail,
  formatVND,
}) {
  if (!open) return null;

  const unit = reservation?.unit || {};
  const currentStatus =
    countdown === 0 && paymentSession?.status === "PENDING"
      ? "EXPIRED"
      : paymentSession?.status;

  const isTerminalSuccess = currentStatus === "SUCCEEDED";
  const isTerminalFailed = currentStatus === "FAILED";
  const isTerminalExpired = currentStatus === "EXPIRED";
  const isProcessing = currentStatus === "PROCESSING" || polling;
  const isMoMoOtpStage =
    selectedMethod === "MOMO" && paymentSession?.otpRequired && currentStatus === "PENDING";

  // Receipt code
  const finalReceiptCode =
    paymentSession?.receiptCode ||
    paymentResult?.receipt?.receiptCode ||
    paymentResult?.payment?.receiptCode ||
    "RT-2026-0001";

  // Indicator variant class
  const modalVariantClass = isTerminalSuccess
    ? "payment-modal--success"
    : isTerminalFailed
    ? "payment-modal--danger"
    : isTerminalExpired
    ? "payment-modal--warning"
    : "";

  return (
    <div
      className="modal-backdrop payment-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className={`swiss-modal payment-modal ${modalVariantClass}`}>
        {/* 3px Left Status Bar */}
        <div className="payment-modal__indicator-bar" />

        {/* Modal Header */}
        <header className="payment-modal__header">
          <div className="payment-modal__header-meta">
            <h2 id="payment-modal-title" className="payment-modal__title">
              {isTerminalSuccess
                ? "Thanh toán cọc thành công"
                : isTerminalFailed
                ? "Giao dịch không thành công"
                : isTerminalExpired
                ? "Phiên thanh toán đã hết hạn"
                : isProcessing
                ? "Đang xử lý giao dịch..."
                : "Thanh toán tiền cọc"}
            </h2>

            <p className="payment-modal__subtitle">
              {isTerminalSuccess
                ? `Đã nhận tiền cọc cho kho ${unit.code || "S-3"} tại ${
                    unit.depot || "Cơ sở Tân Bình"
                  }.`
                : isTerminalFailed
                ? "Giao dịch chưa hoàn tất và tài khoản của bạn chưa bị trừ tiền."
                : isTerminalExpired
                ? "Mã thanh toán đã hết thời gian hiệu lực sau 5 phút."
                : `Giữ kho ${unit.code || "S-3"} tại ${unit.depot || "Cơ sở Tân Bình"} · REF: ${
                    reservation?.code || "RSV-2026-S3"
                  }`}
            </p>
          </div>

          {!isProcessing && (
            <button
              type="button"
              className="payment-modal__close-btn"
              onClick={onClose}
              aria-label="Đóng cửa sổ thanh toán"
            >
              <X size={18} weight="bold" />
            </button>
          )}
        </header>

        {/* Modal Body */}
        <div className="payment-modal__body">
          {/* Thông báo lỗi từ API */}
          {apiError && (
            <div className="status-alert status-alert--danger">
              <WarningCircle size={18} weight="bold" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Toast Notification từ Server */}
          {notificationToast && (
            <div className="status-alert status-alert--success">
              <CheckCircle size={18} weight="bold" />
              <div>
                <strong>{notificationToast.title}</strong>
                <p>{notificationToast.body}</p>
              </div>
            </div>
          )}

          {/* ── 1. TRẠNG THÁI TERMINAL: THÀNH CÔNG (SUCCESS - VARIANT A) ── */}
          {isTerminalSuccess ? (
            <div className="terminal-view">
              <div className="terminal-status-row">
                <div className="status-icon-wrap status-icon-wrap--success">
                  <CheckCircle size={28} weight="fill" />
                </div>
                <Badge tone="success">Đã nhận tiền cọc</Badge>
              </div>

              <div className="terminal-content">
                <h3 className="terminal-title">
                  {formatVND(paymentSession?.amount || reservation?.depositAmount)}
                </h3>
                <p className="terminal-desc">
                  Khoản đặt cọc giữ chỗ đã được xác nhận. Kho <strong>{unit.code || "S-3"}</strong>{" "}
                  được đảm bảo giữ cho bạn đến ngày nhận kho{" "}
                  <strong>{reservation?.startDate}</strong>. Mã PIN vào kho sẽ tự động kích
                  hoạt lúc 08:00 sáng ngày nhận kho.
                </p>
              </div>

              {/* Receipt highlight chip */}
              <div className="receipt-card">
                <div>
                  <span className="receipt-card__label">Mã biên lai giao dịch</span>
                  <div className="receipt-card__code">
                    {finalReceiptCode} · {reservation?.code}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-copy-receipt"
                  onClick={() => onCopyReceipt(finalReceiptCode)}
                >
                  {copiedCode ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copiedCode ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>

              <div className="modal-actions-grid">
                <Button variant="primary" onClick={onNavigateRentalDetail}>
                  <Eye size={16} weight="bold" />
                  <span>Xem đơn thuê</span>
                </Button>
                <Button variant="secondary" onClick={onNavigateRentals}>
                  <ListDashes size={16} weight="bold" />
                  <span>Danh sách thuê</span>
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  <span>Đóng</span>
                </Button>
              </div>
            </div>
          ) : isTerminalFailed ? (
            /* ── 2. TRẠNG THÁI TERMINAL: THẤT BẠI (FAILED - VARIANT B) ── */
            <div className="terminal-view">
              <div className="terminal-status-row">
                <div className="status-icon-wrap status-icon-wrap--danger">
                  <XCircle size={28} weight="fill" />
                </div>
                <Badge tone="danger">Chưa hoàn tất</Badge>
              </div>

              <div className="terminal-content">
                <h3 className="terminal-title">Giao dịch chưa thành công</h3>
                <p className="terminal-desc">
                  <strong>Tài khoản của bạn chưa bị trừ tiền</strong>. Cổng thanh
                  toán hoặc ngân hàng chưa thể hoàn tất giao dịch. Bạn vui lòng kiểm tra lại số dư thẻ,
                  mã OTP hoặc đổi phương thức thanh toán khác nhé.
                </p>
              </div>

              <div className="decline-code-box">
                <span className="decline-code-box__label">Mã phản hồi từ cổng:</span>
                <code className="decline-code-box__code">DECLINE_CODE_51</code>
              </div>

              <div className="modal-actions-grid">
                <Button variant="danger" onClick={() => onResetOrSwitch(selectedMethod)}>
                  <ArrowCounterClockwise size={16} weight="bold" />
                  <span>Thử lại thanh toán</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    onResetOrSwitch(selectedMethod === "CARD" ? "MOMO" : "CARD")
                  }
                >
                  <span>Đổi phương thức khác</span>
                </Button>
              </div>
            </div>
          ) : isTerminalExpired ? (
            /* ── 3. TRẠNG THÁI TERMINAL: HẾT HẠN (EXPIRED) ── */
            <div className="terminal-view">
              <div className="terminal-status-row">
                <div className="status-icon-wrap status-icon-wrap--warning">
                  <Clock size={28} weight="fill" />
                </div>
                <Badge tone="warning">Hết thời gian</Badge>
              </div>

              <div className="terminal-content">
                <h3 className="terminal-title">Hết thời gian thanh toán</h3>
                <p className="terminal-desc">
                  Mã thanh toán đã hết hạn sau 5 phút. Bạn vui lòng bấm nút bên dưới để tạo mã mới và hoàn tất giữ chỗ nhé.
                </p>
              </div>

              <div className="modal-actions-grid">
                <Button variant="primary" fullWidth onClick={() => onResetOrSwitch(selectedMethod)}>
                  <ArrowCounterClockwise size={16} weight="bold" />
                  <span>Tạo phiên thanh toán mới</span>
                </Button>
              </div>
            </div>
          ) : isProcessing ? (
            /* ── 4. TRẠNG THÁI: ĐANG XỬ LÝ (PROCESSING) ── */
            <div className="processing-view">
              <CircleNotch size={48} className="spinner-rotate" />
              <h3 className="processing-title">Đang kiểm tra thanh toán...</h3>
              <p className="processing-desc">
                Hệ thống đang kết nối an toàn với cổng thanh toán. Quá trình này thường mất vài giây, bạn vui lòng đợi trong giây lát nhé.
              </p>
              <div className="processing-progress-bar">
                <div className="processing-progress-fill" />
              </div>
            </div>
          ) : isMoMoOtpStage ? (
            /* ── 5. BƯỚC 2 MOMO: NHẬP OTP ── */
            <form onSubmit={onConfirmOtp} className="momo-otp-form">
              <div className="momo-info-box">
                <Wallet size={24} weight="fill" />
                <div>
                  <strong>Xác thực ví MoMo</strong>
                  <p>Mã OTP 6 số đã được gửi tới số điện thoại {momoPhone}.</p>
                </div>
              </div>

              <div className="otp-field-wrap">
                <label htmlFor="momo-otp-input" className="swiss-label">
                  Nhập mã OTP 6 chữ số
                </label>
                <input
                  id="momo-otp-input"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`otp-input ${formErrors?.otp ? "is-invalid" : ""}`}
                  placeholder="••••••"
                  autoFocus
                />
                {formErrors?.otp && <span className="field-error-text">{formErrors.otp}</span>}

                {countdown !== null && (
                  <div className="countdown-pill">
                    <Clock size={13} weight="bold" />
                    <span>Hiệu lực còn: {formatCountdown(countdown)}</span>
                  </div>
                )}
              </div>

              {/* Quick Mock OTP Presets */}
              <div className="mock-presets-row">
                <span className="mock-presets-label">Kiểm thử:</span>
                <button
                  type="button"
                  className="preset-chip preset-chip--success"
                  onClick={() => onOtpChange("123456")}
                >
                  OTP hợp lệ (123456)
                </button>
                <button
                  type="button"
                  className="preset-chip preset-chip--danger"
                  onClick={() => onOtpChange("999999")}
                >
                  OTP sai (999999)
                </button>
              </div>

              <div className="modal-actions-grid">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || otp.length !== 6}
                >
                  {submitting ? (
                    <>
                      <CircleNotch size={16} className="spinner-rotate" />
                      <span>Đang xác nhận...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} weight="bold" />
                      <span>Xác nhận thanh toán</span>
                    </>
                  )}
                </Button>
                <Button variant="secondary" onClick={() => onResetOrSwitch()} disabled={submitting}>
                  Hủy &amp; chọn lại
                </Button>
              </div>
            </form>
          ) : (
            /* ── METHOD SELECTION & PAYMENT FLOW (CARD / MOMO / VNPAY) ── */
            <div className="method-selection-flow">
              {/* Segmented Control Tabs */}
              <div className="segmented-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedMethod === "CARD"}
                  className={`segmented-tab ${selectedMethod === "CARD" ? "is-active" : ""}`}
                  onClick={() => onSelectMethod("CARD")}
                >
                  <CreditCard size={18} weight={selectedMethod === "CARD" ? "bold" : "regular"} />
                  <span>Thẻ (Card)</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedMethod === "MOMO"}
                  className={`segmented-tab ${selectedMethod === "MOMO" ? "is-active" : ""}`}
                  onClick={() => onSelectMethod("MOMO")}
                >
                  <Wallet size={18} weight={selectedMethod === "MOMO" ? "bold" : "regular"} />
                  <span>Ví MoMo</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedMethod === "VNPAY"}
                  className={`segmented-tab ${selectedMethod === "VNPAY" ? "is-active" : ""}`}
                  onClick={() => onSelectMethod("VNPAY")}
                >
                  <QrCodeIcon size={18} weight={selectedMethod === "VNPAY" ? "bold" : "regular"} />
                  <span>VNPay QR</span>
                </button>
              </div>

              {/* CARD FORM */}
              {selectedMethod === "CARD" && (
                <form onSubmit={onInitiatePayment} className="method-form">
                  <div className="form-field">
                    <div className="field-label-row">
                      <label htmlFor="card-number-input" className="swiss-label">
                        Số thẻ thanh toán
                      </label>
                      <div className="card-brand-badges">
                        <span className="brand-tag">VISA</span>
                        <span className="brand-tag">MASTERCARD</span>
                      </div>
                    </div>
                    <div className="input-with-icon">
                      <CreditCard size={18} className="input-with-icon__icon" />
                      <input
                        id="card-number-input"
                        type="text"
                        value={cardForm.number}
                        onChange={onCardNumberChange}
                        placeholder="4242 4242 4242 4242"
                        className={`swiss-input swiss-input--mono ${
                          formErrors?.number ? "is-invalid" : ""
                        }`}
                      />
                    </div>
                    {formErrors?.number && (
                      <span className="field-error-text">{formErrors.number}</span>
                    )}
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label htmlFor="card-expiry-input" className="swiss-label">
                        Hết hạn (MM / YY)
                      </label>
                      <input
                        id="card-expiry-input"
                        type="text"
                        value={cardForm.expiry}
                        onChange={onExpiryChange}
                        placeholder="12 / 28"
                        className={`swiss-input swiss-input--mono ${
                          formErrors?.expiry ? "is-invalid" : ""
                        }`}
                      />
                      {formErrors?.expiry && (
                        <span className="field-error-text">{formErrors.expiry}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="card-cvc-input" className="swiss-label">
                        CVC / CVV
                      </label>
                      <input
                        id="card-cvc-input"
                        type="password"
                        maxLength={4}
                        value={cardForm.cvc}
                        onChange={(e) =>
                          onCardFormChange("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        placeholder="•••"
                        className={`swiss-input swiss-input--mono ${
                          formErrors?.cvc ? "is-invalid" : ""
                        }`}
                      />
                      {formErrors?.cvc && (
                        <span className="field-error-text">{formErrors.cvc}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="card-name-input" className="swiss-label">
                      Tên chủ thẻ
                    </label>
                    <input
                      id="card-name-input"
                      type="text"
                      value={cardForm.name}
                      onChange={(e) => onCardFormChange("name", e.target.value)}
                      placeholder="NGUYEN THI LAN"
                      className="swiss-input"
                    />
                  </div>

                  {/* Mock Gateway Test Chips */}
                  <div className="mock-presets-row">
                    <span className="mock-presets-label">Thẻ thử nghiệm:</span>
                    <button
                      type="button"
                      className="preset-chip preset-chip--success"
                      onClick={() => onApplyCardPreset("success")}
                    >
                      Thẻ hợp lệ (4242 4242...)
                    </button>
                    <button
                      type="button"
                      className="preset-chip preset-chip--danger"
                      onClick={() => onApplyCardPreset("fail")}
                    >
                      Thẻ từ chối (5555 5555...)
                    </button>
                  </div>

                  {/* Hóa đơn xác nhận trước khi thanh toán */}
                  <PaymentInvoiceSummary
                    unit={unit}
                    reservation={reservation}
                    formatVND={formatVND}
                  />

                  <div className="modal-actions-grid">
                    <Button type="submit" variant="primary" disabled={submitting}>
                      {submitting ? (
                        <>
                          <CircleNotch size={16} className="spinner-rotate" />
                          <span>Đang khởi tạo...</span>
                        </>
                      ) : (
                        <>
                          <Lock size={16} weight="bold" />
                          <span>Thanh toán</span>
                        </>
                      )}
                    </Button>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                      Hủy
                    </Button>
                  </div>
                </form>
              )}

              {/* MOMO FORM */}
              {selectedMethod === "MOMO" && (
                <form onSubmit={onInitiatePayment} className="method-form">
                  <div className="form-field">
                    <label htmlFor="momo-phone-input" className="swiss-label">
                      Số điện thoại ví MoMo
                    </label>
                    <div className="input-with-icon">
                      <DeviceMobile size={18} className="input-with-icon__icon" />
                      <input
                        id="momo-phone-input"
                        type="tel"
                        value={momoPhone}
                        onChange={(e) =>
                          onMomoPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 11))
                        }
                        placeholder="0901234567"
                        className={`swiss-input swiss-input--mono ${
                          formErrors?.momoPhone ? "is-invalid" : ""
                        }`}
                      />
                    </div>
                    {formErrors?.momoPhone && (
                      <span className="field-error-text">{formErrors.momoPhone}</span>
                    )}
                  </div>

                  <div className="momo-flow-note">
                    Hệ thống sẽ gửi mã OTP 6 chữ số tới số MoMo này để bạn xác thực thanh toán tiền
                    cọc.
                  </div>

                  {/* Hóa đơn xác nhận trước khi thanh toán */}
                  <PaymentInvoiceSummary
                    unit={unit}
                    reservation={reservation}
                    formatVND={formatVND}
                  />

                  <div className="modal-actions-grid">
                    <Button type="submit" variant="primary" disabled={submitting}>
                      {submitting ? (
                        <>
                          <CircleNotch size={16} className="spinner-rotate" />
                          <span>Đang kết nối...</span>
                        </>
                      ) : (
                        <>
                          <Lock size={16} weight="bold" />
                          <span>Thanh toán</span>
                        </>
                      )}
                    </Button>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                      Hủy
                    </Button>
                  </div>
                </form>
              )}

              {/* VNPAY QR VIEW (Auto-generated on tab select) */}
              {selectedMethod === "VNPAY" && (
                <div className="vnpay-qr-view">
                  <div className="qr-wrapper">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="VNPay QR Code" className="qr-image" />
                    ) : (
                      <div className="qr-placeholder">
                        <CircleNotch size={32} className="spinner-rotate" />
                      </div>
                    )}
                    <div className="qr-badge">
                      <QrCodeIcon size={14} weight="bold" />
                      <span>VNPAY-QR</span>
                    </div>
                  </div>

                  {countdown !== null && (
                    <div className="countdown-pill">
                      <Clock size={13} weight="bold" />
                      <span>Mã QR hết hạn sau: {formatCountdown(countdown)}</span>
                    </div>
                  )}

                  <p className="vnpay-instruction">
                    Mở ứng dụng ngân hàng hoặc ví VNPAY, chọn Quét QR để thanh toán{" "}
                    <strong>{formatVND(paymentSession?.amount || reservation?.depositAmount)}</strong>.
                  </p>

                  {/* Mock Presets */}
                  <div className="mock-presets-row">
                    <span className="mock-presets-label">Kiểm thử Mock Gateway:</span>
                    <button
                      type="button"
                      className="preset-chip preset-chip--success"
                      onClick={onSimulateVNPaySuccess}
                    >
                      Giả lập quét thành công
                    </button>
                  </div>

                  <div className="polling-status-hint">
                    <CircleNotch size={14} className="spinner-rotate" />
                    <span>Hệ thống tự động xác nhận sau khi quét mã...</span>
                  </div>

                  <div className="modal-actions-grid">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={onCheckPaymentStatus}
                      disabled={checkingStatus || submitting}
                      title="Kiểm tra xem đã thanh toán chưa"
                    >
                      {checkingStatus ? (
                        <>
                          <CircleNotch size={16} className="spinner-rotate" />
                          <span>Đang kiểm tra...</span>
                        </>
                      ) : (
                        <>
                          <ArrowCounterClockwise size={16} weight="bold" />
                          <span>Làm mới</span>
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Hủy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
