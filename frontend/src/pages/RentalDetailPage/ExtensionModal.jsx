import { useState, useMemo } from "react";
import {
    X,
    CalendarPlus,
    Warning,
    Receipt,
    CheckCircle,
    Info,
    ArrowRight,
} from "@phosphor-icons/react";

function fmtDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function fmtMoney(n) {
    if (n == null) return "0 ₫";
    return n.toLocaleString("vi-VN") + " ₫";
}

/**
 * ExtensionModal — US-18 & US-19 (FR-16 / FR-12)
 *
 * Nghiệp vụ:
 * 1. Khách chọn ngày checkout mới (chỉ mở trước EndDate hiện tại).
 * 2. Conflict boundary: Nếu ngày checkout mới chạm vào Reservation tiếp theo
 *    (ví dụ kho S-3 có đơn BK-1044 bắt đầu 19/10/2026), submit bị chặn kèm thông báo
 *    "Latest new checkout: 18/10/2026".
 * 3. Phí gia hạn = Tiền thuê kỳ thêm + Top-up cọc = max(0, Deposit% × tổng giá trị sau gia hạn - cọc đang giữ).
 * 4. Thanh toán xong → Cập nhật EndDate, nâng cọc giữ, sinh Addendum giấy (CT-...-A1) hẹn ký 7 ngày.
 */
