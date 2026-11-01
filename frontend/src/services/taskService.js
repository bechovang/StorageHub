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


/**
 * Lấy danh sách nhiệm vụ của ca trực từ Backend: GET /api/v1/tasks
 */
export async function getStaffTasks() {
  const res = await apiClient("/api/v1/tasks");
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || "Không thể tải danh sách nhiệm vụ.");
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}

/**
 * Cập nhật trạng thái nhiệm vụ (To do -> In progress -> Done): PATCH /api/v1/tasks/{taskId}/status
 */
export async function getTaskDetail(taskId) {
  const res = await apiClient(`/api/v1/tasks/${taskId}`, { method: "GET" });
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || "Không thể tải chi tiết nhiệm vụ.");
  return data;
}

export async function updateTaskStatus(taskId, newStatus) {
  const res = await apiClient(`/api/v1/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
  });
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || "Không thể cập nhật trạng thái nhiệm vụ.");
  return data;
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
      return "Chặn Done ảo: Chưa thu đủ 100% tiền thuê kho tại quầy!";
    }
    if (!task.ritual?.paymentProofPhoto) {
      return "Chặn Done ảo: Chưa đính kèm ảnh chụp biên lai thu tiền mặt hoặc chuyển khoản ngân hàng!";
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
    if (!task.ritual?.settlementPhotoUrl) {
      return "Chặn Done ảo: Chưa đính kèm ảnh chứng từ đối soát hoàn tiền cọc hoặc thu phụ phí!";
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
export async function completeContractRitual(taskId, { contractPhotoUrl, notes = "" }) {
  // POST /api/v1/tasks/{id}/rituals/contract — lưu ảnh bản ký + SIGNED addendum/contract.
  const res = await apiClient(`/api/v1/tasks/${taskId}/rituals/contract`, {
    method: "POST",
    body: JSON.stringify({ contractPhotoUrl, notes }),
  });
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể lưu hồ sơ hợp đồng/phụ lục.");
  }
  return data;
}

/**
 * Thực hiện nghiệp vụ Check-in Ritual (US-15)
 */
export async function completeCheckinRitual(taskId, { paymentMethod, contractPhotoUrl, paymentProofPhoto, accessPin }) {
  // POST /api/v1/tasks/{id}/rituals/check-in — BE ghi payment RENT (CASH/QR/POS)
  // vào DB + ký hợp đồng + cấp access code + DONE task trong cùng transaction.
  const res = await apiClient(`/api/v1/tasks/${taskId}/rituals/check-in`, {
    method: "POST",
    body: JSON.stringify({
      paymentMethod,
      paymentProofPhoto,
      contractPhotoUrl,
      accessPin: accessPin || null,
    }),
  });
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể hoàn tất nhận kho.");
  }
  return data;
}

/**
 * Thực hiện nghiệp vụ Checkout Ritual (US-21)
 */
export async function completeCheckoutRitual(taskId, { checklist, damageCharges, refundAmount, extraCharged, settlementMethod, settlementPhotoUrl }) {
  // POST /api/v1/tasks/{id}/rituals/checkout — BE lập Settlement + Inspection +
  // ghi phí hư hại/phát sinh vào payments + đóng vòng thuê (1 transaction).
  const res = await apiClient(`/api/v1/tasks/${taskId}/rituals/checkout`, {
    method: "POST",
    body: JSON.stringify({
      checklist: Object.entries(checklist || {}).map(([item, result]) => ({ item, result })),
      damageCharges: (damageCharges || []).map((c) => ({
        item: c.item,
        amount: Number(c.amount) || 0,
        reason: c.reason || "",
      })),
      refundAmount: Number(refundAmount) || 0,
      extraCharged: Number(extraCharged) || 0,
      settlementMethod,
      settlementPhotoUrl,
    }),
  });
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tất toán trả kho.");
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
  return data;
}

/**
 * Hoàn tất dọn kho (Cleaning)
 */
export async function completeCleaningRitual(taskId, checklistState) {
  // Backend chưa có endpoint lưu chi tiết ritual — chỉ đồng bộ trạng thái qua API
  void checklistState;
  return updateTaskStatus(taskId, "DONE");
}

/**
 * Xử lý hoặc chuyển tiếp Ticket Support
 */
export async function resolveSupportTicket(taskId, { note, escalate = false, escalateReason = "" }) {
  if (escalate) {
    if (!escalateReason.trim()) {
      throw new Error("Lý do báo cáo sự cố lên Quản lý (Escalate) là bắt buộc!");
    }
    return updateTaskStatus(taskId, "ESCALATED");
  }

  void note;
  return updateTaskStatus(taskId, "DONE");
}
