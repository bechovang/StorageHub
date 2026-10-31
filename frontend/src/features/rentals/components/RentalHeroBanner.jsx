import { Link } from "react-router";
import {
  ArrowRight,
  Key,
  CheckCircle,
  QrCode,
  CalendarPlus,
  SignOut,
} from "@phosphor-icons/react";

export function RentalHeroBanner({
  reservation,
  reservationId,
  statusColor,
  statusLabel,
  isCheckedIn,
  canCheckIn,
  onOpenExtension,
  onOpenCheckout,
}) {
  return (
    <article className={`rd-hero rd-hero--${statusColor}`}>
      <div className="rd-hero__indicator" aria-hidden="true" />

      <div className="rd-hero__inner">
        <div className="rd-hero__left">
          <div className="rd-hero__badges">
            <span className="rd-hero__unit-code font-mono">
              KHO {reservation.unit?.code || "—"}
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
            Cơ sở: <strong>Tân Bình</strong>
            {reservation.unit?.floor && (
              <> · Tầng {reservation.unit.floor}</>
            )}
            {reservation.unit?.zoneCode && (
              <> · Phân khu {reservation.unit.zoneCode}</>
            )}
          </p>
        </div>

        <div className="rd-hero__actions">
          {canCheckIn && (
            <Link
              to={`/rentals/${reservationId}/check-in-pass`}
              className="rental-btn rental-btn--primary"
            >
              <QrCode size={16} weight="bold" />
              Mở Thẻ nhận kho
              <ArrowRight size={14} weight="bold" />
            </Link>
          )}

          {/* Actions cho trạng thái CHECKED_IN */}
          {reservation.status === "CHECKED_IN" && (
            <>
              <button
                type="button"
                className="rental-btn rental-btn--primary"
                onClick={onOpenExtension}
                title="Gia hạn thời gian thuê kho"
              >
                <CalendarPlus size={16} weight="bold" />
                Gia hạn thuê kho
              </button>
              <button
                type="button"
                className="rental-btn rental-btn--secondary"
                onClick={onOpenCheckout}
                title="Gửi yêu cầu trả kho"
              >
                <SignOut size={16} weight="bold" />
                Yêu cầu trả kho
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
