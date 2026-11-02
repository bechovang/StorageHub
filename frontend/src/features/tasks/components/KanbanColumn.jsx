import { TaskCard } from "./TaskCard.jsx";

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
