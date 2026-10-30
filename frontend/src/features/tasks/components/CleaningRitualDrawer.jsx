import { useState } from "react";
import { Broom } from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import Button from "../../../components/Button/Button.jsx";
import { completeCleaningRitual } from "../../../services/taskService.js";

export function CleaningRitualDrawer({ task, onClose, onSuccess, showToast }) {
  const [checklist, setChecklist] = useState({
    sweptFloor: false,
    dehumidifierChecked: false,
    lockLubricated: false,
  });

  const allChecked = checklist.sweptFloor && checklist.dehumidifierChecked && checklist.lockLubricated;

  const handleComplete = async () => {
    try {
      await completeCleaningRitual(task.taskId, checklist);
      showToast?.(`Đã hoàn tất dọn kho ${task.unitCode}! Kho đã sẵn sàng bàn giao cho khách thuê tiếp theo.`, "success");
      onSuccess();
    } catch (err) {
      showToast?.(err.message || "Lỗi khi cập nhật trạng thái dọn dẹp", "error");
    }
  };

  return (
    <Drawer
      open={Boolean(task)}
      headerLabel={`VỆ SINH KHO · ${task.unitCode}`}
      onClose={onClose}
      size="md"
    >
      <div className="ritual-flow">
        <div className="ritual-step-card">
          <span className="ritual-step-title">
            <Broom size={18} weight="bold" />
            Checklist vệ sinh kho tự quản
          </span>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-secondary)" }}>
            Hoàn tất các bước dọn dẹp trước khi đưa kho trở về trạng thái Sẵn sàng cho thuê.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px", fontSize: "0.82rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={checklist.sweptFloor}
                onChange={(e) => setChecklist({ ...checklist, sweptFloor: e.target.checked })}
              />
              <span>Quét dọn sàn & hút bụi sạch sẽ</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={checklist.dehumidifierChecked}
                onChange={(e) => setChecklist({ ...checklist, dehumidifierChecked: e.target.checked })}
              />
              <span>Kiểm tra máy hút ẩm & nồng độ thông gió</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={checklist.lockLubricated}
                onChange={(e) => setChecklist({ ...checklist, lockLubricated: e.target.checked })}
              />
              <span>Tra dầu chốt khóa & reset mã số ổ khóa về mặc định</span>
            </label>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleComplete} disabled={!allChecked}>
            Hoàn tất vệ sinh · Sẵn sàng đón khách
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
