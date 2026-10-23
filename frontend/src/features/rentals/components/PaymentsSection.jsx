import { Receipt } from "@phosphor-icons/react";
import {
  fmtDateTime,
  fmtMoney,
  PAYMENT_STATUS_LABEL,
} from "../../../utils/rentalConstants.js";

export function PaymentsSection({ payments = [] }) {
  if (payments.length === 0) {
    return <p className="rd-empty-text">Chưa có giao dịch thanh toán nào được ghi nhận.</p>;
  }

  const methodLabel = {
    CARD: "Thẻ ngân hàng",
    MOMO: "Ví MoMo",
    VNPAY: "Thanh toán QR",
    PAYOS: "Thanh toán QR",
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
