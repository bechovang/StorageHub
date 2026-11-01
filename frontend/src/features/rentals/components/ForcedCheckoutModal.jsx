import { useState } from "react";
import {
  X,
  SignOut,
  WarningCircle,
  ArrowRight,
  ShieldWarning,
} from "@phosphor-icons/react";

/**
 * ForcedCheckoutModal — Buộc trả kho sớm (thao tác quản lý)
 * checkoutType: VIOLATION (đuổi vi phạm) | TRANSFER (trả sớm để điều chuyển)
 * POST /api/v1/reservations/{id}/checkout-request/forced
 */
export default function ForcedCheckoutModal({
  isOpen,
  onClose,
  reservation,
  onConfirm,
  submitting,
  error,
  onError,
}) {
  const [checkoutType, setCheckoutType] = useState("VIOLATION");
  const [reason, setReason] = useState("");

  if (!isOpen || !reservation) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    onError("");
    try {
      await onConfirm({ checkoutType, reason });
      onClose();
    } catch (err) {
      onError(err?.message || "Không thể buộc trả kho. Vui lòng thử lại.");
    }
  };

  return (
    <div className="rd-modal-backdrop" onClick={onClose}>
      <div
        className="rd-modal-container rd-modal-container--checkout"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="rd-modal-header rd-modal-header--checkout">
          <div className="rd-modal-header__title-group">
            <ShieldWarning size={22} weight="bold" className="rd-modal-icon rd-modal-icon--orange" />
            <div>
              <h3 className="rd-modal-title">Buộc trả kho sớm</h3>
              <p className="rd-modal-subtitle">
                Đơn {reservation.code} · Kho {reservation.unit?.code}
              </p>
            </div>
          </div>
          <button className="rd-modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="rd-modal-body">
          {error && (
            <div className="rd-form-error-banner">
              <WarningCircle size={18} weight="fill" />
              <span>{error}</span>
            </div>
          )}

          <div className="rd-form-group">
            <label htmlFor="forced-type" className="rd-form-label">
              Loại buộc trả kho
            </label>
            <select
              id="forced-type"
              className="rd-form-select"
              value={checkoutType}
              onChange={(e) => setCheckoutType(e.target.value)}
            >
              <option value="VIOLATION">Thu hồi do vi phạm quy định</option>
              <option value="TRANSFER">Thu hồi để điều chuyển kho</option>
            </select>
          </div>

          <div className="rd-form-group">
            <label htmlFor="forced-reason" className="rd-form-label">
              Ghi chú lý do (tùy chọn)
            </label>
            <textarea
              id="forced-reason"
              className="rd-form-textarea"
              rows={3}
              placeholder="Ví dụ: Khách vi phạm quy định an toàn cháy nổ; kho cần thu hồi để bảo trì khẩn cấp..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="rd-settlement-guide">
            <p className="rd-settlement-desc">
              Sau khi xác nhận, đơn thuê sẽ chuyển sang trạng thái chờ trả kho và kho cũ sẽ được
              mở lại cho phép xử lý tất toán cọc. Thao tác được ghi nhật ký kiểm toán.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="rd-modal-footer">
            <button
              type="button"
              className="rd-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="rd-btn-checkout-submit" disabled={submitting}>
              {submitting ? "Đang xử lý..." : "Xác nhận buộc trả kho"}
              <SignOut size={16} weight="bold" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
