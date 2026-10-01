import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router";
import QRCode from "qrcode";
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

const INSTRUCTION_TRANSLATIONS = {
    "Show this code at the Tân Bình depot desk upon arrival.":
        "Xuất trình mã xác thực hoặc quét mã QR này tại quầy khi đến nhận kho.",
    "Bring your valid national ID card (CCCD) or Passport to sign the contract.":
        "Mang theo CCCD/CMND hoặc Hộ chiếu gốc để đối chiếu và ký hợp đồng thuê kho.",
    "Pay the remaining rent balance at the front operational desk prior to access activation.":
        "Thanh toán 100% tiền thuê còn lại tại quầy trước khi kích hoạt nhận kho.",
};

function formatInstruction(text) {
    if (!text) return "";
    return INSTRUCTION_TRANSLATIONS[text.trim()] || text;
}

export default function CheckInPassPage() {
    const { reservationId } = useParams();
    const navigate = useNavigate();

    const [pass, setPass] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState("");
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
        let isMounted = true;
        async function fetchPass() {
            try {
                const data = await getCheckInPass(reservationId);
                if (isMounted) setPass(data);
            } catch (err) {
                if (!isMounted) return;
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
                if (isMounted) setLoading(false);
            }
        }
        fetchPass();
        return () => {
            isMounted = false;
        };
    }, [reservationId, navigate]);

    useEffect(() => {
        let active = true;
        if (pass?.code) {
            QRCode.toDataURL(pass.code, {
                width: 180,
                margin: 2,
                color: {
                    dark: "#0F172A",
                    light: "#FFFFFF",
                },
            })
                .then((url) => {
                    if (active) setQrDataUrl(url);
                })
                .catch((err) => {
                    console.error("Lỗi sinh QR Check-in:", err);
                });
        } else {
            setQrDataUrl("");
        }
        return () => {
            active = false;
        };
    }, [pass?.code]);

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
                            <div className="cip__pass-header__label">THẺ NHẬN KHO (CHECK-IN PASS)</div>
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
                                Quét mã QR hoặc đọc mã này cho nhân viên khi đến nhận kho để ký hợp đồng và nhận chìa/mã mở kho.
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
                                    Hướng dẫn check-in tại quầy cho khách hàng
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
