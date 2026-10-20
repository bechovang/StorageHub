import Modal from "../../../components/Modal/Modal.jsx";

export default function ResolveTicketModal({
  ticket,
  onClose,
  onSubmit,
  resolutionNote,
  setResolutionNote,
  resolveError,
}) {
  if (!ticket) return null;

  return (
    <Modal
      isOpen={!!ticket}
      onClose={onClose}
      title="XỬ LÝ HOÀN TẤT SỰ CỐ"
    >
      <form onSubmit={onSubmit} className="modal-form-grid">
        {resolveError && (
          <div style={{ color: "var(--color-accent)", fontSize: "0.82rem", background: "#fef2f2", padding: "8px 12px", border: "1px solid var(--color-accent)" }}>
            {resolveError}
          </div>
        )}
        <p style={{ margin: 0, fontSize: "0.85rem" }}>
          Ghi nhận kết quả xử lý cho yêu cầu <strong>{ticket.code}</strong> (Ô kho {ticket.unitCode} - {ticket.customerName}):
        </p>

        <div className="form-field">
          <label className="form-field__label">Ghi chú giải quyết cho khách hàng *</label>
          <textarea
            required
            rows={3}
            className="form-field__textarea"
            placeholder="Đã tra dầu bản lề / Cấp lại mã PIN mới / Vệ sinh sàn sạch sẽ..."
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn btn--primary">
            Xác nhận xử lý xong
          </button>
        </div>
      </form>
    </Modal>
  );
}
