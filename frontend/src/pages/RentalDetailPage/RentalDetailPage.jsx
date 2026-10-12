import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowClockwise,
  Receipt,
  FileText,
  CheckCircle,
  XCircle,
  ClockCountdown,
  WarningCircle,
  QrCode,
  Seal,
  Key,
  ShieldCheck,
  CreditCard,
  Eye,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { getReservation } from "../../services/rentalService.js";
import {
  fmtDate,
  fmtDateTime,
  fmtMoney,
  STATUS_LABEL,
  STATUS_COLOR,
  DEPOSIT_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  CONTRACT_STATUS_LABEL,
} from "../MyRentalsPage/rentalConstants";
import "./RentalDetailPage.css";

// ─── 1. BẢNG LỊCH SỬ GIAO DỊCH (PAYMENTS TABLE) ──────────────────────────────
function PaymentsSection({ payments = [] }) {
  if (payments.length === 0) {
    return <p className="rd-empty-text">Chưa có giao dịch thanh toán nào được ghi nhận.</p>;
  }

  const methodLabel = {
    CARD: "Thẻ quốc tế",
    MOMO: "Ví MoMo",
    VNPAY: "VNPay QR",
  };

  const purposeLabel = {
    DEPOSIT: "Tiền cọc (10%)",
    RENT: "Tiền thuê kho",
    EXTENSION_FEE: "Phí gia hạn",
    DAMAGE_FEE: "Bồi thường hư hại",
    EXTRA_FEE: "Phí phụ trợ",
  };

  const totalPaid = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="rd-payments-wrap">
      <div className="rd-table-scroll">
        <table className="rd-table">
          <thead>
            <tr>
              <th>Mục đích</th>
              <th>Phương thức</th>
              <th>Mã biên lai</th>
              <th>Thời gian</th>
              <th className="text-right">Số tiền</th>
              <th className="text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const isSuccess = p.status === "SUCCEEDED";
              const isFailed = p.status === "FAILED" || p.status === "EXPIRED";

              return (
                <tr key={p.id}>
                  <td>
                    <div className="rd-payment-purpose">
                      {purposeLabel[p.purpose] || p.purpose}
                    </div>
                  </td>
                  <td>
                    <div className="rd-payment-method">
                      {methodLabel[p.method] || p.method}
                    </div>
                  </td>
                  <td>
                    <span className="font-mono rd-payment-receipt">
                      {p.receiptCode || "—"}
                    </span>
                  </td>
                  <td>
                    <span className="rd-payment-date">
                      {fmtDateTime(p.paidAt)}
                    </span>
                  </td>
                  <td className="text-right font-mono font-bold">
                    {fmtMoney(p.amount)}
                  </td>
                  <td className="text-center">
                    <span
                      className={`rd-status-chip ${
                        isSuccess
                          ? "rd-status-chip--success"
                          : isFailed
                          ? "rd-status-chip--danger"
                          : "rd-status-chip--neutral"
                      }`}
                    >
                      {PAYMENT_STATUS_LABEL[p.status] || p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rd-payments-footer">
        <div className="rd-payments-note">
          <Receipt size={15} />
          <span>Hóa đơn điện tử đối soát theo chuẩn VAT Depot SGN-01</span>
        </div>
        <div className="rd-payments-total">
          <span>Tổng tiền đã tất toán:</span>
          <strong className="font-mono">{fmtMoney(totalPaid)}</strong>
        </div>
      </div>
    </div>
  );
}

// ─── 2. DANH SÁCH CHUỖI HỢP ĐỒNG (CONTRACTS CHAIN) ───────────────────────────
function ContractsSection({ contracts = [] }) {
  if (contracts.length === 0) {
    return (
      <p className="rd-empty-text">
        Chưa có hợp đồng nào. Hợp đồng điện tử được tự động khởi tạo ngay sau khi hoàn tất thanh toán cọc.
      </p>
    );
  }

  return (
    <div className="rd-contracts-list">
      {contracts.map((c) => {
        const isActive = c.status === "ACTIVE" || c.status === "SIGNED";
        const isDraft = c.status === "DRAFT" || c.status === "PRINTED";

        return (
          <div
            key={c.code || `${c.id}-${c.kind}`}
            className={`rd-contract-item ${c.isLatest ? "is-latest" : ""}`}
          >
            <div className="rd-contract-item__left">
              <div className="rd-contract-item__icon-wrap">
                <Seal
                  size={18}
                  weight={c.isLatest ? "fill" : "bold"}
                  className="rd-contract-item__icon"
                />
              </div>

              <div className="rd-contract-item__details">
                <div className="rd-contract-item__top">
                  <span className="rd-contract-code font-mono">{c.code}</span>
                  <span className="rd-contract-kind">
                    {c.kind === "ORIGINAL" ? "Hợp đồng gốc" : "Phụ lục gia hạn"}
                  </span>
                  {c.isLatest && (
                    <span className="rd-contract-tag rd-contract-tag--latest">
                      Hiện hành
                    </span>
                  )}
                </div>

                {c.signatureDueDate && (
                  <p className="rd-contract-sub">
                    Hạn ký bản cứng tại quầy:{" "}
                    <strong>{fmtDate(c.signatureDueDate)}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="rd-contract-item__right">
              <span
                className={`rd-status-chip ${
                  isActive || c.status === "CLOSED"
                    ? "rd-status-chip--success"
                    : isDraft
                    ? "rd-status-chip--warning"
                    : "rd-status-chip--neutral"
                }`}
              >
                {CONTRACT_STATUS_LABEL[c.status] || c.status}
              </span>

              {c.signedPhotoUrl && (
                <a
                  href={c.signedPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rd-contract-link"
                >
                  <Eye size={14} weight="bold" />
                  Xem bản ký
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 3. MAIN COMPONENT: RENTAL DETAIL PAGE ───────────────────────────────────
export default function RentalDetailPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleRefresh = async () => {
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
  };

  useEffect(() => {
    let ignore = false;
    async function fetchDetail() {
      try {
        const data = await getReservation(reservationId);
        if (!ignore) setReservation(data);
      } catch (err) {
        if (!ignore) {
          if (err?.status === 404) {
            setError("Không tìm thấy đơn thuê này.");
          } else if (err?.status === 403) {
            navigate("/403", { replace: true });
          } else {
            setError(err?.message || "Không thể tải thông tin đơn thuê.");
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchDetail();

    return () => {
      ignore = true;
    };
  }, [reservationId, navigate]);

  const canCheckIn = reservation?.status === "RESERVED";
  const needsPayment = reservation?.status === "PENDING_PAYMENT";
  const isExpired = reservation?.status === "EXPIRED";
  const isCheckedIn =
    reservation?.status === "CHECKED_IN" ||
    reservation?.status === "CHECKOUT_REQUESTED";

  const unsignedAddendum = reservation?.contracts?.find(
    (c) =>
      c.kind === "ADDENDUM" &&
      c.status !== "SIGNED" &&
      c.status !== "CLOSED" &&
      c.status !== "SUPERSEDED"
  );

  const statusColor = STATUS_COLOR[reservation?.status] || "neutral";
  const statusLabel = STATUS_LABEL[reservation?.status] || reservation?.status;
  const depositText =
    DEPOSIT_STATUS_LABEL[reservation?.depositStatus] ||
    reservation?.depositStatus ||
    "—";

  return (
    <AppShell>
      <div className="rental-detail-page">
        {/* Breadcrumb Navigation */}
        <div className="rd-subbar">
          <nav className="rd-breadcrumb" aria-label="Breadcrumb">
            <Link to="/rentals" className="rd-breadcrumb__back">
              <ArrowLeft size={14} weight="bold" />
              <span>Đơn thuê của tôi</span>
            </Link>
            <span className="rd-breadcrumb__sep">/</span>
            <span>Depot Tân Bình (VN-SGN-01)</span>
            <span className="rd-breadcrumb__sep">/</span>
            <span className="rd-breadcrumb__current font-mono">
              {reservation?.code || `ID #${reservationId}`}
            </span>
          </nav>

          <button
            type="button"
            className="rd-refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Tải lại chi tiết"
          >
            <ArrowClockwise
              size={15}
              weight="bold"
              className={loading ? "is-spinning" : ""}
            />
            <span>Cập nhật</span>
          </button>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="rd-skeleton-list" aria-label="Đang tải dữ liệu đơn thuê">
            <div className="rd-skeleton rd-skeleton--hero" />
            <div className="rd-skeleton-grid">
              <div className="rd-skeleton rd-skeleton--box" />
              <div className="rd-skeleton rd-skeleton--box" />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="rd-error" role="alert">
            <WarningCircle size={20} weight="fill" className="rd-error__icon" />
            <div className="rd-error__msg">
              <strong>Đã có lỗi xảy ra:</strong> {error}
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="rental-btn rental-btn--secondary rd-error__retry"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && reservation && (
          <>
            {/* ── 1. HERO OPERATIONAL BANNER ── */}
            <article className={`rd-hero rd-hero--${statusColor}`}>
              <div className="rd-hero__indicator" aria-hidden="true" />

              <div className="rd-hero__inner">
                <div className="rd-hero__left">
                  <div className="rd-hero__badges">
                    <span className="rd-hero__unit-code font-mono">
                      UNIT {reservation.unit?.code || "—"}
                    </span>

                    <span className={`rd-badge rd-badge--${statusColor}`}>
                      <span className="rd-badge__dot" aria-hidden="true" />
                      {statusLabel}
                    </span>

                    {isCheckedIn && (
                      <span className="rd-hero__telemetry rd-hero__telemetry--success font-mono">
                        <Key size={13} weight="bold" />
                        Mở khóa điện tử 24/7
                      </span>
                    )}

                    {canCheckIn && (
                      <span className="rd-hero__telemetry rd-hero__telemetry--info font-mono">
                        <CheckCircle size={13} weight="bold" />
                        Sẵn sàng nhận kho
                      </span>
                    )}

                    {reservation.status === "CLOSED" && (
                      <span className="rd-hero__telemetry rd-hero__telemetry--success font-mono">
                        <CheckCircle size={13} weight="bold" />
                        Đã tất toán &amp; Hoàn tất
                      </span>
                    )}
                  </div>

                  <h1 className="rd-hero__title">
                    <span className="font-mono">{reservation.code}</span>
                    <span className="rd-hero__sep">·</span>
                    <span>
                      {reservation.unit?.sizeM2
                        ? `${reservation.unit.sizeM2} m²`
                        : "Kho tiêu chuẩn"}
                    </span>
                    <span className="rd-hero__sep">·</span>
                    <span className="rd-hero__type">
                      {reservation.unit?.typeName
                        ? `Loại ${reservation.unit.typeName}`
                        : "Kho cá nhân"}
                    </span>
                  </h1>

                  <p className="rd-hero__location">
                    Cơ sở: <strong>Tân Bình Gateway (VN-SGN-01)</strong>
                    {reservation.unit?.floor && (
                      <> · Tầng {reservation.unit.floor}</>
                    )}
                    {reservation.unit?.zoneCode && (
                      <> · Phân khu {reservation.unit.zoneCode}</>
                    )}
                  </p>
                </div>

                <div className="rd-hero__actions">
                  {needsPayment && (
                    <Link
                      to={`/payment/${reservationId}`}
                      className="rental-btn rental-btn--primary"
                    >
                      Thanh toán cọc ngay
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  )}

                  {canCheckIn && (
                    <Link
                      to={`/rentals/${reservationId}/check-in-pass`}
                      className="rental-btn rental-btn--primary"
                    >
                      <QrCode size={16} weight="bold" />
                      Mở Check-in Pass
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  )}
                </div>
              </div>
            </article>

            {/* ── 2. ALERT CALLOUTS ── */}
            {isExpired && reservation.depositForfeitReason && (
              <div className="rd-callout rd-callout--danger">
                <XCircle size={20} weight="fill" className="rd-callout__icon" />
                <div className="rd-callout__body">
                  <strong>Cọc đã bị tịch thu:</strong>
                  <p>{reservation.depositForfeitReason}</p>
                </div>
              </div>
            )}

            {unsignedAddendum && (
              <div className="rd-callout rd-callout--warning">
                <WarningCircle size={20} weight="fill" className="rd-callout__icon" />
                <div className="rd-callout__body">
                  <strong>
                    Phụ lục gia hạn ({unsignedAddendum.code}) đang chờ ký tại quầy
                  </strong>
                  <p>
                    Vui lòng đến quầy vận hành Tân Bình Gateway ký phụ lục hợp đồng giấy trước ngày{" "}
                    <strong>{fmtDate(unsignedAddendum.signatureDueDate)}</strong> để hoàn tất thủ tục lưu trữ.
                  </p>
                </div>
              </div>
            )}

            {/* ── 3. BENTO 2-COLUMNS CANVAS ── */}
            <div className="rd-bento-grid">
              {/* CỘT TRÁI: ĐẶT CỌC & THÔNG SỐ KHO */}
              <div className="rd-bento-col">
                {/* Khối Tiền Cọc (Deposit Card) */}
                <article className="rd-card">
                  <header className="rd-card__header">
                    <div className="rd-card__title-wrap">
                      <ShieldCheck size={18} weight="bold" />
                      <h2 className="rd-card__title">Tiền cọc &amp; Ký quỹ</h2>
                    </div>
                    <span className="font-mono rd-card__sub-badge">
                      10% GIỮ CHỖ
                    </span>
                  </header>

                  <div className="rd-card__body">
                    <div className="rd-deposit-hero">
                      <span className="rd-deposit-label">Tiền cọc quy định</span>
                      <div className="rd-deposit-amount font-mono">
                        {fmtMoney(
                          reservation.quote?.depositAmount ||
                            reservation.depositAmount
                        )}
                      </div>
                      <div className="rd-deposit-state-row">
                        <span className="rd-deposit-dot" />
                        <span>Trạng thái: <strong>{depositText}</strong></span>
                      </div>
                    </div>

                    <div className="rd-meta-list">
                      <div className="rd-meta-row">
                        <span className="rd-meta-row__label">Giá thuê theo tháng</span>
                        <span className="rd-meta-row__value font-mono">
                          {fmtMoney(
                            reservation.quote?.monthlyRent ||
                              reservation.unit?.baseMonthlyRent
                          )}
                        </span>
                      </div>

                      <div className="rd-meta-row">
                        <span className="rd-meta-row__label">Tổng cam kết hợp đồng</span>
                        <span className="rd-meta-row__value font-mono">
                          {fmtMoney(reservation.quote?.totalRent)}
                        </span>
                      </div>

                      <div className="rd-meta-row rd-meta-row--highlight">
                        <span className="rd-meta-row__label">Số tiền cần thanh toán</span>
                        <span className="rd-meta-row__value font-mono font-bold">
                          {fmtMoney(reservation.quote?.dueNow || 0)}
                        </span>
                      </div>

                      {reservation.quote?.policyVersion && (
                        <div className="rd-meta-row">
                          <span className="rd-meta-row__label">Phiên bản chính sách</span>
                          <span className="rd-meta-row__value font-mono">
                            Policy {reservation.quote.policyVersion}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="rd-card__hint">
                      Khoản tiền cọc được lưu giữ an toàn (Escrow Safe) và sẽ được hoàn trả đầy đủ khi thanh lý hợp đồng nếu không phát sinh vi phạm.
                    </p>
                  </div>
                </article>

                {/* Khối Thông Tin Đặt Chỗ (Specs Card) */}
                <article className="rd-card">
                  <header className="rd-card__header">
                    <div className="rd-card__title-wrap">
                      <ClockCountdown size={18} weight="bold" />
                      <h2 className="rd-card__title">Thông số hợp đồng</h2>
                    </div>
                  </header>

                  <div className="rd-card__body">
                    <div className="rd-meta-list">
                      <div className="rd-meta-row">
                        <span className="rd-meta-row__label">Mã đặt chỗ</span>
                        <span className="rd-meta-row__value font-mono font-bold">
                          {reservation.code}
                        </span>
                      </div>

                      <div className="rd-meta-row">
                        <span className="rd-meta-row__label">Mã ô kho</span>
                        <span className="rd-meta-row__value font-mono font-bold">
                          Unit {reservation.unit?.code}
                        </span>
                      </div>

                      <div className="rd-meta-row">
                        <span className="rd-meta-row__label">Thời hạn thuê</span>
                        <span className="rd-meta-row__value">
                          {reservation.durationMonths} tháng
                        </span>
                      </div>

                      <div className="rd-meta-row">
                        <span className="rd-meta-row__label">Ngày bắt đầu</span>
                        <span className="rd-meta-row__value">
                          {fmtDate(reservation.startDate)}
                        </span>
                      </div>

                      <div className="rd-meta-row">
                        <span className="rd-meta-row__label">Ngày kết thúc</span>
                        <span className="rd-meta-row__value">
                          {fmtDate(reservation.endDate)}
                        </span>
                      </div>

                      {reservation.checkInDeadline && (
                        <div className="rd-meta-row">
                          <span className="rd-meta-row__label">Hạn nhận kho (Check-in)</span>
                          <span
                            className={`rd-meta-row__value ${
                              new Date(reservation.checkInDeadline) <
                                new Date() && reservation.status === "RESERVED"
                                ? "text-danger font-bold"
                                : ""
                            }`}
                          >
                            {fmtDate(reservation.checkInDeadline)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>

                {/* Khối Mã Truy Cập PIN (Nếu có) */}
                {reservation.accessCode && (
                  <article className="rd-card rd-card--access">
                    <header className="rd-card__header">
                      <div className="rd-card__title-wrap">
                        <Key size={18} weight="bold" />
                        <h2 className="rd-card__title">Mã số mở khóa (Smart PIN)</h2>
                      </div>
                      <span className="rd-card__sub-badge">24/7 KEYLESS</span>
                    </header>

                    <div className="rd-card__body">
                      <div className="rd-access-box">
                        <span className="rd-access-box__code font-mono">
                          {reservation.accessCode}
                        </span>
                      </div>
                      <p className="rd-card__hint">
                        Nhập mã này tại bàn phím số gắn trên cửa kho hoặc trạm kiểm soát ra vào Depot để mở khóa.
                      </p>
                    </div>
                  </article>
                )}
              </div>

              {/* CỘT PHẢI: LỊCH SỬ THANH TOÁN & HỢP ĐỒNG */}
              <div className="rd-bento-col">
                {/* Lịch sử thanh toán */}
                <article className="rd-card">
                  <header className="rd-card__header">
                    <div className="rd-card__title-wrap">
                      <CreditCard size={18} weight="bold" />
                      <h2 className="rd-card__title">Lịch sử thanh toán &amp; Hóa đơn</h2>
                    </div>
                    <span className="font-mono rd-card__sub-badge">
                      {reservation.payments?.length || 0} GIAO DỊCH
                    </span>
                  </header>

                  <div className="rd-card__body rd-card__body--flush">
                    <PaymentsSection payments={reservation.payments} />
                  </div>
                </article>

                {/* Chuỗi hợp đồng */}
                <article className="rd-card">
                  <header className="rd-card__header">
                    <div className="rd-card__title-wrap">
                      <FileText size={18} weight="bold" />
                      <h2 className="rd-card__title">Chuỗi hợp đồng lưu trữ</h2>
                    </div>
                    <span className="font-mono rd-card__sub-badge">
                      {reservation.contracts?.length || 0} HỒ SƠ
                    </span>
                  </header>

                  <div className="rd-card__body">
                    <ContractsSection contracts={reservation.contracts} />
                  </div>
                </article>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
