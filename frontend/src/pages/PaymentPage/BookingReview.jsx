import {
  CaretRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  PlusCircle,
  Lock,
  CornersOut,
  IdentificationCard,
  CreditCard,
} from "@phosphor-icons/react";
import { Link } from "react-router";
import Badge from "../../components/Badge/Badge.jsx";
import Button from "../../components/Button/Button.jsx";
import { formatDateTime } from "../../utils/formatters.js";

export default function BookingReview({
  reservation,
  user,
  formatVND,
  formatDate,
  onOpenModal,
  isAlreadyPaid,
  myReservations = [],
  onSelectReservation,
  onCreateTestReservation,
  loadingReservation,
  paymentHistory = [],
  showHistory,
  setShowHistory,
}) {
  const unit = reservation?.unit || {};
  const totalRent = (unit.monthlyPrice || 345000) * (reservation?.durationMonths || 3);
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(-2)
        .toUpperCase()
    : "LN";

  return (
    <div className="booking-review-layout">
      {/* ── BREADCRUMB & WORKFLOW STEP ── */}
      <div className="booking-subbar">
        <nav className="booking-breadcrumb" aria-label="Breadcrumb">
          <Link to="/browse">Danh sách kho</Link>
          <CaretRight size={13} weight="bold" />
          <span>{unit.depot || "Cơ sở Tân Bình"}</span>
          <CaretRight size={13} weight="bold" />
          <span className="booking-breadcrumb__current">
            {unit.code ? `Kho ${unit.code}` : "Kho"} · Đặt chỗ
          </span>
        </nav>

        <Badge tone={isAlreadyPaid ? "success" : "default"} className="step-badge">
          <ShieldCheck size={14} weight="bold" />
          <span>Bước 3/3: Xác nhận &amp; Thanh toán</span>
        </Badge>
      </div>

      {/* ── MAIN REVIEW CANVAS (2 COLUMNS) ── */}
      <div className="booking-grid">
        {/* ── CỘT TRÁI: THÔNG TIN KHO & THỜI HẠN ── */}
        <div className="booking-left-col">
          {/* Unit Card */}
          <article className="swiss-card unit-spec-card">
            <div className="swiss-card__indicator" />

            <div className="unit-spec-card__header">
              <div className="unit-spec-card__title-row">
                <div className="unit-badges-row">
                  <span className="code-pill">UNIT {unit.code || "S-3"}</span>
                  <Badge tone={isAlreadyPaid ? "success" : "warning"}>
                    {isAlreadyPaid ? "Đã giữ kho" : "Chờ thanh toán cọc"}
                  </Badge>
                </div>
                <h1 className="unit-title">
                  {unit.typeName || "Kho Tiêu chuẩn"} ({unit.sizeM2 || 5} m²)
                </h1>
                <p className="unit-location">
                  {unit.building || "Tầng 2 · Khu B"} · {unit.depot || "Cơ sở Tân Bình"}
                </p>
              </div>

              <div className="unit-price-box">
                <span className="unit-price-val">{formatVND(unit.monthlyPrice || 345000)}</span>
                <span className="unit-price-sub">mỗi tháng</span>
              </div>
            </div>

            {/* Parameters Grid (3 cols) */}
            <div className="unit-params-grid">
              <div className="param-cell">
                <span className="param-cell__label">Thời hạn thuê</span>
                <p className="param-cell__value">{reservation?.durationMonths || 3} Tháng</p>
                <span className="param-cell__sub">Hợp đồng linh hoạt</span>
              </div>

              <div className="param-cell">
                <span className="param-cell__label">Bắt đầu thuê</span>
                <p className="param-cell__value">{formatDate(reservation?.startDate)}</p>
                <span className="param-cell__sub">Nhận kho từ 08:00</span>
              </div>

              <div className="param-cell">
                <span className="param-cell__label">Kết thúc thuê</span>
                <p className="param-cell__value">{formatDate(reservation?.endDate)}</p>
                <span className="param-cell__sub">Gia hạn linh hoạt</span>
              </div>
            </div>

            {/* Lessee Details */}
            <div className="lessee-row">
              <div className="lessee-info">
                <div className="avatar-chip">{initials}</div>
                <div>
                  <div className="lessee-name">{user?.fullName || "Lan Nguyen"}</div>
                  <div className="lessee-sub">
                    <IdentificationCard size={14} />
                    <span>Người thuê chính · Đã xác minh CCCD</span>
                  </div>
                </div>
              </div>

              <div className="gate-pin-hint">
                <Clock size={14} />
                <span>Mã PIN vào kho kích hoạt vào ngày bắt đầu</span>
              </div>
            </div>
          </article>

          {/* Unit Dimensions Bar */}
          <div className="swiss-card dimension-bar">
            <div className="dimension-bar__left">
              <CornersOut size={20} className="dimension-icon" />
              <div>
                <span className="dimension-spec">
                  {unit.dimensions || "2.0m (W) × 2.5m (L) × 2.8m (H)"}
                </span>
                <span className="dimension-volume">· Thể tích {unit.volume || "14.0 m³"}</span>
              </div>
            </div>
            <span className="feature-pill">Ra vào 24/7 · Khóa số điện tử</span>
          </div>
        </div>

        {/* ── CỘT PHẢI: BẢNG KÊ TÀI CHÍNH (FINANCIAL LEDGER) ── */}
        <div className="booking-right-col">
          <article className="swiss-card financial-card">
            <header className="financial-card__header">
              <h2 className="financial-title">Bảng kê thanh toán</h2>
              <span className="ref-code">REF: {reservation?.code || "RSV-2026-S3"}</span>
            </header>

            {/* Multi-reservation Selector nếu có nhiều hơn 1 đơn */}
            {myReservations.length > 1 && (
              <div className="reservation-selector-wrap">
                <label htmlFor="select-reservation-dropdown" className="selector-label">
                  Chọn đơn đặt chỗ:
                </label>
                <select
                  id="select-reservation-dropdown"
                  value={reservation?.id || ""}
                  onChange={(e) => onSelectReservation(Number(e.target.value))}
                  className="selector-select"
                >
                  {myReservations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — Kho {r.unit?.code} ({r.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Bảng chi tiết chi phí */}
            <div className="ledger-lines">
              <div className="ledger-item">
                <span className="ledger-item__label">
                  Tiền thuê cơ sở ({reservation?.durationMonths || 3} tháng)
                </span>
                <span className="ledger-item__val">{formatVND(totalRent)}</span>
              </div>

              <div className="ledger-item">
                <span className="ledger-item__label">Hạ tầng an ninh &amp; camera</span>
                <span className="ledger-item__val ledger-item__val--free">Đã bao gồm</span>
              </div>

              <div className="ledger-item">
                <span className="ledger-item__label">Mã PIN điện tử tự quản</span>
                <span className="ledger-item__val ledger-item__val--free">Miễn phí (0 ₫)</span>
              </div>

              <div className="ledger-item ledger-item--total">
                <span className="ledger-item__label">Tổng giá trị hợp đồng ({reservation?.durationMonths || 3} tháng)</span>
                <span className="ledger-item__val">{formatVND(totalRent)}</span>
              </div>
            </div>

            {/* Khối Đặt cọc 10% */}
            <div className={`deposit-highlight ${isAlreadyPaid ? "deposit-highlight--paid" : ""}`}>
              <div className="deposit-highlight__top">
                <span className="deposit-highlight__title">
                  {isAlreadyPaid ? "Tiền cọc đã thanh toán (10%)" : "Tiền cọc thanh toán ngay (10%)"}
                </span>
                <span className="deposit-highlight__amount">
                  {formatVND(reservation?.depositAmount || Math.round(totalRent * 0.1))}
                </span>
              </div>
              <p className="deposit-highlight__note">
                {isAlreadyPaid
                  ? "Khoản cọc đã được lưu giữ an toàn trên hệ thống để đảm bảo hiệu lực đơn đặt chỗ."
                  : "Hoàn trả 100% khi kết thúc hợp đồng hoặc cấn trừ vào kỳ thanh toán đầu tiên theo nhu cầu của bạn."}
              </p>
            </div>

            {/* Nút Thanh toán cọc / Mở Modal & Điều hướng kế tiếp */}
            <div className="financial-card__actions">
              {isAlreadyPaid ? (
                <>
                  <div className="paid-status-box">
                    <CheckCircle size={20} weight="fill" />
                    <span>Đơn đặt chỗ đã thanh toán cọc thành công</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "12px", width: "100%" }}>
                    <Link
                      to={`/checkin/${reservation?.id || 1}`}
                      className="btn btn--primary"
                      style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
                    >
                      Mở Check-in Pass nhận kho
                    </Link>
                    <Link
                      to="/rentals"
                      className="btn btn--outline"
                      style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
                    >
                      Kho của tôi
                    </Link>
                  </div>
                </>
              ) : (
                <Button variant="primary" fullWidth size="large" onClick={onOpenModal}>
                  <Lock size={18} weight="bold" />
                  <span>Tiến hành thanh toán cọc</span>
                </Button>
              )}

              {/* Nút tạo đơn mẫu để test thuận tiện (chỉ hiển thị ở môi trường DEV) */}
              {import.meta.env.DEV && (
                <button
                  type="button"
                  className="btn-create-test"
                  onClick={onCreateTestReservation}
                  disabled={loadingReservation}
                >
                  <PlusCircle size={15} />
                  <span>Tạo đơn đặt chỗ thử nghiệm (Demo)</span>
                </button>
              )}
            </div>
          </article>

          {/* Lịch sử giao dịch liên quan (FR-9) */}
          {paymentHistory.length > 0 && (
            <article className="swiss-card history-card">
              <header className="history-card__header">
                <div className="history-card__title">
                  <CreditCard size={16} />
                  <span>Lịch sử giao dịch ({paymentHistory.length})</span>
                </div>
                <button
                  type="button"
                  className="history-toggle-btn"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? "Thu gọn" : "Xem tất cả"}
                </button>
              </header>

              <div className="history-list">
                {(showHistory ? paymentHistory : paymentHistory.slice(0, 2)).map((p) => (
                  <div key={p.id} className="history-row">
                    <div>
                      <div className="history-code">
                        {p.receiptCode || `TXN-${p.id}`} · {p.method}
                      </div>
                      <div className="history-time">
                        {p.paidAt ? formatDateTime(p.paidAt) : "Đang giao dịch"}
                      </div>
                    </div>
                    <div className="history-right">
                      <div className="history-amt">{formatVND(p.amount)}</div>
                      <Badge
                        tone={
                          p.status === "SUCCEEDED"
                            ? "success"
                            : p.status === "FAILED"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
