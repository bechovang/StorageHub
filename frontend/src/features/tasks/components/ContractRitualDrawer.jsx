import { useRef, useState } from "react";
import { FileText, UploadSimple } from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import Button from "../../../components/Button/Button.jsx";
import { completeContractRitual } from "../../../services/taskService.js";

export function ContractRitualDrawer({ task, onClose, onSuccess, showToast }) {
  const [photoUrl, setPhotoUrl] = useState(task.ritual?.contractPhotoUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleConfirmSignature = async () => {
    if (!photoUrl) return;
    setIsSubmitting(true);
    try {
      await completeContractRitual(task.taskId, { contractPhotoUrl: photoUrl });
      showToast?.(`Đã hoàn tất lưu hồ sơ hợp đồng/phụ lục ${task.refCode}!`, "success");
      onSuccess();
    } catch (err) {
      showToast?.(err.message || "Lỗi khi lưu chữ ký hợp đồng", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={Boolean(task)}
      headerLabel={`KÝ HỢP ĐỒNG / PHỤ LỤC · ${task.refCode}`}
      subtitle={`Kho ${task.unitCode} · Khách hàng: ${task.customerName}`}
      badge={
        <span className="ritual-step-badge ritual-step-badge--active font-mono">
          HỒ SƠ PHÁP LÝ
        </span>
      }
      onClose={onClose}
      size="lg"
    >
      <div className="ritual-flow">
        {/* Thông tin hợp đồng / phụ lục */}
        <div className="ritual-step-card is-completed">
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <FileText size={18} weight="bold" />
              1. Hồ sơ pháp lý cần đối chiếu chữ ký
            </span>
            <span className="ritual-step-badge ritual-step-badge--completed">
              ✓ ĐÃ ĐỐI CHIẾU
            </span>
          </div>
          <div style={{ fontSize: "0.82rem" }}>
            <p style={{ margin: "4px 0" }}>Khách hàng: <strong>{task.customerName}</strong> ({task.customerPhone || "Khách tại quầy"})</p>
            <p style={{ margin: "4px 0" }}>Vị trí kho: <strong>{task.unitCode}</strong> · Mã hồ sơ: <strong>{task.refCode}</strong></p>
            {task.alertNote && (
              <div style={{ backgroundColor: "#ecfdf5", padding: "8px 10px", border: "1px solid #a7f3d0", marginTop: "8px", color: "#065f46" }}>
                <strong>Ghi chú:</strong> {task.alertNote}
              </div>
            )}
          </div>
        </div>

        {/* Chụp / Tải ảnh bản hợp đồng giấy có chữ ký */}
        <div className={`ritual-step-card ${photoUrl ? "is-completed" : "needs-attention"}`}>
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <UploadSimple size={18} weight="bold" />
              2. Đính kèm ảnh chụp hợp đồng đã ký
            </span>
            <span className={`ritual-step-badge ${photoUrl ? "ritual-step-badge--completed" : "ritual-step-badge--attention"}`}>
              {photoUrl ? "✓ ĐÃ LƯU ẢNH BẢN KÝ" : "⚠ CẦN CHỤP ẢNH BẢN KÝ"}
            </span>
          </div>
          <p style={{ margin: "2px 0 10px 0", fontSize: "0.78rem", color: "var(--color-secondary)" }}>
            Nhân viên đối chiếu chữ ký của khách hàng trên bản in giấy và chụp lại trang có chữ ký để lưu vào hệ thống.
          </p>

          <div
            className="ritual-photo-dropzone"
            onClick={() => fileInputRef.current?.click()}
            title="Bấm để chụp hoặc tải ảnh bản ký"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onClick={(e) => e.stopPropagation()}
              onChange={handleFileSelect}
            />
            {photoUrl ? (
              <div className="ritual-photo-preview">
                <img src={photoUrl} alt="Hợp đồng đã ký" />
                <span className="photo-preview-tag">✓ Đã chụp ảnh hợp đồng có chữ ký</span>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 12px" }}>
                <UploadSimple size={32} weight="bold" color="#64748b" />
                <p style={{ margin: "6px 0 0 0", fontWeight: 600 }}>
                  Chụp ảnh bản hợp đồng đã ký tên
                </p>
                <small style={{ color: "#94a3b8" }}>Hỗ trợ camera quầy hoặc tệp ảnh JPG/PNG</small>
              </div>
            )}
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleConfirmSignature} disabled={!photoUrl || isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Xác nhận & Lưu hồ sơ"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
