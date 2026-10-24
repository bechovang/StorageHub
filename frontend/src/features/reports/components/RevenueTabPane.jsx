import {
  ShieldCheck,
  CheckCircle,
  DownloadSimple,
} from "@phosphor-icons/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatVND } from "../../../utils/formatters.js";

const AUDIT_DATA = [
  { month: "Tháng 7/2026", rent: 11010000, deposits: 1830000, surcharge: 450000, total: 13290000 },
  { month: "Tháng 8/2026", rent: 10450000, deposits: 1820000, surcharge: 480000, total: 12750000 },
  { month: "Tháng 9/2026", rent: 9860000, deposits: 1240000, surcharge: 310000, total: 11410000 },
];

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rentVal = payload.find((p) => p.dataKey === "rent")?.value || 0;
    const depositsVal = payload.find((p) => p.dataKey === "deposits")?.value || 0;
    const surchargeVal = payload.find((p) => p.dataKey === "surcharge")?.value || 0;
    const totalVal = rentVal + surchargeVal + depositsVal;

    return (
      <div
        style={{
          background: "var(--color-ink, #000000)",
          color: "var(--color-surface, #ffffff)",
          padding: "10px 14px",
          border: "1px solid var(--color-ink, #000000)",
          borderRadius: 0,
          boxShadow: "3px 3px 0px rgba(0,0,0,0.9)",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.76rem",
          minWidth: 200,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            borderBottom: "1px solid rgba(255,255,255,0.25)",
            paddingBottom: 5,
            marginBottom: 6,
            display: "flex",
            justifyContent: "space-between",
            letterSpacing: "0.05em",
          }}
        >
          <span>[ SỔ CÁI ĐÃ CHỐT ]</span>
          <span style={{ color: "var(--color-accent, #dc2626)" }}>{label}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: "#a3a3a3" }}>TIỀN THUÊ:</span>
          <strong>{formatVND(rentVal)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: "#38bdf8" }}>CỌC ESCROW:</span>
          <strong>{formatVND(depositsVal)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 5 }}>
          <span style={{ color: "#fbbf24" }}>PHỤ THU:</span>
          <strong>{formatVND(surchargeVal)}</strong>
        </div>
        <div
          style={{
            borderTop: "1px dashed rgba(255,255,255,0.25)",
            paddingTop: 5,
            marginTop: 4,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            fontWeight: 800,
          }}
        >
          <span>TỔNG THỰC THU:</span>
          <strong style={{ color: "#4ade80" }}>{formatVND(totalVal)}</strong>
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueTabPane({ onDrilldown, onExportCSV }) {
  return (
    <div className="tab-pane space-y-6">
      {/* Bento Grid: Chart & Settlement Status */}
      <div className="bento-grid">
        {/* Dynamic Architectural Revenue Curve Chart (8 Cols) */}
        <div className="bento-chart-card">
          <div className="bento-chart-header">
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  color: "var(--color-accent, #dc2626)",
                  letterSpacing: "0.08em",
                  marginBottom: 3,
                }}
              >
                [ AUDIT MATRIX // REVENUE RECONCILIATION ]
              </div>
              <div className="bento-title-cluster">
                <h2 className="bento-title">Biểu đồ đối soát doanh thu</h2>
                <span className="badge-audited">Đã kiểm toán</span>
              </div>
              <p className="bento-subtitle">
                Phân tích chi tiết tiền thuê cơ bản, tiền cọc ký quỹ và phụ thu phát sinh
              </p>
            </div>
            <div className="bento-legend">
              <div className="legend-item">
                <span className="legend-indicator legend-indicator--primary" style={{ backgroundColor: "#000000", borderRadius: 0 }} />
                <span>Tiền thuê kho</span>
              </div>
              <div className="legend-item">
                <span className="legend-indicator legend-indicator--deposit" style={{ backgroundColor: "#0284c7", borderRadius: 0 }} />
                <span>Tiền cọc (Ký quỹ)</span>
              </div>
              <div className="legend-item">
                <span className="legend-indicator legend-indicator--surcharge" style={{ backgroundColor: "#f59e0b", borderRadius: 0 }} />
                <span>Phụ thu</span>
              </div>
            </div>
          </div>

          {/* Precision Architectural Area Chart */}
          <div style={{ width: "100%", height: 260, paddingTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={AUDIT_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="swissRentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="var(--color-line, #d7d7d7)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-line-strong, #000000)", strokeWidth: 1 }}
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", fill: "var(--color-secondary, #555555)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-line-strong, #000000)", strokeWidth: 1 }}
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", fill: "var(--color-secondary, #555555)" }}
                  tickFormatter={(v) => (v === 0 ? "0 ₫" : `${(v / 1000000).toFixed(0)}M ₫`)}
                  domain={[0, 15000000]}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="linear"
                  dataKey="rent"
                  name="Tiền thuê kho"
                  stroke="#000000"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#swissRentGrad)"
                />
                <Area
                  type="linear"
                  dataKey="deposits"
                  name="Tiền cọc (Ký quỹ)"
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={0}
                />
                <Area
                  type="linear"
                  dataKey="surcharge"
                  name="Phụ thu"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Settlement Gateway & VAS Compliance (4 Cols) */}
        <div className="bento-side-column">
          <div className="side-card">
            <div className="side-card-header">
              <span className="side-card-title">Cổng thanh toán &amp; Đối soát</span>
              <span className="badge-sync">
                <span className="dot-pulse-green" /> Đã đồng bộ
              </span>
            </div>
            <div className="side-card-body">
              {/* Telemetry Segmented Bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", fontFamily: "var(--font-mono, monospace)", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>[ ROUTE: NAPAS / VIETQR ]</span>
                  <span style={{ color: "var(--color-status-success, #16a34a)", fontWeight: 700 }}>92.4% (34.60M ₫)</span>
                </div>
                <div
                  style={{
                    height: 14,
                    width: "100%",
                    background: "var(--color-surface-page, #f5f5f5)",
                    border: "var(--border-strong, 1px solid #000000)",
                    borderRadius: 0,
                    display: "flex",
                    overflow: "hidden",
                    padding: 1,
                  }}
                >
                  <div style={{ width: "92.4%", background: "#000000" }} title="VietQR 92.4%" />
                  <div style={{ width: "7.6%", background: "#0284c7" }} title="Direct Wire 7.6%" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontFamily: "var(--font-mono, monospace)", marginTop: 6, color: "var(--color-secondary, #555555)" }}>
                  <span>[ ROUTE: CHUYỂN KHOẢN ]</span>
                  <span>7.6% (2.85M ₫)</span>
                </div>
              </div>
            </div>
            <div className="side-card-footer">
              <span className="side-card-footer-label">Lần quét tự động gần nhất:</span>
              <span className="side-card-footer-val">23:59:58 UTC+7</span>
            </div>
          </div>

          <div className="side-card">
            <div className="side-card-header">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" weight="duotone" />
                <span className="side-card-title">Tuân thủ kiểm toán VN VAS</span>
              </div>
              <span className="compliance-badge">
                <CheckCircle size={13} weight="fill" /> 100% VAT
              </span>
            </div>
            <div className="side-card-body">
              <p className="side-card-desc">
                Toàn bộ hóa đơn điện tử được ký số VNPT-CA và đồng bộ trực tiếp lên hệ thống Tổng cục Thuế.
              </p>
            </div>
            <div className="side-card-footer-action">
              <button
                type="button"
                className="btn-cert-download"
                onClick={onExportCSV}
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Tải chứng thư kiểm toán (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Ledger Audit Table */}
      <div className="ledger-card">
        <div className="ledger-header">
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                color: "var(--color-accent, #dc2626)",
                letterSpacing: "0.08em",
                marginBottom: 3,
              }}
            >
              [ GENERAL LEDGER // AUDITED MONTHLY RECORDS ]
            </div>
            <h2 className="ledger-title">Sổ cái tổng hợp theo tháng (Monthly Ledger)</h2>
            <p className="ledger-subtitle">
              Đối soát tài chính từng tháng đã được chốt sổ kiểm toán
            </p>
          </div>
          <button
            type="button"
            className="btn-ledger-export"
            onClick={onExportCSV}
          >
            <DownloadSimple size={14} weight="bold" />
            <span>Xuất CSV</span>
          </button>
        </div>

        <div className="ledger-table-wrapper">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Tháng</th>
                <th>Tiền thuê</th>
                <th>Cọc giữ (Escrow)</th>
                <th>Phụ thu</th>
                <th>Tổng thực thu</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="ledger-month-cell">
                    <span className="ledger-month-name">Tháng 9/2026</span>
                    <span className="ledger-badge-closed">(Chốt sổ)</span>
                  </div>
                </td>
                <td className="font-mono">{formatVND(9860000)}</td>
                <td className="font-mono text-muted">{formatVND(1240000)}</td>
                <td className="font-mono">{formatVND(310000)}</td>
                <td className="font-mono font-bold text-success">{formatVND(11410000)}</td>
                <td>
                  <span className="badge-reconciled">Đã đối soát</span>
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    className="btn-ledger-detail"
                    onClick={() => onDrilldown?.("REVENUE")}
                  >
                    Xem chi tiết →
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="ledger-month-cell">
                    <span className="ledger-month-name">Tháng 8/2026</span>
                  </div>
                </td>
                <td className="font-mono">{formatVND(10450000)}</td>
                <td className="font-mono text-muted">{formatVND(1820000)}</td>
                <td className="font-mono">{formatVND(480000)}</td>
                <td className="font-mono font-bold text-success">{formatVND(12750000)}</td>
                <td>
                  <span className="badge-reconciled">Đã đối soát</span>
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    className="btn-ledger-detail"
                    onClick={() => onDrilldown?.("REVENUE")}
                  >
                    Xem chi tiết →
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="ledger-month-cell">
                    <span className="ledger-month-name">Tháng 7/2026</span>
                  </div>
                </td>
                <td className="font-mono">{formatVND(11010000)}</td>
                <td className="font-mono text-muted">{formatVND(1830000)}</td>
                <td className="font-mono">{formatVND(450000)}</td>
                <td className="font-mono font-bold text-success">{formatVND(13290000)}</td>
                <td>
                  <span className="badge-reconciled">Đã đối soát</span>
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    className="btn-ledger-detail"
                    onClick={() => onDrilldown?.("REVENUE")}
                  >
                    Xem chi tiết →
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="font-bold">Tổng cộng Q3 2026</td>
                <td className="font-mono font-bold">{formatVND(31320000)}</td>
                <td className="font-mono font-bold text-muted">{formatVND(4890000)}</td>
                <td className="font-mono font-bold">{formatVND(1240000)}</td>
                <td className="font-mono font-bold text-success">{formatVND(37450000)}</td>
                <td className="text-muted text-xs">Đã kiểm toán &amp; khóa sổ</td>
                <td className="text-right text-muted text-xs">3/3 tháng chốt</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
