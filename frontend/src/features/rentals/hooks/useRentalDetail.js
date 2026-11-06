import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  getReservation,
  createCheckoutRequest,
  createExtensionRequest,
  confirmZeroExtensionDeposit,
  cancelCheckoutRequest,
} from "../../../services/rentalService.js";
import { paymentService } from "../../../services/paymentService.js";
import {
  fmtDate,
  fmtMoney,
  STATUS_LABEL,
  STATUS_COLOR,
  DEPOSIT_STATUS_LABEL,
} from "../../../utils/rentalConstants.js";

export function useRentalDetail() {
  const { reservationId } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sprint 2 Modals State (US-18, US-19, US-20)
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReservation(reservationId);
      setReservation(data);
    } catch (err) {
      if (err?.status === 404) {
        setError("Không tìm thấy đơn thuê này.");
      } else if (err?.status === 403) {
        navigate("/403", { replace: true });
      } else {
        setError(err?.message || "Không thể tải thông tin đơn thuê.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function fetchDetail() {
      try {
        const data = await getReservation(reservationId);
        if (!ignore) setReservation(data);
      } catch (err) {
        if (!ignore) {
          if (err?.status === 404) {
            setError("Không tìm thấy đơn thuê này.");
          } else if (err?.status === 403) {
            navigate("/403", { replace: true });
          } else {
            setError(err?.message || "Không thể tải thông tin đơn thuê.");
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchDetail();

    return () => {
      ignore = true;
    };
  }, [reservationId, navigate]);

  // Đồng bộ trạng thái khi staff vừa check-in/checkout ở quầy.
  useEffect(() => {
    const refresh = () => {
      if (document.hidden) return;
      getReservation(reservationId)
        .then((data) => setReservation(data))
        .catch(() => {});
    };
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [reservationId]);

  // Tự tắt Toast sau 4 giây (theo chuẩn US-17 / FR-33)
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Xử lý xác nhận gia hạn (US-18 & US-19):
  // 1) server tạo extension PENDING_PAYMENT + bảng tính server-truth
  // 2) tạo payment EXTENSION_FEE rồi chuyển sang màn hình quét QR
  // EndDate/cọc/addendum chỉ được backend cập nhật khi PayOS SUCCEEDED.
  const handleConfirmExtension = async (extensionData) => {
    try {
      const quote = await createExtensionRequest(
        reservationId,
        extensionData.newEndDate
      );

      if (Number(quote.depositDelta || 0) <= 0) {
        await confirmZeroExtensionDeposit(reservationId, quote.extensionId);
        await handleRefresh();
        setToastMessage({
          type: "success",
          text: `Cọc đã đủ — không cần quét QR. Đã tạo task hợp đồng cho staff cho kỳ +${quote.addedDays} ngày.`,
        });
        return quote;
      }

      const session = await paymentService.createPayment({
        purpose: "EXTENSION_DEPOSIT",
        reservationId: Number(reservationId),
        method: "PAYOS",
      });

      setToastMessage({
        type: "info",
        text: `Đã tạo yêu cầu gia hạn +${quote.addedDays} ngày. Vui lòng thanh toán chênh lệch cọc ${fmtMoney(
          quote.depositDelta
        )}.`,
      });

      navigate(`/payments/${session.id}`);
      return quote;
    } catch (err) {
      // Nếu phiên PayOS cũ vẫn PENDING, mở lại đúng phiên thay vì báo lỗi.
      if (err?.code === "PAYMENT_DUPLICATE") {
        try {
          const history = await paymentService.listPayments({
            reservationId: Number(reservationId),
            pageSize: 50,
          });
          const pending = history?.items?.find(
            (p) => p.purpose === "EXTENSION_DEPOSIT"
              && ["PENDING", "PROCESSING"].includes(p.status)
          );
          if (pending) {
            navigate(`/payments/${pending.id}`);
            return null;
          }
        } catch {
          // Rơi xuống để hiển thị lỗi gốc.
        }
      }
      // Ném lại để ExtensionModal hiển thị lỗi server (boundary, hạn mức...)
      throw err;
    }
  };

  // Xử lý gửi yêu cầu trả kho (US-20)
  const handleConfirmCheckoutRequest = async (checkoutData) => {
    try {
      await createCheckoutRequest(reservationId, {
        requestedDate: checkoutData.requestedDate,
        timeSlot: checkoutData.timeSlot,
        reason: checkoutData.reason,
      });
    } catch (err) {
      console.warn("Checkout request failed:", err);
    }

    setReservation((prev) => ({
      ...prev,
      status: "CHECKOUT_REQUESTED",
      checkoutRequestedDate: checkoutData.requestedDate,
      checkoutTimeSlot: checkoutData.timeSlot,
      checkoutReason: checkoutData.reason,
    }));

    setToastMessage({
      type: "success",
      text: `Đã gửi yêu cầu trả kho cho ngày ${fmtDate(
        checkoutData.requestedDate
      )}. Nhân viên ca trực sẽ tiến hành kiểm tra và tất toán cọc tại quầy.`,
    });
  };

  // Hủy yêu cầu trả kho
  const handleCancelCheckoutRequest = async () => {
    try {
      await cancelCheckoutRequest(reservationId);
    } catch (err) {
      console.warn("Cancel checkout request failed:", err);
    }

    setReservation((prev) => ({
      ...prev,
      status: "CHECKED_IN",
    }));

    setToastMessage({
      type: "info",
      text: "Đã hủy yêu cầu trả kho. Trạng thái đơn tiếp tục duy trì Đang thuê kho.",
    });
  };

  const canCheckIn = reservation?.status === "RESERVED";
  const isExpired = reservation?.status === "EXPIRED";
  const isCheckedIn =
    reservation?.status === "CHECKED_IN" ||
    reservation?.status === "CHECKOUT_REQUESTED";

  const unsignedAddendum = reservation?.contracts?.find(
    (c) =>
      c.kind === "ADDENDUM" &&
      c.status !== "SIGNED" &&
      c.status !== "CLOSED" &&
      c.status !== "VOIDED" &&
      c.status !== "EXPIRED" &&
      c.status !== "SUPERSEDED"
  );

  const statusColor = STATUS_COLOR[reservation?.status] || "neutral";
  const statusLabel = STATUS_LABEL[reservation?.status] || reservation?.status;
  const depositText = DEPOSIT_STATUS_LABEL[reservation?.depositStatus] ||
    reservation?.depositStatus ||
    "—";

  return {
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
    isExpired,
    isCheckedIn,
    unsignedAddendum,
    statusColor,
    statusLabel,
    depositText,
  };
}
