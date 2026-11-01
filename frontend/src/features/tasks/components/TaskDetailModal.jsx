import { useEffect, useState } from "react";
import Modal from "../../../components/Modal/Modal.jsx";
import { TASK_TYPES, getTaskDetail } from "../../../services/taskService.js";

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
  const [detail, setDetail] = useState(task);

  // List không mang ảnh Base64 (payload nặng); mở modal mới lấy chi tiết đầy đủ.
  useEffect(() => {
    let ignore = false;
    setDetail(task);
    if (!task?.taskId) return undefined;
    getTaskDetail(task.taskId)
      .then((full) => {
        if (!ignore) setDetail(full);
      })
      .catch(() => {
        // Giữ dữ liệu list nếu API chi tiết lỗi
      });
    return () => {
      ignore = true;
    };
  }, [task]);

  if (!detail) return null;
  const taskView = detail;
  const typeConfig = TASK_TYPES[taskView.type] || TASK_TYPES.CHECK_IN;

  return (
    <Modal isOpen={Boolean(task)} onClose={onClose} title={`CHI TIẾT NHIỆM VỤ · ${typeConfig.label}`}>
      <div className="task-detail">
        <div className="task-detail__status-row">
          <span className="task-type-badge" style={{ backgroundColor: typeConfig.bg, color: typeConfig.color }}>
            {typeConfig.label}
          </span>
          <span className={`status-ticket-chip ${taskView.status === "DONE" ? "status-ticket--resolved" : "status-ticket--progress"}`}>
            {STATUS_LABEL[taskView.status] || taskView.status}
          </span>
        </div>

        <dl className="task-detail__grid">
          <div>
            <dt>Mã tham chiếu</dt>
            <dd className="font-mono">{taskView.refCode || "—"}</dd>
          </div>
          <div>
            <dt>Kho</dt>
            <dd className="font-mono">{taskView.unitCode || "—"}</dd>
          </div>
          <div>
            <dt>Khách hàng</dt>
            <dd>
              {taskView.customerName || "—"}
              {taskView.customerPhone ? ` · ${taskView.customerPhone}` : ""}
            </dd>
          </div>
          <div>
            <dt>Ngày làm việc</dt>
            <dd>{taskView.workDate || "—"}</dd>
          </div>
          <div>
            <dt>Hạn trong ca</dt>
            <dd>{taskView.dueTime || "—"}</dd>
          </div>
          <div>
            <dt>Người phụ trách</dt>
            <dd>{taskView.assignedStaff?.fullName || "—"}</dd>
          </div>
          {taskView.accessPin && (
            <div>
              <dt>Mã truy cập</dt>
              <dd className="font-mono">{taskView.accessPin}</dd>
            </div>
          )}
          {taskView.rentAmount != null && (
            <div>
              <dt>Tiền thuê cần thu</dt>
              <dd>{fmtVND(taskView.rentAmount)}</dd>
            </div>
          )}
          {taskView.depositPaid != null && (
            <div>
              <dt>Cọc đã giữ</dt>
              <dd>{fmtVND(taskView.depositPaid)}</dd>
            </div>
          )}
          {taskView.priority && (
            <div>
              <dt>Ưu tiên</dt>
              <dd>{taskView.priority}</dd>
            </div>
          )}
        </dl>

        {taskView.issueDescription && (
          <section className="task-detail__section">
            <h4>Mô tả sự cố</h4>
            <p>{taskView.issueDescription}</p>
          </section>
        )}
        {taskView.alertNote && (
          <section className="task-detail__section">
            <h4>Cảnh báo</h4>
            <p>{taskView.alertNote}</p>
          </section>
        )}

        {[
          ["Ảnh chứng từ thu tiền", taskView.paymentProofPhotoUrl],
          ["Ảnh hợp đồng đã ký", taskView.contractPhotoUrl],
          ["Ảnh biên bản thanh lý", taskView.settlementPhotoUrl],
        ]
          .filter(([, src]) => src)
          .map(([label, src]) => (
            <section className="task-detail__section" key={label}>
              <h4>{label}</h4>
              <a href={src} target="_blank" rel="noreferrer">
                <img className="task-detail__photo" src={src} alt={label} />
              </a>
            </section>
          ))}
      </div>
    </Modal>
  );
}
