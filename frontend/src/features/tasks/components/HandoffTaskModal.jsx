import { useState } from "react";
import Modal from "../../../components/Modal/Modal.jsx";
import Button from "../../../components/Button/Button.jsx";

export default function HandoffTaskModal({
  task,
  staffList = [],
  submitting = false,
  error = "",
  onClose,
  onConfirm,
}) {
  const [staffId, setStaffId] = useState("");
  const [reason, setReason] = useState("");

  if (!task) return null;

  return (
    <Modal isOpen title={`Chuyển task · ${task.refCode || task.type}`} onClose={onClose} showFooter={false}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (staffId) onConfirm({ staffId: Number(staffId), reason });
        }}
        className="modal-form-grid"
      >
        {error && (
          <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
            {error}
          </div>
        )}
        <p style={{ margin: 0, fontSize: "0.85rem" }}>
          Task hiện thuộc <strong>{task.assignedStaff?.fullName || "chưa có người nhận"}</strong>.
        </p>
        <div className="form-field">
          <label className="form-field__label">Nhân viên nhận task *</label>
          <select
            className="form-field__input"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            required
          >
            <option value="">-- Chọn nhân viên --</option>
            {staffList
              .filter((s) => s.id !== task.assignedStaff?.staffId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} {s.code ? `(${s.code})` : ""}
                </option>
              ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-field__label">Lý do chuyển</label>
          <textarea
            rows={3}
            className="form-field__textarea"
            placeholder="Hết ca / cần hỗ trợ / lý do khác..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={!staffId || submitting}>
            {submitting ? "Đang chuyển..." : "Chuyển task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
