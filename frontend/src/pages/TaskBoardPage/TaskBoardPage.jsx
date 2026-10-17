import { useState, useEffect, useCallback } from "react";
import {
  ListChecks,
  Clock,
  MapPin,
  Broom,
  ShieldCheck,
  Key,
  WarningCircle,
  FileText,
  CaretRight,
  CaretLeft,
  X,
  UploadSimple,
  Receipt,
  ArrowRight,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Drawer from "../../components/Drawer/Drawer.jsx";
import Button from "../../components/Button/Button.jsx";
import {
  TASK_TYPES,
  TASK_STATUSES,
  getStaffTasks,
  updateTaskStatus,
  checkSnapBackViolation,
  completeCheckinRitual,
  completeCheckoutRitual,
  completeCleaningRitual,
  completeContractRitual,
  resolveSupportTicket,
  resetLocalTasks,
} from "../../services/taskService.js";
import { formatVND as formatVnd, PLACEHOLDER_UNIT_IMAGE } from "../../utils/formatters.js";
import "./TaskBoardPage.css";

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Snap-back notification toast state & visual snap-back trigger
  const [toastData, setToastData] = useState(null); // { message, task }
  const [snappingBackTaskId, setSnappingBackTaskId] = useState(null);

  // Active ritual drawers
  const [activeCheckinTask, setActiveCheckinTask] = useState(null);
  const [activeCheckoutTask, setActiveCheckoutTask] = useState(null);
  const [activeCleaningTask, setActiveCleaningTask] = useState(null);
  const [activeSupportTask, setActiveSupportTask] = useState(null);
  const [activeContractTask, setActiveContractTask] = useState(null);

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const reloadTasks = useCallback(async () => {
    try {
      const data = await getStaffTasks();
      setTasks(data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách công việc:", err);
    }
  }, []);

  // Auto-dismiss Snap-back toast notification sau 4.5s
  useEffect(() => {
    if (!toastData) return;
    const timer = setTimeout(() => {
      setToastData(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastData]);

  useEffect(() => {
    let ignore = false;
    getStaffTasks()
      .then((data) => {
        if (!ignore) {
          setTasks(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh sách công việc:", err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Xử lý chuyển cột trạng thái (bằng nút hoặc drag-drop)
  const handleMoveStatus = async (task, targetStatus) => {
    try {
      // Kiểm tra Snap-back chống Done ảo (FR-22)
      if (targetStatus === "DONE") {
        const violation = checkSnapBackViolation(task);
        if (violation) {
          setSnappingBackTaskId(task.taskId);
          setToastData({
            message: violation,
            task,
          });
          setTimeout(() => {
            setSnappingBackTaskId(null);
          }, 800);
          return;
        }
      }

      await updateTaskStatus(task.taskId, targetStatus);
      await reloadTasks();
    } catch (err) {
      setSnappingBackTaskId(task.taskId);
      setToastData({
        message: err.message || "Không thể chuyển trạng thái",
        task,
      });
      setTimeout(() => {
        setSnappingBackTaskId(null);
      }, 800);
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", String(taskId));
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, statusKey) => {
    e.preventDefault();
    setDragOverCol(statusKey);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;

    const task = tasks.find((t) => t.taskId === Number(taskIdStr));
    if (!task || task.status === targetStatus) return;

    await handleMoveStatus(task, targetStatus);
    setDraggingTaskId(null);
  };

  // Lọc thẻ theo tab
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "ALL") return true;
    return t.type === activeTab;
  });

  // Đếm số lượng task theo trạng thái và tab
  const getColTasks = (statusKey) =>
    filteredTasks.filter((t) => t.status === statusKey);

  const taskTypeCounts = {
    ALL: tasks.length,
    CHECK_IN: tasks.filter((t) => t.type === "CHECK_IN").length,
    CHECKOUT: tasks.filter((t) => t.type === "CHECKOUT").length,
    CLEANING: tasks.filter((t) => t.type === "CLEANING").length,
    SUPPORT: tasks.filter((t) => t.type === "SUPPORT").length,
    CONTRACT: tasks.filter((t) => t.type === "CONTRACT").length,
  };

  return (
    <AppShell
      roleLabel="STAFF"
      navLinks={[
        { label: "Task Board", href: "/tasks" },
        { label: "Hỗ trợ sự cố", href: "/support" },
      ]}
    >
      <div className="taskboard-container">
        {/* ── Sub-header / Context Bar ── */}
        <div className="taskboard-context-bar">
          <div className="taskboard-context-left">
            <MapPin size={15} weight="bold" />
            <span>Cơ sở: <strong>Tân Bình Gateway (VN-SGN-01)</strong></span>
            <span style={{ color: "var(--color-line)" }}>/</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-status-success)" }}>
              <span className="status-dot-pulse" />
              Cổng tự động: Online
            </span>
          </div>

          <div className="taskboard-context-right">
            <button
              type="button"
              className="btn-reset-demo"
              title="Đặt lại các thẻ nhiệm vụ mẫu ban đầu để test Snap-back"
              onClick={async () => {
                resetLocalTasks();
                await reloadTasks();
              }}
            >
              ↺ Đặt lại dữ liệu mẫu
            </button>
            <Clock size={15} weight="bold" />
            <span>Thời gian trực ca: <strong>08:42 ICT (UTC+7)</strong></span>
          </div>
        </div>

        {/* ── Main Canvas ── */}
        <main className="taskboard-main">
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
                <section
                  key={statusDef.key}
                  className={`kanban-column ${isOver ? "is-drag-over" : ""}`}
                  onDragOver={(e) => handleDragOver(e, statusDef.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, statusDef.key)}
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
                      <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--color-muted)", fontSize: "0.82rem" }}>
                        Chưa có nhiệm vụ
                      </div>
                    )}

                    {colTasks.map((task) => {
                      const typeConfig = TASK_TYPES[task.type] || TASK_TYPES.CHECK_IN;
                      const isDragging = draggingTaskId === task.taskId;
                      const isDone = task.status === "DONE";
                      const isSnapBack = snappingBackTaskId === task.taskId;

                      return (
                        <article
                          key={task.taskId}
                          className={`task-card ${isDragging ? "is-dragging" : ""} ${isDone ? "task-card--done" : ""} ${isSnapBack ? "is-snap-back" : ""}`}
                          draggable={!isDone}
                          onDragStart={(e) => handleDragStart(e, task.taskId)}
                          onDragEnd={handleDragEnd}
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
                                  onClick={() => handleMoveStatus(task, "TODO")}
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
                                  onClick={() => setActiveCheckinTask(task)}
                                >
                                  <span>Làm Check-in</span>
                                  <ArrowRight size={12} weight="bold" />
                                </button>
                              )}

                              {task.type === "CHECKOUT" && task.status !== "DONE" && (
                                <button
                                  type="button"
                                  className="card-ritual-btn"
                                  onClick={() => setActiveCheckoutTask(task)}
                                >
                                  <span>Làm Checkout</span>
                                  <ArrowRight size={12} weight="bold" />
                                </button>
                              )}

                              {task.type === "CLEANING" && task.status !== "DONE" && (
                                <button
                                  type="button"
                                  className="card-ritual-btn"
                                  onClick={() => setActiveCleaningTask(task)}
                                >
                                  <span>Dọn kho</span>
                                  <ArrowRight size={12} weight="bold" />
                                </button>
                              )}

                              {task.type === "SUPPORT" && task.status !== "DONE" && (
                                <button
                                  type="button"
                                  className="card-ritual-btn"
                                  onClick={() => setActiveSupportTask(task)}
                                >
                                  <span>Xử lý</span>
                                  <ArrowRight size={12} weight="bold" />
                                </button>
                              )}

                              {task.type === "CONTRACT" && task.status !== "DONE" && (
                                <button
                                  type="button"
                                  className="card-ritual-btn"
                                  onClick={() => setActiveContractTask(task)}
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
                                  onClick={() => handleMoveStatus(task, "IN_PROGRESS")}
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
                                  onClick={() => handleMoveStatus(task, "DONE")}
                                >
                                  <span>Xong</span>
                                  <CaretRight size={13} weight="bold" />
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          )}
        </main>
      </div>

      {/* ── Snap-back Toast Notification (Chống Done ảo FR-22) ── */}
      {toastData && (
        <aside className="snapback-toast" role="alert">
          <div className="snapback-toast__badge">
            <WarningCircle size={16} weight="fill" />
            <span>SNAP-BACK · CHỐNG DONE ẢO (FR-22)</span>
          </div>
          <div className="snapback-toast__body">
            <p className="snapback-toast__title">Thao tác bị từ chối & nảy về cột cũ:</p>
            <p className="snapback-toast__desc">{toastData.message}</p>
          </div>
          <div className="snapback-toast__actions">
            <button
              type="button"
              className="snapback-toast__btn-fix"
              onClick={() => {
                const targetTask = toastData.task;
                setToastData(null);
                if (targetTask.type === "CHECK_IN") setActiveCheckinTask(targetTask);
                else if (targetTask.type === "CHECKOUT") setActiveCheckoutTask(targetTask);
                else if (targetTask.type === "CLEANING") setActiveCleaningTask(targetTask);
                else if (targetTask.type === "SUPPORT") setActiveSupportTask(targetTask);
                else if (targetTask.type === "CONTRACT") setActiveContractTask(targetTask);
              }}
            >
              <span>Mở quy trình xử lý ngay</span>
              <ArrowRight size={14} weight="bold" />
            </button>
            <button
              type="button"
              className="snapback-toast__close"
              onClick={() => setToastData(null)}
              aria-label="Đóng thông báo"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </aside>
      )}

      {/* ── US-15: Check-in Ritual Drawer (F2-02) ── */}
      {activeCheckinTask && (
        <CheckinRitualDrawer
          task={activeCheckinTask}
          onClose={() => setActiveCheckinTask(null)}
          onSuccess={async () => {
            setActiveCheckinTask(null);
            await reloadTasks();
          }}
        />
      )}

      {/* ── US-21: Checkout Ritual Drawer (F3-01) ── */}
      {activeCheckoutTask && (
        <CheckoutRitualDrawer
          task={activeCheckoutTask}
          onClose={() => setActiveCheckoutTask(null)}
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
          onSuccess={async () => {
            setActiveSupportTask(null);
            await reloadTasks();
          }}
        />
      )}

      {/* ── US-19: Contract / Addendum Signature Drawer ── */}
      {activeContractTask && (
        <ContractRitualDrawer
          task={activeContractTask}
          onClose={() => setActiveContractTask(null)}
          onSuccess={async () => {
            setActiveContractTask(null);
            await reloadTasks();
          }}
        />
      )}
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: US-15 CHECK-IN RITUAL DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function CheckinRitualDrawer({ task, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [photoUploaded, setPhotoUploaded] = useState(Boolean(task.ritual?.contractPhotoUrl));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSimulateUpload = () => {
    setPhotoUploaded(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await completeCheckinRitual(task.taskId, {
        paymentMethod,
        contractPhotoUrl: PLACEHOLDER_UNIT_IMAGE,
        accessPin: task.accessPin || "8842-Active",
      });
      onSuccess();
    } catch (err) {
      alert(err.message || "Lỗi khi hoàn tất check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={Boolean(task)}
      headerLabel={`NGHI THỨC CHECK-IN · ${task.refCode}`}
      onClose={onClose}
    >
      <div className="ritual-flow">
        {/* Bước 1: Xác thực đơn cọc */}
        <div className="ritual-step-card is-completed">
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <ShieldCheck size={18} color="#16a34a" weight="bold" />
              1. Xác nhận đơn & Tiền cọc đã trả
            </span>
            <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700 }}>
              ✓ ĐÃ THANH TOÁN
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-secondary)" }}>
            Khách hàng: <strong>{task.customerName}</strong> ({task.customerPhone}) · Kho: <strong>{task.unitCode}</strong>
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", paddingTop: "4px" }}>
            <span>Tiền cọc giữ chỗ (10%):</span>
            <strong>{formatVnd(task.depositPaid || 180000)}</strong>
          </div>
        </div>

        {/* Bước 2: Thu 100% tiền thuê tại quầy */}
        <div className="ritual-step-card">
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <Receipt size={18} weight="bold" />
              2. Thu tiền thuê kỳ đầu tại quầy
            </span>
            <strong style={{ color: "var(--color-accent)", fontSize: "0.92rem" }}>
              {formatVnd(task.rentAmount || 1800000)}
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-secondary)" }}>
            Quy định nghiệp vụ (FR-15): Tiền cọc và tiền thuê là hai khoản tách biệt. Phải thu đủ 100% tiền thuê trước khi bàn giao kho.
          </p>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
              PHƯƠNG THỨC THU TIỀN:
            </label>
            <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === "CASH"}
                  onChange={() => setPaymentMethod("CASH")}
                />
                Tiền mặt
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="QR"
                  checked={paymentMethod === "QR"}
                  onChange={() => setPaymentMethod("QR")}
                />
                Quét mã QR PayOS
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="POS"
                  checked={paymentMethod === "POS"}
                  onChange={() => setPaymentMethod("POS")}
                />
                Quẹt thẻ POS
              </label>
            </div>
          </div>
        </div>

        {/* Bước 3: Đính kèm ảnh hợp đồng đã ký */}
        <div className="ritual-step-card">
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <FileText size={18} weight="bold" />
              3. Chụp / Đính kèm ảnh hợp đồng đã ký
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-secondary)" }}>
            In bản hợp đồng mẫu cho khách ký, sau đó chụp ảnh trang có chữ ký 2 bên để lưu vào nhật ký hợp đồng (ActivityLog CONTRACT_SIGNED).
          </p>
          <div
            className="ritual-photo-preview"
            onClick={handleSimulateUpload}
            title="Bấm để tải ảnh mẫu"
          >
            {photoUploaded ? (
              <div style={{ textAlign: "center", color: "#16a34a" }}>
                <ShieldCheck size={32} weight="bold" />
                <p style={{ margin: "4px 0 0 0", fontWeight: 700 }}>Đã tải lên ảnh hợp đồng có chữ ký</p>
                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>(Bấm để thay đổi ảnh)</span>
              </div>
            ) : (
              <>
                <UploadSimple size={24} />
                <span>Bấm vào đây để tải ảnh hoặc mở camera chụp hợp đồng</span>
              </>
            )}
          </div>
        </div>

        {/* Bước 4: Mở khóa Access Code PIN */}
        <div className="ritual-step-card">
          <div className="ritual-step-header">
            <span className="ritual-step-title">
              <Key size={18} weight="bold" />
              4. Cấp mã PIN khóa điện tử cho khách
            </span>
          </div>
          {photoUploaded ? (
            <div className="access-pin-reveal-box">
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#94a3b8" }}>MÃ SỐ BÀN GIAO CHO KHÁCH:</p>
              <div className="access-pin-number">{task.accessPin || "8842-Active"}</div>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#34d399" }}>
                ✓ Mã đã được kích hoạt trên hệ thống khóa tự quản Depot Tân Bình
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: "#f1f5f9", padding: "12px", fontSize: "0.78rem", color: "#64748b", textAlign: "center" }}>
              🔒 Mã PIN đang bị khóa theo quy tắc bảo mật (AD-5). Hoàn tất chụp ảnh hợp đồng đã ký ở Bước 3 để mở khóa mã PIN.
            </div>
          )}
        </div>

        {/* Nút hành động chốt */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
          <Button variant="secondary" onClick={onClose}>
            Hủy / Đóng
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!photoUploaded || isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : "HOÀN TẤT CHECK-IN & BÀN GIAO"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: US-21 CHECKOUT RITUAL DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function CheckoutRitualDrawer({ task, onClose, onSuccess }) {
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
      alert("Quy định: Phụ phí bồi thường bắt buộc phải có tên hạng mục, số tiền > 0 và lý do hư hại cụ thể!");
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
      alert("Không thể đóng rental: Mọi khoản phụ phí hư hại bắt buộc có số tiền và lý do giải trình!");
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
      alert(
        `Đã hoàn tất tất toán cho đơn ${task.refCode}!\n- Tiền cọc hoàn trả: ${formatVnd(refundAmount)}\n- Hệ thống đã tự động sinh một Thẻ dọn kho (Cleaning Task) cho ${task.unitCode}.`
      );
      onSuccess();
    } catch (err) {
      alert(err.message || "Lỗi khi xử lý tất toán");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={Boolean(task)}
      headerLabel={`TẤT TOÁN TRẢ KHO · ${task.refCode}`}
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
            <div style={{ display: "flex", flexConcat: "column", flexDirection: "column", gap: "8px" }}>
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
              placeholder="Lý do hư hại cụ thể (bắt buộc theo quy định FR-18)"
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
            {isSubmitting ? "Đang xử lý..." : "XÁC NHẬN TẤT TOÁN & ĐÓNG HỢP ĐỒNG"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: CLEANING RITUAL DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function CleaningRitualDrawer({ task, onClose, onSuccess }) {
  const [checklist, setChecklist] = useState({
    sweptFloor: false,
    dehumidifierChecked: false,
    lockLubricated: false,
  });

  const allChecked = checklist.sweptFloor && checklist.dehumidifierChecked && checklist.lockLubricated;

  const handleComplete = async () => {
    try {
      await completeCleaningRitual(task.taskId, checklist);
      alert(`Đã hoàn tất dọn kho ${task.unitCode}! Kho đã sẵn sàng cho khách thuê tiếp theo.`);
      onSuccess();
    } catch (err) {
      alert(err.message || "Lỗi khi cập nhật");
    }
  };

  return (
    <Drawer open={Boolean(task)} headerLabel={`DỌN KHO · ${task.unitCode}`} onClose={onClose}>
      <div className="ritual-flow">
        <div className="ritual-step-card">
          <span className="ritual-step-title">
            <Broom size={18} weight="bold" />
            Checklist vệ sinh kho tự quản
          </span>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-secondary)" }}>
            Hoàn tất các bước dọn dẹp trước khi đưa Unit trở về trạng thái Available.
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
            HOÀN TẤT VỆ SINH (AVAILABLE)
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: SUPPORT TICKET DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function SupportTicketDrawer({ task, onClose, onSuccess }) {
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
      alert(escalate ? "Đã chuyển sự cố lên Quản lý cơ sở!" : "Đã xử lý xong sự cố!");
      onSuccess();
    } catch (err) {
      alert(err.message || "Lỗi khi xử lý ticket");
    }
  };

  return (
    <Drawer open={Boolean(task)} headerLabel={`XỬ LÝ SỰ CỐ · ${task.refCode}`} onClose={onClose}>
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
              Báo cáo sự cố nghiêm trọng lên Quản lý cơ sở (Escalate)
            </label>

            {escalate && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  placeholder="Lý do bắt buộc chuyển tiếp lên Quản lý..."
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
            {escalate ? "CHUYỂN TIẾP LÊN QUẢN LÝ" : "HOÀN TẤT XỬ LÝ SỰ CỐ"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: CONTRACT / ADDENDUM SIGNATURE DRAWER (US-19)
// ─────────────────────────────────────────────────────────────────────────────
function ContractRitualDrawer({ task, onClose, onSuccess }) {
  const [photoUrl, setPhotoUrl] = useState(task.ritual?.contractPhotoUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCapturePhoto = () => {
    setIsUploading(true);
    setTimeout(() => {
      setPhotoUrl(PLACEHOLDER_UNIT_IMAGE);
      setIsUploading(false);
    }, 400);
  };

  const handleConfirmSignature = async () => {
    if (!photoUrl) return;
    setIsSubmitting(true);
    try {
      await completeContractRitual(task.taskId, { contractPhotoUrl: photoUrl });
      alert(`Đã hoàn tất lưu hồ sơ hợp đồng/phụ lục ${task.refCode}!`);
      onSuccess();
    } catch (err) {
      alert(err.message || "Lỗi khi lưu chữ ký hợp đồng");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={Boolean(task)} headerLabel={`KÝ HỢP ĐỒNG / PHỤ LỤC · ${task.refCode}`} onClose={onClose}>
      <div className="ritual-flow">
        {/* Thông tin hợp đồng / phụ lục */}
        <div className="ritual-step-card">
          <span className="ritual-step-title">
            <FileText size={18} weight="bold" />
            Hồ sơ pháp lý cần đối chiếu chữ ký
          </span>
          <div style={{ fontSize: "0.82rem" }}>
            <p style={{ margin: "4px 0" }}>Khách hàng: <strong>{task.customerName}</strong> ({task.customerPhone || "Khách tại quầy"})</p>
            <p style={{ margin: "4px 0" }}>Vị trí kho: <strong>{task.unitCode}</strong> · Mã hồ sơ: <strong>{task.refCode}</strong></p>
            {task.alertNote && (
              <div style={{ backgroundColor: "#ecfdf5", padding: "8px 10px", border: "1px solid #a7f3d0", marginTop: "8px", color: "#065f46" }}>
                <strong>Ghi chú:</strong> {task.alertNote}
              </div>
            )}
          </div>
        </div>

        {/* Chụp / Tải ảnh bản hợp đồng giấy có chữ ký */}
        <div className="ritual-step-card">
          <span className="ritual-step-title">
            <UploadSimple size={18} weight="bold" />
            Đính kèm ảnh chụp bản hợp đồng giấy đã ký tên (Bắt buộc FR-12)
          </span>
          <p style={{ margin: "4px 0 10px 0", fontSize: "0.78rem", color: "var(--color-secondary)" }}>
            Nhân viên đối chiếu chữ ký của khách hàng trên bản in giấy và chụp lại trang có chữ ký để lưu vào hệ thống.
          </p>

          <div
            className="ritual-photo-dropzone"
            onClick={handleCapturePhoto}
            title="Bấm để chụp hoặc tải ảnh bản ký"
          >
            {photoUrl ? (
              <div className="ritual-photo-preview">
                <img src={photoUrl} alt="Hợp đồng đã ký" />
                <span className="photo-preview-tag">✓ Đã chụp ảnh hợp đồng có chữ ký</span>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 12px" }}>
                <UploadSimple size={32} weight="bold" color="#64748b" />
                <p style={{ margin: "6px 0 0 0", fontWeight: 600 }}>
                  {isUploading ? "Đang tải ảnh lên..." : "Chụp ảnh bản hợp đồng đã ký tên"}
                </p>
                <small style={{ color: "#94a3b8" }}>Hỗ trợ camera quầy hoặc tệp ảnh JPG/PNG</small>
              </div>
            )}
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleConfirmSignature} disabled={!photoUrl || isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "XÁC NHẬN ĐÃ KÝ & HOÀN TẤT"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
