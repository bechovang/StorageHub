import { Receipt } from "@phosphor-icons/react";
import { fmtMoney } from "../../../utils/rentalConstants.js";

export function RentalDepositCard({ reservation, depositText }) {
  return (
    <article className="rd-card">
      <header className="rd-card__header">
        <div className="rd-card__title-wrap">
          <Receipt size={18} weight="bold" />
          <h2 className="rd-card__title">Tiền cọc &amp; Ký quỹ</h2>
        </div>
        <span className="rd-card__sub-badge">10% GIỮ CHỖ</span>
      </header>

      <div className="rd-card__body">
        <div className="rd-deposit-headline">
          <span className="rd-deposit-label">Tiền cọc quy định</span>
          <div className="rd-deposit-amount font-mono">
            {fmtMoney(
              reservation.depositAmount ||
                reservation.quote?.deposit ||
                0
            )}
          </div>
          <div className="rd-deposit-status-row">
            <span className="rd-badge__dot" aria-hidden="true" />
            <span>Trạng thái: <strong>{depositText}</strong></span>
          </div>
        </div>

        <div className="rd-meta-list">
          <div className="rd-meta-row">
            <span className="rd-meta-row__label">Giá thuê theo ngày</span>
            <span className="rd-meta-row__value font-mono">
              {fmtMoney(
                reservation.quote?.dailyRent ||
                  reservation.unit?.baseDailyRent
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
          Tiền cọc được giữ an toàn và sẽ được hoàn trả 100% vào tài khoản khi bạn kết thúc hợp đồng.
        </p>
      </div>
    </article>
  );
}
