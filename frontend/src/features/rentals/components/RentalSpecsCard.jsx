import { ClockCountdown, Key } from "@phosphor-icons/react";
import { fmtDate } from "../../../utils/rentalConstants.js";

export function RentalSpecsCard({ reservation }) {
  return (
    <>
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
              <span className="rd-meta-row__label">Mã kho</span>
              <span className="rd-meta-row__value font-mono font-bold">
                Kho {reservation.unit?.code}
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
              Nhập mã này tại bàn phím số gắn trên cửa kho hoặc trạm kiểm soát ra vào Cơ sở để mở khóa.
            </p>
          </div>
        </article>
      )}
    </>
  );
}
