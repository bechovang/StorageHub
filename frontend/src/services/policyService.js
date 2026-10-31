/**
 * StorageHub — Policy Management Service (US-30 / FR-29 / FR-30 / NFR-8)
 * Kết nối API chính sách thuê kho.
 *
 * Lưu ý: Backend hiện CHƯA có PolicyController/endpoint CRUD cho policy.
 * Service vẫn gọi /api/v1/policies/active và để lỗi surface lên UI thay vì
 * dùng dữ liệu cứng hoặc localStorage.
 */

import { apiClient, safeParseJson } from "./apiClient.js";

export const HARD_CAPS = {
  LATE_CHECKOUT_MAX_PERCENT: 10, // Trần cứng phí trả trễ tối đa 10%
  SECURITY_DEPOSIT_MIN_PERCENT: 10, // Trần sàn tiền cọc tối thiểu 10%
  TURNOVER_BUFFER_MIN_DAYS: 1, // Đệm vệ sinh tối thiểu 1 ngày
  TURNOVER_BUFFER_MAX_DAYS: 7, // Đệm vệ sinh tối đa 7 ngày
};

/**
 * Lấy chính sách hiện hành: GET /api/v1/policies/active
 * Lỗi (404/500/mạng) sẽ được ném lên để UI hiển thị.
 */
export async function getCurrentPolicy() {
  const res = await apiClient("/api/v1/policies/active");
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể tải chính sách thuê kho hiện hành.");
  }
  return data;
}

/**
 * Kiểm tra tính hợp lệ của chính sách theo Hard Caps (Validation)
 * @returns {Array<{ field: string, rule: string, message: string }>} danh sách lỗi
 */
export function validatePolicy(policyDraft) {
  const errors = [];

  // 1. Kiểm tra trần phí phạt trả trễ (Late checkout fee <= 10%)
  const lateFee = Number(policyDraft.surcharges?.lateCheckoutPercent);
  if (isNaN(lateFee) || lateFee <= 0) {
    errors.push({
      field: "lateCheckoutPercent",
      rule: "#CAP-04",
      message: "Tỷ lệ phụ thu trả trễ phải lớn hơn 0%.",
    });
  } else if (lateFee > HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT) {
    errors.push({
      field: "lateCheckoutPercent",
      rule: "#CAP-04",
      message: `Late-checkout fee ${lateFee}% exceeds the ${HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT}% cap in Rental Policy. Fix the value, or edit the cap first.`,
    });
  }

  // 2. Kiểm tra tỷ lệ đặt cọc tối thiểu (Deposit >= 10%)
  const deposit = Number(policyDraft.surcharges?.depositPercent);
  if (isNaN(deposit) || deposit < HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT) {
    errors.push({
      field: "depositPercent",
      rule: "#CAP-08",
      message: `Tỷ lệ cọc tối thiểu không được dưới ${HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT}% (#CAP-08).`,
    });
  }

  // 3. Kiểm tra thời gian đệm Turnover Buffer (1 - 7 ngày)
  const buffer = Number(policyDraft.surcharges?.turnoverBufferDays);
  if (isNaN(buffer) || buffer < HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS || buffer > HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS) {
    errors.push({
      field: "turnoverBufferDays",
      rule: "#OPS-012",
      message: `Thời gian đệm vệ sinh phải từ ${HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS} đến ${HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS} ngày (#OPS-012).`,
    });
  }

  // 4. Kiểm tra giá thuê các loại kho (Base rent > 0)
  if (Array.isArray(policyDraft.baseRates)) {
    policyDraft.baseRates.forEach((rate) => {
      const val = Number(rate.rateVnd);
      if (isNaN(val) || val <= 0) {
        errors.push({
          field: `rate_${rate.id}`,
          rule: "#RATE-MIN",
          message: `Đơn giá cho loại kho ${rate.fullName || rate.typeName} phải lớn hơn 0 ₫.`,
        });
      }
    });
  }

  return errors;
}

/**
 * Lưu chính sách mới: POST /api/v1/policies
 * Chặn lưu nếu có lỗi validation; lỗi backend sẽ surface lên UI.
 */
export async function savePolicy(policyDraft, actorName = "Business Ops") {
  const errors = validatePolicy(policyDraft);
  if (errors.length > 0) {
    const errorObj = new Error(errors[0].message);
    errorObj.validationErrors = errors;
    throw errorObj;
  }

  const res = await apiClient("/api/v1/policies", {
    method: "POST",
    // Body đúng contract: { baseRates, lateCheckoutPercent, depositPercent, turnoverBufferDays, updatedBy }
    body: JSON.stringify({
      baseRates: (policyDraft.baseRates || []).map((r) => ({
        id: r.id,
        typeName: r.typeName,
        rateVnd: Number(r.rateVnd),
      })),
      lateCheckoutPercent: Number(policyDraft.surcharges?.lateCheckoutPercent),
      depositPercent: Number(policyDraft.surcharges?.depositPercent),
      turnoverBufferDays: Number(policyDraft.surcharges?.turnoverBufferDays),
      updatedBy: actorName,
    }),
  });
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể lưu chính sách thuê kho.");
  }
  return data;
}

/**
 * Khôi phục chính sách mặc định: POST /api/v1/policies/reset
 */
export async function resetPolicyToDefault(actorName = "Business Ops") {
  const res = await apiClient("/api/v1/policies/reset", {
    method: "POST",
    body: JSON.stringify({ actorName }),
  });
  const data = await safeParseJson(res);
  if (!res.ok) {
    throw new Error(data.message || "Không thể khôi phục chính sách mặc định.");
  }
  return data;
}
