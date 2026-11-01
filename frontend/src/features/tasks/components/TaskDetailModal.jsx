import Modal from "../../../components/Modal/Modal.jsx";
import { TASK_TYPES } from "../../../services/taskService.js";

const STATUS_LABEL = {
  TODO: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  DONE: "Hoàn thành",
};

function fmtVND(v) {
  if (v == null) return "—";
  return Number(v).toLocaleString("vi-VN") + " ₫";
}

/**
 * Chi tiết nhiệm vụ (read-only) — mở được cho MỌI trạng thái kể cả DONE
 * (trước đây thẻ hoàn thành không còn nút nào để xem lại thông tin).
 */
export function TaskDetailModal({ task, onClose }) {
  if (!task) return null;
  const typeConfig = TASK_TYPES[task.type] || TASK_TYPES.CHECK_IN;

  return (
    <Modal isOpen={Boolean(task)} onClose={onClose} title={`CHI TIẾT NHIỆM VỤ · ${typeConfig.label}`}>
      <div className="task-detail">
        <div className="task-detail__status-row">
          <span className="task-type-badge" style={{ backgroundColor: typeConfig.bg, color: typeConfig.color }}>
            {typeConfig.label}
          </span>
          <span className={`status-ticket-chip ${task.status === "DONE" ? "status-ticket--resolved" : "status-ticket--progress"}`}>
            {STATUS_LABEL[task.status] || task.status}
          </span>
        </div>

        <dl className="task-detail__grid">
          <div>
            <dt>Mã tham chiếu</dt>
            <dd className="font-mono">{task.refCode || "—"}</dd>
          </div>
          <div>
            <dt>Kho</dt>
            <dd className="font-mono">{task.unitCode || "—"}</dd>
          </div>
          <div>
            <dt>Khách hàng</dt>
            <dd>
              {task.customerName || "—"}
              {task.customerPhone ? ` · ${task.customerPhone}` : ""}
            </dd>
          </div>
          <div>
            <dt>Ngày làm việc</dt>
            <dd>{task.workDate || "—"}</dd>
          </div>
          <div>
            <dt>Hạn trong ca</dt>
            <dd>{task.dueTime || "—"}</dd>
          </div>
          <div>
            <dt>Người phụ trách</dt>
            <dd>{task.assignedStaff?.fullName || "—"}</dd>
          </div>
          {task.accessPin && (
            <div>
              <dt>Mã truy cập</dt>
              <dd className="font-mono">{task.accessPin}</dd>
            </div>
          )}
          {task.rentAmount != null && (
            <div>
              <dt>Tiền thuê cần thu</dt>
              <dd>{fmtVND(task.rentAmount)}</dd>
            </div>
          )}
          {task.depositPaid != null && (
            <div>
              <dt>Cọc đã giữ</dt>
              <dd>{fmtVND(task.depositPaid)}</dd>
            </div>
          )}
          {task.priority && (
            <div>
              <dt>Ưu tiên</dt>
              <dd>{task.priority}</dd>
            </div>
          )}
        </dl>

        {task.issueDescription && (
          <section className="task-detail__section">
            <h4>Mô tả sự cố</h4>
            <p>{task.issueDescription}</p>
          </section>
        )}
        {task.alertNote && (
          <section className="task-detail__section">
            <h4>Cảnh báo</h4>
            <p>{task.alertNote}</p>
          </section>
        )}
      </div>
    </Modal>
  );
}
