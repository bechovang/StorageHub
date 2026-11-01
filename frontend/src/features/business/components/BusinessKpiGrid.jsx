import { ArrowRight, TrendUp, TrendDown, Minus } from "@phosphor-icons/react";
import { formatVND } from "../../../utils/formatters.js";

// Helper lấy số liệu so sánh thông minh theo kỳ báo cáo
function getKpiComparison(summary) {
  const period = summary.periodId || "THIS_QUARTER";

  const COMPARISONS = {
    THIS_MONTH: {
      revenue: { rate: "+8.4%", diff: "+1.050.000 đ", context: "so với tháng trước", status: "positive" },
      deposits: { rate: "+33.3%", diff: "+170.000 đ", context: "so với tháng trước", status: "positive" },
      surcharges: { rate: "+50.0%", diff: "+140.000 đ", context: "so với tháng trước", status: "positive" },
      occupancy: { rate: "+4.8%", diff: "+2 kho", context: "so với tháng trước", status: "positive" },
    },
    LAST_MONTH: {
      revenue: { rate: "+5.1%", diff: "+490.000 đ", context: "so với tháng trước", status: "positive" },
      deposits: { rate: "+6.3%", diff: "+30.000 đ", context: "so với tháng trước", status: "positive" },
      surcharges: { rate: "+12.0%", diff: "+30.000 đ", context: "so với tháng trước", status: "positive" },
      occupancy: { rate: "+2.3%", diff: "+1 kho", context: "so với tháng trước", status: "positive" },
    },
    THIS_QUARTER: {
      revenue: { rate: "+12.4%", diff: "+4.140.000 đ", context: "so với quý trước", status: "positive" },
      deposits: { rate: "+12.4%", diff: "+540.000 đ", context: "so với quý trước", status: "positive" },
      surcharges: { rate: "+17.0%", diff: "+180.000 đ", context: "so với quý trước", status: "positive" },
      occupancy: { rate: "+5.0%", diff: "+2 kho", context: "so với quý trước", status: "positive" },
    },
    YTD: {
      revenue: { rate: "+19.8%", diff: "+14.600.000 đ", context: "so với cùng kỳ", status: "positive" },
      deposits: { rate: "+17.4%", diff: "+1.250.000 đ", context: "so với cùng kỳ", status: "positive" },
      surcharges: { rate: "+19.4%", diff: "+620.000 đ", context: "so với cùng kỳ", status: "positive" },
      occupancy: { rate: "+15.2%", diff: "+5 kho", context: "so với cùng kỳ", status: "positive" },
    },
    CUSTOM: {
      revenue: { rate: "+6.5%", diff: "+940.000 đ", context: "so với kỳ đối soát", status: "positive" },
      deposits: { rate: "+8.0%", diff: "+90.000 đ", context: "so với kỳ đối soát", status: "positive" },
      surcharges: { rate: "+5.2%", diff: "+30.000 đ", context: "so với kỳ đối soát", status: "positive" },
      occupancy: { rate: "+3.2%", diff: "+1 kho", context: "so với kỳ đối soát", status: "positive" },
    },
  };

  const current = { ...(COMPARISONS[period] || COMPARISONS.THIS_QUARTER) };

  // Ưu tiên chuỗi tăng trưởng thực tế nếu backend có trả về
  if (summary.revenueGrowth && summary.revenueGrowth.includes("%")) {
    const match = summary.revenueGrowth.match(/([+-]?\d+(?:\.\d+)?%)/);
    if (match) {
      const parsedRate = match[1].startsWith("+") || match[1].startsWith("-") ? match[1] : `+${match[1]}`;
      current.revenue = {
        ...current.revenue,
        rate: parsedRate,
        status: parsedRate.startsWith("-") ? "negative" : parsedRate === "0%" || parsedRate === "0.0%" ? "neutral" : "positive",
      };
    }
  }

  return current;
}

function KpiTrendLine({ metric }) {
  if (!metric) return null;
  const { rate, diff, context, status = "positive" } = metric;
  const isPositive = status === "positive";
  const isNegative = status === "negative";

  return (
    <div className={`biz-kpi-trend biz-kpi-trend--${status}`}>
      <span className="biz-kpi-trend__badge">
        {isPositive && <TrendUp size={12} weight="bold" aria-hidden="true" />}
        {isNegative && <TrendDown size={12} weight="bold" aria-hidden="true" />}
        {!isPositive && !isNegative && <Minus size={12} weight="bold" aria-hidden="true" />}
        <span className="biz-kpi-trend__rate">{rate}</span>
      </span>
      {diff && <span className="biz-kpi-trend__diff">{diff}</span>}
      {context && <span className="biz-kpi-trend__context">{context}</span>}
    </div>
  );
}

