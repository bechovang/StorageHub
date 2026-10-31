import AppShell from "../../components/AppShell/AppShell.jsx";
import { formatVND, formatDate } from "../../utils/formatters.js";
import { usePayment, BookingReview, PaymentModal } from "../../features/booking/index.js";
import "./PaymentPage.css";

export default function PaymentPage() {
  const {
    user,
    navigate,
    reservation,
    loadingReservation,
    myReservations,
    isModalOpen,
    setIsModalOpen,
    selectedMethod,
    paymentSession,
    paymentResult,
    qrDataUrl,
    countdown,
    formatCountdown,
    submitting,
    polling,
    checkingStatus,
    apiError,
    notificationToast,
    paymentHistory,
    showHistory,
    setShowHistory,
    copiedCode,
    isAlreadyPaid,
    handleInitiatePayment,
    handleResetOrSwitch,
    handleSelectMethod,
    handleCheckPaymentStatus,
    handleDemoCompletePayment,
    handleCreateTestReservation,
    handleSelectReservation,
    handleCopyReceipt,
  } = usePayment();

  return (
    <AppShell>
      <div className="payment-page-container">
        {/* Lớp nền: Toàn bộ thông tin đặt cọc & bảng kê chi phí (Booking Review Summary) */}
        <div className={`booking-canvas-wrap ${isModalOpen ? "is-blurred" : ""}`}>
          <div className="shell">
            <BookingReview
              reservation={reservation}
              user={user}
              formatVND={formatVND}
              formatDate={formatDate}
              onOpenModal={() => setIsModalOpen(true)}
              isAlreadyPaid={isAlreadyPaid}
              myReservations={myReservations}
              onSelectReservation={handleSelectReservation}
              onCreateTestReservation={handleCreateTestReservation}
              loadingReservation={loadingReservation}
              paymentHistory={paymentHistory}
              showHistory={showHistory}
              setShowHistory={setShowHistory}
            />
          </div>
        </div>

        {/* Lớp nổi: Modal thanh toán (Checkout Authorization Overlay) */}
        <PaymentModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          reservation={reservation}
          selectedMethod={selectedMethod}
          onSelectMethod={handleSelectMethod}
          paymentSession={paymentSession}
          paymentResult={paymentResult}
          qrDataUrl={qrDataUrl}
          countdown={countdown}
          formatCountdown={formatCountdown}
          submitting={submitting}
          polling={polling}
          checkingStatus={checkingStatus}
          onCheckPaymentStatus={handleCheckPaymentStatus}
          onDemoCompletePayment={handleDemoCompletePayment}
          apiError={apiError}
          notificationToast={notificationToast}
          onInitiatePayment={handleInitiatePayment}
          onResetOrSwitch={handleResetOrSwitch}
          copiedCode={copiedCode}
          onCopyReceipt={handleCopyReceipt}
          onNavigateRentals={() => navigate("/rentals")}
          onNavigateRentalDetail={() => navigate(`/rentals/${reservation?.id || ""}`)}
          formatVND={formatVND}
        />
      </div>
    </AppShell>
  );
}
