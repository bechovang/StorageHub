import { ArrowRight, TrendUp, TrendDown, Minus } from "@phosphor-icons/react";
import { formatVND } from "../../../utils/formatters.js";

function formatSignedDiff(diffNumber) {
  if (diffNumber == null || isNaN(diffNumber)) return "";
  if (diffNumber > 0) return `+${formatVND(diffNumber)}`;
  if (diffNumber < 0) return `-${formatVND(Math.abs(diffNumber))}`;
  return "0 đ";
}

// Helper lấy số liệu so sánh thông minh & chính xác 100% theo kỳ báo cáo
function getKpiComparison(summary) {
  const period = summary.periodId || "THIS_QUARTER";

  const contextMap = {
    THIS_MONTH: "so với tháng trước",
    LAST_MONTH: "so với tháng trước",
    THIS_QUARTER: "so với quý trước",
    YTD: "so với cùng kỳ",
    CUSTOM: "so với kỳ đối soát",
  };
  const context = contextMap[period] || "so với quý trước";

  // 1. Doanh thu kinh doanh (Gross Revenue)
  let revRate = "0%";
  let revStatus = "neutral";
  if (summary.revenueGrowth) {
    const match = String(summary.revenueGrowth).match(/([+-]?\d+(?:\.\d+)?%)/);
    if (match) {
      revRate = match[1].startsWith("+") || match[1].startsWith("-") ? match[1] : `+${match[1]}`;
      revStatus = revRate.startsWith("-")
        ? "negative"
        : revRate === "0%" || revRate === "0.0%"
        ? "neutral"
        : "positive";
    }
  }

  let revDiffStr = "";
  if (summary.grossRevenueDiff != null) {
    revDiffStr = formatSignedDiff(summary.grossRevenueDiff);
  } else if (revRate.includes("%") && summary.grossRevenue != null) {
    const pct = parseFloat(revRate) / 100;
    if (!isNaN(pct) && 1 + pct > 0) {
      const prevGross = summary.grossRevenue / (1 + pct);
      const computedDiff = Math.round(summary.grossRevenue - prevGross);
      revDiffStr = formatSignedDiff(computedDiff);
    }
  }

  // 2. Tiền cọc an ninh Escrow (Deposits Held)
  let depRate = "0%";
  let depStatus = "neutral";
  if (summary.escrowDepositGrowth) {
    const match = String(summary.escrowDepositGrowth).match(/([+-]?\d+(?:\.\d+)?%)/);
    if (match) {
      depRate = match[1].startsWith("+") || match[1].startsWith("-") ? match[1] : `+${match[1]}`;
      depStatus = depRate.startsWith("-")
        ? "negative"
        : depRate === "0%" || depRate === "0.0%"
        ? "neutral"
        : "positive";
    }
  }

  let depDiffStr = "";
  if (summary.escrowDepositDiff != null) {
    depDiffStr = formatSignedDiff(summary.escrowDepositDiff);
  } else if (depRate.includes("%") && summary.depositsHeld != null) {
    const pct = parseFloat(depRate) / 100;
    if (!isNaN(pct) && 1 + pct > 0) {
      const prevDep = summary.depositsHeld / (1 + pct);
      const computedDiff = Math.round(summary.depositsHeld - prevDep);
      depDiffStr = formatSignedDiff(computedDiff);
    }
  }

  // 3. Phụ thu & Phí dịch vụ (Surcharges)
  let surchRate = "0%";
  let surchStatus = "neutral";
  if (summary.surchargeGrowth) {
    const match = String(summary.surchargeGrowth).match(/([+-]?\d+(?:\.\d+)?%)/);
    if (match) {
      surchRate = match[1].startsWith("+") || match[1].startsWith("-") ? match[1] : `+${match[1]}`;
      surchStatus = surchRate.startsWith("-")
        ? "negative"
        : surchRate === "0%" || surchRate === "0.0%"
        ? "neutral"
        : "positive";
    }
  }

  let surchDiffStr = "";
  if (summary.surchargesDiff != null) {
    surchDiffStr = formatSignedDiff(summary.surchargesDiff);
  } else if (summary.surcharges === 0) {
    surchDiffStr = "0 đ";
    surchRate = "0%";
    surchStatus = "neutral";
  }

  // 4. Tỷ lệ lấp đầy kho (Occupancy)
  let occRate = "+0.0%";
  let occStatus = "neutral";
  if (summary.occupancyStatus) {
    const match = String(summary.occupancyStatus).match(/([+-]?\d+(?:\.\d+)?%)/);
    if (match) {
      occRate = match[1].startsWith("+") || match[1].startsWith("-") ? match[1] : `+${match[1]}`;
      occStatus = occRate.startsWith("-")
        ? "negative"
        : occRate === "0%" || occRate === "0.0%"
        ? "neutral"
        : "positive";
    }
  }

  return {
    revenue: { rate: revRate, diff: revDiffStr, context, status: revStatus },
    deposits: { rate: depRate, diff: depDiffStr, context, status: depStatus },
    surcharges: { rate: surchRate, diff: surchDiffStr, context, status: surchStatus },
    occupancy: {
      rate: occRate,
      diff: summary.occupiedUnits > 0 ? `${summary.occupiedUnits} kho đang thuê` : "0 kho",
      context,
      status: occStatus,
    },
  };
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
          <span className="kpi-escrow-highlight" title="100% Escrow · Ký quỹ phong tỏa (Không tính vào doanh thu)">
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
        title="Nhấn để xem bảng chi tiết các khoản phụ thu phát sinh"
      >
        <div className="kpi-indicator kpi-indicator--amber" />
        <div className="biz-kpi-header">
          <span className="kpi-label">Phụ thu & Phí dịch vụ</span>
        </div>
        <div className="biz-kpi-value">{formatVND(summary.surcharges)}</div>
        <KpiTrendLine metric={comparison.surcharges} />
        <div className="biz-kpi-footer">
          <span className="biz-kpi-footer-text">Phí quá hạn & Hư hại</span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>

      {/* Card 4: Occupancy Rate (Tỷ lệ lấp đầy) */}
      <div
        className="biz-kpi-card biz-kpi-card--occupancy"
        role="button"
        tabIndex={0}
        onClick={() => onSelectDrilldown("occupancy")}
        onKeyDown={(e) => e.key === "Enter" && onSelectDrilldown("occupancy")}
        title="Nhấn để xem sơ đồ tỷ lệ lấp đầy toàn bộ kho cơ sở"
      >
        <div className="kpi-indicator kpi-indicator--orange" />
        <div className="biz-kpi-header">
          <span className="kpi-label">Tỷ lệ lấp đầy kho</span>
        </div>
        <div className="biz-kpi-value">
          {summary.occupancyRate}%
          <span className="kpi-occupancy-ratio"> ({summary.occupiedUnits}/{summary.totalUnits})</span>
        </div>
        <KpiTrendLine metric={comparison.occupancy} />
        <div className="biz-kpi-footer">
          <span className="biz-kpi-footer-text">
            {summary.occupancyBreakdown || `${summary.occupiedUnits} / ${summary.totalUnits} kho đang thuê`}
          </span>
          <span className="kpi-drill-hint">
            Chi tiết <ArrowRight size={12} weight="bold" />
          </span>
        </div>
      </div>
    </section>
  );
}
