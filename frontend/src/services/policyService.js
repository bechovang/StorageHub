/**
 * StorageHub — Policy Management Service (US-30 / FR-29 / FR-30 / NFR-8)
 * Quản trị chính sách thuê kho, biểu phí cơ bản, phụ thu và trần quy định (Hard Caps)
 *
 * Nghiệp vụ:
 * 1. Giá thuê cơ bản (Base rent per month) theo từng loại ô kho (S Indoor, S Outdoor, M Climate, L Climate, Locker)
 * 2. Phụ thu (Surcharges):
 *    - Phí trả kho trễ (Late checkout fee): Tối đa 10% (Hard cap #CAP-04). Nhập > 10% (ví dụ 15%) => Chặn lưu, cắm cờ.
 *    - Tỷ lệ tiền cọc tối thiểu (Security deposit %): Tối thiểu 10% (#CAP-08).
 *    - Thời gian đệm vệ sinh (Turnover buffer): Tối thiểu 1 ngày, tối đa 7 ngày (#OPS-012).
 *    - Phí bồi thường hư hại (Damage handling): Thẩm định tại quầy, bắt buộc lý do.
 * 3. Validation trước khi lưu:
 *    - Không bao giờ lưu chính sách vi phạm quy chuẩn.
 *    - Báo banner chuẩn: "Late-checkout fee [X]% exceeds the 10% cap in Rental Policy v3. Fix the value, or edit the cap first."
 * 4. Đóng dấu phiên bản (version stamp) + ngày hiệu lực (effective date) + ghi nhật ký kiểm toán (ActivityLog).
 */

import { appendActivityLog } from "./activityService.js";

const POLICY_STORAGE_KEY = "storagehub_policy_v3";

export const HARD_CAPS = {
  LATE_CHECKOUT_MAX_PERCENT: 10, // Trần cứng phí trả trễ tối đa 10%
  SECURITY_DEPOSIT_MIN_PERCENT: 10, // Trần sàn tiền cọc tối thiểu 10%
  TURNOVER_BUFFER_MIN_DAYS: 1, // Đệm vệ sinh tối thiểu 1 ngày
  TURNOVER_BUFFER_MAX_DAYS: 7, // Đệm vệ sinh tối đa 7 ngày
};

/**
 * Bản chính sách chuẩn Rental Policy v3 gốc (Seed baseline)
 */
export const DEFAULT_POLICY = {
  version: "v3.0.4",
  status: "ACTIVE",
  effectiveDate: "2026-10-01",
  updatedAt: "2026-10-18T10:30:00Z",
  updatedBy: "Lê Thị Hằng (Business Ops)",
  facilityScope: "VN-SGN-01 (Tân Bình Gateway)",
  baseRates: [
    {
      id: "RATE-S-IN",
      code: "S",
      typeName: "Indoor",
      fullName: "S · Indoor (1.5m × 2.0m)",
      rateVnd: 345000,
      billingInterval: "tháng",
      status: "ACTIVE",
    },
    {
      id: "RATE-S-OUT",
      code: "S",
      typeName: "Outdoor",
      fullName: "S · Outdoor (1.5m × 2.0m)",
      rateVnd: 380000,
      billingInterval: "tháng",
      status: "ACTIVE",
    },
    {
      id: "RATE-M-CLI",
      code: "M",
      typeName: "Climate",
      fullName: "M · Climate Controlled (2.0m × 3.0m)",
      rateVnd: 890000,
      billingInterval: "tháng",
      status: "ACTIVE",
    },
    {
      id: "RATE-L-CLI",
      code: "L",
      typeName: "Climate",
      fullName: "L · Climate Controlled (3.0m × 4.0m)",
      rateVnd: 1280000,
      billingInterval: "tháng",
      status: "ACTIVE",
    },
    {
      id: "RATE-LCK",
      code: "LCK",
      typeName: "Locker",
      fullName: "Locker Mini (0.8m × 0.8m)",
      rateVnd: 120000,
      billingInterval: "tháng",
      status: "ACTIVE",
    },
  ],
  surcharges: {
    lateCheckoutPercent: 5, // % cộng thêm trên mỗi ngày trễ
    depositPercent: 10, // % cọc trên tổng tiền thuê
    turnoverBufferDays: 1, // Số ngày đệm dọn dẹp sau trả kho
    damageAssessment: "Thẩm định tại quầy (bắt buộc lý do & biên bản)",
  },
};

/**
 * Lấy chính sách hiện tại từ LocalStorage
 */
export function getCurrentPolicy() {
  try {
    const raw = localStorage.getItem(POLICY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(DEFAULT_POLICY));
      return { ...DEFAULT_POLICY };
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read rental policy:", err);
    return { ...DEFAULT_POLICY };
  }
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
      message: `Late-checkout fee ${lateFee}% exceeds the ${HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT}% cap in Rental Policy v3. Fix the value, or edit the cap first.`,
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
 * Lưu chính sách mới
 * - Chặn lưu nếu có lỗi validation
 * - Đóng dấu phiên bản mới (v3.0.x hoặc v3.1)
 * - Cập nhật ngày hiệu lực và người sửa
 * - Tự động ghi nhận Activity Log
 */
export function savePolicy(policyDraft, actorName = "Lê Thị Hằng (Business Ops)") {
  const errors = validatePolicy(policyDraft);
  if (errors.length > 0) {
    const errorObj = new Error(errors[0].message);
    errorObj.validationErrors = errors;
    throw errorObj;
  }

  const current = getCurrentPolicy();
  const currentVer = current.version || "v3.0.4";
  
  // Tạo version mới tiếp theo
  let nextVer = "v3.1.0";
  const match = currentVer.match(/v3\.(\d+)\.?(\d+)?/);
  if (match) {
    const minor = parseInt(match[1] || "0", 10);
    const patch = parseInt(match[2] || "0", 10) + 1;
    nextVer = `v3.${minor}.${patch}`;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const effectiveDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // Hiệu lực từ ngày mai

  const updatedPolicy = {
    ...policyDraft,
    version: nextVer,
    status: "ACTIVE",
    effectiveDate: effectiveDate,
    updatedAt: nowIso,
    updatedBy: actorName,
  };

  localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(updatedPolicy));

  // Ghi nhận Activity Log
  try {
    appendActivityLog({
      actor: actorName,
      actorRole: "BUSINESS_OPS",
      entityType: "POLICY",
      entityId: nextVer,
      entityName: `Rental Policy ${nextVer}`,
      action: "UPDATED",
      fromValue: currentVer,
      toValue: nextVer,
      reason: `Ban hành điều chỉnh bảng giá và tham số quy chế thuê kho (${nextVer}, hiệu lực từ ${effectiveDate}).`,
    });
  } catch (e) {
    console.warn("Failed to log policy activity:", e);
  }

  return updatedPolicy;
}

/**
 * Khôi phục lại bản mặc định của hệ thống
 */
export function resetPolicyToDefault(actorName = "Lê Thị Hằng (Business Ops)") {
  localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(DEFAULT_POLICY));
  
  appendActivityLog({
    actor: actorName,
    actorRole: "BUSINESS_OPS",
    entityType: "POLICY",
    entityId: DEFAULT_POLICY.version,
    entityName: `Rental Policy ${DEFAULT_POLICY.version}`,
    action: "RESET",
    fromValue: null,
    toValue: DEFAULT_POLICY.version,
    reason: "Khôi phục chính sách giá và trần phụ thu về bản gốc mặc định v3.0.4.",
  });

  return { ...DEFAULT_POLICY };
}
