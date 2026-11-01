import { useState, useRef } from "react";
import {
  ShieldCheck,
  Receipt,
  FileText,
  UploadSimple,
  Key,
  QrCode,
  IdentificationCard,
  CheckCircle,
  Eye,
  Camera,
  Image as ImageIcon,
  Copy,
  Check,
} from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import Button from "../../../components/Button/Button.jsx";
import ContractViewerModal from "../../../components/ContractModal/ContractViewerModal.jsx";
import { completeCheckinRitual } from "../../../services/taskService.js";
import { formatVND as formatVnd, PLACEHOLDER_UNIT_IMAGE } from "../../../utils/formatters.js";

export function CheckinRitualDrawer({ task, onClose, onSuccess, showToast }) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [idVerified, setIdVerified] = useState(true);
  const [showFullPassModal, setShowFullPassModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Ảnh thực tế (Base64 URL) — chỉ giữ trong phiên, không cache localStorage
  const [paymentPhotoUrl, setPaymentPhotoUrl] = useState(
    () => task?.ritual?.paymentProofPhoto || ""
  );
  const [contractPhotoUrl, setContractPhotoUrl] = useState(
    () => task?.ritual?.contractPhotoUrl || ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentFileInputRef = useRef(null);
  const contractFileInputRef = useRef(null);

  const handleCopyPin = async () => {
    const pin = task?.accessPin || "8842-Active";
    try {
      await navigator.clipboard.writeText(pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 1600);
    } catch {
      // ignore
    }
  };

  // Xử lý đọc file ảnh thật
  const handlePaymentFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleContractFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setContractPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!paymentPhotoUrl) {
      showToast?.("Bắt buộc: Vui lòng đính kèm ảnh chụp biên lai thu tiền mặt hoặc chuyển khoản ngân hàng!", "warning");
      return;
    }
    if (!contractPhotoUrl) {
      showToast?.("Bắt buộc: Vui lòng đính kèm ảnh chụp bản hợp đồng có chữ ký 2 bên!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeCheckinRitual(task.taskId, {
        paymentMethod,
        paymentProofPhoto: paymentPhotoUrl,
        contractPhotoUrl,
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
    <>
      <Drawer
        open={Boolean(task)}
        headerLabel={`QUY TRÌNH NHẬN KHO · ${task.refCode}`}
        subtitle={`Kho ${task.unitCode} · Khách hàng: ${task.customerName}`}
        badge={
          <span className="ritual-step-badge ritual-step-badge--active font-mono">
            BÀN GIAO TẠI QUẦY
          </span>
        }
        onClose={onClose}
        size="lg"
      >
        <div className="ritual-flow">
          {/* ── BƯỚC 1: THẺ NHẬN KHO CHO STAFF ĐỐI CHIẾU ── */}
          <div className={`ritual-step-card ${idVerified ? "is-completed" : "needs-attention"}`}>
            <div className="ritual-step-header">
              <span className="ritual-step-title">
                <ShieldCheck size={18} color="#16a34a" weight="bold" />
                1. Thẻ nhận kho đối chiếu (Check-in Pass)
              </span>
              <span className={`ritual-step-badge ${idVerified ? "ritual-step-badge--completed" : "ritual-step-badge--attention"}`}>
                {idVerified ? "✓ ĐÃ ĐỐI CHIẾU CCCD" : "⚠ CẦN ĐỐI CHIẾU"}
              </span>
            </div>

            {/* Khối Thẻ Nhận Kho mini đối chiếu tại quầy */}
            <div style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              padding: "12px",
              marginTop: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Mã đơn đặt chỗ:</span>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                    {task.refCode}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Vị trí kho:</span>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-primary)" }}>
                    Kho {task.unitCode}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "0.8rem", color: "#334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", borderTop: "1px dashed #cbd5e1", paddingTop: "8px" }}>
                <div>Khách hàng: <strong>{task.customerName}</strong></div>
                <div>Điện thoại: <strong>{task.customerPhone || "0901 234 567"}</strong></div>
                <div>CCCD đối chiếu: <strong>079198002345</strong></div>
                <div>Tiền cọc đã trả: <strong>{formatVnd(task.depositPaid || 180000)}</strong></div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px", borderTop: "1px solid #e2e8f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={idVerified}
                    onChange={(e) => setIdVerified(e.target.checked)}
                  />
                  <span>Đã đối chiếu đúng CCCD &amp; Thẻ nhận kho</span>
                </label>

                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "#0284c7", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  onClick={() => setShowFullPassModal(true)}
                >
                  <QrCode size={14} />
                  <span>Xem mã QR thẻ</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── BƯỚC 2: THU ĐỦ TIỀN THUÊ KỲ ĐẦU KÈM ẢNH MINH CHỨNG ── */}
          <div className={`ritual-step-card ${paymentPhotoUrl ? "is-completed" : "needs-attention"}`}>
            <div className="ritual-step-header">
              <span className="ritual-step-title">
                <Receipt size={18} weight="bold" />
                2. Thu đủ tiền thuê kỳ đầu tại quầy (Kèm ảnh)
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong style={{ color: "var(--color-accent, #dc2626)", fontSize: "0.95rem", fontFamily: "var(--font-mono)" }}>
                  {formatVnd(task.rentAmount || 1800000)}
                </strong>
                <span className={`ritual-step-badge ${paymentPhotoUrl ? "ritual-step-badge--completed" : "ritual-step-badge--attention"}`}>
                  {paymentPhotoUrl ? "✓ ĐÃ THU ĐỦ TIỀN" : "⚠ CHƯA ĐÍNH KÈM ẢNH"}
                </span>
              </div>
            </div>
            <p style={{ margin: "2px 0 8px 0", fontSize: "0.78rem", color: "var(--color-secondary)" }}>
              Quy định bắt buộc: Thu đủ 100% tiền thuê kỳ đầu và chụp ảnh biên nhận/giao dịch trước khi bàn giao.
            </p>

            {/* Chọn hình thức thu tiền */}
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                PHƯƠNG THỨC THU TIỀN:
              </label>
              <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={paymentMethod === "CASH"}
                    onChange={() => setPaymentMethod("CASH")}
                  />
                  <span>Tiền mặt (Cash)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="QR"
                    checked={paymentMethod === "QR"}
                    onChange={() => setPaymentMethod("QR")}
                  />
                  <span>Chuyển khoản (VietQR / Banking)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="POS"
                    checked={paymentMethod === "POS"}
                    onChange={() => setPaymentMethod("POS")}
                  />
                  <span>Quẹt thẻ POS</span>
                </label>
              </div>
            </div>

            {/* Upload ảnh thu tiền */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                ẢNH CHỨNG TỪ THU TIỀN (BIÊN LAI / ẢNH GIAO DỊCH CHUYỂN KHOẢN): <span style={{ color: "#dc2626" }}>*</span>
              </label>

              <input
                ref={paymentFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePaymentFileSelect}
              />

              {paymentPhotoUrl ? (
                <div style={{
                  padding: "8px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img
                      src={paymentPhotoUrl}
                      alt="Minh chứng thu tiền"
                      style={{ width: "48px", height: "48px", objectFit: "cover", border: "1px solid #86efac" }}
                    />
                    <div>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle size={14} weight="fill" /> Đã đính kèm ảnh thu tiền
                      </span>
                      <small style={{ fontSize: "0.7rem", color: "#64748b" }}>Phương thức: {paymentMethod === "CASH" ? "Tiền mặt" : paymentMethod === "QR" ? "Chuyển khoản VietQR" : "Thẻ POS"}</small>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Button size="small" variant="secondary" onClick={() => paymentFileInputRef.current?.click()}>
                      Đổi ảnh
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "14px",
                  background: "#fffbeb",
                  border: "1px dashed #f59e0b",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <UploadSimple size={24} color="#d97706" />
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#b45309" }}>
                    Chưa có ảnh chứng từ thu tiền
                  </span>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <Button size="small" variant="secondary" onClick={() => paymentFileInputRef.current?.click()}>
                      <UploadSimple size={14} /> Chọn ảnh từ máy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BƯỚC 3: ĐÍNH KÈM ẢNH HỢP ĐỒNG ĐÃ KÝ ── */}
          <div className={`ritual-step-card ${contractPhotoUrl ? "is-completed" : "needs-attention"}`}>
            <div className="ritual-step-header">
              <span className="ritual-step-title">
                <FileText size={18} weight="bold" />
                3. Chụp / Đính kèm ảnh hợp đồng đã ký
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={`ritual-step-badge ${contractPhotoUrl ? "ritual-step-badge--completed" : "ritual-step-badge--attention"}`}>
                  {contractPhotoUrl ? "✓ ĐÃ LƯU ẢNH HĐ" : "⚠ CHƯA CÓ ẢNH HĐ"}
                </span>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => setShowContractModal(true)}
                >
                  Xem mẫu HĐ
                </button>
              </div>
            </div>
            <p style={{ margin: "2px 0 8px 0", fontSize: "0.78rem", color: "var(--color-secondary)" }}>
              In bản hợp đồng cho khách ký, sau đó chụp ảnh trang có chữ ký 2 bên để lưu vào hồ sơ lưu trữ điện tử.
            </p>

            <input
              ref={contractFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleContractFileSelect}
            />

            {contractPhotoUrl ? (
              <div style={{
                padding: "8px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img
                    src={contractPhotoUrl}
                    alt="Hợp đồng đã ký"
                    style={{ width: "48px", height: "48px", objectFit: "cover", border: "1px solid #86efac" }}
                  />
                  <div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle size={14} weight="fill" /> Đã lưu ảnh hợp đồng có chữ ký
                    </span>
                    <small style={{ fontSize: "0.7rem", color: "#64748b" }}>Lưu trữ vĩnh viễn trên Activity Log</small>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <Button size="small" variant="secondary" onClick={() => contractFileInputRef.current?.click()}>
                    Đổi ảnh
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: "14px",
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}>
                <UploadSimple size={24} color="#64748b" />
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569" }}>
                  Chưa có ảnh chụp bản hợp đồng có chữ ký
                </span>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <Button size="small" variant="secondary" onClick={() => contractFileInputRef.current?.click()}>
                    <UploadSimple size={14} /> Chọn ảnh từ máy
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── BƯỚC 4: MỞ KHÓA MÃ PIN ACCESS CODE ── */}
          <div className={`ritual-step-card ${paymentPhotoUrl && contractPhotoUrl ? "is-completed" : ""}`}>
            <div className="ritual-step-header">
              <span className="ritual-step-title">
                <Key size={18} weight="bold" />
                4. Cấp mã PIN khóa điện tử cho khách
              </span>
              <span className={`ritual-step-badge ${paymentPhotoUrl && contractPhotoUrl ? "ritual-step-badge--completed" : "ritual-step-badge--attention"}`}>
                {paymentPhotoUrl && contractPhotoUrl ? "✓ ĐÃ KÍCH HOẠT PIN" : "🔒 KHÓA BẢO MẬT"}
              </span>
            </div>
            {paymentPhotoUrl && contractPhotoUrl ? (
              <div className="access-pin-reveal-box">
                <div className="access-pin-header">
                  <span className="access-pin-label font-mono">MÃ SỐ BÀN GIAO CHO KHÁCH (ACCESS PIN):</span>
                  <span className="access-pin-badge font-mono">ENCRYPTED IOT LOCK</span>
                </div>
                <div className="access-pin-row">
                  <div className="access-pin-number font-mono">{task.accessPin || "8842-Active"}</div>
                  <button
                    type="button"
                    className={`access-pin-copy-btn ${copiedPin ? "is-copied" : ""}`}
                    onClick={handleCopyPin}
                    title="Sao chép mã PIN nhanh"
                    aria-label="Sao chép mã PIN nhanh"
                  >
                    {copiedPin ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
                    <span>{copiedPin ? "ĐÃ CHÉP" : "CHÉP PIN"}</span>
                  </button>
                </div>
                <div className="access-pin-note font-mono">
                  ✓ Mã PIN tự động kích hoạt trên hệ thống khóa tự quản Cơ sở Tân Bình
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: "#f1f5f9", padding: "14px", fontSize: "0.8rem", color: "#64748b", textAlign: "center", border: "1px dashed #cbd5e1" }}>
                🔒 Mã PIN sẽ tự động hiển thị sau khi hoàn tất thu đủ tiền (kèm ảnh) và lưu ảnh hợp đồng ở Bước 2 &amp; 3.
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
              disabled={!paymentPhotoUrl || !contractPhotoUrl || !idVerified || isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Hoàn tất nhận kho & Bàn giao"}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal xem toàn văn hợp đồng */}
      <ContractViewerModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        contract={{ code: `HĐ-${task.refCode}` }}
        reservation={{ code: task.refCode, customerName: task.customerName, customerPhone: task.customerPhone, unitCode: task.unitCode }}
      />

      {/* Modal xem Thẻ nhận kho đầy đủ có QR */}
      {showFullPassModal && (
        <div className="contract-modal-backdrop" onClick={() => setShowFullPassModal(false)}>
          <div className="contract-modal-card" style={{ maxWidth: "420px", padding: "24px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>THẺ NHẬN KHO (CHECK-IN PASS)</h3>
            <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "#64748b" }}>Đối chiếu với màn hình điện thoại của khách hàng</p>
            <div style={{ display: "inline-block", padding: "16px", background: "#ffffff", border: "2px solid #0f172a", marginBottom: "16px" }}>
              <QrCode size={140} weight="bold" />
              <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: "8px" }}>
                {task.refCode}
              </div>
            </div>
            <div style={{ textAlign: "left", fontSize: "0.82rem", background: "#f8fafc", padding: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div>Khách hàng: <strong>{task.customerName}</strong></div>
              <div>Số điện thoại: <strong>{task.customerPhone}</strong></div>
              <div>Kho được cấp: <strong>{task.unitCode}</strong></div>
              <div>Mã PIN truy cập: <strong style={{ color: "#16a34a" }}>{task.accessPin || "8842-Active"}</strong></div>
            </div>
            <Button style={{ marginTop: "16px" }} fullWidth onClick={() => setShowFullPassModal(false)}>
              Đóng đối chiếu
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
