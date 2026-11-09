import { TaskCard } from "./TaskCard.jsx";
import { formatVND } from "../../../utils/formatters.js";

const SHIFT_LABELS = {
  MORNING: "Ca sáng",
  AFTERNOON: "Ca chiều",
  EVENING: "Ca tối",
  FULL_DAY: "Cả ngày",
};

export function KanbanColumn({
  statusDef,
  colTasks,
  isOver,
  onDragOver,
  onDragLeave,
  onDrop,
  draggingTaskId,
  snappingBackTaskId,
  onDragStart,
  onDragEnd,
  onMoveStatus,
  onOpenCheckin,
  onOpenCheckout,
  onOpenCleaning,
  onOpenSupport,
  onOpenContract,
  onShowDetail,
  showAssignee,
  financeSummary,
}) {
  return (
    <section
      className={`kanban-column ${isOver ? "is-drag-over" : ""}`}
      onDragOver={(e) => onDragOver(e, statusDef.key)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, statusDef.key)}
    >
      {/* Column Header */}
      <div className="kanban-column-header">
        <h2 className="kanban-column-title">
          <span>{statusDef.label}</span>
          <span className="kanban-column-count">{colTasks.length}</span>
        </h2>
      </div>

      {statusDef.key === "DONE" && financeSummary && (
        <div className="kanban-finance" aria-label="Tiền thu tại quầy theo ca">
          <div className="kanban-finance__title">
            Thu tại quầy · {formatVND(financeSummary.totalCollected || 0)}
          </div>
          {(financeSummary.shifts || [])
            .filter((s) => Number(s.collected || 0) > 0 || Number(s.refunded || 0) > 0)
            .map((s) => (
              <div key={s.shift} className="kanban-finance__row">
                <span>{SHIFT_LABELS[s.shift] || s.shift}</span>
                <strong>{formatVND(s.collected || 0)}</strong>
                {Number(s.refunded || 0) > 0 && (
                  <span className="kanban-finance__refund">
                    hoàn {formatVND(s.refunded)}
                  </span>
                )}
              </div>
            ))}
          {Number(financeSummary.totalCollected || 0) === 0
            && Number(financeSummary.totalRefunded || 0) === 0 && (
              <div className="kanban-finance__empty">Chưa phát sinh thu trong ca</div>
            )}
        </div>
      )}

      {/* Cards Container */}
      <div className="kanban-cards-list">
        {colTasks.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 10px",
              color: "var(--color-muted)",
              fontSize: "0.82rem",
            }}
          >
            Chưa có nhiệm vụ
          </div>
        )}

        {colTasks.map((task) => (
          <TaskCard
            key={task.taskId}
            task={task}
            isDragging={draggingTaskId === task.taskId}
            isDone={task.status === "DONE"}
            isSnapBack={snappingBackTaskId === task.taskId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onMoveStatus={onMoveStatus}
            onOpenCheckin={onOpenCheckin}
            onOpenCheckout={onOpenCheckout}
            onOpenCleaning={onOpenCleaning}
            onOpenSupport={onOpenSupport}
            onOpenContract={onOpenContract}
            onShowDetail={onShowDetail}
            showAssignee={showAssignee}
          />
        ))}
      </div>
    </section>
  );
}
