import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
    ArrowLeft,
    Package,
    Receipt,
    FileText,
    CheckCircle,
    XCircle,
    ClockCountdown,
    WarningCircle,
    QrCode,
    Seal,
    ArrowRight,
    ArrowClockwise,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { getReservation } from "../../services/rentalService.js";
import "./RentalDetailPage.css";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function fmtDateTime(str) {
    if (!str) return "—";
    return new Date(str).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function fmtMoney(n) {
    if (n == null) return "—";
    return n.toLocaleString("vi-VN") + " ₫";
}

const STATUS_LABEL = {
    PENDING_PAYMENT: "Chờ thanh toán cọc",
    RESERVED: "Đã xác nhận — Chờ nhận kho",
    CHECKED_IN: "Đang thuê kho",
    CHECKOUT_REQUESTED: "Đang chờ trả kho",
    CLOSED: "Đã kết thúc",
    EXPIRED: "Hết hạn — Đã mất cọc",
};

const STATUS_COLOR = {
    PENDING_PAYMENT: "warning",
    RESERVED: "success",
    CHECKED_IN: "info",
    CHECKOUT_REQUESTED: "info",
    CLOSED: "neutral",
    EXPIRED: "danger",
};

const PAYMENT_STATUS_LABEL = {
    PENDING: "Chờ xử lý",
    PROCESSING: "Đang xử lý",
    SUCCEEDED: "Thành công",
    FAILED: "Thất bại",
    EXPIRED: "Hết hạn",
};

const CONTRACT_STATUS_LABEL = {
    DRAFT: "Bản thảo",
    PRINTED: "Đã in",
    SIGNED: "Đã ký",
    ACTIVE: "Đang hiệu lực",
    CLOSED: "Đã đóng",
    SUPERSEDED: "Đã thay thế",
};

// ─── sections ────────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }) {
    return (
        <div className="rd-section-card">
            <div className="rd-section-card__header">
                <Icon size={18} weight="bold" />
                <h2 className="rd-section-card__title">{title}</h2>
            </div>
            <div className="rd-section-card__body">{children}</div>
        </div>
    );
}

function MetaRow({ label, value }) {
    return (
        <div className="rd-meta-row">
            <span className="rd-meta-row__label">{label}</span>
            <span className="rd-meta-row__value">{value}</span>
        </div>
    );
}

