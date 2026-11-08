import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  getCurrentPolicy,
  savePolicy,
  resetPolicyToDefault,
  validatePolicy,
  HARD_CAPS,
} from "../../../services/policyService.js";
import { getFacilities } from "../../../services/facilityService.js";
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

  // Phạm vi cơ sở đang chỉnh sửa
  const [facilities, setFacilities] = useState([]);
  const [facilityId, setFacilityId] = useState(null);
  const [facilityError, setFacilityError] = useState("");

  // Bản nháp đang thao tác (Form Draft)
  const [draftBaseRates, setDraftBaseRates] = useState([]);
  const [draftLateFee, setDraftLateFee] = useState("");
  const [draftEscalationDays, setDraftEscalationDays] = useState("");
  const [draftDeposit, setDraftDeposit] = useState("");
  const [draftBufferDays, setDraftBufferDays] = useState("");
  const [draftCheckinGrace, setDraftCheckinGrace] = useState(3);
  const [draftCheckinLatePercent, setDraftCheckinLatePercent] = useState(300);
  const [draftExtensionGrace, setDraftExtensionGrace] = useState(3);
  const [draftExtensionLatePercent, setDraftExtensionLatePercent] = useState(300);

  // Lỗi validation & Banner cảnh báo
  const [validationBanner, setValidationBanner] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const capRulesRef = useRef(null);

  // Tải danh sách cơ sở để chọn phạm vi
  useEffect(() => {
    let ignore = false;
    getFacilities()
      .then((list) => {
        if (ignore) return;
        const active = Array.isArray(list) ? list : [];
        setFacilities(active);
        if (active.length === 0) {
          setPolicyLoading(false);
          setFacilityError("Chưa có cơ sở đang hoạt động để cấu hình chính sách.");
          return;
        }
        setFacilityId((prev) => prev ?? active[0].id);
      })
      .catch((err) => {
        if (ignore) return;
        setPolicyLoading(false);
        setFacilityError(err.message || "Không thể tải danh sách cơ sở.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Tải chính sách hiện hành theo cơ sở đang chọn
  useEffect(() => {
    if (facilityId == null) return undefined;
    let ignore = false;
    async function loadPolicy() {
      setPolicyLoading(true);
      setPolicyError("");
      setPersistedPolicy(null);
      clearDraft();
      try {
        const policy = await getCurrentPolicy(facilityId);
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
  }, [facilityId]);

  function clearDraft() {
    setDraftBaseRates([]);
    setDraftLateFee("");
    setDraftEscalationDays(3);
    setDraftDeposit("");
    setDraftBufferDays("");
    setDraftCheckinGrace(3);
    setDraftCheckinLatePercent(300);
    setDraftExtensionGrace(3);
    setDraftExtensionLatePercent(300);
    setValidationBanner(null);
  }

  // Khi persistedPolicy đổi, đồng bộ form draft
  function syncDraftFromPersisted(policy) {
    if (!policy) return;
    setDraftBaseRates(Array.isArray(policy.baseRates) ? policy.baseRates.map((r) => ({ ...r })) : []);
    setDraftLateFee(policy.surcharges?.lateCheckoutPercent ?? "");
    setDraftEscalationDays(policy.surcharges?.lateEscalationDays ?? 3);
    setDraftDeposit(policy.surcharges?.depositPercent ?? "");
    setDraftBufferDays(policy.surcharges?.turnoverBufferDays ?? "");
    setDraftCheckinGrace(policy.surcharges?.checkinGraceDays ?? 3);
    setDraftCheckinLatePercent(policy.surcharges?.checkinLateFeePercent ?? 300);
    setDraftExtensionGrace(policy.surcharges?.extensionGraceDays ?? 3);
    setDraftExtensionLatePercent(policy.surcharges?.extensionLateFeePercent ?? 300);
    setValidationBanner(null);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Tính danh sách thay đổi (Pending Modifications) so với bản persisted
  const pendingModifications = useMemo(() => {
    if (!persistedPolicy || !persistedPolicy.baseRates || !persistedPolicy.surcharges) return [];
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

    // Kiểm tra ngưỡng chuyển quản lý
    if (Number(draftEscalationDays) !== Number(persistedPolicy.surcharges.lateEscalationDays ?? 3)) {
      const daysNum = Number(draftEscalationDays);
      const isBlocked = isNaN(daysNum) || daysNum < 1 || daysNum > 30;
      list.push({
        id: "late-escalation-days",
        title: "Ngưỡng chuyển quản lý trễ checkout",
        from: `${persistedPolicy.surcharges.lateEscalationDays ?? 3} ngày`,
        to: `${draftEscalationDays} ngày`,
        isValid: !isBlocked,
        blockReason: isBlocked ? "Ngưỡng phải từ 1 đến 30 ngày" : null,
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
  }, [draftBaseRates, draftLateFee, draftEscalationDays, draftDeposit, draftBufferDays, persistedPolicy]);

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
        ...(persistedPolicy.surcharges || {}),
        lateCheckoutPercent: Number(draftLateFee),
        lateEscalationDays: Number(draftEscalationDays),
        depositPercent: Number(draftDeposit),
        turnoverBufferDays: Number(draftBufferDays),
        checkinGraceDays: Number(draftCheckinGrace),
        checkinLateFeePercent: Number(draftCheckinLatePercent),
        extensionGraceDays: Number(draftExtensionGrace),
        extensionLateFeePercent: Number(draftExtensionLatePercent),
      },
    };
  }, [
    persistedPolicy,
    draftBaseRates,
    draftLateFee,
    draftEscalationDays,
    draftDeposit,
    draftBufferDays,
    draftCheckinGrace,
    draftCheckinLatePercent,
    draftExtensionGrace,
    draftExtensionLatePercent,
  ]);

  // Kiểm tra vi phạm các điều kiện trần cứng
  const activeValidationErrors = useMemo(() => {
    return validatePolicy(currentDraftObject);
  }, [currentDraftObject]);

  const isLateFeeViolated = Number(draftLateFee) > HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT;
  const isEscalationViolated =
    Number(draftEscalationDays) < 1 || Number(draftEscalationDays) > 30;
  const isDepositViolated = Number(draftDeposit) < HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT;
  const isBufferViolated =
    Number(draftBufferDays) < HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS ||
    Number(draftBufferDays) > HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS;

  const isLateFeeModified =
    persistedPolicy?.surcharges
      ? Number(draftLateFee) !== Number(persistedPolicy.surcharges.lateCheckoutPercent)
      : false;
  const isEscalationModified =
    persistedPolicy?.surcharges
      ? Number(draftEscalationDays) !== Number(persistedPolicy.surcharges.lateEscalationDays ?? 3)
      : false;
  const isDepositModified =
    persistedPolicy?.surcharges
      ? Number(draftDeposit) !== Number(persistedPolicy.surcharges.depositPercent)
      : false;
  const isBufferModified =
    persistedPolicy?.surcharges
      ? Number(draftBufferDays) !== Number(persistedPolicy.surcharges.turnoverBufferDays)
      : false;

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
      const saved = await savePolicy(currentDraftObject, currentActorName, facilityId);
      setPersistedPolicy(saved);
      syncDraftFromPersisted(saved);
      showToast(
        `Đã ban hành thành công Rental Policy ${saved.version || ""}! Cập nhật lúc: ${saved.updatedAt || "—"}`.trim()
      );
    } catch (err) {
      setValidationBanner(err.message);
    }
  };

  // Đổi cơ sở — chặn mất draft chưa lưu
  const handleFacilityChange = (nextFacilityId) => {
    const next = Number(nextFacilityId);
    if (Number.isNaN(next) || next === Number(facilityId)) return;
    if (
      hasChanges &&
      !window.confirm(
        "Bạn đang có thay đổi chưa lưu ở cơ sở hiện tại. Đổi cơ sở sẽ hủy bỏ các thay đổi này. Tiếp tục?"
      )
    ) {
      return;
    }
    setFacilityId(next);
  };

  const selectedFacility = facilities.find((f) => Number(f.id) === Number(facilityId)) || null;

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
        "Khôi phục giá thuê của cơ sở đang chọn về mặc định gốc? Các tham số dùng chung (cọc, phạt trễ, buffer...) cũng sẽ về mặc định. Thao tác này sẽ ghi nhật ký kiểm toán."
      )
    ) {
      try {
        const reset = await resetPolicyToDefault(currentActorName, facilityId);
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
    facilities,
    facilityId,
    facilityError,
    selectedFacility,
    handleFacilityChange,
    draftBaseRates,
    draftLateFee,
    setDraftLateFee,
    draftEscalationDays,
    setDraftEscalationDays,
    draftDeposit,
    setDraftDeposit,
    draftBufferDays,
    setDraftBufferDays,
    draftCheckinGrace,
    setDraftCheckinGrace,
    draftCheckinLatePercent,
    setDraftCheckinLatePercent,
    draftExtensionGrace,
    setDraftExtensionGrace,
    draftExtensionLatePercent,
    setDraftExtensionLatePercent,
    validationBanner,
    toastMessage,
    capRulesRef,
    pendingModifications,
    hasChanges,
    activeValidationErrors,
    isLateFeeViolated,
    isEscalationViolated,
    isEscalationModified,
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
