import { useState } from "react";
import {
  ShieldCheck,
  Receipt,
  FileText,
  UploadSimple,
  Key,
} from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import Button from "../../../components/Button/Button.jsx";
import { completeCheckinRitual } from "../../../services/taskService.js";
import { formatVND as formatVnd, PLACEHOLDER_UNIT_IMAGE } from "../../../utils/formatters.js";

export function CheckinRitualDrawer({ task, onClose, onSuccess, showToast }) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [photoUploaded, setPhotoUploaded] = useState(Boolean(task.ritual?.contractPhotoUrl));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSimulateUpload = () => {
    setPhotoUploaded(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await completeCheckinRitual(task.taskId, {
        paymentMethod,
        contractPhotoUrl: PLACEHOLDER_UNIT_IMAGE,
        accessPin: task.accessPin || "8842-Active",
      });
      showToast?.(`Hoàn tất nhận kho ${task.refCode} thành công! Mã PIN đã được kích hoạt.`, "success");
      onSuccess();
    } catch (err) {
      showToast?.(err.message || "Lỗi khi hoàn tất check-in", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={Boolean(task)}
      headerLabel={`QUY TRÌNH NHẬN KHO · ${task.refCode}`}
      onClose={onClose}
    >
      <div className="ritual-flow">
        {/* Bước 1: Xác thực đơn cọc */}
        <div className="ritual-step-card is-completed">
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <ShieldCheck size={18} color="#16a34a" weight="bold" />
              1. Xác nhận đơn & Tiền cọc đã trả
            </span>
            <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700 }}>
              ✓ ĐÃ THANH TOÁN
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-secondary)" }}>
            Khách hàng: <strong>{task.customerName}</strong> ({task.customerPhone}) · Kho: <strong>{task.unitCode}</strong>
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", paddingTop: "4px" }}>
            <span>Tiền cọc giữ chỗ (10%):</span>
            <strong>{formatVnd(task.depositPaid || 180000)}</strong>
          </div>
        </div>

        {/* Bước 2: Thu 100% tiền thuê tại quầy */}
        <div className="ritual-step-card">
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <Receipt size={18} weight="bold" />
              2. Thu tiền thuê kỳ đầu tại quầy
            </span>
            <strong style={{ color: "var(--color-accent)", fontSize: "0.92rem" }}>
              {formatVnd(task.rentAmount || 1800000)}
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-secondary)" }}>
            Quy định: Thu đủ tiền thuê kỳ đầu trước khi bàn giao kho cho khách.
          </p>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
              PHƯƠNG THỨC THU TIỀN:
            </label>
            <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === "CASH"}
                  onChange={() => setPaymentMethod("CASH")}
                />
                Tiền mặt
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="QR"
                  checked={paymentMethod === "QR"}
                  onChange={() => setPaymentMethod("QR")}
                />
                Quét mã QR PayOS
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="POS"
                  checked={paymentMethod === "POS"}
                  onChange={() => setPaymentMethod("POS")}
                />
                Quẹt thẻ POS
              </label>
            </div>
          </div>
        </div>

        {/* Bước 3: Đính kèm ảnh hợp đồng đã ký */}
        <div className="ritual-step-card">
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <FileText size={18} weight="bold" />
              3. Chụp / Đính kèm ảnh hợp đồng đã ký
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-secondary)" }}>
            In bản hợp đồng mẫu cho khách ký, sau đó chụp ảnh trang có chữ ký 2 bên để lưu vào nhật ký hợp đồng (ActivityLog CONTRACT_SIGNED).
          </p>
          <div
            className="ritual-photo-preview"
            onClick={handleSimulateUpload}
            title="Bấm để tải ảnh mẫu"
          >
            {photoUploaded ? (
              <div style={{ textAlign: "center", color: "#16a34a" }}>
                <ShieldCheck size={32} weight="bold" />
                <p style={{ margin: "4px 0 0 0", fontWeight: 700 }}>Đã tải lên ảnh hợp đồng có chữ ký</p>
                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>(Bấm để thay đổi ảnh)</span>
              </div>
            ) : (
              <>
                <UploadSimple size={24} />
                <span>Bấm vào đây để tải ảnh hoặc mở camera chụp hợp đồng</span>
              </>
            )}
          </div>
        </div>

        {/* Bước 4: Mở khóa Access Code PIN */}
        <div className="ritual-step-card">
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <Key size={18} weight="bold" />
              4. Cấp mã PIN khóa điện tử cho khách
            </span>
          </div>
          {photoUploaded ? (
            <div className="access-pin-reveal-box">
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#94a3b8" }}>MÃ SỐ BÀN GIAO CHO KHÁCH:</p>
              <div className="access-pin-number">{task.accessPin || "8842-Active"}</div>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#34d399" }}>
                ✓ Mã đã được kích hoạt trên hệ thống khóa tự quản Cơ sở Tân Bình
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: "#f1f5f9", padding: "12px", fontSize: "0.78rem", color: "#64748b", textAlign: "center" }}>
              🔒 Mã PIN sẽ hiển thị sau khi tải lên ảnh hợp đồng đã ký ở Bước 3.
            </div>
          )}
        </div>

        {/* Nút hành động chốt */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
          <Button variant="secondary" onClick={onClose}>
            Hủy / Đóng
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!photoUploaded || isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : "Hoàn tất nhận kho & Bàn giao"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