function PaymentsSection({ payments }) {
    if (!payments || payments.length === 0)
        return <p className="rd-empty-text">Chưa có giao dịch nào.</p>;

    const methodLabel = { CARD: "Thẻ ngân hàng", MOMO: "MoMo", VNPAY: "VNPay QR" };
    const purposeLabel = { DEPOSIT: "Cọc", RENT: "Tiền thuê", EXTENSION_FEE: "Gia hạn", DAMAGE_FEE: "Bồi thường", EXTRA_FEE: "Phí khác" };

    return (
        <div className="rd-payments-list">
            {payments.map((p) => (
                <div
                    key={p.id}
                    className={`rd-payment-row rd-payment-row--${p.status === "SUCCEEDED" ? "success" : p.status === "FAILED" || p.status === "EXPIRED" ? "danger" : "neutral"}`}
                >
                    <div className="rd-payment-row__left">
                        <span className="rd-payment-row__purpose">
                            {purposeLabel[p.purpose] || p.purpose}
                        </span>
                        <span className="rd-payment-row__method">
                            {methodLabel[p.method] || p.method}
                        </span>
                        {p.receiptCode && (
                            <span className="rd-payment-row__receipt">{p.receiptCode}</span>
                        )}
                        {p.paidAt && (
                            <span className="rd-payment-row__date">{fmtDateTime(p.paidAt)}</span>
                        )}
                    </div>
                    <div className="rd-payment-row__right">
                        <span className="rd-payment-row__amount">{fmtMoney(p.amount)}</span>
                        <span className={`rd-payment-status rd-payment-status--${p.status === "SUCCEEDED" ? "success" : p.status === "FAILED" || p.status === "EXPIRED" ? "danger" : "neutral"}`}>
                            {PAYMENT_STATUS_LABEL[p.status] || p.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ContractsSection({ contracts }) {
    if (!contracts || contracts.length === 0)
        return <p className="rd-empty-text">Chưa có hợp đồng nào. Hợp đồng tự sinh sau khi cọc thành công.</p>;

    return (
        <div className="rd-contracts-list">
            {contracts.map((c) => (
                <div key={c.id} className={`rd-contract-row ${c.isLatest ? "rd-contract-row--latest" : ""}`}>
                    <div className="rd-contract-row__left">
                        <Seal size={18} weight={c.isLatest ? "fill" : "regular"} className="rd-contract-row__icon" />
                        <div>
                            <span className="rd-contract-row__code">{c.code}</span>
                            <span className="rd-contract-row__kind">{c.kind === "ORIGINAL" ? "Hợp đồng gốc" : "Phụ lục"}</span>
                        </div>
                    </div>
                    <div className="rd-contract-row__right">
                        <span className={`rd-contract-status rd-contract-status--${c.status === "ACTIVE" || c.status === "SIGNED" ? "success" : c.status === "SUPERSEDED" || c.status === "CLOSED" ? "neutral" : "warning"}`}>
                            {CONTRACT_STATUS_LABEL[c.status] || c.status}
                        </span>
                        {c.isLatest && (
                            <span className="rd-contract-row__latest-tag">Hiện hành</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function RentalDetailPage() {
    const { reservationId } = useParams();
    const navigate = useNavigate();

    const [reservation, setReservation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getReservation(reservationId);
            setReservation(data);
        } catch (err) {
            if (err?.status === 404) {
                setError("Không tìm thấy đơn thuê này.");
            } else if (err?.status === 403) {
                navigate("/403", { replace: true });
            } else {
                setError(err?.message || "Không thể tải thông tin đơn thuê.");
            }
        } finally {
            setLoading(false);
        }
    }, [reservationId, navigate]);

    useEffect(() => {
        let isMounted = true;
        async function fetchDetail() {
            try {
                const data = await getReservation(reservationId);
                if (isMounted) setReservation(data);
            } catch (err) {
                if (!isMounted) return;
                if (err?.status === 404) {
                    setError("Không tìm thấy đơn thuê này.");
                } else if (err?.status === 403) {
                    navigate("/403", { replace: true });
                } else {
                    setError(err?.message || "Không thể tải thông tin đơn thuê.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchDetail();
        return () => {
            isMounted = false;
        };
    }, [reservationId, navigate]);

    const canCheckIn = reservation?.status === "RESERVED";
    const needsPayment = reservation?.status === "PENDING_PAYMENT";
    const isExpired = reservation?.status === "EXPIRED";
    const unsignedAddendum = reservation?.contracts?.find(
        (c) => c.kind === "ADDENDUM" && c.status !== "SIGNED" && c.status !== "CLOSED" && c.status !== "SUPERSEDED"
    );

    return (
        <AppShell>
            <div className="rental-detail-page">
                {/* ─ Back nav ─ */}
                <Link to="/rentals" className="rd-back-link">
                    <ArrowLeft size={16} weight="bold" />
                    Về danh sách đơn thuê
                </Link>

                {/* ─ Loading ─ */}
                {loading && (
                    <div className="rd-skeleton-wrap">
                        <div className="rd-skeleton rd-skeleton--hero" />
                        <div className="rd-skeleton rd-skeleton--section" />
                        <div className="rd-skeleton rd-skeleton--section" />
                    </div>
                )}

                {/* ─ Error ─ */}
                {error && (
                    <div className="rd-error">
                        <WarningCircle size={20} weight="fill" />
                        <span>{error}</span>
                        <button onClick={load} className="rd-error__retry">
                            <ArrowClockwise size={14} /> Thử lại
                        </button>
                    </div>
                )}

                {/* ─ Content ─ */}
                {!loading && !error && reservation && (
                    <>
                        {/* ── Hero ── */}
                        <div className={`rd-hero rd-hero--${STATUS_COLOR[reservation.status] || "neutral"}`}>
                            <div className="rd-hero__left">
                                <div className="rd-hero__code">{reservation.code}</div>
                                <div className="rd-hero__unit">
                                    <Package size={20} weight="fill" />
                                    <span>{reservation.unit?.code}</span>
                                    {reservation.unit?.typeName && (
                                        <span className="rd-hero__unit-type">{reservation.unit.typeName}</span>
                                    )}
                                    {reservation.unit?.sizeM2 && (
                                        <span className="rd-hero__unit-size">{reservation.unit.sizeM2} m²</span>
                                    )}
                                </div>
                                <span className={`rd-badge rd-badge--${STATUS_COLOR[reservation.status] || "neutral"} rd-badge--lg`}>
                                    {STATUS_LABEL[reservation.status] || reservation.status}
                                </span>
                            </div>

                            <div className="rd-hero__actions">
                                {needsPayment && (
                                    <Link
                                        to={`/payment/${reservationId}`}
                                        className="rd-hero__btn rd-hero__btn--warning"
                                    >
                                        Thanh toán cọc
                                        <ArrowRight size={14} weight="bold" />
                                    </Link>
                                )}
                                {canCheckIn && (
                                    <Link
                                        to={`/rentals/${reservationId}/check-in-pass`}
                                        className="rd-hero__btn rd-hero__btn--primary"
                                    >
                                        <QrCode size={16} weight="bold" />
                                        Check-in Pass
                                        <ArrowRight size={14} weight="bold" />
                                    </Link>
                                )}
                                <button onClick={load} className="rd-hero__btn rd-hero__btn--ghost" title="Tải lại">
                                    <ArrowClockwise size={14} />
                                </button>
                            </div>
                        </div>

                        {/* ── Expired callout ── */}
                        {isExpired && reservation.depositForfeitReason && (
                            <div className="rd-expired-callout">
                                <XCircle size={20} weight="fill" />
                                <div>
                                    <strong>Cọc đã bị tịch thu</strong>
                                    <p>{reservation.depositForfeitReason}</p>
                                </div>
                            </div>
                        )}

                        {/* ── Unsigned addendum callout (US-13 rule) ── */}
                        {unsignedAddendum && (
                            <div className="rd-warning-callout">
                                <WarningCircle size={20} weight="fill" />
                                <div>
                                    <strong>Phụ lục gia hạn ({unsignedAddendum.code}) đang chờ ký tại quầy</strong>
                                    <p>
                                        Vui lòng đến quầy Tân Bình Depot ký phụ lục hợp đồng giấy trước ngày{" "}
                                        <strong>{fmtDate(unsignedAddendum.signatureDueDate)}</strong> để hoàn tất hồ sơ.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── 3-col grid ── */}
                        <div className="rd-main-grid">
                            {/* Left: info + quote */}
                            <div className="rd-main-grid__left">
                                <SectionCard title="Thông tin đặt chỗ" icon={ClockCountdown}>
                                    <MetaRow label="Mã đặt chỗ" value={<code className="rd-code">{reservation.code}</code>} />
                                    <MetaRow label="Ô kho" value={reservation.unit?.code} />
                                    <MetaRow label="Ngày bắt đầu" value={fmtDate(reservation.startDate)} />
                                    <MetaRow label="Ngày kết thúc" value={fmtDate(reservation.endDate)} />
                                    <MetaRow label="Thời hạn" value={`${reservation.durationMonths} tháng`} />
                                    {reservation.checkInDeadline && (
                                        <MetaRow
                                            label="Hạn nhận kho"
                                            value={
                                                <span className={new Date(reservation.checkInDeadline) < new Date() && reservation.status === "RESERVED" ? "rd-deadline--danger" : ""}>
                                                    {fmtDate(reservation.checkInDeadline)}
                                                </span>
                                            }
                                        />
                                    )}
                                </SectionCard>

                                {reservation.quote && (
                                    <SectionCard title="Bảng giá & Cọc" icon={Receipt}>
                                        <MetaRow label="Tiền thuê 1 tháng" value={fmtMoney(reservation.quote.monthlyRent)} />
                                        <MetaRow label="Tổng tiền thuê" value={fmtMoney(reservation.quote.totalRent)} />
                                        <MetaRow
                                            label="Tiền cọc (10%)"
                                            value={
                                                <strong className="rd-deposit-amount">
                                                    {fmtMoney(reservation.quote.depositAmount || reservation.depositAmount)}
                                                </strong>
                                            }
                                        />
                                        <MetaRow
                                            label="Phải trả ngay"
                                            value={
                                                <strong className={reservation.depositStatus === "HELD" || reservation.depositStatus === "SETTLED" ? "rd-amount--paid" : "rd-amount--due"}>
                                                    {fmtMoney(reservation.quote.dueNow)}
                                                </strong>
                                            }
                                        />
                                        {reservation.depositStatus && (
                                            <MetaRow
                                                label="Trạng thái cọc"
                                                value={
                                                    <span className={`rd-deposit-status rd-deposit-status--${reservation.depositStatus === "HELD" ? "success" : reservation.depositStatus === "FORFEITED" ? "danger" : "neutral"}`}>
                                                        {reservation.depositStatus}
                                                    </span>
                                                }
                                            />
                                        )}
                                        {reservation.quote.policyVersion && (
                                            <MetaRow label="Chính sách giá" value={`Policy ${reservation.quote.policyVersion}`} />
                                        )}
                                    </SectionCard>
                                )}

                                {reservation.accessCode && (
                                    <SectionCard title="Mã truy cập kho" icon={CheckCircle}>
                                        <div className="rd-access-code">{reservation.accessCode}</div>
                                        <p className="rd-access-code__hint">Nhập mã này tại bảng điều khiển cửa kho của bạn.</p>
                                    </SectionCard>
                                )}
                            </div>

                            {/* Right: payments + contracts */}
                            <div className="rd-main-grid__right">
                                <SectionCard title="Lịch sử thanh toán" icon={Receipt}>
                                    <PaymentsSection payments={reservation.payments} />
                                </SectionCard>

                                <SectionCard title="Chuỗi hợp đồng" icon={FileText}>
                                    <ContractsSection contracts={reservation.contracts} />
                                </SectionCard>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}
