import { apiClient, safeParseJson } from "./apiClient";

/**
 * Cấu hình 5 loại Task theo chuẩn nghiệp vụ (FR-21 / StateChart-6)
 */
export const TASK_TYPES = {
  CHECK_IN: {
    key: "CHECK_IN",
    label: "Check-in",
    shortLabel: "Nhận kho",
    color: "#4f46e5", // Indigo Primary
    bg: "#eef2ff",
    border: "#c7d2fe",
    barColor: "#4f46e5",
  },
  CHECKOUT: {
    key: "CHECKOUT",
    label: "Checkout",
    shortLabel: "Trả kho",
    color: "#0284c7", // Sky Blue Preparing
    bg: "#f0f9ff",
    border: "#bae6fd",
    barColor: "#0284c7",
  },
  CLEANING: {
    key: "CLEANING",
    label: "Cleaning",
    shortLabel: "Vệ sinh",
    color: "#b45309", // Amber Buffer
    bg: "#fffbeb",
    border: "#fde68a",
    barColor: "#f59e0b",
  },
  SUPPORT: {
    key: "SUPPORT",
    label: "Support",
    shortLabel: "Hỗ trợ",
    color: "#dc2626", // Red Error / Incident
    bg: "#fef2f2",
    border: "#fecaca",
    barColor: "#dc2626",
  },
  CONTRACT: {
    key: "CONTRACT",
    label: "Contract",
    shortLabel: "Ký HĐ",
    color: "#059669", // Emerald Available
    bg: "#ecfdf5",
    border: "#a7f3d0",
    barColor: "#059669",
  },
};

export const TASK_STATUSES = {
  TODO: { key: "TODO", label: "Chờ xử lý", countLabel: "Chờ xử lý" },
  IN_PROGRESS: { key: "IN_PROGRESS", label: "Đang thực hiện", countLabel: "Đang thực hiện" },
  DONE: { key: "DONE", label: "Đã hoàn thành", countLabel: "Hoàn thành" },
};

const STORAGE_KEY = "storagehub_tasks_v2";

/**
 * Danh sách Task mẫu ban đầu theo đúng snapshot ca sáng Depot Tân Bình (F2-01 mockup & seed DB)
 */
