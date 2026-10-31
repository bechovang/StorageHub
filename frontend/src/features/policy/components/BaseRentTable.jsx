export function BaseRentTable({
  draftBaseRates,
  persistedPolicy,
  onRateChange,
}) {
  return (
    <div className="policy-section">
      <div className="policy-section__header">
        <div className="policy-section__title-wrap">
          <span className="policy-section__title">Đơn giá thuê cơ sở theo tháng</span>
          <span className="policy-section__sub">(Đơn giá cơ bản)</span>
        </div>
        <span className="policy-section__currency">Đơn vị: Đồng Việt Nam (VND)</span>
      </div>

      <div className="policy-table-container">
        <table className="policy-table">
          <thead>
            <tr>
              <th className="w-20">Mã cỡ</th>
              <th>Loại kho</th>
              <th className="text-right">Đơn giá niêm yết</th>
              <th className="text-center w-28">Chu kỳ</th>
              <th className="text-right w-36">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {draftBaseRates.map((rate) => {
              const orig = persistedPolicy.baseRates.find((r) => r.id === rate.id);
              const isModified = orig && Number(orig.rateVnd) !== Number(rate.rateVnd);

              return (
                <tr
                  key={rate.id}
                  className={isModified ? "policy-row--modified" : ""}
                >
                  <td className="policy-cell--mono font-bold text-ink-secondary">
                    {rate.code || rate.typeName}
                  </td>
                  <td>
                    <div className="policy-cell-content">
                      <span className="policy-cell-title">{rate.typeName}</span>
                      <span className="policy-cell-sub">{rate.fullName}</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="policy-input-currency-wrap">
                      <input
                        type="text"
                        className={`policy-input policy-input--currency ${
                          isModified ? "policy-input--modified" : ""
                        }`}
                        value={
                          rate.rateVnd === ""
                            ? ""
                            : Number(rate.rateVnd).toLocaleString("vi-VN")
                        }
                        onChange={(e) => onRateChange(rate.id, e.target.value)}
                      />
                      <span className="policy-input__suffix">₫</span>
                    </div>
                    {isModified && (
                      <div className="policy-input-hint">Đã sửa đổi trong bản nháp</div>
                    )}
                  </td>
                  <td className="text-center text-muted text-xs">
                    / {rate.billingInterval || "tháng"}
                  </td>
                  <td className="text-right">
                    {isModified ? (
                      <span className="status-badge status-badge--drafting">
                        Bản thảo
                      </span>
                    ) : (
                      <span className="status-badge status-badge--active">
                        Hiệu lực
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
