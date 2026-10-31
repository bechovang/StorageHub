import { useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { searchUnits } from "../../../services/unitService.js";
import {
  forceCheckout,
  transferReservation,
} from "../../../services/rentalService.js";

/**
 * useManagerActions — Thao tác quản lý trên đơn thuê đang CHECKED_IN:
 * 1. Buộc trả kho sớm (forced checkout: VIOLATION | TRANSFER)
 * 2. Đổi kho (transfer sang kho trống + gia hạn/đổi ngày)
 * Chỉ hiển thị cho vai trò nhân sự (không phải CUSTOMER).
 */
export function useManagerActions({ reservation, onRefresh, onToast }) {
  const { user } = useAuth();
  const isManagerFeature = Boolean(user && user.role && user.role !== "CUSTOMER");

  const [actionError, setActionError] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Transfer state
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [transferResult, setTransferResult] = useState(null);

  // Danh sách kho trống theo khoảng ngày: GET /api/v1/units?type-id=&start-date=&end-date=
  const loadAvailableUnits = useCallback(
    async ({ startDate, endDate }) => {
      if (!startDate || !endDate) {
        setAvailableUnits([]);
        return;
      }
      setLoadingUnits(true);
      try {
        const data = await searchUnits({ startDate, endDate, pageSize: 100 });
        const items = Array.isArray(data?.items) ? data.items : [];
        setAvailableUnits(
          items.filter((u) => (u.availability?.status || u.availability) === "AVAILABLE")
        );
      } catch (err) {
        setAvailableUnits([]);
        setActionError(err.message || "Không thể tải danh sách kho trống.");
      } finally {
        setLoadingUnits(false);
      }
    },
    []
  );

  // Buộc trả kho sớm
  const handleForcedCheckout = useCallback(
    async ({ checkoutType, reason }) => {
      setActionError("");
      setSubmittingAction(true);
      try {
        const result = await forceCheckout(reservation.id, { checkoutType, reason });
        onToast({
          type: "success",
          text: `Đã buộc trả kho sớm cho đơn ${result.code || reservation.code}. Vui lòng tiến hành tất toán cọc tại quầy.`,
        });
        await onRefresh();
        return result;
      } finally {
        setSubmittingAction(false);
      }
    },
    [reservation, onRefresh, onToast]
  );

  // Đổi kho (transfer)
  const handleTransfer = useCallback(
    async ({ newUnitId, newStartDate, newEndDate }) => {
      setActionError("");
      setSubmittingAction(true);
      try {
        const result = await transferReservation({
          reservationId: reservation.id,
          newUnitId,
          newStartDate,
          newEndDate,
        });
        setTransferResult(result);
        onToast({
          type: "success",
          text: `Đã đổi kho sang ${result.newUnitCode}. Đơn mới ${result.newReservationCode} đã được tạo, kho cũ ${result.oldUnitCode} đã đóng.`,
        });
        await onRefresh();
        return result;
      } finally {
        setSubmittingAction(false);
      }
    },
    [reservation, onRefresh, onToast]
  );

  const clearActionError = useCallback(() => setActionError(""), []);

  return {
    isManagerFeature,
    actionError,
    setActionError,
    clearActionError,
    submittingAction,
    availableUnits,
    loadingUnits,
    loadAvailableUnits,
    transferResult,
    setTransferResult,
    handleForcedCheckout,
    handleTransfer,
  };
}
