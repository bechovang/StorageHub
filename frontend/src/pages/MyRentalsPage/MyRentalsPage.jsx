import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
    Package,
    ClockCountdown,
    CheckCircle,
    XCircle,
    ArrowRight,
    Receipt,
    WarningCircle,
    ArrowClockwise,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { listMyReservations } from "../../services/rentalService.js";
import "./MyRentalsPage.css";

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_GROUP = {
    PENDING_PAYMENT: "active",
    RESERVED: "active",
    CHECKED_IN: "active",
    CHECKOUT_REQUESTED: "active",
    CLOSED: "history",
    EXPIRED: "history",
};

const STATUS_LABEL = {
    PENDING_PAYMENT: "Chờ thanh toán cọc",
    RESERVED: "Đã xác nhận",
    CHECKED_IN: "Đang thuê",
    CHECKOUT_REQUESTED: "Đang chờ trả kho",
    CLOSED: "Đã kết thúc",
    EXPIRED: "Hết hạn (mất cọc)",
};

const STATUS_COLOR = {
    PENDING_PAYMENT: "warning",
    RESERVED: "success",
    CHECKED_IN: "info",
    CHECKOUT_REQUESTED: "info",
    CLOSED: "neutral",
    EXPIRED: "danger",
};

function fmtDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMoney(n) {
    if (n == null) return "—";
    return n.toLocaleString("vi-VN") + " ₫";
}

// ─── sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const label = STATUS_LABEL[status] || status;
    const color = STATUS_COLOR[status] || "neutral";
    return <span className={`rental-badge rental-badge--${color}`}>{label}</span>;
}

function RentalCard({ item }) {
    const isActive = STATUS_GROUP[item.status] === "active";
    const canCheckIn = item.status === "RESERVED";
    const needsPayment = item.status === "PENDING_PAYMENT";

    return (
        <div className={`rental-card rental-card--${STATUS_COLOR[item.status] || "neutral"}`}>
            <div className="rental-card__header">
                <div className="rental-card__unit">
                    <Package size={18} weight="fill" className="rental-card__unit-icon" />
                    <span className="rental-card__unit-code">{item.unit?.code || "—"}</span>
                    {item.unit?.typeName && (
                        <span className="rental-card__unit-type">{item.unit.typeName}</span>
                    )}
                    {item.unit?.sizeM2 && (
                        <span className="rental-card__unit-size">{item.unit.sizeM2} m²</span>
                    )}
                </div>
                <StatusBadge status={item.status} />
            </div>

            <div className="rental-card__meta">
                <div className="rental-card__meta-row">
                    <span className="rental-card__meta-label">Mã đặt chỗ</span>
                    <span className="rental-card__meta-value rental-card__code">{item.code}</span>
                </div>
                <div className="rental-card__meta-row">
                    <span className="rental-card__meta-label">Thời gian thuê</span>
                    <span className="rental-card__meta-value">
                        {fmtDate(item.startDate)} → {fmtDate(item.endDate)}
                    </span>
                </div>
                <div className="rental-card__meta-row">
                    <span className="rental-card__meta-label">Tiền cọc</span>
                    <span className="rental-card__meta-value">{fmtMoney(item.depositAmount)}</span>
                </div>
                {item.depositStatus && (
                    <div className="rental-card__meta-row">
                        <span className="rental-card__meta-label">Trạng thái cọc</span>
                        <span className="rental-card__meta-value">{item.depositStatus}</span>
                    </div>
                )}
            </div>

            <div className="rental-card__actions">
                <Link
                    to={`/rentals/${item.id}`}
                    className="rental-card__btn rental-card__btn--ghost"
                >
                    <Receipt size={14} weight="bold" />
                    Xem chi tiết
                    <ArrowRight size={12} weight="bold" />
                </Link>

                {needsPayment && (
                    <Link
                        to={`/rentals/${item.id}`}
                        className="rental-card__btn rental-card__btn--warning"
                    >
                        Thanh toán cọc ngay
                        <ArrowRight size={12} weight="bold" />
                    </Link>
                )}

                {canCheckIn && (
                    <Link
                        to={`/rentals/${item.id}/check-in-pass`}
                        className="rental-card__btn rental-card__btn--primary"
                    >
                        <CheckCircle size={14} weight="bold" />
                        Xem Check-in Pass
                        <ArrowRight size={12} weight="bold" />
                    </Link>
                )}
            </div>
        </div>
    );
}

