import Modal from "../../../components/Modal/Modal.jsx";

export default function EscalateTicketModal({
  ticket,
  onClose,
  onSubmit,
  escalateReason,
  setEscalateReason,
  escalateError,
}) {
  if (!ticket) return null;

  return (
    <Modal
      isOpen={!!ticket}
      onClose={onClose}
      title="CHUYỂN TIẾP LÊN QUẢN LÝ CƠ SỞ (ESCALATE)"
    >
      <form onSubmit={onSubmit} className="modal-form-grid">
        {escalateError && (
          <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
            {escalateError}
          </div>
        )}
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-accent)" }}>
          Sự cố nghiêm trọng vượt thẩm quyền xử lý của nhân viên ca trực tại kho {ticket.unitCode} sẽ được chuyển tiếp thẳng vào hộp thư của Facility Manager.
        </p>

        <div className="form-field">
          <label className="form-field__label">Lý do chuyển tiếp (Bắt buộc) *</label>
          <textarea
            required
            rows={3}
            className="form-field__textarea"
            placeholder="Ví dụ: Rò rỉ nước từ mái, nguy cơ ảnh hưởng hàng hóa cần duyệt di dời khẩn cấp..."
            value={escalateReason}
            onChange={(e) => setEscalateReason(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn btn--danger">
            Xác nhận chuyển Quản lý
          </button>
        </div>
      </form>
    </Modal>
  );
}