export default function ExtensionModal({
    isOpen,
    onClose,
    reservation,
    onConfirmExtension,
}) {
    if (!isOpen || !reservation) return null;

    const currentEndDateStr = reservation.endDate || "2026-08-18";
    const currentEndDate = useMemo(() => new Date(currentEndDateStr), [currentEndDateStr]);

    // Giá thuê 1 tháng & tỷ lệ cọc
    const monthlyRent = reservation.quote?.monthlyRent || 345000;
    const depositRate = 0.1; // 10%
    const currentDepositHeld = reservation.depositAmount || 103500;
    const currentDurationMonths = reservation.durationMonths || 3;

    // Giới hạn xung đột (Conflict boundary): Đơn kế tiếp bắt đầu ngày 19/10/2026 (theo kịch bản demo PRD UJ-1)
    // Ngày muộn nhất được phép trả là 18/10/2026
    const conflictStartDateStr = reservation.nextReservationStartDate || "2026-10-19";
    const latestAllowedCheckoutStr = "2026-10-18";
    const conflictStartDate = useMemo(() => new Date(conflictStartDateStr), [conflictStartDateStr]);
    const latestAllowedCheckout = useMemo(() => new Date(latestAllowedCheckoutStr), [latestAllowedCheckoutStr]);

    // Ngày checkout mới được chọn (mặc định gợi ý +2 tháng: 18/10/2026)
    const [selectedDateStr, setSelectedDateStr] = useState("2026-10-18");
    const [extensionMonths, setExtensionMonths] = useState(2);
    const [submitting, setSubmitting] = useState(false);

    // Tính toán ngày và kiểm tra xung đột
    const selectedDate = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);

    const isConflict = useMemo(() => {
        if (!selectedDateStr) return false;
        // Nếu ngày mới lớn hơn hoặc bằng ngày bắt đầu của đơn đặt chỗ kế tiếp
        return selectedDate >= conflictStartDate;
    }, [selectedDate, conflictStartDate]);

    const isBeforeCurrent = useMemo(() => {
        if (!selectedDateStr) return true;
        return selectedDate <= currentEndDate;
    }, [selectedDate, currentEndDate]);

    // Tính toán chi phí gia hạn theo công thức PRD FR-16:
    // Phí gia hạn = Tiền thuê kỳ thêm + Top-up cọc
    const calculation = useMemo(() => {
        const addedMonths = Math.max(1, extensionMonths);
        const addedRent = addedMonths * monthlyRent;
        const newTotalDuration = currentDurationMonths + addedMonths;
        const newTotalRent = newTotalDuration * monthlyRent;
        const targetDeposit = Math.round(newTotalRent * depositRate);
        const topUpDeposit = Math.max(0, targetDeposit - currentDepositHeld);
        const totalPayable = addedRent + topUpDeposit;

        return {
            addedMonths,
            addedRent,
            newTotalDuration,
            targetDeposit,
            topUpDeposit,
            totalPayable,
        };
    }, [extensionMonths, monthlyRent, currentDurationMonths, currentDepositHeld]);

    // Chọn nhanh các gói tháng
    const handleQuickSelectMonths = (months) => {
        setExtensionMonths(months);
        // Tính ngày mới = currentEndDate + months
        const target = new Date(currentEndDate);
        target.setMonth(target.getMonth() + months);
        const yyyy = target.getFullYear();
        const mm = String(target.getMonth() + 1).padStart(2, "0");
        const dd = String(target.getDate()).padStart(2, "0");
        setSelectedDateStr(`${yyyy}-${mm}-${dd}`);
    };

    const handleDateChange = (e) => {
        const val = e.target.value;
        setSelectedDateStr(val);
        if (val) {
            const picked = new Date(val);
            const diffMonths = Math.max(
                1,
                Math.round((picked - currentEndDate) / (1000 * 60 * 60 * 24 * 30.4))
            );
            setExtensionMonths(diffMonths);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isConflict || isBeforeCurrent) return;

        setSubmitting(true);
        try {
            await onConfirmExtension({
                newEndDate: selectedDateStr,
                addedMonths: calculation.addedMonths,
                addedRent: calculation.addedRent,
                topUpDeposit: calculation.topUpDeposit,
                totalPayable: calculation.totalPayable,
                newDepositHeld: calculation.targetDeposit,
            });
            onClose();
        } catch (err) {
            console.error("Lỗi gia hạn:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rd-modal-backdrop" onClick={onClose}>
            <div
                className="rd-modal-container"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="rd-modal-header">
                    <div className="rd-modal-header__title-group">
                        <CalendarPlus size={22} weight="bold" className="rd-modal-icon" />
                        <div>
                            <h3 className="rd-modal-title">Gia hạn thời gian thuê kho</h3>
                            <p className="rd-modal-subtitle">
                                Đơn thuê {reservation.code} · Kho {reservation.unit?.code}
                            </p>
                        </div>
                    </div>
                    <button className="rd-modal-close-btn" onClick={onClose} aria-label="Đóng">
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="rd-modal-body">
                    {/* Ngày thuê hiện tại */}
                    <div className="rd-form-group">
                        <label className="rd-form-label">Thời hạn thuê hiện tại</label>
                        <div className="rd-current-date-box">
                            <span>Từ <strong>{fmtDate(reservation.startDate)}</strong> đến <strong>{fmtDate(currentEndDateStr)}</strong></span>
                            <span className="rd-current-badge">{currentDurationMonths} tháng</span>
                        </div>
                    </div>

                    {/* Chọn nhanh thời gian gia hạn */}
                    <div className="rd-form-group">
                        <label className="rd-form-label">Chọn nhanh kỳ gia hạn thêm</label>
                        <div className="rd-quick-presets">
                            {[1, 2, 3].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    className={`rd-preset-btn ${extensionMonths === m ? "is-selected" : ""}`}
                                    onClick={() => handleQuickSelectMonths(m)}
                                >
                                    +{m} Tháng
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ngày trả kho mới */}
                    <div className="rd-form-group">
                        <label htmlFor="newEndDate" className="rd-form-label">
                            Ngày trả kho mới dự kiến (New Checkout Date)
                        </label>
                        <input
                            type="date"
                            id="newEndDate"
                            className={`rd-form-input ${isConflict ? "is-error" : ""}`}
                            value={selectedDateStr}
                            onChange={handleDateChange}
                            min={currentEndDateStr}
                        />
                        <span className="rd-form-hint">
                            Định dạng: Ngày / Tháng / Năm. Ngày chọn phải sau ngày {fmtDate(currentEndDateStr)}.
                        </span>
                    </div>

                    {/* Cảnh báo Conflict Boundary */}
                    {isConflict && (
                        <div className="rd-conflict-alert">
                            <Warning size={20} weight="fill" className="rd-conflict-alert__icon" />
                            <div>
                                <h4 className="rd-conflict-alert__title">Xung đột lịch đặt chỗ kế tiếp!</h4>
                                <p className="rd-conflict-alert__text">
                                    Kho <strong>{reservation.unit?.code}</strong> đã có khách đặt trước bắt đầu từ ngày{" "}
                                    <strong>{fmtDate(conflictStartDateStr)}</strong>.
                                </p>
                                <p className="rd-conflict-alert__boundary">
                                    Giới hạn gia hạn muộn nhất cho phép: <strong>{fmtDate(latestAllowedCheckoutStr)}</strong> (Latest new checkout).
                                </p>
                                <button
                                    type="button"
                                    className="rd-btn-fix-conflict"
                                    onClick={() => setSelectedDateStr(latestAllowedCheckoutStr)}
                                >
                                    Đặt lại ngày {fmtDate(latestAllowedCheckoutStr)}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Bảng minh bạch chi phí gia hạn */}
                    {!isConflict && !isBeforeCurrent && (
                        <div className="rd-price-breakdown">
                            <div className="rd-price-breakdown__header">
                                <Receipt size={16} weight="bold" />
                                <span>Bảng tính chi phí gia hạn minh bạch (FR-16)</span>
                            </div>

                            <div className="rd-price-breakdown__rows">
                                <div className="rd-price-row">
                                    <span>Tiền thuê kỳ thêm ({calculation.addedMonths} tháng × {fmtMoney(monthlyRent)})</span>
                                    <strong>{fmtMoney(calculation.addedRent)}</strong>
                                </div>
                                <div className="rd-price-row">
                                    <span>
                                        Tiền cọc bổ sung (Top-up cọc 10%)
                                        <Info size={13} className="rd-info-icon" title="Cọc nâng từ mức cũ lên mức tỷ lệ với tổng giá trị hợp đồng mới" />
                                    </span>
                                    <span className="rd-topup-value">
                                        +{fmtMoney(calculation.topUpDeposit)}
                                    </span>
                                </div>
                                <div className="rd-price-row rd-price-row--sub">
                                    <small>• Tiền cọc đang giữ hiện tại: {fmtMoney(currentDepositHeld)}</small>
                                    <small>➔ Tiền cọc mới sẽ giữ: {fmtMoney(calculation.targetDeposit)}</small>
                                </div>
                                <div className="rd-divider" />
                                <div className="rd-price-row rd-price-row--total">
                                    <span>Tổng số tiền cần thanh toán</span>
                                    <strong className="rd-total-price">{fmtMoney(calculation.totalPayable)}</strong>
                                </div>
                            </div>

                            <div className="rd-notice-box">
                                <CheckCircle size={16} weight="fill" color="#16a34a" />
                                <span>
                                    Sau khi thanh toán, ngày kết thúc thuê sẽ được cập nhật ngay lập tức. Hệ thống sẽ sinh
                                    phụ lục hợp đồng gia hạn (<strong>Addendum CT-...-A1</strong>) hẹn ký tại quầy trong vòng 7 ngày.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="rd-modal-footer">
                        <button
                            type="button"
                            className="rd-btn-secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="rd-btn-primary"
                            disabled={isConflict || isBeforeCurrent || submitting}
                        >
                            {submitting ? "Đang xử lý..." : "Xác nhận & Thanh toán gia hạn"}
                            <ArrowRight size={16} weight="bold" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
