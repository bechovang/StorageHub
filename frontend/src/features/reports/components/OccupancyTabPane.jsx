import { formatVND } from "../../../utils/formatters.js";
import { ZONE_PERFORMANCE } from "../../../services/reportService.js";

export function OccupancyTabPane({ onDrilldown }) {
  return (
    <div className="tab-pane space-y-6">
      <div className="reports-table-card">
        <div className="reports-table-header">
          <div>
            <h2 className="reports-table-title">Hiệu suất khai thác theo Zone</h2>
            <p className="reports-table-subtitle">
              Tỷ lệ lấp đầy, doanh thu bình quân và thời hạn thuê trung bình từng khu vực
            </p>
          </div>
          <button
            type="button"
            className="reports-btn reports-btn--secondary reports-btn--sm"
            onClick={() => onDrilldown("occupancy")}
          >
            Xem danh sách kho đang thuê →
          </button>
        </div>

        <div className="reports-table-responsive">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Phân khu (Zone)</th>
                <th className="text-center">Số kho</th>
                <th className="text-center">Đang thuê</th>
                <th className="text-center">Tỷ lệ lấp đầy</th>
                <th className="text-right">Doanh thu cơ bản</th>
                <th className="text-right">Phụ thu</th>
                <th className="text-right">Tổng thu</th>
                <th className="text-center">Thời gian TB</th>
                <th className="text-center">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {ZONE_PERFORMANCE.map((zp) => (
                <tr key={zp.zone}>
                  <td className="font-semibold text-ink">{zp.zone}</td>
                  <td className="text-center font-mono">{zp.unitCount}</td>
                  <td className="text-center font-mono font-semibold text-primary">{zp.rentedCount}</td>
                  <td className="text-center">
                    <span className="badge-occupancy">{zp.rate}</span>
                  </td>
                  <td className="text-right font-mono text-secondary">{formatVND(zp.baseRev)}</td>
                  <td className="text-right font-mono text-secondary">{formatVND(zp.surcharge)}</td>
                  <td className="text-right font-mono font-bold text-ink">{formatVND(zp.total)}</td>
                  <td className="text-center text-xs text-secondary">{zp.avgDuration}</td>
                  <td className="text-center">
                    <span className="badge-zone-health">
                      {zp.status === "HIGH_DEMAND" ? "Cầu vượt cung" : "Ổn định"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
