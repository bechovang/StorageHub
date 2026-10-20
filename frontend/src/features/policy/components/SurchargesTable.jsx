export function SurchargesTable({
  draftLateFee,
  setDraftLateFee,
  isLateFeeViolated,
  isLateFeeModified,
  draftDeposit,
  setDraftDeposit,
  isDepositViolated,
  isDepositModified,
  draftBufferDays,
  setDraftBufferDays,
  isBufferViolated,
  isBufferModified,
}) {
  return (
    <div className="policy-section">
      <div className="policy-section__header">
        <div className="policy-section__title-wrap">
          <span className="policy-section__title">Phụ thu & Tham số vận hành</span>
          <span className="policy-section__sub">(Phụ phí & Quy định ràng buộc)</span>
        </div>
        <span className="policy-section__currency text-error font-medium">
          Tuân thủ trần quy chế nghiêm ngặt
        </span>
      </div>

      <div className="policy-table-container">
        <table className="policy-table">
          <thead>
            <tr>
              <th>Hạng mục quy chế</th>
              <th>Hình thức</th>
              <th className="w-48">Giá trị thiết lập</th>
              <th>Hạn mức trần an toàn</th>
              <th className="text-right w-32">Thi hành</th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: Late Checkout Fee (Trần 10%) */}
            <tr
              className={`${
                isLateFeeViolated
                  ? "policy-row--error"
                  : isLateFeeModified
                  ? "policy-row--modified"
                  : ""
              }`.trim()}
            >
              <td>
                <div className="policy-cell-content">
                  <span className="policy-cell-title">Phí phạt trả kho trễ</span>
                  <span className="policy-cell-sub">
                    <span className="policy-code-badge">#SUR-001</span> Late Checkout
                  </span>
                </div>
              </td>
              <td className="text-muted text-xs">Tỷ lệ cộng thêm / ngày</td>
              <td>
                <div className="policy-input-percent-wrap">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className={`policy-input policy-input--percent ${
                      isLateFeeViolated
                        ? "policy-input--error"
                        : isLateFeeModified
                        ? "policy-input--modified"
                        : ""
                    }`.trim()}
                    value={draftLateFee}
                    onChange={(e) => setDraftLateFee(e.target.value)}
                  />
                  <span className="policy-input__suffix">%</span>
                </div>
                {isLateFeeViolated && (
                  <div className="policy-field-error">
                    Vượt trần cứng 10% tại v3 (#CAP-04)
                  </div>
                )}
                {!isLateFeeViolated && isLateFeeModified && (
                  <div className="policy-input-hint">Đã sửa đổi trong bản nháp</div>
                )}
              </td>
              <td>
                <div className="policy-cap-cell">
                  <span className="policy-cap-limit">Tối đa 10.0%</span>
                  <span className="policy-cap-note">Trần hệ thống cấp cao</span>
                </div>
              </td>
              <td className="text-right">
                {isLateFeeViolated ? (
                  <span className="status-badge status-badge--blocked">
                    Bị chặn
                  </span>
                ) : isLateFeeModified ? (
                  <span className="status-badge status-badge--drafting">
                    Bản thảo
                  </span>
                ) : (
                  <span className="status-badge status-badge--active">
                    Áp dụng
                  </span>
                )}
              </td>
            </tr>

            {/* Row 2: Security Deposit % (Sàn 10%) */}
            <tr
              className={`${
                isDepositViolated
                  ? "policy-row--error"
                  : isDepositModified
                  ? "policy-row--modified"
                  : ""
              }`.trim()}
            >
              <td>
                <div className="policy-cell-content">
                  <span className="policy-cell-title">Tỷ lệ tiền cọc tối thiểu</span>
                  <span className="policy-cell-sub">
                    <span className="policy-code-badge">#SUR-003</span> Security Deposit
                  </span>
                </div>
              </td>
              <td className="text-muted text-xs">% trên tổng tiền hợp đồng</td>
              <td>
                <div className="policy-input-percent-wrap">
                  <input
                    type="number"
                    min="5"
                    max="50"
                    className={`policy-input policy-input--percent ${
                      isDepositViolated
                        ? "policy-input--error"
                        : isDepositModified
                        ? "policy-input--modified"
                        : ""
                    }`.trim()}
                    value={draftDeposit}
                    onChange={(e) => setDraftDeposit(e.target.value)}
                  />
                  <span className="policy-input__suffix">%</span>
                </div>
                {isDepositViolated && (
                  <div className="policy-field-error">
                    Không được dưới sàn 10% (#CAP-08)
                  </div>
                )}
                {!isDepositViolated && isDepositModified && (
                  <div className="policy-input-hint">Đã sửa đổi trong bản nháp</div>
                )}
              </td>
              <td>
                <div className="policy-cap-cell">
                  <span className="policy-cap-limit">Tối thiểu 10%</span>
                  <span className="policy-cap-note">Sàn bảo đảm thanh toán</span>
                </div>
              </td>
              <td className="text-right">
                {isDepositViolated ? (
                  <span className="status-badge status-badge--blocked">
                    Bị chặn
                  </span>
                ) : isDepositModified ? (
                  <span className="status-badge status-badge--drafting">
                    Bản thảo
                  </span>
                ) : (
                  <span className="status-badge status-badge--active">
                    Áp dụng
                  </span>
                )}
              </td>
            </tr>

            {/* Row 3: Turnover Buffer Days (1 - 5 ngày) */}
            <tr
              className={`${
                isBufferViolated
                  ? "policy-row--error"
                  : isBufferModified
                  ? "policy-row--modified"
                  : ""
              }`.trim()}
            >
              <td>
                <div className="policy-cell-content">
                  <span className="policy-cell-title">Thời gian đệm vệ sinh kho</span>
                  <span className="policy-cell-sub">
                    <span className="policy-code-badge">#OPS-012</span> Turnover Buffer
                  </span>
                </div>
              </td>
              <td className="text-muted text-xs">Số ngày giữa 2 hợp đồng</td>
              <td>
                <div className="policy-input-wrap">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className={`policy-input policy-input--days ${
                      isBufferViolated
                        ? "policy-input--error"
                        : isBufferModified
                        ? "policy-input--modified"
                        : ""
                    }`.trim()}
                    value={draftBufferDays}
                    onChange={(e) => setDraftBufferDays(e.target.value)}
                  />
                  <span className="policy-input__suffix">ngày</span>
                </div>
                {isBufferViolated && (
                  <div className="policy-field-error">
                    Thời gian đệm từ 1 đến 5 ngày (#OPS-012)
                  </div>
                )}
                {!isBufferViolated && isBufferModified && (
                  <div className="policy-input-hint">Đã sửa đổi trong bản nháp</div>
                )}
              </td>
              <td>
                <div className="policy-cap-cell">
                  <span className="policy-cap-limit">1 - 5 ngày</span>
                  <span className="policy-cap-note">Quy trình vệ sinh tiêu chuẩn</span>
                </div>
              </td>
              <td className="text-right">
                {isBufferViolated ? (
                  <span className="status-badge status-badge--blocked">
                    Bị chặn
                  </span>
                ) : isBufferModified ? (
                  <span className="status-badge status-badge--drafting">
                    Bản thảo
                  </span>
                ) : (
                  <span className="status-badge status-badge--active">
                    Áp dụng
                  </span>
                )}
              </td>
            </tr>

            {/* Row 4: Damage Handling */}
            <tr>
              <td>
                <div className="policy-cell-content">
                  <span className="policy-cell-title">Bồi thường hư hại ô kho</span>
                  <span className="policy-cell-sub">
                    <span className="policy-code-badge">#SUR-002</span> Damage Assessment
                  </span>
                </div>
              </td>
              <td className="text-muted text-xs">Thẩm định hiện trường</td>
              <td className="font-medium text-ink">
                Tại quầy (bắt buộc lý do & biên bản)
              </td>
              <td>
                <div className="policy-cap-cell">
                  <span className="policy-cap-limit">Bàn giao trả kho</span>
                  <span className="policy-cap-note">Cấn trừ cọc hoặc thu thêm</span>
                </div>
              </td>
              <td className="text-right">
                <span className="status-badge status-badge--active">
                  Áp dụng
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
