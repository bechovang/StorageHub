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
import { fmtDate, fmtMoney } from "../../../utils/formatters.js";

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
    const currentEndDateStr = reservation?.endDate || new Date().toISOString().split("T")[0];
    const currentEndDate = useMemo(() => new Date(currentEndDateStr), [currentEndDateStr]);

    // Giá thuê 1 ngày & tỷ lệ cọc (mô hình thuê theo ngày)
    const dailyRent = reservation?.quote?.dailyRent || reservation?.unit?.baseDailyRent || 0;
    const depositRate = 0.1; // 10%
    const currentDepositHeld = reservation?.depositAmount || 0;
    const currentDurationDays = reservation?.durationDays || 0;

    /** Số ngày thuê (inclusive) giữa 2 chuỗi ngày yyyy-MM-dd */
    const diffDaysInclusive = (start, end) => {
        if (!start || !end) return 0;
        const a = new Date(`${start}T00:00:00`);
        const b = new Date(`${end}T00:00:00`);
        return Math.floor((b - a) / 86400000) + 1;
    };

    // Giới hạn xung đột (Conflict boundary): Chỉ áp dụng nếu backend báo có đơn tiếp theo
    const conflictStartDateStr = reservation?.nextReservationStartDate || null;
    const conflictStartDate = useMemo(
        () => (conflictStartDateStr ? new Date(conflictStartDateStr) : null),
        [conflictStartDateStr]
    );
    const latestAllowedCheckoutStr = useMemo(() => {
        if (!conflictStartDate) return null;
        const d = new Date(conflictStartDate);
        d.setDate(d.getDate() - 1);
        return d.toISOString().split("T")[0];
    }, [conflictStartDate]);

    // Ngày checkout mới được chọn (mặc định gợi ý +30 ngày tính từ currentEndDate)
    const [extensionDays, setExtensionDays] = useState(30);
    const [selectedDateStr, setSelectedDateStr] = useState(() => {
        const target = new Date(currentEndDate);
        target.setDate(target.getDate() + 30);
        return target.toISOString().split("T")[0];
    });
    const [submitting, setSubmitting] = useState(false);

    // Tính toán ngày và kiểm tra xung đột
    const selectedDate = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);

    const isConflict = useMemo(() => {
        if (!selectedDateStr || !conflictStartDate) return false;
        return selectedDate >= conflictStartDate;
    }, [selectedDate, conflictStartDate, selectedDateStr]);

    const isBeforeCurrent = useMemo(() => {
        if (!selectedDateStr) return true;
        return selectedDate <= currentEndDate;
    }, [selectedDate, currentEndDate, selectedDateStr]);

    // Tính toán chi phí gia hạn theo công thức PRD FR-16 (mô hình ngày):
    // Phí gia hạn = Tiền thuê kỳ thêm (ngày × giá ngày) + Top-up cọc
    const calculation = useMemo(() => {
        const addedDays = Math.max(1, diffDaysInclusive(currentEndDateStr, selectedDateStr));
        const addedRent = addedDays * dailyRent;
        const newTotalDuration = currentDurationDays + addedDays;
        const newTotalRent = newTotalDuration * dailyRent;
        const targetDeposit = Math.round(newTotalRent * depositRate);
        const topUpDeposit = Math.max(0, targetDeposit - currentDepositHeld);
        const totalPayable = addedRent + topUpDeposit;

        return {
            addedDays,
            addedRent,
            newTotalDuration,
            targetDeposit,
            topUpDeposit,
            totalPayable,
        };
    }, [selectedDateStr, dailyRent, currentDurationDays, currentDepositHeld, currentEndDateStr]);

    // Chọn nhanh các gói ngày
    const handleQuickSelectDays = (days) => {
        setExtensionDays(days);
        // Tính ngày mới = currentEndDate + days
        const target = new Date(currentEndDate);
        target.setDate(target.getDate() + days);
        setSelectedDateStr(target.toISOString().split("T")[0]);
    };

    const handleDateChange = (e) => {
        const val = e.target.value;
        setSelectedDateStr(val);
        if (val) {
            setExtensionDays(diffDaysInclusive(currentEndDateStr, val));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isConflict || isBeforeCurrent) return;

        setSubmitting(true);
        try {
            await onConfirmExtension({
                newEndDate: selectedDateStr,
                addedDays: calculation.addedDays,
                addedRent: calculation.addedRent,
                topUpDeposit: calculation.topUpDeposit,
                totalPayable: calculation.totalPayable,
                newDepositHeld: calculation.targetDeposit,
            });
            onClose();
        } catch (err) {
            console.error("Failed to extend rental:", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !reservation) return null;

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
                            <span className="rd-current-badge">
                                {currentDurationDays ? `${currentDurationDays} ngày` : "—"}
                            </span>
                        </div>
                    </div>

                    {/* Chọn nhanh thời gian gia hạn */}
                    <div className="rd-form-group">
                        <label className="rd-form-label">Chọn nhanh kỳ gia hạn thêm</label>
                        <div className="rd-quick-presets">
                            {[7, 14, 30].map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    className={`rd-preset-btn ${extensionDays === d ? "is-selected" : ""}`}
                                    onClick={() => handleQuickSelectDays(d)}
                                >
                                    +{d} Ngày
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ngày trả kho mới */}
                    <div className="rd-form-group">
                        <label htmlFor="newEndDate" className="rd-form-label">
                            Ngày kết thúc thuê mới
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
                    {isConflict && conflictStartDateStr && latestAllowedCheckoutStr && (
                        <div className="rd-conflict-alert">
                            <Warning size={20} weight="fill" className="rd-conflict-alert__icon" />
                            <div>
                                <h4 className="rd-conflict-alert__title">Kho đã có khách đặt trước</h4>
                                <p className="rd-conflict-alert__text">
                                    Kho <strong>{reservation.unit?.code}</strong> đã có khách đặt trước từ ngày{" "}
                                    <strong>{fmtDate(conflictStartDateStr)}</strong>.
                                </p>
                                <p className="rd-conflict-alert__boundary">
                                    Quý khách có thể gia hạn tối đa đến ngày: <strong>{fmtDate(latestAllowedCheckoutStr)}</strong>.
                                </p>
                                <button
                                    type="button"
                                    className="rd-btn-fix-conflict"
                                    onClick={() => setSelectedDateStr(latestAllowedCheckoutStr)}
                                >
                                    Chọn ngày {fmtDate(latestAllowedCheckoutStr)}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Bảng minh bạch chi phí gia hạn */}
                    {!isConflict && !isBeforeCurrent && (
                        <div className="rd-price-breakdown">
                            <div className="rd-price-breakdown__header">
                                <Receipt size={16} weight="bold" />
                                <span>Chi tiết chi phí gia hạn</span>
                            </div>

                            <div className="rd-price-breakdown__rows">
                                <div className="rd-price-row">
                                    <span>Tiền thuê kỳ thêm ({calculation.addedDays} ngày × {fmtMoney(dailyRent)}/ngày)</span>
                                    <strong>{fmtMoney(calculation.addedRent)}</strong>
                                </div>
                                <div className="rd-price-row">
                                    <span>
                                        Tiền cọc bổ sung (đạt 10% hợp đồng mới)
                                        <Info size={13} className="rd-info-icon" title="Cọc nâng từ mức cũ lên mức tương ứng với tổng giá trị hợp đồng mới" />
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
                                <CheckCircle size={16} weight="fill" color="var(--color-status-success, #16a34a)" />
                                <span>
                                    Sau khi thanh toán, thời hạn thuê mới sẽ có hiệu lực ngay lập tức. Quý khách vui lòng đến quầy dịch vụ để ký xác nhận phụ lục hợp đồng trong vòng 7 ngày làm việc.
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