const INITIAL_TASKS = [
  {
    taskId: 1042,
    type: "CHECK_IN",
    refCode: "BK-1042",
    unitCode: "Unit S-3",
    customerName: "Nguyễn Thị Lan",
    customerPhone: "0901 234 567",
    dueTime: "09:00",
    status: "TODO",
    workDate: "2026-10-08",
    accessPin: "8842-Active",
    rentAmount: 1800000,
    depositPaid: 180000,
    // Trạng thái kiểm soát nghiệp vụ check-in ritual (US-15)
    ritual: {
      depositVerified: true,
      rentCollected: false,
      contractSigned: false,
      contractPhotoUrl: null,
      accessCodeHanded: false,
    },
  },
  {
    taskId: 1043,
    type: "CLEANING",
    refCode: "CL-0101",
    unitCode: "Unit S-1",
    customerName: "Hệ thống",
    dueTime: "16:00",
    status: "TODO",
    workDate: "2026-10-08",
    alertNote: "Khách kế tiếp nhận lúc 16:30",
    ritual: {
      sweptFloor: false,
      dehumidifierChecked: false,
      lockLubricated: false,
      readyForTenant: false,
    },
  },
  {
    taskId: 1044,
    type: "SUPPORT",
    refCode: "SR-0032",
    unitCode: "Unit S-4",
    customerName: "Lê Minh Trí",
    customerPhone: "0912 888 999",
    dueTime: "11:30",
    status: "TODO",
    workDate: "2026-10-08",
    priority: "Medium",
    issueDescription: "Cửa cuốn bị kẹt rãnh dưới góc phải, khó kéo hết hành trình.",
    ritual: {
      assignedTo: "Trần Minh",
      resolvedNote: "",
      escalated: false,
      escalationReason: "",
    },
  },
  {
    taskId: 1045,
    type: "CHECKOUT",
    refCode: "RT-0871",
    unitCode: "Unit M-2",
    customerName: "Hoàng Nam",
    customerPhone: "0933 555 777",
    dueTime: "14:00",
    status: "IN_PROGRESS",
    workDate: "2026-10-08",
    depositAmount: 360000,
    rentalMonths: 3,
    // Trạng thái kiểm soát nghiệp vụ checkout ritual (US-21)
    ritual: {
      checklist: {
        accessCard: "OK",
        padlock: "OK",
        cleanliness: "MINOR", // Có vết bẩn nhẹ
        structure: "OK",
      },
      damageCharges: [
        { id: 1, item: "Vệ sinh sàn khử ố", amount: 100000, reason: "Vết dầu xe đọng góc trái kho" }
      ],
      settlementConfirmed: false,
      receiptPrinted: false,
    },
  },
  {
    taskId: 1046,
    type: "CLEANING",
    refCode: "CL-0102",
    unitCode: "Unit L-3",
    customerName: "Hệ thống",
    dueTime: "15:00",
    status: "IN_PROGRESS",
    workDate: "2026-10-08",
    alertNote: "12 m² · Cần hút ẩm khử mùi",
    ritual: {
      sweptFloor: true,
      dehumidifierChecked: false,
      lockLubricated: false,
      readyForTenant: false,
    },
  },
  {
    taskId: 1047,
    type: "CONTRACT",
    refCode: "CT-1044",
    unitCode: "Unit S-2",
    customerName: "Phạm Tuấn",
    customerPhone: "0944 111 222",
    dueTime: "10:15",
    status: "DONE",
    workDate: "2026-10-08",
    ritual: {
      contractSigned: true,
      contractPhotoUrl: "/placeholder.svg",
    },
  },
  {
    taskId: 1048,
    type: "CHECK_IN",
    refCode: "BK-1040",
    unitCode: "Unit M-1",
    customerName: "Đỗ Mai Hương",
    dueTime: "08:30",
    status: "DONE",
    workDate: "2026-10-08",
    accessPin: "1940-Active",
    rentAmount: 3600000,
    depositPaid: 360000,
    ritual: {
      depositVerified: true,
      rentCollected: true,
      contractSigned: true,
      contractPhotoUrl: "/placeholder.svg",
      accessCodeHanded: true,
    },
  },
  {
    taskId: 1049,
    type: "CONTRACT",
    refCode: "CT-1042-A1",
    unitCode: "Unit S-3",
    customerName: "Nguyễn Thị Lan",
    customerPhone: "0901 234 567",
    dueTime: "Hạn 7 ngày",
    status: "IN_PROGRESS",
    workDate: "2026-10-08",
    alertNote: "Phụ lục gia hạn +2 tháng (chờ ký tại quầy)",
    ritual: {
      contractSigned: false,
      contractPhotoUrl: null,
    },
  },
];

export function resetLocalTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
  } catch (err) {
    console.error("Failed to reset tasks:", err);
  }
  return INITIAL_TASKS;
}

function loadLocalTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read tasks:", err);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
  return INITIAL_TASKS;
}

function saveLocalTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error("Failed to save tasks:", err);
  }
}

/**
 * Lấy danh sách nhiệm vụ của ca trực
 */
export async function getStaffTasks() {
  return loadLocalTasks();
}

/**
 * Cập nhật trạng thái nhiệm vụ (To do -> In progress -> Done)
 */
