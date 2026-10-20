import Modal from "../../../components/Modal/Modal.jsx";

export function RoleChangeModal({
  user,
  onClose,
  onSubmit,
  targetRole,
  setTargetRole,
  roleReason,
  setRoleReason,
  roleError,
  isSubmitting,
}) {
  if (!user) return null;

  return (
    <Modal
      isOpen={Boolean(user)}
      onClose={onClose}
      title="ĐỔI VAI TRÒ NGƯỜI DÙNG"
    >
      <form onSubmit={onSubmit} className="modal-form-grid">
        {roleError && (
          <div
            style={{
              color: "var(--color-accent)",
              fontSize: "0.82rem",
              background: "#fef2f2",
              padding: "8px 12px",
              border: "1px solid var(--color-accent)",
            }}
          >
            {roleError}
          </div>
        )}
        <div>
          Đổi vai trò cho tài khoản: <strong>{user.fullName}</strong> ({user.email})
        </div>

        <div className="form-field">
          <label className="form-field__label">Vai trò mới *</label>
          <select
            className="form-field__select"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          >
            <option value="STAFF">Staff (Nhân viên kho)</option>
            <option value="FACILITY_MANAGER">Facility Manager (Quản lý cơ sở)</option>
            <option value="BUSINESS_OPS">Business Ops (Vận hành kinh doanh)</option>
            <option value="SYSTEM_ADMIN">System Admin (Quản trị hệ thống)</option>
            <option value="CUSTOMER">Customer (Khách thuê)</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-field__label">Lý do thay đổi (Bắt buộc kiểm toán) *</label>
          <textarea
            required
            rows={3}
            className="form-field__textarea"
            placeholder="Ghi rõ lý do điều chuyển hoặc phân quyền bổ sung..."
            value={roleReason}
            onChange={(e) => setRoleReason(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          <button
            type="button"
            className="btn btn--outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang cập nhật..." : "Lưu & Ghi nhận kiểm toán"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
