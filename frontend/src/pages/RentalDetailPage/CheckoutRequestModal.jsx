import { useState } from "react";
import {
    X,
    SignOut,
    ShieldCheck,
    WarningCircle,
    ArrowRight,
} from "@phosphor-icons/react";
import { formatDate as fmtDate, formatVND as fmtMoney } from "../../utils/formatters.js";

/**
 * CheckoutRequestModal — US-20 (FR-17)
 *
 * Nghiệp vụ:
 * 1. Khách gửi yêu cầu trả kho trực tiếp từ trang Rental Detail.
 * 2. Chọn ngày & khung giờ hẹn đến quầy bàn giao chìa khóa.
 * 3. Minh bạch logic tất toán cọc (Settlement logic):
 *    - Hoàn lại cọc: Deposit - Charges = Refund.
 *    - Nhân viên kiểm tra 4 hạng mục: access card, padlock, cleanliness, structure.
 *    - Phí phát sinh (nếu có) phải có số tiền và lý do rõ ràng.
 * 4. Submit thành công → Rental chuyển sang CHECKOUT_REQUESTED, sinh task trên Kanban cho staff.
 */
export default function CheckoutRequestModal({
    isOpen,
    onClose,
    reservation,
    onConfirmCheckoutRequest,
}) {
    const todayStr = new Date().toISOString().split("T")[0];
    const defaultDate = reservation?.endDate || todayStr;

    const [requestedDate, setRequestedDate] = useState(defaultDate);
    const [timeSlot, setTimeSlot] = useState("MORNING");
    const [reason, setReason] = useState("");
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    if (!isOpen || !reservation) return null;

    const depositAmount = reservation.depositAmount || 103500;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!requestedDate) {
            setErrorMsg("Vui lòng chọn ngày dự kiến bàn giao kho.");
            return;
        }

        if (!agreedTerms) {
            setErrorMsg("Vui lòng xác nhận bạn đã hiểu quy trình kiểm tra và tất toán cọc.");
            return;
        }

        setSubmitting(true);
        try {
            await onConfirmCheckoutRequest({
                requestedDate,
                timeSlot,
                reason,
            });
            onClose();
        } catch (err) {
            setErrorMsg(err?.message || "Không thể gửi yêu cầu trả kho. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rd-modal-backdrop" onClick={onClose}>
            <div
                className="rd-modal-container rd-modal-container--checkout"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="rd-modal-header rd-modal-header--checkout">
                    <div className="rd-modal-header__title-group">
                        <SignOut size={22} weight="bold" className="rd-modal-icon rd-modal-icon--orange" />
                        <div>
                            <h3 className="rd-modal-title">Gửi yêu cầu trả kho (Checkout Request)</h3>
                            <p className="rd-modal-subtitle">
                                Đơn {reservation.code} · Ô kho {reservation.unit?.code} (Hạn thuê: {fmtDate(reservation.endDate)})
                            </p>
                        </div>
                    </div>
                    <button className="rd-modal-close-btn" onClick={onClose} aria-label="Đóng">
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="rd-modal-body">
                    {/* Error nếu có */}
                    {errorMsg && (
                        <div className="rd-form-error-banner">
                            <WarningCircle size={18} weight="fill" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Ngày hẹn trả kho */}
                    <div className="rd-form-row">
                        <div className="rd-form-group" style={{ flex: 1 }}>
                            <label htmlFor="checkoutDate" className="rd-form-label">
                                Ngày dự kiến đến bàn giao kho
                            </label>
                            <input
                                type="date"
                                id="checkoutDate"
                                className="rd-form-input"
                                value={requestedDate}
                                onChange={(e) => setRequestedDate(e.target.value)}
                            />
                        </div>

                        {/* Khung giờ */}
                        <div className="rd-form-group" style={{ flex: 1 }}>
                            <label htmlFor="timeSlot" className="rd-form-label">
                                Khung giờ đến quầy
                            </label>
                            <select
                                id="timeSlot"
                                className="rd-form-select"
                                value={timeSlot}
                                onChange={(e) => setTimeSlot(e.target.value)}
                            >
                                <option value="MORNING">Ca sáng (08:00 – 12:00)</option>
                                <option value="AFTERNOON">Ca chiều (13:00 – 17:00)</option>
                                <option value="EVENING">Ca tối (17:00 – 20:00)</option>
                            </select>
                        </div>
                    </div>

                    {/* Lý do trả kho */}
                    <div className="rd-form-group">
                        <label htmlFor="checkoutReason" className="rd-form-label">
                            Lý do trả kho (tùy chọn)
                        </label>
                        <select
                            id="checkoutReason"
                            className="rd-form-select"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <option value="">-- Chọn lý do --</option>
                            <option value="EXPIRED_NEED">Đã hết nhu cầu lưu trữ đồ đạc</option>
                            <option value="RELOCATION">Chuyển nhà / chuyển địa điểm kinh doanh</option>
                            <option value="DOWNSIZE">Chuyển sang thuê kho kích thước khác</option>
                            <option value="OTHER">Lý do khác</option>
                        </select>
                    </div>

                    {/* Bảng minh bạch logic tất toán cọc */}
                    <div className="rd-settlement-guide">
                        <div className="rd-settlement-guide__header">
                            <ShieldCheck size={18} weight="bold" color="#1d4ed8" />
                            <span>Quy trình & Logic tất toán cọc minh bạch (FR-17 / FR-18)</span>
                        </div>

                        <div className="rd-settlement-guide__content">
                            <div className="rd-settlement-deposit-badge">
                                <span>Tiền cọc đang giữ:</span>
                                <strong>{fmtMoney(depositAmount)}</strong>
                            </div>

                            <p className="rd-settlement-desc">
                                Khi đến quầy làm thủ tục trả kho, nhân viên kho sẽ cùng bạn kiểm tra kho theo danh mục tiêu chuẩn:
                            </p>

                            <ul className="rd-settlement-checklist">
                                <li>
                                    <strong>Thẻ / Mã ra vào & Khóa:</strong> Bàn giao lại đầy đủ thẻ từ, ổ khóa kho.
                                </li>
                                <li>
                                    <strong>Vệ sinh kho:</strong> Kho đã dọn sạch sẽ, không còn đồ đạc lưu lại.
                                </li>
                                <li>
                                    <strong>Kết cấu kho:</strong> Cửa, tường và sàn kho không bị hư hại.
                                </li>
                            </ul>

                            <div className="rd-settlement-formula-box">
                                <div className="rd-formula-title">Công thức hoàn cọc:</div>
                                <div className="rd-formula-code">
                                    Tiền hoàn lại = Tiền cọc đang giữ − Phí hư hại phát sinh (nếu có)
                                </div>
                                <small>
                                    Mọi khoản phí khấu trừ (nếu có) bắt buộc phải có hình ảnh và lý do cụ thể. Biên nhận
                                    tất toán sẽ được lưu vĩnh viễn trên hệ thống để bạn tra cứu.
                                </small>
                            </div>
                        </div>
                    </div>

                    {/* Cam kết checkbox */}
                    <div className="rd-checkbox-group">
                        <label className="rd-checkbox-label">
                            <input
                                type="checkbox"
                                checked={agreedTerms}
                                onChange={(e) => setAgreedTerms(e.target.checked)}
                            />
                            <span>
                                Tôi xác nhận sẽ dọn sạch đồ đạc và có mặt tại quầy Tân Bình Depot theo ngày hẹn để bàn giao kho.
                            </span>
                        </label>
                    </div>

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
                            className="rd-btn-checkout-submit"
                            disabled={submitting || !agreedTerms}
                        >
                            {submitting ? "Đang gửi..." : "Xác nhận gửi yêu cầu trả kho"}
                            <ArrowRight size={16} weight="bold" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