export async function updateTaskStatus(taskId, newStatus) {
  try {
    const res = await apiClient(`/api/v1/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await safeParseJson(res);
      const tasks = loadLocalTasks();
      const idx = tasks.findIndex((t) => t.taskId === Number(taskId));
      if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], ...updated };
        saveLocalTasks(tasks);
      }
      return updated;
    } else {
      const errData = await safeParseJson(res);
      if (errData && errData.message) {
        throw new Error(errData.message);
      }
    }
  } catch (err) {
    if (err.message && (err.message.includes("Chặn Done ảo") || err.message.includes("nhiệm vụ"))) {
      throw err;
    }
  }

  const tasks = loadLocalTasks();
  const idx = tasks.findIndex((t) => t.taskId === Number(taskId));
  if (idx === -1) throw new Error("Không tìm thấy nhiệm vụ");

  const task = tasks[idx];

  // Kiểm tra rule chống Done ảo (Snap-back FR-22)
  if (newStatus === "DONE") {
    const violation = checkSnapBackViolation(task);
    if (violation) {
      throw new Error(violation);
    }
  }

  task.status = newStatus;
  tasks[idx] = task;
  saveLocalTasks(tasks);
  return task;
}

/**
 * Kiểm tra điều kiện Snap-back chống Done ảo (FR-22 / AD-4)
 * @returns {string|null} Thông báo lỗi nếu vi phạm, null nếu hợp lệ
 */
export function checkSnapBackViolation(task) {
  if (!task) return null;

  if (task.type === "CHECK_IN") {
    if (!task.ritual?.depositVerified) {
      return "Chặn Done ảo: Đơn chưa xác nhận thanh toán tiền cọc!";
    }
    if (!task.ritual?.rentCollected) {
      return "Chặn Done ảo: Chưa thu 100% tiền thuê kho tại quầy!";
    }
    if (!task.ritual?.contractSigned || !task.ritual?.contractPhotoUrl) {
      return "Chặn Done ảo: Chưa hoàn tất ký hợp đồng và đính kèm ảnh bản ký!";
    }
    if (!task.ritual?.accessCodeHanded) {
      return "Chặn Done ảo: Chưa cấp phát mã truy cập (Access Code) cho khách!";
    }
  }

  if (task.type === "CHECKOUT") {
    const checklist = task.ritual?.checklist;
    if (!checklist || !checklist.accessCard || !checklist.padlock || !checklist.cleanliness || !checklist.structure) {
      return "Chặn Done ảo: Chưa hoàn tất biên bản kiểm tra 4 hạng mục kho (Thẻ, Khóa, Sàn, Kết cấu)!";
    }
    const hasUnresolvedDamage = (task.ritual?.damageCharges || []).some(
      (c) => !c.reason || !c.amount || c.amount <= 0
    );
    if (hasUnresolvedDamage) {
      return "Chặn Done ảo: Khoản phụ phí bồi thường phải có đầy đủ số tiền và lý do!";
    }
    if (!task.ritual?.settlementConfirmed) {
      return "Chặn Done ảo: Chưa hoàn tất đối soát tất toán cọc và phụ phí!";
    }
    if (!task.ritual?.receiptPrinted) {
      return "Chặn Done ảo: Chưa xuất biên nhận tất toán thanh lý hợp đồng!";
    }
  }

  if (task.type === "CLEANING") {
    if (!task.ritual?.sweptFloor) {
      return "Chặn Done ảo: Chưa quét dọn và hút bụi sạch sẽ sàn kho!";
    }
    if (!task.ritual?.dehumidifierChecked) {
      return "Chặn Done ảo: Chưa kiểm tra máy hút ẩm và độ thông gió của kho!";
    }
    if (!task.ritual?.lockLubricated) {
      return "Chặn Done ảo: Chưa tra dầu chốt khóa và reset mã ổ khóa về mặc định!";
    }
    if (!task.ritual?.readyForTenant) {
      return "Chặn Done ảo: Kho chưa được nghiệm thu sẵn sàng giao khách (Ready for tenant)!";
    }
  }

  if (task.type === "SUPPORT") {
    if (task.ritual?.escalated) {
      if (!task.ritual?.escalationReason || !task.ritual.escalationReason.trim()) {
        return "Chặn Done ảo: Báo cáo sự cố lên Quản lý bắt buộc phải có lý do chi tiết!";
      }
    } else {
      if (!task.ritual?.resolvedNote || !task.ritual.resolvedNote.trim()) {
        return "Chặn Done ảo: Yêu cầu hỗ trợ phải có ghi chú biện pháp xử lý sự cố trước khi đóng!";
      }
    }
  }

  if (task.type === "CONTRACT") {
    if (!task.ritual?.contractSigned || !task.ritual?.contractPhotoUrl) {
      return "Chặn Done ảo: Thiếu ảnh chụp hồ sơ phụ lục hợp đồng đã ký tên tại quầy!";
    }
  }

  return null;
}

/**
 * Thực hiện ký hợp đồng / phụ lục tại quầy (US-19)
 */
export async function completeContractRitual(taskId, { contractPhotoUrl }) {
  const tasks = loadLocalTasks();
  const idx = tasks.findIndex((t) => t.taskId === Number(taskId));
  if (idx === -1) throw new Error("Không tìm thấy nhiệm vụ Ký hợp đồng");

  const task = tasks[idx];
  task.ritual = {
    ...task.ritual,
    contractSigned: true,
    contractPhotoUrl: contractPhotoUrl || "/placeholder.svg",
  };
  task.status = "DONE";

  tasks[idx] = task;
  saveLocalTasks(tasks);
  return task;
}

/**
 * Thực hiện nghiệp vụ Check-in Ritual (US-15)
 */
export async function completeCheckinRitual(taskId, { paymentMethod, contractPhotoUrl, accessPin }) {
  const tasks = loadLocalTasks();
  const idx = tasks.findIndex((t) => t.taskId === Number(taskId));
  if (idx === -1) throw new Error("Không tìm thấy nhiệm vụ Check-in");

  const task = tasks[idx];
  task.ritual = {
    ...task.ritual,
    depositVerified: true,
    rentCollected: true,
    paymentMethod: paymentMethod || "CASH",
    contractSigned: true,
    contractPhotoUrl: contractPhotoUrl || "/placeholder.svg",
    accessCodeHanded: true,
  };
  task.accessPin = accessPin || task.accessPin || "8842-Active";
  task.status = "DONE";

  tasks[idx] = task;
  saveLocalTasks(tasks);
  return task;
}

/**
 * Thực hiện nghiệp vụ Checkout Ritual (US-21)
 */
export async function completeCheckoutRitual(taskId, { checklist, damageCharges, refundAmount, extraCharged }) {
  const tasks = loadLocalTasks();
  const idx = tasks.findIndex((t) => t.taskId === Number(taskId));
  if (idx === -1) throw new Error("Không tìm thấy nhiệm vụ Checkout");

  const task = tasks[idx];
  task.ritual = {
    ...task.ritual,
    checklist,
    damageCharges: damageCharges || [],
    refundAmount: refundAmount || 0,
    extraCharged: extraCharged || 0,
    settlementConfirmed: true,
    receiptPrinted: true,
  };
  task.status = "DONE";

  // Sau khi Checkout thành công -> Tự động sinh task dọn kho CLEANING cho Unit này theo quy định
  const newCleaningTaskId = Math.max(...tasks.map((t) => t.taskId), 1050) + 1;
  const newCleaningTask = {
    taskId: newCleaningTaskId,
    type: "CLEANING",
    refCode: `CL-${newCleaningTaskId}`,
    unitCode: task.unitCode,
    customerName: "Hệ thống (Tự động sau trả kho)",
    dueTime: "17:00",
    status: "TODO",
    workDate: task.workDate,
    alertNote: "Cần dọn dẹp và kiểm tra kho sau khi khách trả",
    ritual: {
      sweptFloor: false,
      dehumidifierChecked: false,
      lockLubricated: false,
      readyForTenant: false,
    },
  };

  tasks.push(newCleaningTask);
  saveLocalTasks(tasks);
  return { checkoutTask: task, newCleaningTask };
}

/**
 * Hoàn tất dọn kho (Cleaning)
 */
export async function completeCleaningRitual(taskId, checklistState) {
  const tasks = loadLocalTasks();
  const idx = tasks.findIndex((t) => t.taskId === Number(taskId));
  if (idx === -1) throw new Error("Không tìm thấy nhiệm vụ");

  const task = tasks[idx];
  task.ritual = {
    ...task.ritual,
    ...checklistState,
    readyForTenant: true,
  };
  task.status = "DONE";
  tasks[idx] = task;
  saveLocalTasks(tasks);
  return task;
}

/**
 * Xử lý hoặc chuyển tiếp Ticket Support
 */
export async function resolveSupportTicket(taskId, { note, escalate = false, escalateReason = "" }) {
  const tasks = loadLocalTasks();
  const idx = tasks.findIndex((t) => t.taskId === Number(taskId));
  if (idx === -1) throw new Error("Không tìm thấy nhiệm vụ");

  const task = tasks[idx];
  if (escalate) {
    if (!escalateReason.trim()) {
      throw new Error("Lý do báo cáo sự cố lên Quản lý (Escalate) là bắt buộc!");
    }
    task.ritual.escalated = true;
    task.ritual.escalationReason = escalateReason;
    task.priority = "High";
  } else {
    task.ritual.resolvedNote = note;
    task.status = "DONE";
  }

  tasks[idx] = task;
  saveLocalTasks(tasks);
  return task;
}
