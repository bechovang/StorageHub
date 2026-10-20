import {
  Clock,
  CaretRight,
  CaretLeft,
  ArrowRight,
} from "@phosphor-icons/react";
import { TASK_TYPES } from "../../../services/taskService.js";

export function TaskCard({
  task,
  isDragging,
  isDone,
  isSnapBack,
  onDragStart,
  onDragEnd,
  onMoveStatus,
  onOpenCheckin,
  onOpenCheckout,
  onOpenCleaning,
  onOpenSupport,
  onOpenContract,
}) {
  const typeConfig = TASK_TYPES[task.type] || TASK_TYPES.CHECK_IN;

  return (
    <article
      className={`task-card ${isDragging ? "is-dragging" : ""} ${isDone ? "task-card--done" : ""} ${isSnapBack ? "is-snap-back" : ""}`}
      draggable={!isDone}
      onDragStart={(e) => onDragStart(e, task.taskId)}
      onDragEnd={onDragEnd}
    >
      {/* 4px Left Status Bar */}
      <div
        className="task-card__status-bar"
        style={{ backgroundColor: typeConfig.barColor }}
      />

      {/* Card Header */}
      <div className="task-card__header">
        <span
          className="task-type-badge"
          style={{
            backgroundColor: typeConfig.bg,
            color: typeConfig.color,
            border: `1px solid ${typeConfig.border}`,
          }}
        >
          {typeConfig.label}
        </span>
        <span className="task-card__ref">
          {task.refCode ? `${task.refCode} · ` : ""}
          <strong>{task.unitCode}</strong>
        </span>
      </div>

      {/* Card Body */}
      <div className="task-card__body">
        <h3 className="task-card__title">
          {typeConfig.label}: {task.unitCode}
        </h3>
        <p className="task-card__meta">
          {task.customerName} {task.dueTime ? `· Hẹn ${task.dueTime}` : ""}
        </p>

        {/* Extra Badges */}
        {task.accessPin && (
          <span className="task-card__extra-badge task-card__extra-badge--pin">
            PIN: {task.accessPin}
          </span>
        )}
        {task.alertNote && (
          <span className="task-card__extra-badge task-card__extra-badge--alert">
            {task.alertNote}
          </span>
        )}
        {task.priority && (
          <span className="task-card__extra-badge task-card__extra-badge--priority">
            Ưu tiên: {task.priority}
          </span>
        )}
      </div>

      {/* Card Footer & Action Controls */}
      <div className="task-card__footer">
        <div className="task-card__due">
          <Clock size={13} />
          <span>{task.dueTime || "Trong ca"}</span>
        </div>

        <div className="task-card__actions">
          {/* Left navigation arrow */}
          {task.status === "IN_PROGRESS" && (
            <button
              type="button"
              className="card-nav-btn"
              title="Chuyển về To do"
              onClick={() => onMoveStatus(task, "TODO")}
            >
              <CaretLeft size={13} weight="bold" />
              <span>To do</span>
            </button>
          )}

          {/* Ritual Trigger Action Buttons */}
          {task.type === "CHECK_IN" && task.status !== "DONE" && (
            <button
              type="button"
              className="card-ritual-btn"
              onClick={() => onOpenCheckin(task)}
            >
              <span>Làm Check-in</span>
              <ArrowRight size={12} weight="bold" />
            </button>
          )}

          {task.type === "CHECKOUT" && task.status !== "DONE" && (
            <button
              type="button"
              className="card-ritual-btn"
              onClick={() => onOpenCheckout(task)}
            >
              <span>Làm Checkout</span>
              <ArrowRight size={12} weight="bold" />
            </button>
          )}

          {task.type === "CLEANING" && task.status !== "DONE" && (
            <button
              type="button"
              className="card-ritual-btn"
              onClick={() => onOpenCleaning(task)}
            >
              <span>Dọn kho</span>
              <ArrowRight size={12} weight="bold" />
            </button>
          )}

          {task.type === "SUPPORT" && task.status !== "DONE" && (
            <button
              type="button"
              className="card-ritual-btn"
              onClick={() => onOpenSupport(task)}
            >
              <span>Xử lý</span>
              <ArrowRight size={12} weight="bold" />
            </button>
          )}

          {task.type === "CONTRACT" && task.status !== "DONE" && (
            <button
              type="button"
              className="card-ritual-btn"
              onClick={() => onOpenContract(task)}
            >
              <span>Ký phụ lục</span>
              <ArrowRight size={12} weight="bold" />
            </button>
          )}

          {/* Right navigation arrow (move to Next) */}
          {task.status === "TODO" && (
            <button
              type="button"
              className="card-nav-btn"
              title="Bắt đầu thực hiện"
              onClick={() => onMoveStatus(task, "IN_PROGRESS")}
            >
              <span>Nhận việc</span>
              <CaretRight size={13} weight="bold" />
            </button>
          )}

          {task.status === "IN_PROGRESS" && (
            <button
              type="button"
              className="card-nav-btn"
              title="Hoàn tất nhiệm vụ"
              onClick={() => onMoveStatus(task, "DONE")}
            >
              <span>Xong</span>
              <CaretRight size={13} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
