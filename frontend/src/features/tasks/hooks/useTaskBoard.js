import { useState, useEffect, useCallback } from "react";
import {
  getStaffTasks,
  updateTaskStatus,
  checkSnapBackViolation,
} from "../../../services/taskService.js";

export function useTaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Snap-back notification toast state & visual snap-back trigger (FR-22)
  const [toastData, setToastData] = useState(null); // { message, task }
  const [snappingBackTaskId, setSnappingBackTaskId] = useState(null);

  // General action toast (thay thế window.alert)
  const [actionToast, setActionToast] = useState(null);
  const showActionToast = useCallback((message, type = "success") => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 4500);
  }, []);

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
      console.error("Failed to fetch staff tasks:", err);
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
        console.error("Failed to fetch staff tasks:", err);
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

  return {
    tasks,
    setTasks,
    activeTab,
    setActiveTab,
    loading,
    toastData,
    setToastData,
    snappingBackTaskId,
    actionToast,
    setActionToast,
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
    filteredTasks,
    getColTasks,
    taskTypeCounts,
  };
}
