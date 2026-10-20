import { useState } from "react";
import {
  ListChecks,
  WarningCircle,
  Receipt,
  X,
} from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import Button from "../../../components/Button/Button.jsx";
import { completeCheckoutRitual } from "../../../services/taskService.js";
import { formatVND as formatVnd } from "../../../utils/formatters.js";

export function CheckoutRitualDrawer({ task, onClose, onSuccess, showToast }) {
  const [checklist, setChecklist] = useState(
    task.ritual?.checklist || {
      accessCard: "OK",
      padlock: "OK",
      cleanliness: "OK",
      structure: "OK",
    }
  );

  const [charges, setCharges] = useState(
    task.ritual?.damageCharges || []
  );

  const [newChargeItem, setNewChargeItem] = useState("");
  const [newChargeAmount, setNewChargeAmount] = useState("");
  const [newChargeReason, setNewChargeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const depositHeld = task.depositAmount || 360000;
  const totalCharges = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const refundAmount = Math.max(0, depositHeld - totalCharges);
  const extraDue = Math.max(0, totalCharges - depositHeld);

  const handleAddCharge = () => {
    if (!newChargeItem.trim() || !newChargeAmount || Number(newChargeAmount) <= 0 || !newChargeReason.trim()) {
      showToast?.("Quy định: Phụ phí bồi thường bắt buộc phải có tên hạng mục, số tiền > 0 và lý do hư hại cụ thể!", "warning");
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
      showToast?.("Không thể đóng hợp đồng thuê: Mọi khoản phụ phí hư hại bắt buộc có số tiền và lý do giải trình!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeCheckoutRitual(task.taskId, {
        checklist,
        damageCharges: charges,
        refundAmount,
        extraCharged: extraDue,
      });
      showToast?.(
        `Đã hoàn tất tất toán cho đơn ${task.refCode}! Hoàn trả cọc: ${formatVnd(refundAmount)}. Đã tự động tạo Thẻ dọn kho cho ${task.unitCode}.`,
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
    <Drawer
      open={Boolean(task)}
      headerLabel={`THỦ TỤC TRẢ KHO · ${task.refCode}`}
      onClose={onClose}
    >
      <div className="ritual-flow">
        {/* Bước 1: Checklist kiểm tra cơ sở vật chất */}
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

        {/* Bước 2: Kê khai phụ phí hư hại */}
        <div className="ritual-step-card">
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <WarningCircle size={18} weight="bold" color="var(--color-accent)" />
              2. Kê khai phụ phí hư hại (Bắt buộc lý do)
            </span>
          </div>
          {charges.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#16a34a" }}>
              ✓ Không ghi nhận hư hại tài sản. Toàn bộ tiền cọc sẽ được hoàn trả.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {charges.map((c) => (
                <div key={c.id} className="damage-charge-item" style={{ padding: "8px", background: "#fef2f2", border: "1px solid #fecaca" }}>
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
                placeholder="Tên hạng mục (vd: Mất chìa khóa)"
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
              placeholder="Ghi rõ lý do hư hại cụ thể..."
              value={newChargeReason}
              onChange={(e) => setNewChargeReason(e.target.value)}
              style={{ padding: "6px 8px", fontSize: "0.78rem", border: "1px solid #cbd5e1" }}
            />
            <Button size="small" variant="secondary" onClick={handleAddCharge} style={{ alignSelf: "flex-end" }}>
              Thêm khoản phạt
            </Button>
          </div>
        </div>

        {/* Bước 3: Đối soát tất toán cọc */}
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
            <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
              <span>
                {extraDue > 0 ? "KHÁCH PHẢI TRẢ THÊM CHÊNH LỆCH:" : "SỐ TIỀN HOÀN TRẢ LẠI CHO KHÁCH:"}
              </span>
              <strong style={{ color: extraDue > 0 ? "#dc2626" : "#16a34a", fontFamily: "var(--font-mono)" }}>
                {extraDue > 0 ? formatVnd(extraDue) : formatVnd(refundAmount)}
              </strong>
            </div>
          </div>
        </div>

        {/* Nút hành động chốt */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
          <Button variant="secondary" onClick={onClose}>
            Hủy / Đóng
          </Button>
          <Button onClick={handleConfirmCheckout} disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Xác nhận trả kho & Đóng hợp đồng"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
