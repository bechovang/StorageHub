import { Link } from "react-router";
import {
  ArrowRight,
  CheckCircle,
  ClockCountdown,
  WarningCircle,
  Key,
  QrCode,
  Receipt,
  Calendar,
} from "@phosphor-icons/react";
import {
  STATUS_LABEL,
  STATUS_COLOR,
  DEPOSIT_STATUS_LABEL,
  fmtDate,
  fmtMoney,
} from "./rentalConstants";

export default function RentalCard({ item }) {
  const statusColor = STATUS_COLOR[item.status] || "neutral";
  const statusText = STATUS_LABEL[item.status] || item.status;
  const depositText =
    DEPOSIT_STATUS_LABEL[item.depositStatus] || item.depositStatus || "—";

  const isPending = item.status === "PENDING_PAYMENT";
  const isReserved = item.status === "RESERVED";
  const isCheckedIn =
    item.status === "CHECKED_IN" || item.status === "CHECKOUT_REQUESTED";

  return (
    <article className={`rental-card rental-card--${statusColor}`}>
      {/* 4px Left Status Indicator Bar */}
      <div className="rental-card__indicator" aria-hidden="true" />

      <div className="rental-card__inner">
        {/* Top Operational Strip */}
        <div className="rental-card__top">
          <div className="rental-card__tags">
            {/* Unit Mono Badge */}
            <span className="rental-card__unit-code font-mono">
              {item.unit?.code || "—"}
            </span>

            {/* Swiss Status Badge */}
            <span className={`rental-badge rental-badge--${statusColor}`}>
              <span className="rental-badge__dot" aria-hidden="true" />
              {statusText}
            </span>

            {/* Access Status Chip */}
            {isCheckedIn && (
              <span className="rental-card__access-tag rental-card__access-tag--success">
                <Key size={13} weight="bold" />
                Mở khóa điện tử 24/7
              </span>
            )}

            {isReserved && (
              <span className="rental-card__access-tag rental-card__access-tag--info">
                <CheckCircle size={13} weight="bold" />
                Sẵn sàng nhận kho
              </span>
            )}

            {isPending && (
              <span className="rental-card__access-tag rental-card__access-tag--warning">
                <ClockCountdown size={13} weight="bold" />
                Chờ thanh toán cọc
              </span>
            )}

            {item.status === "CLOSED" && (
              <span className="rental-card__access-tag rental-card__access-tag--success">
                <CheckCircle size={13} weight="bold" />
                Đã hoàn tất hợp đồng
              </span>
            )}
          </div>

          {/* Reservation Code */}
          <div className="rental-card__code font-mono" title="Mã đặt chỗ">
            {item.code}
          </div>
        </div>

        {/* Middle Specs & Headline */}
        <div className="rental-card__headline">
          <h2 className="rental-card__title">
            <span className="rental-card__size font-mono">
              {item.unit?.sizeM2 ? `${item.unit.sizeM2} m²` : "Kho tiêu chuẩn"}
            </span>
            <span className="rental-card__sep">·</span>
            <span>
              {item.unit?.typeName
                ? `Loại ${item.unit.typeName}`
                : "Kho lưu trữ cá nhân"}
            </span>
            <span className="rental-card__sep">·</span>
            <span className="rental-card__depot">
              Tân Bình Gateway (VN-SGN-01)
            </span>
          </h2>

          <div className="rental-card__meta-strip">
            <div className="rental-card__meta-item">
              <Calendar size={15} weight="bold" className="rental-card__meta-icon" />
              <span>
                Thời gian:{" "}
                <strong>
                  {fmtDate(item.startDate)} → {fmtDate(item.endDate)}
                </strong>
              </span>
            </div>

            <span className="rental-card__meta-sep">|</span>

            <div className="rental-card__meta-item">
              <Receipt size={15} weight="bold" className="rental-card__meta-icon" />
              <span>
                Tiền cọc:{" "}
                <strong className="rental-card__amount font-mono">
                  {fmtMoney(item.depositAmount)}
                </strong>
                <span className="rental-card__deposit-state">
                  ({depositText})
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Context Prompt / Alert */}
        {isPending && (
          <div className="rental-card__prompt rental-card__prompt--warning">
            <WarningCircle size={16} weight="fill" />
            <span>
              <strong>Cần thanh toán:</strong> Vui lòng hoàn tất thanh toán tiền cọc để giữ chỗ kho này nhé.
            </span>
          </div>
        )}

        {isReserved && (
          <div className="rental-card__prompt rental-card__prompt--info">
            <CheckCircle size={16} weight="fill" />
            <span>
              <strong>Đã giữ chỗ:</strong> Bạn chỉ cần mang theo CCCD và mở thẻ nhận kho khi đến quầy.
            </span>
          </div>
        )}

        {/* Action Button Row */}
        <div className="rental-card__actions">
          <div className="rental-card__actions-group">
            {isPending && (
              <Link
                to={`/payment/${item.id}`}
                className="rental-btn rental-btn--primary"
              >
                Thanh toán cọc ngay
                <ArrowRight size={14} weight="bold" />
              </Link>
            )}

            {isReserved && (
              <Link
                to={`/rentals/${item.id}/check-in-pass`}
                className="rental-btn rental-btn--primary"
              >
                <QrCode size={15} weight="bold" />
                Mở thẻ nhận kho
                <ArrowRight size={14} weight="bold" />
              </Link>
            )}

            <Link
              to={`/rentals/${item.id}`}
              className="rental-btn rental-btn--secondary"
            >
              Xem chi tiết
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>

          <span className="rental-card__id-sub font-mono">
            ID #{item.id}
          </span>
        </div>
      </div>
    </article>
  );
}
