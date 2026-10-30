import { useState } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import Button from "../../../components/Button/Button.jsx";
import { resolveSupportTicket } from "../../../services/taskService.js";

export function SupportTicketDrawer({ task, onClose, onSuccess, showToast }) {
  const [note, setNote] = useState("");
  const [escalate, setEscalate] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");

  const handleResolve = async () => {
    try {
      await resolveSupportTicket(task.taskId, {
        note,
        escalate,
        escalateReason,
      });
      showToast?.(escalate ? "Đã chuyển sự cố lên Quản lý cơ sở tiếp nhận!" : "Đã xử lý xong sự cố cho khách!", "success");
      onSuccess();
    } catch (err) {
      showToast?.(err.message || "Lỗi khi xử lý sự cố", "error");
    }
  };

  return (
    <Drawer
      open={Boolean(task)}
      headerLabel={`XỬ LÝ SỰ CỐ · ${task.refCode}`}
      onClose={onClose}
      size="lg"
    >
      <div className="ritual-flow">
        <div className="ritual-step-card">
          <span className="ritual-step-title">
            <WarningCircle size={18} weight="bold" color="#dc2626" />
            Chi tiết phản ánh sự cố từ khách
          </span>
          <div style={{ fontSize: "0.82rem" }}>
            <p style={{ margin: "4px 0" }}>Khách hàng: <strong>{task.customerName}</strong> ({task.customerPhone})</p>
            <p style={{ margin: "4px 0" }}>Vị trí kho: <strong>{task.unitCode}</strong></p>
            <div style={{ backgroundColor: "#fef2f2", padding: "10px", border: "1px solid #fecaca", marginTop: "8px" }}>
              <strong>Mô tả sự cố:</strong> {task.issueDescription || "Khách yêu cầu hỗ trợ mở khóa."}
            </div>
          </div>
        </div>

        <div className="ritual-step-card">
          <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "4px" }}>
            GHI CHÚ XỬ LÝ SỰ CỐ:
          </label>
          <textarea
            rows={3}
            placeholder="Mô tả biện pháp đã thực hiện..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: "100%", padding: "8px", fontSize: "0.8rem", border: "1px solid #cbd5e1" }}
          />

          <div style={{ marginTop: "12px", borderTop: "1px dashed #cbd5e1", paddingTop: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", cursor: "pointer", color: "#dc2626", fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={escalate}
                onChange={(e) => setEscalate(e.target.checked)}
              />
              Chuyển lên Quản lý cơ sở xử lý
            </label>

            {escalate && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  placeholder="Ghi rõ lý do cần chuyển lên Quản lý..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "0.78rem", border: "1px solid #dc2626" }}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleResolve}>
            {escalate ? "Chuyển lên Quản lý" : "Hoàn tất xử lý sự cố"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
