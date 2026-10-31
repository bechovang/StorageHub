import {
  QrCode as QrCodeIcon,
  CheckCircle,
  XCircle,
  Clock,
  ArrowCounterClockwise,
  WarningCircle,
  Copy,
  Check,
  CircleNotch,
  X,
  Eye,
  ListDashes,
} from "@phosphor-icons/react";
import Badge from "../../../components/Badge/Badge.jsx";
import Button from "../../../components/Button/Button.jsx";

/**
 * Thẻ tóm tắt hóa đơn cọc hiển thị trước khi thanh toán để người dùng xác nhận
 */
function PaymentInvoiceSummary({ unit, reservation, formatVND }) {
  const deposit = reservation?.depositAmount || 0;
  return (
    <div className="payment-invoice-summary">
      <div className="payment-invoice-summary__header">
        <span className="payment-invoice-summary__title">Hóa đơn thanh toán</span>
        <span className="payment-invoice-summary__ref">
          REF: {reservation?.code || "—"}
        </span>
      </div>
      <div className="payment-invoice-summary__body">
        <div className="payment-invoice-summary__row">
          <span className="payment-invoice-summary__label">Kho thuê:</span>
          <span className="payment-invoice-summary__value">
            {unit.code || "—"}
            {unit.depot ? ` · ${unit.depot}` : ""}
          </span>
        </div>
        <div className="payment-invoice-summary__row">
          <span className="payment-invoice-summary__label">Thời hạn thuê:</span>
          <span className="payment-invoice-summary__value">
            {reservation?.startDate ? `${reservation.startDate} → ${reservation.endDate || "?"}` : "—"}
            {reservation?.durationDays ? ` (${reservation.durationDays} ngày)` : ""}
          </span>
        </div>
        <div className="payment-invoice-summary__row payment-invoice-summary__row--total">
          <span className="payment-invoice-summary__label">Tiền cọc cần thanh toán:</span>
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
  paymentSession,
  paymentResult,
  qrDataUrl,
  countdown,
  formatCountdown,
  submitting,
  polling,
  checkingStatus,
  onCheckPaymentStatus,
  onDemoCompletePayment,
  apiError,
  notificationToast,
  onInitiatePayment,
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
  // Polling không che QR: PAYOS vẫn PENDING trong lúc chờ webhook.
  const isProcessing = currentStatus === "PROCESSING";

  // Receipt code
  const finalReceiptCode =
    paymentSession?.receiptCode ||
    paymentResult?.receipt?.receiptCode ||
    paymentResult?.payment?.receiptCode ||
    "—";

  // DEMO ONLY: hiện nút "Bỏ qua thanh toán" khi phiên đang chờ (PENDING/PROCESSING).
  // Backend PaymentSessionResponse không có cờ demoSkipEnabled — luôn hiện khi pending.
  const canDemoSkip =
    (currentStatus === "PENDING" || currentStatus === "PROCESSING") &&
    Boolean(paymentSession?.id) &&
    typeof onDemoCompletePayment === "function";

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
                ? `Đã nhận tiền cọc cho kho ${unit.code || "—"} tại ${
                  unit.depot || "cơ sở"
                }.`
                : isTerminalFailed
                  ? "Giao dịch chưa hoàn tất và tài khoản của Quý khách chưa bị trừ tiền."
                  : isTerminalExpired
                    ? "Mã thanh toán đã hết thời gian hiệu lực."
                    : `Thanh toán cọc để khóa giữ chỗ kho ${unit.code || "—"} · REF: ${
                      reservation?.code || "—"
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
          {apiError && !apiError.includes("PAYOS_") && !apiError.includes("PayOS chưa được cấu hình") && (
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
                  Khoản đặt cọc đã được xác nhận thành công! Kho <strong>{unit.code || "—"}</strong>{" "}
                  đã chính thức chuyển sang trạng thái <strong>Đã giữ chỗ thành công</strong> và được đảm bảo giữ cho Quý khách đến ngày nhận kho{" "}
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
                  <strong>Tài khoản của Quý khách chưa bị trừ tiền</strong>. Cổng thanh
                  toán hoặc ngân hàng chưa thể hoàn tất giao dịch. Quý khách vui lòng thử lại.
                </p>
              </div>

              <div className="modal-actions-grid">
                <Button variant="danger" onClick={() => onResetOrSwitch(selectedMethod)}>
                  <ArrowCounterClockwise size={16} weight="bold" />
                  <span>Thử lại thanh toán</span>
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
                  Mã thanh toán đã hết hạn. Quý khách vui lòng bấm nút bên dưới để tạo phiên thanh toán mới và hoàn tất giữ chỗ.
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
                Hệ thống đang kết nối an toàn với cổng thanh toán. Quá trình này thường mất vài giây, Quý khách vui lòng đợi trong giây lát.
              </p>
              <div className="processing-progress-bar">
                <div className="processing-progress-fill" />
              </div>
              {canDemoSkip && (
                <Button
                  type="button"
                  variant="secondary"
                  style={{ marginTop: "14px" }}
                  onClick={onDemoCompletePayment}
                  disabled={checkingStatus}
                  title="Chỉ dùng cho môi trường Demo — đánh dấu phiên đã thanh toán mà không cần chuyển khoản"
                >
                  <WarningCircle size={16} weight="bold" />
                  <span>Bỏ qua thanh toán (Demo)</span>
                </Button>
              )}
            </div>
          ) : (
            /* ── METHOD: THANH TOÁN QR PAYOS ── */
            <div className="method-selection-flow">
              {/* Hóa đơn xác nhận trước khi thanh toán */}
              <PaymentInvoiceSummary
                unit={unit}
                reservation={reservation}
                formatVND={formatVND}
              />

              {submitting && !paymentSession ? (
                <div className="gateway-loading-view">
                  <CircleNotch size={36} className="spinner-rotate" />
                  <p className="gateway-loading-text">Đang tạo mã thanh toán QR...</p>
                </div>
              ) : paymentSession?.method === "PAYOS" && paymentSession?.status === "PENDING" ? (
                <div className="vnpay-qr-view">
                  <div className="qr-wrapper">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Mã thanh toán QR" className="qr-image" />
                    ) : (
                      <div className="qr-placeholder">
                        <CircleNotch size={32} className="spinner-rotate" />
                      </div>
                    )}
                    <div className="qr-badge">
                      <QrCodeIcon size={14} weight="bold" />
                      <span>QR Pay · VietQR</span>
                    </div>
                  </div>

                  {countdown !== null && (
                    <div className="countdown-pill">
                      <Clock size={13} weight="bold" />
                      <span>Mã QR hết hạn sau: {formatCountdown(countdown)}</span>
                    </div>
                  )}

                  <p className="vnpay-instruction">
                    Mở ứng dụng ngân hàng bất kỳ, chọn Quét QR để chuyển khoản{" "}
                    <strong>{formatVND(paymentSession?.amount || reservation?.depositAmount)}</strong>.
                  </p>

                  <div className="polling-status-hint">
                    <CircleNotch size={14} className="spinner-rotate" />
                    <span>
                      {polling
                        ? "Hệ thống tự động xác nhận sau khi quét mã..."
                        : "Hoàn tất quét mã rồi bấm 'Làm mới' để kiểm tra."}
                    </span>
                  </div>

                  {paymentSession?.checkoutUrl && (
                    <Button
                      type="button"
                      variant="primary"
                      fullWidth
                      onClick={() =>
                        window.open(paymentSession.checkoutUrl, "_blank", "noopener,noreferrer")
                      }
                    >
                      <QrCodeIcon size={16} weight="bold" />
                      <span>Mở trang thanh toán QR</span>
                    </Button>
                  )}

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

                  {canDemoSkip && (
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      style={{ marginTop: "10px" }}
                      onClick={onDemoCompletePayment}
                      disabled={checkingStatus}
                      title="Chỉ dùng cho môi trường Demo — đánh dấu phiên đã thanh toán mà không cần chuyển khoản"
                    >
                      <WarningCircle size={16} weight="bold" />
                      <span>Bỏ qua thanh toán (Demo)</span>
                    </Button>
                  )}
                </div>
              ) : (
                /* Chưa có phiên PENDING — nút khởi tạo thanh toán QR */
                <div className="modal-actions-grid" style={{ marginTop: "12px" }}>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => (onSelectMethod ? onSelectMethod("PAYOS") : onInitiatePayment(null, "PAYOS"))}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <CircleNotch size={16} className="spinner-rotate" />
                        <span>Đang khởi tạo...</span>
                      </>
                    ) : (
                      <>
                        <QrCodeIcon size={16} weight="bold" />
                        <span>Thanh toán bằng mã QR</span>
                      </>
                    )}
                  </Button>
                  <Button variant="secondary" onClick={onClose} disabled={submitting}>
                    Hủy
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