function GroupSection({ title, icon: Icon, items, emptyMsg }) {
    if (items.length === 0) {
        return (
            <section className="rental-section">
                <h2 className="rental-section__title">
                    <Icon size={18} weight="bold" />
                    {title}
                    <span className="rental-section__count">0</span>
                </h2>
                <p className="rental-section__empty">{emptyMsg}</p>
            </section>
        );
    }

    return (
        <section className="rental-section">
            <h2 className="rental-section__title">
                <Icon size={18} weight="bold" />
                {title}
                <span className="rental-section__count">{items.length}</span>
            </h2>
            <div className="rental-grid">
                {items.map((item) => (
                    <RentalCard key={item.id} item={item} />
                ))}
            </div>
        </section>
    );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function MyRentalsPage() {
    const [activeItems, setActiveItems] = useState([]);
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [activePage, historyPage] = await Promise.all([
                listMyReservations({ group: "active" }),
                listMyReservations({ group: "history" }),
            ]);
            setActiveItems(activePage.items || []);
            setHistoryItems(historyPage.items || []);
        } catch (err) {
            setError(err?.message || "Không thể tải danh sách đơn thuê.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Nhóm active theo sub-status để hiển thị rõ ràng hơn
    const pendingPayment = activeItems.filter((i) => i.status === "PENDING_PAYMENT");
    const reserved = activeItems.filter((i) => i.status === "RESERVED");
    const checkedIn = activeItems.filter((i) =>
        ["CHECKED_IN", "CHECKOUT_REQUESTED"].includes(i.status)
    );

    return (
        <AppShell>
            <div className="my-rentals-page">
                {/* ─ Header ─ */}
                <div className="my-rentals-page__header">
                    <div>
                        <h1 className="my-rentals-page__title">Đơn thuê của tôi</h1>
                        <p className="my-rentals-page__subtitle">
                            Theo dõi trạng thái đặt chỗ, cọc và hợp đồng của bạn
                        </p>
                    </div>
                    <button
                        className="my-rentals-page__refresh"
                        onClick={load}
                        disabled={loading}
                        title="Tải lại"
                    >
                        <ArrowClockwise size={16} weight="bold" className={loading ? "spinning" : ""} />
                    </button>
                </div>

                {/* ─ Error ─ */}
                {error && (
                    <div className="my-rentals-page__error">
                        <WarningCircle size={20} weight="fill" />
                        <span>{error}</span>
                        <button onClick={load} className="my-rentals-page__retry">
                            Thử lại
                        </button>
                    </div>
                )}

                {/* ─ Loading skeleton ─ */}
                {loading && (
                    <div className="my-rentals-page__skeleton">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="rental-skeleton-card" />
                        ))}
                    </div>
                )}

                {/* ─ Content ─ */}
                {!loading && !error && (
                    <>
                        {/* Chờ thanh toán cọc */}
                        {pendingPayment.length > 0 && (
                            <div className="my-rentals-page__alert">
                                <WarningCircle size={18} weight="fill" />
                                Bạn có <strong>{pendingPayment.length}</strong> đơn chờ thanh toán
                                cọc. Thanh toán trước khi hết hạn để giữ chỗ.
                            </div>
                        )}

                        <GroupSection
                            title="Đặt chỗ đang chờ cọc"
                            icon={ClockCountdown}
                            items={pendingPayment}
                            emptyMsg="Không có đơn nào đang chờ thanh toán cọc."
                        />

                        <GroupSection
                            title="Đã xác nhận — Chờ nhận kho"
                            icon={CheckCircle}
                            items={reserved}
                            emptyMsg="Không có đơn nào đang chờ nhận kho."
                        />

                        <GroupSection
                            title="Đang thuê kho"
                            icon={Package}
                            items={checkedIn}
                            emptyMsg="Bạn hiện không có ô kho nào đang thuê."
                        />

                        <GroupSection
                            title="Lịch sử đơn thuê"
                            icon={XCircle}
                            items={historyItems}
                            emptyMsg="Chưa có lịch sử đơn thuê nào."
                        />

                        {activeItems.length === 0 && historyItems.length === 0 && (
                            <div className="my-rentals-page__empty-state">
                                <Package size={56} weight="thin" className="my-rentals-page__empty-icon" />
                                <h2>Chưa có đơn thuê nào</h2>
                                <p>Tìm ô kho phù hợp và đặt chỗ ngay hôm nay.</p>
                                <Link to="/browse" className="my-rentals-page__browse-btn">
                                    Khám phá kho lưu trữ
                                    <ArrowRight size={14} weight="bold" />
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppShell>
    );
}
