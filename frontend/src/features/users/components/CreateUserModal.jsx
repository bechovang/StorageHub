import { ShieldCheck, Copy } from "@phosphor-icons/react";
import Modal from "../../../components/Modal/Modal.jsx";
import { getRoleLabel } from "../../../utils/statusLabels.js";

export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  createdSuccessData,
  createName,
  setCreateName,
  createEmail,
  setCreateEmail,
  createPhone,
  setCreatePhone,
  createRole,
  setCreateRole,
  createError,
  copied,
  onCopy,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CẤP TÀI KHOẢN MỚI CHO HỆ THỐNG"
    >
      {createdSuccessData ? (
        <div>
          <div
            style={{
              color: "var(--color-status-success)",
              fontWeight: 700,
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ShieldCheck size={20} />
            <span>Tài khoản đã được tạo thành công!</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-secondary)", marginBottom: "16px" }}>
            Vui lòng sao chép thông tin đăng nhập dưới đây để bàn giao cho nhân sự. Mật khẩu tạm này sẽ yêu cầu đổi trong lần đăng nhập đầu tiên.
          </p>

          <div className="temp-password-box">
            <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: 700 }}>
              MẬT KHẨU TẠM (CHỈ HIỂN THỊ MỘT LẦN):
            </div>
            <div className="temp-password-val">{createdSuccessData.tempPassword}</div>
            <div style={{ fontSize: "0.78rem", color: "#854d0e" }}>
              Email: <strong>{createdSuccessData.user.email}</strong> | Vai trò:{" "}
              <strong>{getRoleLabel(createdSuccessData.user.role)}</strong>
            </div>
          </div>

          <div style={{ marginTop: "24px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() =>
                onCopy(
                  `Email: ${createdSuccessData.user.email}\nMật khẩu tạm: ${createdSuccessData.tempPassword}`
                )
              }
            >
              <Copy size={14} />
              <span>{copied ? "Đã sao chép!" : "Sao chép thông tin"}</span>
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={onClose}
            >
              Xong
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="modal-form-grid">
          {createError && (
            <div
              style={{
                color: "var(--color-accent)",
                fontSize: "0.82rem",
                background: "#fef2f2",
                padding: "8px 12px",
                border: "1px solid var(--color-accent)",
              }}
            >
              {createError}
            </div>
          )}
          <div className="form-field">
            <label className="form-field__label">Họ và tên nhân sự / khách hàng *</label>
            <input
              type="text"
              required
              className="form-field__input"
              placeholder="Nguyễn Văn A"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">Email đăng nhập *</label>
            <input
              type="email"
              required
              className="form-field__input"
              placeholder="ten@demo.storagehub.vn"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">Số điện thoại liên hệ *</label>
            <input
              type="tel"
              required
              className="form-field__input"
              placeholder="0901234567"
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">Vai trò hệ thống *</label>
            <select
              className="form-field__select"
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value)}
            >
              <option value="STAFF">Staff (Nhân viên kho)</option>
              <option value="FACILITY_MANAGER">Facility Manager (Quản lý cơ sở)</option>
              <option value="BUSINESS_OPS">Business Ops (Vận hành kinh doanh)</option>
              <option value="SYSTEM_ADMIN">System Admin (Quản trị hệ thống)</option>
              <option value="CUSTOMER">Customer (Khách thuê)</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button type="button" className="btn btn--outline" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn--primary">
              Tạo tài khoản & Cấp mật khẩu tạm
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
