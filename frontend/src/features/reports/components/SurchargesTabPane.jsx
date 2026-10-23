import { useState, useEffect } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { formatVND } from "../../../utils/formatters.js";
import { getDrilldownItems } from "../../../services/reportService.js";

export function SurchargesTabPane({ onExportCSV }) {
  const [surchargeRows, setSurchargeRows] = useState([]);

  useEffect(() => {
    let ignore = false;
    getDrilldownItems("surcharges")
      .then((data) => {
        if (!ignore) setSurchargeRows(data?.rows || []);
      })
      .catch((err) => {
        console.error("Failed to load surcharge ledger:", err);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="tab-pane space-y-6">
      <div className="reports-table-card">
        <div className="reports-table-header">
          <div>
            <h2 className="reports-table-title">Sổ theo dõi phụ thu phát sinh (Surcharge Ledger)</h2>
            <p className="reports-table-subtitle">
              Các khoản phí quá giờ, xử lý vệ sinh và bồi hoàn hao mòn cơ sở vật chất
            </p>
          </div>
          <button
            type="button"
            className="reports-btn reports-btn--secondary reports-btn--sm"
            onClick={onExportCSV}
          >
            <DownloadSimple size={14} weight="bold" />
            <span>Xuất CSV</span>
          </button>
        </div>

        <div className="reports-table-responsive">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Mã biên lai</th>
                <th>Mã sự vụ / Task</th>
                <th>Khách hàng</th>
                <th>Kho</th>
                <th>Hạng mục phụ thu</th>
                <th className="text-right">Số tiền</th>
                <th>Lý do phát sinh</th>
                <th>Ngày thu</th>
              </tr>
            </thead>
            <tbody>
              {surchargeRows.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono font-semibold text-ink">{item.id}</td>
                  <td className="font-mono text-secondary">{item.refCode}</td>
                  <td className="font-medium text-ink">{item.tenant}</td>
                  <td>
                    <span className="badge-unit">{item.unitCode}</span>
                  </td>
                  <td className="font-medium text-ink">{item.type}</td>
                  <td className="text-right font-mono font-bold text-amber-700">
                    {formatVND(item.amount)}
                  </td>
                  <td className="text-secondary text-xs">{item.reason}</td>
                  <td className="text-secondary">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
