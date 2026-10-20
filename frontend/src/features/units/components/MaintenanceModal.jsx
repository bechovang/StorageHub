import Modal from "../../../components/Modal/Modal.jsx";

export function MaintenanceModal({
  unit,
  reason,
  setReason,
  onConfirm,
  onClose,
}) {
  if (!unit) return null;

  return (
    <Modal
      open={Boolean(unit)}
      title={`ĐƯA KHO ${unit.code || ""} VÀO BẢO TRÌ`}
      confirmLabel="Xác nhận Bảo trì"
      cancelLabel="Hủy"
      onConfirm={onConfirm}
      onClose={onClose}
    >
      <div className="maintenance-modal-body">
        <p>
          Kho <strong>{unit.code}</strong> sẽ được tạm khóa khỏi danh mục khả dụng để tiến hành kiểm tra, sửa chữa hoặc nâng cấp.
        </p>
        <div className="form-group mt-3">
          <label htmlFor="maint-reason" className="form-label font-semibold">
            Lý do đưa vào bảo trì (Bắt buộc):
          </label>
          <textarea
            id="maint-reason"
            className="form-textarea"
            rows={3}
            placeholder="Ví dụ: Thay pin khóa thông minh SmartLock, sửa tay nắm cửa, khử ẩm..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
