import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowClockwise,
  CheckCircle,
  XCircle,
  WarningCircle,
  Clock,
  FileText,
  CreditCard,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import {
  useRentalDetail,
  PaymentsSection,
  ContractsSection,
  RentalHeroBanner,
  RentalDepositCard,
  RentalSpecsCard,
  ExtensionModal,
  CheckoutRequestModal,
} from "../../features/rentals/index.js";
import { fmtDate } from "../MyRentalsPage/rentalConstants.js";
import "./RentalDetailPage.css";

export default function RentalDetailPage() {
  const {
    reservationId,
    reservation,
    loading,
    error,
    showExtensionModal,
    setShowExtensionModal,
    showCheckoutModal,
    setShowCheckoutModal,
    toastMessage,
    setToastMessage,
    handleRefresh,
    handleConfirmExtension,
    handleConfirmCheckoutRequest,
    handleCancelCheckoutRequest,
    canCheckIn,
    needsPayment,
    isExpired,
    isCheckedIn,
    unsignedAddendum,
    statusColor,
    statusLabel,
    depositText,
  } = useRentalDetail();

  return (
    <AppShell>
      <div className="rental-detail-page">
        {/* Breadcrumb Navigation */}
        <div className="rd-subbar">
          <nav className="rd-breadcrumb" aria-label="Breadcrumb">
            <Link to="/rentals" className="rd-breadcrumb__back">
              <ArrowLeft size={14} weight="bold" />
              <span>Đơn thuê của tôi</span>
            </Link>
            <span className="rd-breadcrumb__sep">/</span>
            <span>Depot Tân Bình (VN-SGN-01)</span>
            <span className="rd-breadcrumb__sep">/</span>
            <span className="rd-breadcrumb__current font-mono">
              {reservation?.code || `ID #${reservationId}`}
            </span>
          </nav>

          <button
            type="button"
            className="rd-refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Tải lại chi tiết"
          >
            <ArrowClockwise
              size={15}
              weight="bold"
              className={loading ? "is-spinning" : ""}
            />
            <span>Cập nhật</span>
          </button>
        </div>

        {/* ── Toast notification nổi (US-17) ── */}
        {toastMessage && (
          <div className={`rd-toast rd-toast--${toastMessage.type}`}>
            <CheckCircle size={18} weight="fill" />
            <span>{toastMessage.text}</span>
            <button
              className="rd-toast__close"
              onClick={() => setToastMessage(null)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Checkout Requested Callout (US-20) ── */}
        {!loading && reservation?.status === "CHECKOUT_REQUESTED" && (
          <div className="rd-checkout-requested-banner">
            <div className="rd-checkout-requested-banner__content">
              <Clock size={22} weight="fill" className="rd-checkout-icon" />
              <div>
                <strong>Đang chờ làm thủ tục trả kho tại cơ sở Tân Bình</strong>
                <p>
                  Yêu cầu trả kho đã ghi nhận cho ngày{" "}
                  <strong>
                    {fmtDate(
                      reservation.checkoutRequestedDate || reservation.endDate
                    )}
                  </strong>
                  . Vui lòng mang khóa kho đến quầy để hoàn tất bàn giao và nhận lại tiền cọc.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rd-btn-cancel-checkout"
              onClick={handleCancelCheckoutRequest}
            >
              Hủy yêu cầu
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="rd-skeleton-list" aria-label="Đang tải dữ liệu đơn thuê">
            <div className="rd-skeleton rd-skeleton--hero" />
            <div className="rd-skeleton-grid">
              <div className="rd-skeleton rd-skeleton--box" />
              <div className="rd-skeleton rd-skeleton--box" />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="rd-error" role="alert">
            <WarningCircle size={20} weight="fill" className="rd-error__icon" />
            <div className="rd-error__msg">
              <strong>Đã có lỗi xảy ra:</strong> {error}
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="rental-btn rental-btn--secondary rd-error__retry"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && reservation && (
          <>
            {/* ── 1. HERO OPERATIONAL BANNER ── */}
            <RentalHeroBanner
              reservation={reservation}
              reservationId={reservationId}
              statusColor={statusColor}
              statusLabel={statusLabel}
              isCheckedIn={isCheckedIn}
              canCheckIn={canCheckIn}
              needsPayment={needsPayment}
              onOpenExtension={() => setShowExtensionModal(true)}
              onOpenCheckout={() => setShowCheckoutModal(true)}
            />

            {/* ── 2. ALERT CALLOUTS ── */}
            {isExpired && reservation.depositForfeitReason && (
              <div className="rd-callout rd-callout--danger">
                <XCircle size={20} weight="fill" className="rd-callout__icon" />
                <div className="rd-callout__body">
                  <strong>Cọc đã bị tịch thu:</strong>
                  <p>{reservation.depositForfeitReason}</p>
                </div>
              </div>
            )}

            {unsignedAddendum && (
              <div className="rd-callout rd-callout--warning">
                <WarningCircle size={20} weight="fill" className="rd-callout__icon" />
                <div className="rd-callout__body">
                  <strong>
                    Phụ lục gia hạn ({unsignedAddendum.code}) đang chờ ký tại quầy
                  </strong>
                  <p>
                    Vui lòng đến quầy vận hành Tân Bình Gateway ký phụ lục hợp đồng giấy trước ngày{" "}
                    <strong>{fmtDate(unsignedAddendum.signatureDueDate)}</strong> để hoàn tất hồ sơ.
                  </p>
                </div>
              </div>
            )}

            {/* ── 3. BENTO 2-COLUMN MAIN DETAILS ── */}
            <div className="rd-bento-grid">
              {/* CỘT TRÁI: TIỀN CỌC & THÔNG SỐ */}
              <div className="rd-bento-col">
                <RentalDepositCard
                  reservation={reservation}
                  depositText={depositText}
                />
                <RentalSpecsCard reservation={reservation} />
              </div>

              {/* CỘT PHẢI: LỊCH SỬ THANH TOÁN & HỢP ĐỒNG */}
              <div className="rd-bento-col">
                {/* Lịch sử thanh toán */}
                <article className="rd-card">
                  <header className="rd-card__header">
                    <div className="rd-card__title-wrap">
                      <CreditCard size={18} weight="bold" />
                      <h2 className="rd-card__title">Lịch sử thanh toán &amp; Hóa đơn</h2>
                    </div>
                    <span className="font-mono rd-card__sub-badge">
                      {reservation.payments?.length || 0} GIAO DỊCH
                    </span>
                  </header>

                  <div className="rd-card__body rd-card__body--flush">
                    <PaymentsSection payments={reservation.payments} />
                  </div>
                </article>

                {/* Chuỗi hợp đồng */}
                <article className="rd-card">
                  <header className="rd-card__header">
                    <div className="rd-card__title-wrap">
                      <FileText size={18} weight="bold" />
                      <h2 className="rd-card__title">Chuỗi hợp đồng lưu trữ</h2>
                    </div>
                    <span className="font-mono rd-card__sub-badge">
                      {reservation.contracts?.length || 0} HỒ SƠ
                    </span>
                  </header>

                  <div className="rd-card__body">
                    <ContractsSection contracts={reservation.contracts} />
                  </div>
                </article>
              </div>
            </div>

            {/* ── Sprint 2 Modals ── */}
            <ExtensionModal
              isOpen={showExtensionModal}
              onClose={() => setShowExtensionModal(false)}
              reservation={reservation}
              onConfirmExtension={handleConfirmExtension}
            />

            <CheckoutRequestModal
              isOpen={showCheckoutModal}
              onClose={() => setShowCheckoutModal(false)}
              reservation={reservation}
              onConfirmCheckoutRequest={handleConfirmCheckoutRequest}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
