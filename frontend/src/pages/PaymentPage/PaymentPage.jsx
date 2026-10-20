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
    cardForm,
    momoPhone,
    setMomoPhone,
    otp,
    setOtp,
    paymentSession,
    paymentResult,
    qrDataUrl,
    countdown,
    formatCountdown,
    submitting,
    polling,
    checkingStatus,
    formErrors,
    setFormErrors,
    apiError,
    notificationToast,
    paymentHistory,
    showHistory,
    setShowHistory,
    copiedCode,
    isAlreadyPaid,
    handleCardNumberChange,
    handleExpiryChange,
    handleCardFormChange,
    handleApplyCardPreset,
    handleInitiatePayment,
    handleConfirmOtp,
    handleResetOrSwitch,
    handleSelectMethod,
    handleCheckPaymentStatus,
    handleSimulateVNPaySuccess,
    handleCreateTestReservation,
    handleSelectReservation,
    handleCopyReceipt,
    unitDetailUrl,
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
              unitDetailUrl={unitDetailUrl}
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
          cardForm={cardForm}
          onCardNumberChange={handleCardNumberChange}
          onExpiryChange={handleExpiryChange}
          onCardFormChange={handleCardFormChange}
          onApplyCardPreset={handleApplyCardPreset}
          momoPhone={momoPhone}
          onMomoPhoneChange={(v) => {
            setMomoPhone(v);
            if (formErrors.momoPhone) setFormErrors({});
          }}
          otp={otp}
          onOtpChange={(v) => {
            setOtp(v);
            if (formErrors.otp) setFormErrors({});
          }}
          paymentSession={paymentSession}
          paymentResult={paymentResult}
          qrDataUrl={qrDataUrl}
          countdown={countdown}
          formatCountdown={formatCountdown}
          submitting={submitting}
          polling={polling}
          checkingStatus={checkingStatus}
          onCheckPaymentStatus={handleCheckPaymentStatus}
          onSimulateVNPaySuccess={handleSimulateVNPaySuccess}
          formErrors={formErrors}
          apiError={apiError}
          notificationToast={notificationToast}
          onInitiatePayment={handleInitiatePayment}
          onConfirmOtp={handleConfirmOtp}
          onResetOrSwitch={handleResetOrSwitch}
          copiedCode={copiedCode}
          onCopyReceipt={handleCopyReceipt}
          onNavigateRentals={() => navigate("/rentals")}
          onNavigateRentalDetail={() => navigate(`/rentals/${reservation.id}`)}
          formatVND={formatVND}
        />
      </div>
    </AppShell>
  );
}
