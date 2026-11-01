import { useEffect, useState } from "react";
import { getTaskContractPreview } from "../../../services/taskService.js";

const EMPTY_PROPS = { contract: undefined, reservation: {}, unit: undefined };

function toContractProps(preview, task) {
  if (!preview) {
    return {
      contract: { code: `HĐ-${task?.refCode || "SH"}` },
      reservation: {
        code: task?.refCode,
        customerName: task?.customerName,
        customerPhone: task?.customerPhone,
        unitCode: task?.unitCode,
      },
      unit: undefined,
    };
  }
  return {
    contract: { code: `HĐ-${preview.reservationCode}` },
    reservation: {
      code: preview.reservationCode,
      startDate: preview.startDate,
      endDate: preview.endDate,
      durationDays: preview.durationDays,
      totalRent: preview.totalRent,
      depositAmount: preview.depositPaid,
      customerName: preview.customerName,
      customerPhone: preview.customerPhone,
      customerEmail: preview.customerEmail,
    },
    unit: {
      code: preview.unitCode,
      typeName: preview.unitTypeName,
      sizeM2: preview.sizeM2,
      baseDailyRent: preview.dailyRent,
      accessType: preview.accessType,
    },
  };
}

export function useContractPreview(task, enabled) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!enabled || !task?.taskId) return;
    let ignore = false;
    getTaskContractPreview(task.taskId)
      .then((data) => {
        if (!ignore) setPreview(data);
      })
      .catch((err) => console.error("Failed to fetch contract preview:", err));
    return () => {
      ignore = true;
    };
  }, [enabled, task?.taskId]);

  return preview ? toContractProps(preview, task) : EMPTY_PROPS;
}
