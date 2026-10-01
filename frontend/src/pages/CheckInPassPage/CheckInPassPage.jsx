import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
    ArrowLeft,
    QrCode,
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
import { getCheckInPass } from "../../services/rentalService.js";
import "./CheckInPassPage.css";

function fmtDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CheckInPassPage() {
    const { reservationId } = useParams();
    const navigate = useNavigate();

    const [pass, setPass] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorCode, setErrorCode] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        setErrorCode(null);
        try {
            const data = await getCheckInPass(reservationId);
            setPass(data);
        } catch (err) {
            setErrorCode(err?.code || null);
            if (err?.status === 409) {
                setError("Check-in Pass chỉ khả dụng khi đặt chỗ đã xác nhận (đã thanh toán cọc).");
            } else if (err?.status === 403) {
                navigate("/403", { replace: true });
            } else if (err?.status === 404) {
                setError("Không tìm thấy đơn thuê này.");
            } else {
                setError(err?.message || "Không thể tải Check-in Pass.");
            }
        } finally {
            setLoading(false);
        }
    }, [reservationId, navigate]);

    useEffect(() => {
        load();
    }, [load]);

    const days = pass ? daysUntil(pass.checkInDeadline) : null;
    const isUrgent = days !== null && days >= 0 && days <= 3;
    const isOverdue = days !== null && days < 0;

    return (
        <AppShell>
            <div className="checkin-pass-page">
                {/* ─ Back ─ */}
                <div className="cip__nav">
                    <Link to={`/rentals/${reservationId}`} className="cip__back-link">
                        <ArrowLeft size={16} weight="bold" />
                        Về chi tiết đơn thuê
                    </Link>

                    {pass && (
                        <button
                            className="cip__print-btn"
                            onClick={() => window.print()}
                            title="In Check-in Pass"
                        >
                            <Printer size={16} weight="bold" />
                            In ra
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
                        <button onClick={load} className="cip__retry">
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
                            <div className="cip__pass-header__label">CHECK-IN PASS</div>
                        </div>

                        {/* Code – central focus */}
                        <div className="cip__code-section">
                            <div className="cip__code-label">
                                <QrCode size={18} weight="bold" />
                                Mã xác thực tại quầy
                            </div>
                            <div className="cip__code">{pass.code}</div>
                            <p className="cip__code-hint">
                                Trình mã này cho nhân viên khi đến nhận kho. Nhân viên sẽ ký xác nhận hợp đồng.
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
                                    ? "Đơn này đã quá hạn nhận kho. Vui lòng liên hệ nhân viên ngay."
                                    : `Chú ý: Chỉ còn ${days} ngày để nhận kho — quá hạn sẽ mất cọc.`}
                            </div>
                        )}

                        {/* Divider */}
                        <div className="cip__divider" />

                        {/* Instructions */}
                        {pass.instructions && pass.instructions.length > 0 && (
                            <div className="cip__instructions">
                                <div className="cip__instructions__title">
                                    <ListChecks size={16} weight="bold" />
                                    Chuẩn bị khi đến nhận kho
                                </div>
                                <ul className="cip__instructions__list">
                                    {pass.instructions.map((inst, i) => (
                                        <li key={i} className="cip__instructions__item">
                                            <CheckCircle size={14} weight="fill" className="cip__check-icon" />
                                            {inst}
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
