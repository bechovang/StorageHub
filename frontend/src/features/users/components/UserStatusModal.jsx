import Modal from "../../../components/Modal/Modal.jsx";

export function UserStatusModal({
  user,
  targetStatus,
  onClose,
  onSubmit,
  statusReason,
  setStatusReason,
  statusError,
}) {
  if (!user) return null;

  return (
    <Modal
      isOpen={Boolean(user)}
      onClose={onClose}
      title={targetStatus === 2 ? "KHÓA TÀI KHOẢN NGƯỜI DÙNG" : "MỞ KHÓA TÀI KHOẢN"}
    >
      <form onSubmit={onSubmit} className="modal-form-grid">
        {statusError && (
          <div
            style={{
              color: "var(--color-accent)",
              fontSize: "0.82rem",
              background: "#fef2f2",
              padding: "8px 12px",
              border: "1px solid var(--color-accent)",
            }}
          >
            {statusError}
          </div>
        )}
        <p style={{ fontSize: "0.85rem", color: "var(--color-secondary)", margin: 0 }}>
          {targetStatus === 2
            ? `Bạn đang thực hiện khóa tài khoản của ${user.fullName} (${user.email}). Tài khoản này sẽ không thể đăng nhập vào hệ thống ngay lập tức.`
            : `Bạn đang mở khóa tài khoản cho ${user.fullName} (${user.email}).`}
        </p>

        <div className="form-field">
          <label className="form-field__label">Lý do thay đổi trạng thái (Bắt buộc) *</label>
          <textarea
            required
            rows={3}
            className="form-field__textarea"
            placeholder="Nhân viên đã nghỉ việc / Yêu cầu bảo mật / Hết thời hạn kỷ luật..."
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            className={targetStatus === 2 ? "btn btn--danger" : "btn btn--primary"}
          >
            {targetStatus === 2 ? "Xác nhận khóa" : "Xác nhận mở khóa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
