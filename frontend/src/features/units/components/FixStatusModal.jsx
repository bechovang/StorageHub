import { ShieldCheck } from "@phosphor-icons/react";
import Modal from "../../../components/Modal/Modal.jsx";
import { STATUS_LABELS } from "../constants.js";

export function FixStatusModal({
  unit,
  statusValue,
  setStatusValue,
  reason,
  setReason,
  error,
  setError,
  onConfirm,
  onClose,
}) {
  if (!unit) return null;

  return (
    <Modal
      open={Boolean(unit)}
      title={`ĐIỀU CHỈNH TRẠNG THÁI KHO ${unit.code || ""}`}
      confirmLabel="Lưu trạng thái"
      cancelLabel="Hủy"
      onConfirm={onConfirm}
      onClose={onClose}
    >
      <div className="fix-status-body">
        <div className="fix-status-current">
          <span>Trạng thái hiện tại:</span>
          <span className={`status-chip ${STATUS_LABELS[unit.status]?.class}`}>
            {STATUS_LABELS[unit.status]?.text}
          </span>
        </div>

        <div className="form-group mt-3">
          <label htmlFor="fix-status-select" className="form-label font-semibold">
            Trạng thái mới:
          </label>
          <select
            id="fix-status-select"
            className="form-input"
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
          >
            <option value="AVAILABLE">Trống (AVAILABLE)</option>
            <option value="PREPARING">Đang xử lý chuẩn bị (PREPARING)</option>
            <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
            <option value="RENTED">Đang thuê (RENTED)</option>
            <option value="RETIRED">Ngừng thuê (RETIRED)</option>
          </select>
        </div>

        <div className="form-group mt-3">
          <label htmlFor="fix-status-reason" className="form-label font-semibold">
            Lý do điều chỉnh (Bắt buộc lưu nhật ký):
          </label>
          <textarea
            id="fix-status-reason"
            className="form-textarea"
            rows={3}
            placeholder="Ví dụ: Khách đã bàn giao kho và dọn sạch đồ nhưng hệ thống chưa tự đổi; chuyển sang chuẩn bị..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
          />
          {error && (
            <div className="text-danger text-xs mt-1 font-semibold">
              {error}
            </div>
          )}
        </div>

        <div className="fix-status-audit-note">
          <ShieldCheck size={14} className="text-muted flex-shrink-0" />
          <span>Mọi thay đổi thủ công đều lưu lại tài khoản người thực hiện và đối chiếu khi kiểm toán.</span>
        </div>
      </div>
    </Modal>
  );
}