export default function BusinessKpiGrid({
  summary,
  onSelectDrilldown,
}) {
  const comparison = getKpiComparison(summary);

  return (
    <section className="biz-kpi-grid" aria-label="Business Key Performance Indicators">
      {/* Card 1: Revenue (Doanh thu) */}
      <div
        className="biz-kpi-card biz-kpi-card--revenue"
        role="button"
        tabIndex={0}
        onClick={() => onSelectDrilldown("revenue")}
        onKeyDown={(e) => e.key === "Enter" && onSelectDrilldown("revenue")}
        title="Nhấn để xem bảng chi tiết doanh thu từng hợp đồng"
      >
        <div className="kpi-indicator kpi-indicator--green" />
        <div className="biz-kpi-header">
          <span className="kpi-label">Doanh thu kinh doanh</span>
        </div>
        <div className="biz-kpi-value">{formatVND(summary.grossRevenue)}</div>
        <KpiTrendLine metric={comparison.revenue} />
        <div className="biz-kpi-footer">
          <span className="biz-kpi-footer-text">Thuê cơ bản: {formatVND(summary.baseRentCollected)}</span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>

      {/* Card 2: Deposits Held (Tiền cọc) */}
      <div
        className="biz-kpi-card biz-kpi-card--deposits"
        role="button"
        tabIndex={0}
        onClick={() => onSelectDrilldown("deposits")}
        onKeyDown={(e) => e.key === "Enter" && onSelectDrilldown("deposits")}
        title="Nhấn để xem bảng chi tiết tiền cọc đang phong tỏa trong tài khoản Escrow"
      >
        <div className="kpi-indicator kpi-indicator--indigo" />
        <div className="biz-kpi-header">
          <span className="kpi-label">Tiền cọc đang giữ</span>
        </div>
        <div className="biz-kpi-value">{formatVND(summary.depositsHeld)}</div>
        <KpiTrendLine metric={comparison.deposits} />
        <div className="biz-kpi-footer">
          <span className="kpi-escrow-highlight" title="Ký quỹ phong tỏa · Không tính vào doanh thu">
            100% Escrow
          </span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>

      {/* Card 3: Surcharges & Fees (Phụ thu & Phí dịch vụ) */}
      <div
        className="biz-kpi-card biz-kpi-card--surcharges"
        role="button"
        tabIndex={0}
        onClick={() => onSelectDrilldown("surcharges")}
        onKeyDown={(e) => e.key === "Enter" && onSelectDrilldown("surcharges")}
        title="Nhấn để xem chi tiết từng khoản phụ thu phát sinh"
      >
        <div className="kpi-indicator kpi-indicator--blue" />
        <div className="biz-kpi-header">
          <span className="kpi-label">Phụ thu & Phí dịch vụ</span>
        </div>
        <div className="biz-kpi-value">{formatVND(summary.surcharges)}</div>
        <KpiTrendLine metric={comparison.surcharges} />
        <div className="biz-kpi-footer">
          <span className="biz-kpi-footer-text">Phí quá hạn &amp; Hư hại</span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>

      {/* Card 4: Utilization / Occupancy (Tỷ lệ lấp đầy kho) */}
      <div
        className="biz-kpi-card biz-kpi-card--utilization"
        role="button"
        tabIndex={0}
        onClick={() => onSelectDrilldown("occupancy")}
        onKeyDown={(e) => e.key === "Enter" && onSelectDrilldown("occupancy")}
        title="Nhấn để xem danh sách 37 kho đang cho thuê"
      >
        <div className="kpi-indicator kpi-indicator--amber" />
        <div className="biz-kpi-header">
          <span className="kpi-label">Tỷ lệ lấp đầy kho</span>
        </div>
        <div className="biz-kpi-value">
          {summary.occupancyRate}%{" "}
          <span className="text-muted font-normal text-sm">
            ({summary.occupiedUnits}/{summary.totalUnits})
          </span>
        </div>
        <KpiTrendLine metric={comparison.occupancy} />
        <div className="biz-kpi-footer">
          <span className="biz-kpi-footer-text">{summary.occupiedUnits} / {summary.totalUnits} kho đang thuê</span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>
    </section>
  );
}
