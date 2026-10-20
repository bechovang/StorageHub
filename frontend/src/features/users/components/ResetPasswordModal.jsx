import { ShieldCheck, Copy } from "@phosphor-icons/react";
import Modal from "../../../components/Modal/Modal.jsx";

export function ResetPasswordModal({
  user,
  onClose,
  onConfirmReset,
  resetSuccessPass,
  copied,
  onCopy,
}) {
  if (!user) return null;

  return (
    <Modal
      isOpen={Boolean(user)}
      onClose={onClose}
      title="CẤP LẠI MẬT KHẨU TẠM"
    >
      {resetSuccessPass ? (
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
            <span>Đã cấp mật khẩu tạm mới thành công!</span>
          </div>
          <div className="temp-password-box">
            <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: 700 }}>
              MẬT KHẨU TẠM MỚI:
            </div>
            <div className="temp-password-val">{resetSuccessPass}</div>
          </div>

          <div style={{ marginTop: "24px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => onCopy(resetSuccessPass)}
            >
              <Copy size={14} />
              <span>{copied ? "Đã sao chép!" : "Sao chép mật khẩu"}</span>
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-secondary)" }}>
            Bạn có chắc chắn muốn cấp lại mật khẩu tạm cho người dùng{" "}
            <strong>{user.fullName}</strong> ({user.email})? Mật khẩu cũ sẽ bị vô hiệu hóa ngay lập tức.
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button type="button" className="btn btn--outline" onClick={onClose}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={onConfirmReset}
            >
              Cấp mật khẩu tạm mới
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
