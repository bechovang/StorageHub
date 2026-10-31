import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  getCurrentPolicy,
  savePolicy,
  resetPolicyToDefault,
  validatePolicy,
  HARD_CAPS,
} from "../../../services/policyService.js";
import { formatVND } from "../../../utils/formatters.js";

export function usePolicyManagement() {
  const { user } = useAuth();
  const currentActorName = user?.fullName
    ? `${user.fullName} (${user.role === "SYSTEM_ADMIN" ? "System Admin" : "Business Ops"})`
    : "Lê Thị Hằng (Business Ops)";

  // Bản lưu trữ hiện tại trên hệ thống (tải từ API)
  const [persistedPolicy, setPersistedPolicy] = useState(null);
  const [policyError, setPolicyError] = useState("");
  const [policyLoading, setPolicyLoading] = useState(true);

  // Bản nháp đang thao tác (Form Draft)
  const [draftBaseRates, setDraftBaseRates] = useState([]);
  const [draftLateFee, setDraftLateFee] = useState("");
  const [draftDeposit, setDraftDeposit] = useState("");
  const [draftBufferDays, setDraftBufferDays] = useState("");

  // Lỗi validation & Banner cảnh báo
  const [validationBanner, setValidationBanner] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const capRulesRef = useRef(null);

  // Tải chính sách hiện hành từ API
  useEffect(() => {
    let ignore = false;
    async function loadPolicy() {
      setPolicyLoading(true);
      setPolicyError("");
      try {
        const policy = await getCurrentPolicy();
        if (!ignore) {
          setPersistedPolicy(policy);
          syncDraftFromPersisted(policy);
        }
      } catch (err) {
        if (!ignore) setPolicyError(err.message || "Không thể tải chính sách thuê kho.");
      } finally {
        if (!ignore) setPolicyLoading(false);
      }
    }
    loadPolicy();
    return () => {
      ignore = true;
    };
  }, []);

  // Khi persistedPolicy đổi, đồng bộ form draft
  const syncDraftFromPersisted = (policy) => {
    setDraftBaseRates(policy.baseRates.map((r) => ({ ...r })));
    setDraftLateFee(policy.surcharges.lateCheckoutPercent);
    setDraftDeposit(policy.surcharges.depositPercent);
    setDraftBufferDays(policy.surcharges.turnoverBufferDays);
    setValidationBanner(null);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Tính danh sách thay đổi (Pending Modifications) so với bản persisted
  const pendingModifications = useMemo(() => {
    if (!persistedPolicy) return [];
    const list = [];

    // Kiểm tra giá thuê
    draftBaseRates.forEach((draftRate) => {
      const origRate = persistedPolicy.baseRates.find((r) => r.id === draftRate.id);
      if (origRate && Number(draftRate.rateVnd) !== Number(origRate.rateVnd)) {
        const val = Number(draftRate.rateVnd);
        const isValid = !isNaN(val) && val > 0;
        list.push({
          id: `rate-${draftRate.id}`,
          title: `${draftRate.fullName || draftRate.typeName} Đơn giá`,
          from: formatVND(origRate.rateVnd),
          to: isNaN(val) ? "Không hợp lệ" : formatVND(val),
          isValid,
          blockReason: !isValid ? "Đơn giá phải lớn hơn 0 ₫" : null,
        });
      }
    });

    // Kiểm tra phí phạt trả trễ
    if (Number(draftLateFee) !== Number(persistedPolicy.surcharges.lateCheckoutPercent)) {
      const lateNum = Number(draftLateFee);
      const isBlocked = isNaN(lateNum) || lateNum > HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT;
      list.push({
        id: "late-fee",
        title: "Phí phạt trả kho trễ",
        from: `${persistedPolicy.surcharges.lateCheckoutPercent}%`,
        to: `${draftLateFee}%`,
        isValid: !isBlocked,
        blockReason: isBlocked
          ? `Vượt mức trần tối đa cho phép (Tối đa ${HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT}%)`
          : null,
      });
    }

    // Kiểm tra tỷ lệ đặt cọc
    if (Number(draftDeposit) !== Number(persistedPolicy.surcharges.depositPercent)) {
      const depNum = Number(draftDeposit);
      const isBlocked = isNaN(depNum) || depNum < HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT;
      list.push({
        id: "deposit-percent",
        title: "Tỷ lệ cọc bảo đảm tối thiểu",
        from: `${persistedPolicy.surcharges.depositPercent}%`,
        to: `${draftDeposit}%`,
        isValid: !isBlocked,
        blockReason: isBlocked
          ? `Thấp hơn mức sàn tối thiểu theo quy định (Tối thiểu ${HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT}%)`
          : null,
      });
    }

    // Kiểm tra thời gian đệm vệ sinh
    if (Number(draftBufferDays) !== Number(persistedPolicy.surcharges.turnoverBufferDays)) {
      const bufNum = Number(draftBufferDays);
      const isBlocked =
        isNaN(bufNum) ||
        bufNum < HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS ||
        bufNum > HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS;
      list.push({
        id: "turnover-buffer",
        title: "Thời gian đệm vệ sinh kho",
        from: `${persistedPolicy.surcharges.turnoverBufferDays} ngày`,
        to: `${draftBufferDays} ngày`,
        isValid: !isBlocked,
        blockReason: isBlocked
          ? `Thời gian đệm xoay vòng kho phải từ ${HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS} đến ${HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS} ngày`
          : null,
      });
    }

    return list;
  }, [draftBaseRates, draftLateFee, draftDeposit, draftBufferDays, persistedPolicy]);

  const hasChanges = pendingModifications.length > 0;

  // Tổng hợp đối tượng Draft hoàn chỉnh để validate
  const currentDraftObject = useMemo(() => {
    if (!persistedPolicy) {
      return { baseRates: [], surcharges: {} };
    }
    return {
      ...persistedPolicy,
      baseRates: draftBaseRates,
      surcharges: {
        ...persistedPolicy.surcharges,
        lateCheckoutPercent: Number(draftLateFee),
        depositPercent: Number(draftDeposit),
        turnoverBufferDays: Number(draftBufferDays),
      },
    };
  }, [persistedPolicy, draftBaseRates, draftLateFee, draftDeposit, draftBufferDays]);

  // Kiểm tra vi phạm các điều kiện trần cứng
  const activeValidationErrors = useMemo(() => {
    return validatePolicy(currentDraftObject);
  }, [currentDraftObject]);

  const isLateFeeViolated = Number(draftLateFee) > HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT;
  const isDepositViolated = Number(draftDeposit) < HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT;
  const isBufferViolated =
    Number(draftBufferDays) < HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS ||
    Number(draftBufferDays) > HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS;

  const isLateFeeModified =
    Number(draftLateFee) !== Number(persistedPolicy.surcharges.lateCheckoutPercent);
  const isDepositModified =
    Number(draftDeposit) !== Number(persistedPolicy.surcharges.depositPercent);
  const isBufferModified =
    Number(draftBufferDays) !== Number(persistedPolicy.surcharges.turnoverBufferDays);

  // Xử lý chỉnh sửa đơn giá loại kho
  const handleRateChange = (id, newRawValue) => {
    const cleanNum = newRawValue.replace(/[^0-9]/g, "");
    setDraftBaseRates((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rateVnd: cleanNum === "" ? "" : Number(cleanNum) } : item
      )
    );
  };

  // Lưu chính sách (EXACTLY ONE Primary Action)
  const handleSavePolicy = async () => {
    setValidationBanner(null);

    const errors = validatePolicy(currentDraftObject);
    if (errors.length > 0) {
      setValidationBanner(errors[0].message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const saved = await savePolicy(currentDraftObject, currentActorName);
      setPersistedPolicy(saved);
      syncDraftFromPersisted(saved);
      showToast(
        `Đã ban hành thành công Rental Policy ${saved.version || ""}! Cập nhật lúc: ${saved.updatedAt || "—"}`.trim()
      );
    } catch (err) {
      setValidationBanner(err.message);
    }
  };

  // Hủy chỉnh sửa (Discard changes)
  const handleDiscardChanges = () => {
    syncDraftFromPersisted(persistedPolicy);
    setValidationBanner(null);
    showToast("Đã hủy bỏ toàn bộ các thay đổi chưa lưu.");
  };

  // Khôi phục về mặc định gốc v3.0.4
  const handleResetToBaseline = async () => {
    if (
      window.confirm(
        "Bạn có chắc muốn khôi phục chính sách về phiên bản mặc định chuẩn v3.0.4 không? Thao tác này sẽ ghi nhật ký kiểm toán."
      )
    ) {
      try {
        const reset = await resetPolicyToDefault(currentActorName);
        setPersistedPolicy(reset);
        syncDraftFromPersisted(reset);
        showToast("Đã khôi phục chính sách về bản gốc mặc định.");
      } catch (err) {
        setValidationBanner(err.message);
      }
    }
  };

  return {
    user,
    currentActorName,
    persistedPolicy,
    policyError,
    policyLoading,
    draftBaseRates,
    draftLateFee,
    setDraftLateFee,
    draftDeposit,
    setDraftDeposit,
    draftBufferDays,
    setDraftBufferDays,
    validationBanner,
    toastMessage,
    capRulesRef,
    pendingModifications,
    hasChanges,
    activeValidationErrors,
    isLateFeeViolated,
    isDepositViolated,
    isBufferViolated,
    isLateFeeModified,
    isDepositModified,
    isBufferModified,
    handleRateChange,
    handleSavePolicy,
    handleDiscardChanges,
    handleResetToBaseline,
    showToast,
  };
}
