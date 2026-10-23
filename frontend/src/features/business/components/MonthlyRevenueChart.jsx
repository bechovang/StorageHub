import { formatVND } from "../../../utils/formatters.js";

export default function MonthlyRevenueChart({ monthlyData }) {
  return (
    <section className="biz-chart-card">
      <div className="biz-chart-header">
        <div>
          <h2 className="biz-chart-title">Doanh thu theo tháng</h2>
          <p className="biz-chart-subtitle">
            Số liệu tiền thuê thực thu và phụ thu sổ cái kế toán (6 tháng gần nhất)
          </p>
        </div>
        <div className="biz-chart-legend">
          <div className="legend-item">
            <span className="legend-color legend-color--primary" />
            <span className="legend-text">Tiền thuê kho</span>
          </div>
          <div className="legend-item">
            <span className="legend-line-dashed" />
            <span className="legend-text text-muted">Mục tiêu: 12.000.000 ₫/tháng</span>
          </div>
        </div>
      </div>

      {/* Responsive Chart Surface */}
      <div className="biz-chart-body">
        <div className="chart-canvas-wrapper">
          {/* Y-Axis Labels */}
          <div className="chart-y-axis">
            <span>15M ₫</span>
            <span>12M ₫</span>
            <span>9M ₫</span>
            <span>6M ₫</span>
            <span>3M ₫</span>
            <span>0 ₫</span>
          </div>

          {/* Bars & Guides Container */}
          <div className="chart-plot-area">
            {/* Grid Lines */}
            <div className="chart-gridlines">
              <div className="gridline" />
              <div className="gridline gridline--target">
                <span className="target-tag">MỤC TIÊU 12.0M</span>
              </div>
              <div className="gridline" />
              <div className="gridline" />
              <div className="gridline" />
              <div className="gridline" />
            </div>

            {/* Monthly Bars */}
            <div className="chart-bars-row">
              {monthlyData.map((bar) => (
                <div key={bar.month} className="chart-bar-col group">
                  <div className="chart-bar-tooltip">
                    <strong>{bar.month}</strong>: {formatVND(bar.total)}
                    <div className="tooltip-sub">Thuê: {formatVND(bar.rent)}</div>
                    <div className="tooltip-sub">Phụ thu: {formatVND(bar.surcharge)}</div>
                  </div>

                  <div
                    className={`chart-bar-pillar ${bar.isProjected ? "chart-bar-pillar--projected" : ""}`}
                    style={{ height: `${bar.heightPct}%` }}
                  >
                    <div className="chart-bar-fill" />
                  </div>

                  <span className={`chart-bar-label ${bar.isProjected ? "text-primary font-bold" : ""}`}>
                    {bar.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-footnote">
          <span>* Tháng 10 thể hiện số liệu hợp đồng thực tế đang chạy và dự kiến gia hạn.</span>
          <span className="font-mono">Đơn vị: Việt Nam Đồng (VND ₫)</span>
        </div>
      </div>
    </section>
  );
}
