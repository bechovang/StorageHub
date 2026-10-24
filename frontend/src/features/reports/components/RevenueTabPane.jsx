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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatVND } from "../../../utils/formatters.js";

const AUDIT_DATA = [
  { month: "Tháng 7/2026", rent: 11010000, deposits: 1830000, surcharge: 450000, total: 13290000 },
  { month: "Tháng 8/2026", rent: 10450000, deposits: 1820000, surcharge: 480000, total: 12750000 },
  { month: "Tháng 9/2026", rent: 9860000, deposits: 1240000, surcharge: 310000, total: 11410000 },
];

const GATEWAY_DATA = [
  { name: "VietQR / NAPAS", value: 92.4, amount: 34600000, color: "#059669" },
  { name: "Chuyển khoản trực tiếp", value: 7.6, amount: 2850000, color: "#0284c7" },
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
          background: "var(--color-ink, #0f172a)",
          color: "#ffffff",
          padding: "10px 14px",
          border: "1px solid rgba(255,255,255,0.2)",
          fontSize: "0.82rem",
          boxShadow: "2px 2px 0px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 4, marginBottom: 6 }}>
          {label} (Đã chốt sổ)
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 }}>
          <span style={{ color: "#f87171" }}>Tiền thuê kho:</span>
          <strong>{formatVND(rentVal)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 }}>
          <span style={{ color: "#38bdf8" }}>Tiền cọc giữ:</span>
          <strong>{formatVND(depositsVal)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ color: "#fbbf24" }}>Phụ thu:</span>
          <strong>{formatVND(surchargeVal)}</strong>
        </div>
        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.2)", paddingTop: 4, marginTop: 4, display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontWeight: 700 }}>Tổng tiền qua sổ cái:</span>
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
        {/* Dynamic Recharts Revenue Curve Chart (8 Cols) */}
        <div className="bento-chart-card">
          <div className="bento-chart-header">
            <div>
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
                <span className="legend-indicator legend-indicator--primary" />
                <span>Tiền thuê kho</span>
              </div>
              <div className="legend-item">
                <span className="legend-indicator legend-indicator--deposit" />
                <span>Tiền cọc (Ký quỹ)</span>
              </div>
              <div className="legend-item">
                <span className="legend-indicator legend-indicator--surcharge" />
                <span>Phụ thu</span>
              </div>
            </div>
          </div>

          {/* Interactive Responsive Area Chart */}
          <div style={{ width: "100%", height: 260, paddingTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={AUDIT_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line, #e2e8f0)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-line-strong, #cbd5e1)" }}
                  tick={{ fontSize: 12, fill: "var(--color-secondary, #64748b)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-line-strong, #cbd5e1)" }}
                  tick={{ fontSize: 11, fill: "var(--color-secondary, #64748b)" }}
                  tickFormatter={(v) => (v === 0 ? "0 ₫" : `${(v / 1000000).toFixed(0)}M ₫`)}
                  domain={[0, 15000000]}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rent"
                  name="Tiền thuê kho"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#rentGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="deposits"
                  name="Tiền cọc (Ký quỹ)"
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#depositGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="surcharge"
                  name="Phụ thu"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Settlement Gateway & VAS Compliance (4 Cols) */}
        <div className="bento-side-column">
          <div className="side-card">
            <div className="side-card-header">
              <span className="side-card-title">Cổng thanh toán & Đối soát</span>
              <span className="badge-sync">
                <span className="dot-pulse-green" /> Đã đồng bộ
              </span>
            </div>
            <div className="side-card-body">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ width: 68, height: 68, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={GATEWAY_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={32}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {GATEWAY_DATA.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="side-metric-row">
                    <span className="side-metric-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, backgroundColor: "#059669", display: "inline-block" }} />
                      VietQR / NAPAS
                    </span>
                    <span className="side-metric-val">92.4% (34.60M ₫)</span>
                  </div>
                  <div className="side-metric-row side-metric-row--sub" style={{ marginTop: 4 }}>
                    <span className="side-metric-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, backgroundColor: "#0284c7", display: "inline-block" }} />
                      Chuyển khoản
                    </span>
                    <span className="side-metric-val">7.6% (2.85M ₫)</span>
                  </div>
                </div>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: "92.4%" }} />
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
                <td className="text-muted text-xs">Đã kiểm toán & khóa sổ</td>
                <td className="text-right text-muted text-xs">3/3 tháng chốt</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
