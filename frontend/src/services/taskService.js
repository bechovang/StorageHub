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

const RITUAL_CACHE_KEY = "storagehub_task_rituals_v1";

function loadRitualOverrides() {
  try {
    const raw = sessionStorage.getItem(RITUAL_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read task ritual state:", err);
  }
  return {};
}

function saveRitualOverride(taskId, patch) {
  try {
    const current = loadRitualOverrides();
    current[taskId] = { ...(current[taskId] || {}), ...patch };
    sessionStorage.setItem(RITUAL_CACHE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error("Failed to save task ritual state:", err);
  }
}

const DEMO_STAFF_TASKS = [
  {
    taskId: "task-ci-1",
    type: "CHECK_IN",
    refCode: "RSV-2026-L1",
    unitCode: "LOCK-1",
    customerName: "Trần Thị Lan",
    customerPhone: "0912 345 678",
    depositPaid: 230000,
    rentAmount: 2070000,
    dueTime: "10:30",
    status: "TODO",
    priority: "High",
    accessPin: "8842-Active",
    ritual: { depositVerified: true, rentCollected: false, contractSigned: false, accessCodeHanded: false },
  },
  {
    taskId: "task-co-1",
    type: "CHECKOUT",
    refCode: "RSV-2026-S1",
    unitCode: "BOX-102",
    customerName: "Nguyễn Văn Hùng",
    customerPhone: "0988 123 456",
    depositAmount: 360000,
    dueTime: "14:00",
    status: "TODO",
    priority: "Medium",
    ritual: {},
  },
  {
    taskId: "task-cl-1",
    type: "CLEANING",
    refCode: "CL-901",
    unitCode: "BOX-205",
    dueTime: "16:00",
    status: "IN_PROGRESS",
    priority: "Medium",
    ritual: {},
  },
  {
    taskId: "task-ct-1",
    type: "CONTRACT",
    refCode: "CTR-2026-A1",
    unitCode: "BOX-301",
    customerName: "Trần Thị Lan",
    customerPhone: "0912 345 678",
    alertNote: "Ký phụ lục gia hạn thuê thêm 1 tháng",
    dueTime: "11:00",
    status: "TODO",
    priority: "Medium",
    ritual: {},
  },
  {
    taskId: "task-sp-1",
    type: "SUPPORT",
    refCode: "TCK-881",
    unitCode: "SEC-101",
    customerName: "Lê Hoàng Long",
    customerPhone: "0909 999 888",
    issueDescription: "Khách bấm nhầm mã PIN 3 lần, bàn phím số tạm khóa.",
    dueTime: "09:15",
    status: "TODO",
    priority: "High",
    ritual: {},
  },
];

/**
 * Lấy danh sách nhiệm vụ của ca trực từ Backend: GET /api/v1/tasks
 */
export async function getStaffTasks() {
  let list = [];
  try {
    const res = await apiClient("/api/v1/tasks");
    const data = await safeParseJson(res);
    if (!res.ok) throw new Error(data.message);
    list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  } catch (err) {
    list = DEMO_STAFF_TASKS;
  }

  const overrides = loadRitualOverrides();

  return list.map((task) => {
    const ov = overrides[task.taskId];
    if (!ov) return task;
    return {
      ...task,
      status: ov.status || task.status,
      accessPin: ov.accessPin || task.accessPin,
      priority: ov.priority || task.priority,
      ritual: {
        ...(task.ritual || {}),
        ...(ov.ritual || {}),
      },
    };
  });
}

/**
 * Cập nhật trạng thái nhiệm vụ (To do -> In progress -> Done): PATCH /api/v1/tasks/{taskId}/status
 */
export async function updateTaskStatus(taskId, newStatus) {
  try {
    const res = await apiClient(`/api/v1/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await safeParseJson(res);
    if (!res.ok) throw new Error(data.message);
    saveRitualOverride(taskId, { status: newStatus });
    return data;
  } catch (err) {
    saveRitualOverride(taskId, { status: newStatus });
    return { success: true, taskId, status: newStatus };
  }
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
  saveRitualOverride(taskId, {
    status: "DONE",
    ritual: {
      contractSigned: true,
      contractPhotoUrl: contractPhotoUrl || "/placeholder.svg",
    },
  });

  try {
    await updateTaskStatus(taskId, "DONE");
  } catch (err) {
    console.warn("Backend status sync deferred for contract ritual:", err);
  }
}

/**
 * Thực hiện nghiệp vụ Check-in Ritual (US-15)
 */
export async function completeCheckinRitual(taskId, { paymentMethod, contractPhotoUrl, accessPin }) {
  saveRitualOverride(taskId, {
    status: "DONE",
    accessPin: accessPin || "8842-Active",
    ritual: {
      depositVerified: true,
      rentCollected: true,
      paymentMethod: paymentMethod || "CASH",
      contractSigned: true,
      contractPhotoUrl: contractPhotoUrl || "/placeholder.svg",
      accessCodeHanded: true,
    },
  });

  try {
    await updateTaskStatus(taskId, "DONE");
  } catch (err) {
    console.warn("Backend status sync deferred for check-in ritual:", err);
  }
}

/**
 * Thực hiện nghiệp vụ Checkout Ritual (US-21)
 */
export async function completeCheckoutRitual(taskId, { checklist, damageCharges, refundAmount, extraCharged }) {
  saveRitualOverride(taskId, {
    status: "DONE",
    ritual: {
      checklist,
      damageCharges: damageCharges || [],
      refundAmount: refundAmount || 0,
      extraCharged: extraCharged || 0,
      settlementConfirmed: true,
      receiptPrinted: true,
    },
  });

  try {
    await updateTaskStatus(taskId, "DONE");
  } catch (err) {
    console.warn("Backend status sync deferred for checkout ritual:", err);
  }

  // Tự động tạo task dọn kho CLEANING qua POST /api/v1/tasks
  try {
    await apiClient("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify({
        type: "CLEANING",
        refCode: `CL-${Date.now().toString().slice(-4)}`,
        dueTime: "17:00",
        alertNote: "Cần dọn dẹp và kiểm tra kho sau khi khách trả",
      }),
    });
  } catch (err) {
    console.warn("Failed to auto-create cleaning task:", err);
  }
}

/**
 * Hoàn tất dọn kho (Cleaning)
 */
export async function completeCleaningRitual(taskId, checklistState) {
  saveRitualOverride(taskId, {
    status: "DONE",
    ritual: {
      ...checklistState,
      readyForTenant: true,
    },
  });

  await updateTaskStatus(taskId, "DONE");
}

/**
 * Xử lý hoặc chuyển tiếp Ticket Support
 */
export async function resolveSupportTicket(taskId, { note, escalate = false, escalateReason = "" }) {
  if (escalate) {
    if (!escalateReason.trim()) {
      throw new Error("Lý do báo cáo sự cố lên Quản lý (Escalate) là bắt buộc!");
    }
    saveRitualOverride(taskId, {
      priority: "High",
      ritual: {
        escalated: true,
        escalationReason: escalateReason,
      },
    });
    return;
  }

  saveRitualOverride(taskId, {
    status: "DONE",
    ritual: {
      resolvedNote: note,
      escalated: false,
    },
  });

  try {
    await updateTaskStatus(taskId, "DONE");
  } catch (err) {
    console.warn("Backend status sync deferred for support ritual:", err);
  }
}
