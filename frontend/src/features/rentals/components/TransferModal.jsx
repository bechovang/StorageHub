import { useState } from "react";
import {
  X,
  ArrowsLeftRight,
  WarningCircle,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import { formatVND } from "../../../utils/formatters.js";

/**
 * TransferModal — Đổi kho (thao tác quản lý)
 * POST /api/v1/reservations/transfer
 * body { reservationId, newUnitId, newStartDate, newEndDate }
 * Response gồm oldReservationCode / newReservationCode / carriedDeposit...
 */
export default function TransferModal({
  isOpen,
  onClose,
  reservation,
  onConfirm,
  submitting,
  error,
  onError,
  availableUnits,
  loadingUnits,
  onLoadUnits,
  transferResult,
  onClearResult,
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [newUnitId, setNewUnitId] = useState("");
  const [startDate, setStartDate] = useState(reservation?.startDate || todayStr);
  const [endDate, setEndDate] = useState(reservation?.endDate || todayStr);
  const [localError, setLocalError] = useState("");

  if (!isOpen || !reservation) return null;

  // Ngày hợp lệ: end >= start
  const datesValid = startDate && endDate && endDate >= startDate;

  const handleLoadUnits = () => {
    setLocalError("");
    if (!datesValid) {
      setLocalError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
      return;
    }
    onLoadUnits({ startDate, endDate });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onError("");
    setLocalError("");

    if (!newUnitId) {
      setLocalError("Vui lòng chọn kho mới còn trống.");
      return;
    }
    if (!datesValid) {
      setLocalError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
      return;
    }

    try {
      await onConfirm({ newUnitId: Number(newUnitId), newStartDate: startDate, newEndDate: endDate });
    } catch (err) {
      onError(err?.message || "Không thể đổi kho. Vui lòng thử lại.");
    }
  };

  const handleClose = () => {
    onClearResult();
    onClose();
  };

  // Thành công: hiện bảng tóm tắt kết quả đổi kho
  if (transferResult) {
    return (
      <div className="rd-modal-backdrop" onClick={handleClose}>
        <div
          className="rd-modal-container rd-modal-container--checkout"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="rd-modal-header rd-modal-header--checkout">
            <div className="rd-modal-header__title-group">
              <CheckCircle size={22} weight="bold" className="rd-modal-icon rd-modal-icon--orange" />
              <div>
                <h3 className="rd-modal-title">Đổi kho thành công</h3>
                <p className="rd-modal-subtitle">Kho cũ đã đóng, đơn thuê mới đã được tạo</p>
              </div>
            </div>
            <button className="rd-modal-close-btn" onClick={handleClose} aria-label="Đóng">
              <X size={18} weight="bold" />
            </button>
          </div>

          <div className="rd-modal-body">
            <ul className="rd-settlement-checklist">
              <li>
                Kho cũ <strong className="font-mono">{transferResult.oldUnitCode}</strong> (đơn{" "}
                <span className="font-mono">{transferResult.oldReservationCode}</span>) đã được đóng.
              </li>
              <li>
                Đơn thuê mới:{" "}
                <strong className="font-mono">{transferResult.newReservationCode}</strong> tại kho{" "}
                <strong className="font-mono">{transferResult.newUnitCode}</strong>, thời hạn{" "}
                {transferResult.newStartDate} → {transferResult.newEndDate}.
              </li>
              <li>
                Tiền cọc đã chuyển sang: <strong>{formatVND(transferResult.carriedDeposit || 0)}</strong>
                {transferResult.carriedRent != null && (
                  <>
                    {" "}· Tiền thuê đã chuyển: <strong>{formatVND(transferResult.carriedRent)}</strong>
                  </>
                )}
              </li>
            </ul>

            <div className="rd-modal-footer">
              <button type="button" className="rd-btn-secondary" onClick={handleClose}>
                Đóng
              </button>
              <a
                className="rd-btn-checkout-submit"
                href={`/rentals/${transferResult.newReservationId}`}
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                Mở đơn thuê mới
                <ArrowRight size={16} weight="bold" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rd-modal-backdrop" onClick={handleClose}>
      <div
        className="rd-modal-container rd-modal-container--checkout"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="rd-modal-header rd-modal-header--checkout">
          <div className="rd-modal-header__title-group">
            <ArrowsLeftRight size={22} weight="bold" className="rd-modal-icon rd-modal-icon--orange" />
            <div>
              <h3 className="rd-modal-title">Đổi kho cho khách</h3>
              <p className="rd-modal-subtitle">
                Đơn {reservation.code} · Kho hiện tại {reservation.unit?.code}
              </p>
            </div>
          </div>
          <button className="rd-modal-close-btn" onClick={handleClose} aria-label="Đóng">
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="rd-modal-body">
          {(error || localError) && (
            <div className="rd-form-error-banner">
              <WarningCircle size={18} weight="fill" />
              <span>{error || localError}</span>
            </div>
          )}

          <div className="rd-form-row">
            <div className="rd-form-group" style={{ flex: 1 }}>
              <label htmlFor="transfer-start" className="rd-form-label">
                Ngày bắt đầu (kho mới)
              </label>
              <input
                type="date"
                id="transfer-start"
                className="rd-form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="rd-form-group" style={{ flex: 1 }}>
              <label htmlFor="transfer-end" className="rd-form-label">
                Ngày kết thúc (kho mới)
              </label>
              <input
                type="date"
                id="transfer-end"
                className="rd-form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="rd-form-group">
            <label htmlFor="transfer-unit" className="rd-form-label">
              Kho mới (chỉ hiển thị kho trống trong khoảng ngày trên)
            </label>
            <div className="rd-form-row">
              <select
                id="transfer-unit"
                className="rd-form-select"
                style={{ flex: 1 }}
                value={newUnitId}
                onChange={(e) => setNewUnitId(e.target.value)}
              >
                <option value="">
                  {loadingUnits ? "Đang tải danh sách kho trống..." : "-- Chọn kho trống --"}
                </option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} · {u.typeName || "Kho"} · {u.sizeM2} m²
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rd-btn-secondary"
                onClick={handleLoadUnits}
                disabled={loadingUnits}
              >
                Tải kho trống
              </button>
            </div>
            {!loadingUnits && availableUnits.length === 0 && startDate && endDate && (
              <small className="text-muted">
                Chưa có dữ liệu kho trống — bấm “Tải kho trống” sau khi chọn ngày.
              </small>
            )}
          </div>

          <div className="rd-settlement-guide">
            <p className="rd-settlement-desc">
              Khi đổi kho: đơn thuê hiện tại sẽ bị đóng, hệ thống tạo đơn thuê mới tại kho đã chọn
              và tự động chuyển tiền cọc (và tiền thuê chưa sử dụng nếu có) sang đơn mới.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="rd-modal-footer">
            <button type="button" className="rd-btn-secondary" onClick={handleClose} disabled={submitting}>
              Hủy bỏ
            </button>
            <button type="submit" className="rd-btn-checkout-submit" disabled={submitting}>
              {submitting ? "Đang xử lý..." : "Xác nhận đổi kho"}
              <ArrowsLeftRight size={16} weight="bold" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
