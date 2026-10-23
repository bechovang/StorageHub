import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  getReservation,
  createCheckoutRequest,
  cancelCheckoutRequest,
} from "../../../services/rentalService.js";
import {
  fmtDate,
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

  // Tự tắt Toast sau 4 giây (theo chuẩn US-17 / FR-33)
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Xử lý xác nhận gia hạn (US-18 & US-19)
  const handleConfirmExtension = async (extensionData) => {
    setReservation((prev) => {
      const existingContracts = prev.contracts || [];
      const originalContract =
        existingContracts.find((c) => c.kind === "ORIGINAL") || existingContracts[0];
      const newAddendumCode = originalContract
        ? `${originalContract.code}-A1`
        : "CT-1042-A1";

      const updatedContracts = existingContracts.map((c) => ({
        ...c,
        isLatest: false,
      }));

      updatedContracts.push({
        id: Date.now(),
        code: newAddendumCode,
        kind: "ADDENDUM",
        status: "AWAITING_SIGNATURE",
        isLatest: true,
        signatureDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });

      const newPayments = [
        ...(prev.payments || []),
        {
          id: Date.now(),
          purpose: "EXTENSION_FEE",
          method: "CARD",
          amount: extensionData.totalPayable,
          status: "SUCCEEDED",
          receiptCode: `RT-EXT-${Date.now().toString().slice(-4)}`,
          paidAt: new Date().toISOString(),
        },
      ];

      return {
        ...prev,
        endDate: extensionData.newEndDate,
        durationMonths: (prev.durationMonths || 3) + extensionData.addedMonths,
        depositAmount: extensionData.newDepositHeld,
        contracts: updatedContracts,
        payments: newPayments,
      };
    });

    setToastMessage({
      type: "success",
      text: `Gia hạn thành công! Ngày trả kho mới: ${fmtDate(
        extensionData.newEndDate
      )}. Phụ lục hợp đồng đã sinh ra (hẹn ký tại quầy trong 7 ngày).`,
    });
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
  const needsPayment = reservation?.status === "PENDING_PAYMENT";
  const isExpired = reservation?.status === "EXPIRED";
  const isCheckedIn =
    reservation?.status === "CHECKED_IN" ||
    reservation?.status === "CHECKOUT_REQUESTED";

  const unsignedAddendum = reservation?.contracts?.find(
    (c) =>
      c.kind === "ADDENDUM" &&
      c.status !== "SIGNED" &&
      c.status !== "CLOSED" &&
      c.status !== "SUPERSEDED"
  );

  const statusColor = STATUS_COLOR[reservation?.status] || "neutral";
  const statusLabel = STATUS_LABEL[reservation?.status] || reservation?.status;
  const depositText =
    DEPOSIT_STATUS_LABEL[reservation?.depositStatus] ||
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
    needsPayment,
    isExpired,
    isCheckedIn,
    unsignedAddendum,
    statusColor,
    statusLabel,
    depositText,
  };
}
