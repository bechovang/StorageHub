import { Link, useParams } from "react-router";
import {
    ArrowLeft,
    QrCode as QrCodeIcon,
    Package,
    CalendarCheck,
    Warning,
    WarningCircle,
    CheckCircle,
    ArrowClockwise,
    ListChecks,
    Printer,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { useCheckInPass } from "../../features/rentals/index.js";
import { formatDateLong as fmtDate } from "../../utils/formatters.js";
import "./CheckInPassPage.css";

const INSTRUCTION_TRANSLATIONS = {
    "Show this code at the Tân Bình depot desk upon arrival.":
        "Xuất trình mã xác thực hoặc quét mã QR này tại quầy khi đến nhận kho.",
    "Bring your valid national ID card (CCCD) or Passport to sign the contract.":
        "Mang theo CCCD/CMND hoặc Hộ chiếu gốc để đối chiếu và ký hợp đồng thuê kho.",
    "Pay the remaining rent balance at the front operational desk prior to access activation.":
        "Thanh toán tiền thuê còn lại tại quầy trước khi nhận kho.",
};

function formatInstruction(text) {
    if (!text) return "";
    return INSTRUCTION_TRANSLATIONS[text.trim()] || text;
}

export default function CheckInPassPage() {
    const { reservationId } = useParams();
    const {
        pass,
        qrDataUrl,
        loading,
        error,
        errorCode,
        reload,
        days,
        isUrgent,
        isOverdue,
    } = useCheckInPass(reservationId);

    return (
        <AppShell>
            <div className="checkin-pass-page">
                {/* ─ Back ─ */}
                <div className="cip__nav">
                    <Link to={`/rentals/${reservationId}`} className="cip__back-link">
                        <ArrowLeft size={16} weight="bold" />
                        Quay lại đơn thuê
                    </Link>

                    {pass && (
                        <button
                            className="cip__print-btn"
                            onClick={() => window.print()}
                            title="In thẻ nhận kho"
                        >
                            <Printer size={16} weight="bold" />
                            In thẻ nhận kho
                        </button>
                    )}
                </div>

                {/* ─ Loading ─ */}
                {loading && (
                    <div className="cip__skeleton-wrap">
                        <div className="cip__skeleton cip__skeleton--pass" />
                        <div className="cip__skeleton cip__skeleton--instructions" />
                    </div>
                )}

                {/* ─ Error ─ */}
                {error && (
                    <div className="cip__error">
                        <WarningCircle size={20} weight="fill" />
                        <div>
                            <p>{error}</p>
                            {errorCode === "RESERVATION_INVALID_STATE" && (
                                <p className="cip__error-hint">
                                    Vui lòng{" "}
                                    <Link to={`/rentals/${reservationId}`}>xem chi tiết đơn thuê</Link>{" "}
                                    và hoàn tất thanh toán cọc trước.
                                </p>
                            )}
                        </div>
                        <button onClick={reload} className="cip__retry">
                            <ArrowClockwise size={14} /> Thử lại
                        </button>
                    </div>
                )}

                {/* ─ Pass card ─ */}
                {!loading && !error && pass && (
                    <div className="cip__pass-card" id="checkin-pass-print">
                        {/* Header */}
                        <div className="cip__pass-header">
                            <div className="cip__pass-header__logo">
                                <Package size={24} weight="fill" />
                                StorageHub
                            </div>
                            <div className="cip__pass-header__label">THẺ NHẬN KHO</div>
                        </div>

                        {/* Code & QR – central focus */}
                        <div className="cip__code-section">
                            <div className="cip__code-label">
                                <QrCodeIcon size={18} weight="bold" />
                                Mã xác thực tại quầy
                            </div>

                            {qrDataUrl && (
                                <div className="cip__qr-wrapper">
                                    <img
                                        src={qrDataUrl}
                                        alt={`QR Code ${pass.code}`}
                                        className="cip__qr-image"
                                    />
                                </div>
                            )}

                            <div className="cip__code">{pass.code}</div>
                            <p className="cip__code-hint">
                                Xuất trình mã này cho nhân viên quầy khi đến nhận kho để ký hợp đồng và nhận mã mở kho.
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="cip__divider" />

                        {/* Info grid */}
                        <div className="cip__info-grid">
                            <div className="cip__info-item">
                                <span className="cip__info-item__icon">
                                    <Package size={16} weight="fill" />
                                </span>
                                <div>
                                    <span className="cip__info-item__label">Ô kho</span>
                                    <span className="cip__info-item__value">
                                        {pass.unit?.code || "—"}
                                        {pass.unit?.typeName && (
                                             <span className="cip__info-item__sub">
                                                {pass.unit.typeName}
                                                {pass.unit?.sizeM2 && ` · ${pass.unit.sizeM2} m²`}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="cip__info-item">
                                <span className="cip__info-item__icon">
                                    <CalendarCheck size={16} weight="fill" />
                                </span>
                                <div>
                                    <span className="cip__info-item__label">Ngày bắt đầu thuê</span>
                                    <span className="cip__info-item__value">{fmtDate(pass.startDate)}</span>
                                </div>
                            </div>

                            <div className={`cip__info-item ${isUrgent ? "cip__info-item--urgent" : ""} ${isOverdue ? "cip__info-item--overdue" : ""}`}>
                                <span className="cip__info-item__icon">
                                    {isOverdue ? (
                                        <Warning size={16} weight="fill" />
                                    ) : (
                                        <CalendarCheck size={16} weight="fill" />
                                    )}
                                </span>
                                <div>
                                    <span className="cip__info-item__label">Hạn cuối nhận kho</span>
                                    <span className="cip__info-item__value">
                                        {fmtDate(pass.checkInDeadline)}
                                        {days !== null && !isOverdue && (
                                            <span className={`cip__days-left ${isUrgent ? "cip__days-left--urgent" : ""}`}>
                                                còn {days} ngày
                                            </span>
                                        )}
                                        {isOverdue && (
                                            <span className="cip__days-left cip__days-left--overdue">
                                                đã quá hạn {Math.abs(days)} ngày
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Deadline warning */}
                        {(isUrgent || isOverdue) && (
                            <div className={`cip__deadline-banner ${isOverdue ? "cip__deadline-banner--overdue" : "cip__deadline-banner--urgent"}`}>
                                <Warning size={18} weight="fill" />
                                {isOverdue
                                    ? "Đơn này đã quá hạn nhận kho. Vui lòng liên hệ nhân viên quầy để được hỗ trợ nhé."
                                    : `Lưu ý: Bạn còn ${days} ngày để đến nhận kho trước khi đơn bị hủy.`}
                            </div>
                        )}

                        {/* Divider */}
                        <div className="cip__divider" />

                        {/* Instructions */}
                        {pass.instructions && pass.instructions.length > 0 && (
                            <div className="cip__instructions">
                                <div className="cip__instructions__title">
                                    <ListChecks size={16} weight="bold" />
                                    Các bước cần chuẩn bị khi đến quầy
                                </div>
                                <ul className="cip__instructions__list">
                                    {pass.instructions.map((inst, i) => (
                                        <li key={i} className="cip__instructions__item">
                                            <CheckCircle size={14} weight="fill" className="cip__check-icon" />
                                            {formatInstruction(inst)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="cip__pass-footer">
                            <p>StorageHub · Kho lưu trữ tự phục vụ</p>
                            <p>Hotline: <strong>1900 8888</strong></p>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
