import { useState, useRef } from "react";
import {
  ListChecks,
  WarningCircle,
  Receipt,
  X,
  UploadSimple,
  Camera,
  Eye,
  CheckCircle,
  Bank,
  FileText,
  QrCode,
} from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import Button from "../../../components/Button/Button.jsx";
import ContractViewerModal from "../../../components/ContractModal/ContractViewerModal.jsx";
import { completeCheckoutRitual } from "../../../services/taskService.js";
import { formatVND as formatVnd } from "../../../utils/formatters.js";

export function CheckoutRitualDrawer({ task, onClose, onSuccess, showToast }) {
  const [checklist, setChecklist] = useState(
    task?.ritual?.checklist || {
      accessCard: "OK",
      padlock: "OK",
      cleanliness: "OK",
      structure: "OK",
    }
  );

  const [charges, setCharges] = useState(
    task?.ritual?.damageCharges || []
  );

  const [newChargeItem, setNewChargeItem] = useState("");
  const [newChargeAmount, setNewChargeAmount] = useState("");
  const [newChargeReason, setNewChargeReason] = useState("");
  const [settlementMethod, setSettlementMethod] = useState(
    task?.ritual?.settlementMethod || "TRANSFER"
  );

  // Ảnh đối soát thanh toán cọc / phụ phí thực tế (Base64 URL) — không cache localStorage
  const [settlementPhotoUrl, setSettlementPhotoUrl] = useState(
    () => task?.ritual?.settlementPhotoUrl || ""
  );

  const [showContractModal, setShowContractModal] = useState(false);
  const [showFullPhotoModal, setShowFullPhotoModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settlementFileInputRef = useRef(null);

  const depositHeld = task?.depositAmount || 360000;
  const totalCharges = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const refundAmount = Math.max(0, depositHeld - totalCharges);
  const extraDue = Math.max(0, totalCharges - depositHeld);

  // Xử lý đọc file ảnh thật từ máy/thiết bị
  const handleSettlementFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSettlementPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddCharge = () => {
    if (!newChargeItem.trim() || !newChargeAmount || Number(newChargeAmount) <= 0 || !newChargeReason.trim()) {
      showToast?.(
        "Quy định: Phụ phí bồi thường bắt buộc phải có tên hạng mục, số tiền > 0 và lý do hư hại cụ thể!",
        "warning"
      );
      return;
    }

    setCharges([
      ...charges,
      {
        id: Date.now(),
        item: newChargeItem.trim(),
        amount: Number(newChargeAmount),
        reason: newChargeReason.trim(),
      },
    ]);

    setNewChargeItem("");
    setNewChargeAmount("");
    setNewChargeReason("");
  };

  const handleRemoveCharge = (id) => {
    setCharges(charges.filter((c) => c.id !== id));
  };

  const handleConfirmCheckout = async () => {
    // Validate lý do phụ phí bắt buộc
    const invalid = charges.some((c) => !c.reason || !c.amount || c.amount <= 0);
    if (invalid) {
      showToast?.(
        "Không thể đóng hợp đồng thuê: Mọi khoản phụ phí hư hại bắt buộc có số tiền và lý do giải trình!",
        "warning"
      );
      return;
    }

    // Bắt buộc minh chứng ảnh đối soát tiền hoàn hoặc tiền thu thêm
    if (!settlementPhotoUrl) {
      if (refundAmount > 0) {
        showToast?.(
          "Bắt buộc: Vui lòng đính kèm ảnh chụp ủy nhiệm chi / bill chuyển khoản hoàn cọc hoặc biên nhận tiền mặt!",
          "warning"
        );
      } else if (extraDue > 0) {
        showToast?.(
          "Bắt buộc: Vui lòng đính kèm ảnh chụp biên lai thu tiền mặt hoặc xác nhận chuyển khoản ngân hàng của khách!",
          "warning"
        );
      } else {
        showToast?.(
          "Bắt buộc: Vui lòng đính kèm ảnh chụp biên bản thanh lý và nghiệm thu bàn giao kho!",
          "warning"
        );
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await completeCheckoutRitual(task.taskId, {
        checklist,
        damageCharges: charges,
        refundAmount,
        extraCharged: extraDue,
        settlementMethod,
        settlementPhotoUrl,
      });

      const messageDetail =
        refundAmount > 0
          ? `Đã hoàn tất tất toán cho đơn ${task.refCode}! Đã hoàn trả cọc ${formatVnd(refundAmount)} cho khách.`
          : extraDue > 0
          ? `Đã hoàn tất tất toán cho đơn ${task.refCode}! Đã thu thêm ${formatVnd(extraDue)} phụ phí từ khách.`
          : `Đã hoàn tất thanh lý hợp đồng cho đơn ${task.refCode} (Cân bằng 0₫)!`;

      showToast?.(
        `${messageDetail} Đã lưu ảnh minh chứng và tự động tạo Task dọn kho cho ${task.unitCode}.`,
        "success"
      );
      onSuccess();
    } catch (err) {
      showToast?.(err.message || "Lỗi khi xử lý tất toán", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Drawer
        open={Boolean(task)}
        headerLabel={`THỦ TỤC TRẢ KHO · ${task?.refCode || ""}`}
        onClose={onClose}
      >
        <div className="ritual-flow">
          {/* ── BƯỚC 1: KIỂM TRA HIỆN TRẠNG & THU HỒI TÀI SẢN ── */}
          <div className="ritual-step-card">
            <div className="ritual-step-header">
              <span className="ritual-step-title">
                <ListChecks size={18} weight="bold" />
                1. Kiểm tra hiện trạng & Thu hồi tài sản
              </span>
            </div>
            <table className="inspection-table">
              <thead>
                <tr>
                  <th>Hạng mục</th>
                  <th>Tình trạng</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "accessCard", label: "Thẻ từ / Khóa chip" },
                  { key: "padlock", label: "Ổ khóa số / Chốt an toàn" },
                  { key: "cleanliness", label: "Vệ sinh sàn & tường" },
                  { key: "structure", label: "Kết cấu vách ngăn & cửa cuốn" },
                ].map((item) => (
                  <tr key={item.key}>
                    <td><strong>{item.label}</strong></td>
                    <td>
                      <div className="inspection-radio-group">
                        <label className="inspection-radio-label">
                          <input
                            type="radio"
                            name={item.key}
                            value="OK"
                            checked={checklist[item.key] === "OK"}
                            onChange={() => setChecklist({ ...checklist, [item.key]: "OK" })}
                          />
                          OK
                        </label>
                        <label className="inspection-radio-label">
                          <input
                            type="radio"
                            name={item.key}
                            value="MINOR"
                            checked={checklist[item.key] === "MINOR"}
                            onChange={() => setChecklist({ ...checklist, [item.key]: "MINOR" })}
                          />
                          Hư hại nhẹ
                        </label>
                        <label className="inspection-radio-label">
                          <input
                            type="radio"
                            name={item.key}
                            value="MAJOR"
                            checked={checklist[item.key] === "MAJOR"}
                            onChange={() => setChecklist({ ...checklist, [item.key]: "MAJOR" })}
                          />
                          Nghiêm trọng
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── BƯỚC 2: KÊ KHAI PHỤ PHÍ HƯ HẠI (BẮT BUỘC LÝ DO) ── */}
          <div className="ritual-step-card">
            <div className="ritual-step-header">
              <span className="ritual-step-title">
                <WarningCircle size={18} weight="bold" color="var(--color-accent)" />
                2. Kê khai phụ phí hư hại (Bắt buộc lý do)
              </span>
            </div>
            {charges.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#16a34a" }}>
                ✓ Không ghi nhận hư hại tài sản. Toàn bộ tiền cọc sẽ được hoàn trả cho khách.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {charges.map((c) => (
                  <div
                    key={c.id}
                    className="damage-charge-item"
                    style={{ padding: "8px", background: "#fef2f2", border: "1px solid #fecaca" }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.8rem", color: "#991b1b" }}>{c.item}</strong>
                      <div style={{ fontSize: "0.74rem", color: "#7f1d1d" }}>Lý do: {c.reason}</div>
                    </div>
                    <strong style={{ textAlign: "right", fontSize: "0.85rem", color: "#991b1b" }}>
                      {formatVnd(c.amount)}
                    </strong>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                      onClick={() => handleRemoveCharge(c.id)}
                      title="Xóa phụ phí"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form thêm phụ phí */}
            <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--color-secondary)" }}>
                + THÊM KHOẢN PHẠT / PHỤ PHÍ MỚI:
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "6px" }}>
                <input
                  type="text"
                  placeholder="Tên hạng mục (vd: Mất chìa khóa, vách trầy xước)"
                  value={newChargeItem}
                  onChange={(e) => setNewChargeItem(e.target.value)}
                  style={{ padding: "6px 8px", fontSize: "0.78rem", border: "1px solid #cbd5e1" }}
                />
                <input
                  type="number"
                  placeholder="Số tiền (₫)"
                  value={newChargeAmount}
                  onChange={(e) => setNewChargeAmount(e.target.value)}
                  style={{ padding: "6px 8px", fontSize: "0.78rem", border: "1px solid #cbd5e1" }}
                />
              </div>
              <input
                type="text"
                placeholder="Ghi rõ lý do hư hại cụ thể (bắt buộc để đối soát)..."
                value={newChargeReason}
                onChange={(e) => setNewChargeReason(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "0.78rem", border: "1px solid #cbd5e1" }}
              />
              <Button size="small" variant="secondary" onClick={handleAddCharge} style={{ alignSelf: "flex-end" }}>
                Thêm khoản phạt
              </Button>
            </div>
          </div>

          {/* ── BƯỚC 3: BẢNG ĐỐI SOÁT TẤT TOÁN CỌC (SETTLEMENT) ── */}
          <div className="ritual-step-card is-completed">
            <div className="ritual-step-header">
              <span className="ritual-step-title">
                <Receipt size={18} weight="bold" />
                3. Bảng đối soát tất toán cọc (Settlement)
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tiền cọc ban đầu đang giữ:</span>
                <strong>{formatVnd(depositHeld)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#dc2626" }}>
                <span>Tổng phụ phí bồi thường hư hại:</span>
                <strong>- {formatVnd(totalCharges)}</strong>
              </div>
              <div
                style={{
                  borderTop: "1px solid #cbd5e1",
                  paddingTop: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.95rem",
                }}
              >
                <span>
                  {extraDue > 0
                    ? "KHÁCH PHẢI NỘP THÊM CHÊNH LỆCH:"
                    : refundAmount > 0
                    ? "SỐ TIỀN HOÀN TRẢ LẠI CHO KHÁCH:"
                    : "ĐỐI SOÁT CÂN BẰNG (0₫ CHÊNH LỆCH):"}
                </span>
                <strong
                  style={{
                    color: extraDue > 0 ? "#dc2626" : refundAmount > 0 ? "#16a34a" : "#0f172a",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {extraDue > 0
                    ? `+ ${formatVnd(extraDue)}`
                    : refundAmount > 0
                    ? `- ${formatVnd(refundAmount)}`
                    : "0 ₫"}
                </strong>
              </div>
            </div>

            {/* Thông tin phương thức thanh toán/hoàn trả */}
            <div style={{ marginTop: "10px", borderTop: "1px dashed #cbd5e1", paddingTop: "10px" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, marginBottom: "6px" }}>
                {extraDue > 0
                  ? "HÌNH THỨC THU THÊM TIỀN TỪ KHÁCH HÀNG:"
                  : "HÌNH THỨC HOÀN TIỀN CHO KHÁCH HÀNG:"}
              </div>
              <div style={{ display: "flex", gap: "12px", fontSize: "0.82rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="settlementMethod"
                    value="TRANSFER"
                    checked={settlementMethod === "TRANSFER"}
                    onChange={() => setSettlementMethod("TRANSFER")}
                  />
                  <span>
                    <Bank size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    Chuyển khoản VietQR / Ngân hàng
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="settlementMethod"
                    value="CASH"
                    checked={settlementMethod === "CASH"}
                    onChange={() => setSettlementMethod("CASH")}
                  />
                  <span>Tiền mặt tại quầy</span>
                </label>
              </div>

              {/* VietQR / Chi tiết chuyển khoản */}
              {settlementMethod === "TRANSFER" && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <QrCode size={48} color="#0f172a" />
                  </div>
                  <div style={{ fontSize: "0.76rem", lineHeight: "1.4" }}>
                    {extraDue > 0 ? (
                      <>
                        <div style={{ fontWeight: 700, color: "#dc2626" }}>Khách quét VietQR nộp phụ phí</div>
                        <div>STK: <strong>1028849929 (Vietcombank)</strong></div>
                        <div>Số tiền: <strong>{formatVnd(extraDue)}</strong></div>
                        <div>Nội dung: <strong>THU PHI {task?.refCode}</strong></div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, color: "#16a34a" }}>Chuyển khoản hoàn cọc cho khách</div>
                        <div>Người nhận: <strong>{task?.customerName || "Khách hàng"}</strong></div>
                        <div>Số tiền hoàn: <strong>{formatVnd(refundAmount)}</strong></div>
                        <div>Nội dung: <strong>HOAN COC {task?.refCode}</strong></div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BƯỚC 4: LƯU ẢNH MINH CHỨNG ĐỐI SOÁT (BẮT BUỘC) ── */}
          <div className={`ritual-step-card ${settlementPhotoUrl ? "is-completed" : ""}`}>
            <div className="ritual-step-header">
              <span className="ritual-step-title">
                <UploadSimple size={18} weight="bold" />
                4. Ảnh chứng từ đối soát (Bắt buộc lưu ảnh)
              </span>
              {settlementPhotoUrl && (
                <span className="photo-preview-tag">
                  <CheckCircle size={14} weight="fill" />
                  ĐÃ ĐÍNH KÈM ẢNH
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-secondary)" }}>
              {refundAmount > 0
                ? "Yêu cầu: Ảnh chụp ủy nhiệm chi, màn hình chuyển khoản VietQR hoàn cọc hoặc biên nhận tiền mặt có chữ ký của khách hàng."
                : extraDue > 0
                ? "Yêu cầu: Ảnh chụp bill chuyển khoản thành công của khách hàng hoặc phiếu thu phụ phí có chữ ký khách hàng."
                : "Yêu cầu: Ảnh chụp biên bản nghiệm thu bàn giao và thanh lý hợp đồng kho có chữ ký 2 bên."}
            </p>

            <input
              type="file"
              accept="image/*"
              ref={settlementFileInputRef}
              onChange={handleSettlementFileSelect}
              style={{ display: "none" }}
            />

            {settlementPhotoUrl ? (
              <div
                style={{
                  border: "1px solid #16a34a",
                  background: "#f0fdf4",
                  padding: "10px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <img
                  src={settlementPhotoUrl}
                  alt="Chứng từ đối soát"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    border: "1px solid #bbf7d0",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowFullPhotoModal(true)}
                />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#166534" }}>
                    ✓ Đã ghi nhận ảnh chứng từ đối soát
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#15803d" }}>
                    Ảnh đã được lưu cục bộ và đồng bộ tự động vào hồ sơ trả kho {task?.unitCode}.
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button
                      type="button"
                      className="btn--xs"
                      onClick={() => setShowFullPhotoModal(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        cursor: "pointer",
                      }}
                    >
                      <Eye size={12} /> Xem phóng to
                    </button>
                    <button
                      type="button"
                      className="btn--xs"
                      onClick={() => {
                        setSettlementPhotoUrl("");
                        try {
                        } catch {
                          // ignore
                        }
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        color: "#991b1b",
                        cursor: "pointer",
                      }}
                    >
                      <X size={12} /> Xóa & Chọn lại
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="ritual-photo-dropzone"
                onClick={() => settlementFileInputRef.current?.click()}
              >
                <Camera size={28} color="var(--color-primary)" />
                <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                  Nhấn vào đây để tải ảnh chứng từ đối soát
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--color-secondary)" }}>
                  Hỗ trợ PNG, JPG, WebP chụp từ điện thoại hoặc thiết bị quầy
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }} onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => settlementFileInputRef.current?.click()}
                  >
                    <UploadSimple size={14} style={{ marginRight: 4 }} />
                    Chọn tệp ảnh
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Liên kết xem hợp đồng gốc & Điều khoản thanh lý */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
            <span style={{ color: "var(--color-secondary)" }}>
              Hợp đồng thuê kho điện tử:
            </span>
            <button
              type="button"
              onClick={() => setShowContractModal(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary)",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FileText size={14} />
              Xem văn bản Hợp đồng gốc & Điều khoản thanh lý
            </button>
          </div>

          {/* ── NÚT HÀNH ĐỘNG CHỐT TRẢ KHO ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <Button variant="secondary" onClick={onClose}>
              Hủy / Đóng
            </Button>
            <Button
              onClick={handleConfirmCheckout}
              disabled={isSubmitting || !settlementPhotoUrl}
              style={{
                opacity: !settlementPhotoUrl ? 0.6 : 1,
              }}
            >
              {isSubmitting ? "Đang xử lý tất toán..." : "Xác nhận trả kho & Đóng hợp đồng"}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal xem phóng to ảnh chứng từ */}
      {showFullPhotoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowFullPhotoModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "16px",
              maxWidth: "600px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>CHỨNG TỪ ĐỐI SOÁT TẤT TOÁN · {task?.refCode}</strong>
              <button
                type="button"
                onClick={() => setShowFullPhotoModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={settlementPhotoUrl}
              alt="Chứng từ phóng to"
              style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", border: "1px solid #cbd5e1" }}
            />
          </div>
        </div>
      )}

      {/* Modal xem hợp đồng điện tử gốc */}
      <ContractViewerModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        reservation={{
          reservationCode: task?.refCode || "HD-REF",
          unitCode: task?.unitCode || "A-101",
          totalAmount: depositHeld * 10,
          depositAmount: depositHeld,
          createdDate: new Date().toLocaleDateString("vi-VN"),
        }}
        unit={{
          unitNumber: task?.unitCode || "A-101",
          type: "STANDARD",
          facilityName: "Kho Trung Tâm Cát Lái",
          dimensions: "2m × 3m × 2.8m",
          areaM2: 6.0,
        }}
        user={{
          fullName: task?.customerName || "Khách Hàng",
          phone: task?.customerPhone || "0912 345 678",
          cccd: "079094008899",
        }}
      />
    </>
  );
}
