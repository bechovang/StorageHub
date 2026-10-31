import {
  Clock,
  MapPin,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { TASK_TYPES, TASK_STATUSES } from "../../services/taskService.js";
import {
  useTaskBoard,
  KanbanColumn,
  CheckinRitualDrawer,
  CheckoutRitualDrawer,
  CleaningRitualDrawer,
  SupportTicketDrawer,
  ContractRitualDrawer,
  SnapbackToast,
  TaskDetailModal,
} from "../../features/tasks/index.js";
import "./TaskBoardPage.css";

export default function TaskBoardPage() {
  // Task đang xem chi tiết read-only (mở được cả khi DONE)
  const [detailTask, setDetailTask] = useState(null);
  const {
    tasks,
    activeTab,
    setActiveTab,
    loading,
    toastData,
    setToastData,
    snappingBackTaskId,
    actionToast,
    showActionToast,
    activeCheckinTask,
    setActiveCheckinTask,
    activeCheckoutTask,
    setActiveCheckoutTask,
    activeCleaningTask,
    setActiveCleaningTask,
    activeSupportTask,
    setActiveSupportTask,
    activeContractTask,
    setActiveContractTask,
    draggingTaskId,
    dragOverCol,
    reloadTasks,
    handleMoveStatus,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    getColTasks,
    taskTypeCounts,
  } = useTaskBoard();

  return (
    <AppShell>
      <div className="taskboard-container">
        {/* ── Sub-header / Context Bar ── */}
        <div className="taskboard-context-bar">
          <div className="taskboard-context-left">
            <MapPin size={15} weight="bold" />
            <span>Cơ sở: <strong>Cơ sở Tân Bình (VN-SGN-01)</strong></span>
            <span style={{ color: "var(--color-line)" }}>/</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-status-success)" }}>
              <span className="status-dot-pulse" />
              Cổng tự động: Online
            </span>
          </div>

          <div className="taskboard-context-right">
            <Clock size={15} weight="bold" />
            <span>Thời gian trực ca: <strong>08:42 ICT (UTC+7)</strong></span>
          </div>
        </div>

        {/* ── Main Canvas ── */}
        <div className="taskboard-main">
          {/* Page Header */}
          <div className="taskboard-header">
            <div className="taskboard-title-group">
              <h1>
                <span>Hôm nay · Ca sáng</span>
                <span className="shift-badge">Ca đang trực</span>
              </h1>
              <p className="taskboard-subtitle">
                Khung giờ ca: <strong>07:00 – 15:00</strong> · <strong>{tasks.length} nhiệm vụ hôm nay</strong> ·{" "}
                <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>
                  {tasks.filter((t) => t.type === "CHECK_IN" && t.status !== "DONE").length} đơn chờ check-in
                </span>
              </p>
            </div>
          </div>

          {/* Filter Tabs Bar */}
          <div className="taskboard-filter-tabs">
            <button
              type="button"
              className={`filter-tab-btn ${activeTab === "ALL" ? "is-active" : ""}`}
              onClick={() => setActiveTab("ALL")}
            >
              <span>Tất cả</span>
              <span className="filter-tab-badge">{taskTypeCounts.ALL}</span>
            </button>

            {Object.values(TASK_TYPES).map((typeDef) => (
              <button
                key={typeDef.key}
                type="button"
                className={`filter-tab-btn ${activeTab === typeDef.key ? "is-active" : ""}`}
                onClick={() => setActiveTab(typeDef.key)}
              >
                <span>{typeDef.label}</span>
                <span className="filter-tab-badge">{taskTypeCounts[typeDef.key]}</span>
              </button>
            ))}
          </div>

          {/* 3-Column Kanban Board */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--color-secondary)" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Đang tải danh sách nhiệm vụ ca trực...</p>
            </div>
          ) : (
            <div className="kanban-grid">
              {Object.values(TASK_STATUSES).map((statusDef) => {
                const colTasks = getColTasks(statusDef.key);
                const isOver = dragOverCol === statusDef.key;

                return (
                  <KanbanColumn
                    key={statusDef.key}
                    statusDef={statusDef}
                    onShowDetail={setDetailTask}
                    colTasks={colTasks}
                    isOver={isOver}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    draggingTaskId={draggingTaskId}
                    snappingBackTaskId={snappingBackTaskId}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onMoveStatus={handleMoveStatus}
                    onOpenCheckin={setActiveCheckinTask}
                    onOpenCheckout={setActiveCheckoutTask}
                    onOpenCleaning={setActiveCleaningTask}
                    onOpenSupport={setActiveSupportTask}
                    onOpenContract={setActiveContractTask}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Snap-back Toast Notification (Chống Done ảo) ── */}
      <SnapbackToast
        toastData={toastData}
        onClose={() => setToastData(null)}
        onOpenCheckin={setActiveCheckinTask}
        onOpenCheckout={setActiveCheckoutTask}
        onOpenCleaning={setActiveCleaningTask}
        onOpenSupport={setActiveSupportTask}
        onOpenContract={setActiveContractTask}
      />

      {/* ── Task Detail Modal (read-only, mọi trạng thái) ── */}
      <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} />

      {/* ── Check-in Ritual Drawer ── */}
      {activeCheckinTask && (
        <CheckinRitualDrawer
          task={activeCheckinTask}
          onClose={() => setActiveCheckinTask(null)}
          showToast={showActionToast}
          onSuccess={async () => {
            setActiveCheckinTask(null);
            await reloadTasks();
          }}
        />
      )}

      {/* ── Checkout Ritual Drawer ── */}
      {activeCheckoutTask && (
        <CheckoutRitualDrawer
          task={activeCheckoutTask}
          onClose={() => setActiveCheckoutTask(null)}
          showToast={showActionToast}
          onSuccess={async () => {
            setActiveCheckoutTask(null);
            await reloadTasks();
          }}
        />
      )}

      {/* ── Cleaning Checklist Drawer ── */}
      {activeCleaningTask && (
        <CleaningRitualDrawer
          task={activeCleaningTask}
          onClose={() => setActiveCleaningTask(null)}
          showToast={showActionToast}
          onSuccess={async () => {
            setActiveCleaningTask(null);
            await reloadTasks();
          }}
        />
      )}

      {/* ── Support Ticket Drawer ── */}
      {activeSupportTask && (
        <SupportTicketDrawer
          task={activeSupportTask}
          onClose={() => setActiveSupportTask(null)}
          showToast={showActionToast}
          onSuccess={async () => {
            setActiveSupportTask(null);
            await reloadTasks();
          }}
        />
      )}

      {/* ── Contract / Addendum Signature Drawer ── */}
      {activeContractTask && (
        <ContractRitualDrawer
          task={activeContractTask}
          onClose={() => setActiveContractTask(null)}
          showToast={showActionToast}
          onSuccess={async () => {
            setActiveContractTask(null);
            await reloadTasks();
          }}
        />
      )}

      {/* ── General Action Toast ── */}
      {actionToast && (
        <div className={`toast-banner toast-banner--${actionToast.type}`} role="status">
          {actionToast.type === "success" ? (
            <CheckCircle size={18} weight="bold" />
          ) : (
            <WarningCircle size={18} weight="bold" />
          )}
          <span>{actionToast.message}</span>
        </div>
      )}
    </AppShell>
  );
}
