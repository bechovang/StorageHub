import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { formatVND } from "../../../utils/formatters.js";

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rentVal = payload.find((p) => p.dataKey === "rent")?.value || 0;
    const surchargeVal = payload.find((p) => p.dataKey === "surcharge")?.value || 0;
    const depositsVal = payload.find((p) => p.dataKey === "deposits")?.value || 0;
    const totalVal = rentVal + surchargeVal;

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
          {label}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 }}>
          <span style={{ color: "#818cf8" }}>Tiền thuê kho:</span>
          <strong>{formatVND(rentVal)}</strong>
        </div>
        {surchargeVal > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 }}>
            <span style={{ color: "#fbbf24" }}>Phụ thu:</span>
            <strong>{formatVND(surchargeVal)}</strong>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ color: "#38bdf8" }}>Tiền cọc giữ:</span>
          <strong>{formatVND(depositsVal)}</strong>
        </div>
        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.2)", paddingTop: 4, marginTop: 4, display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontWeight: 700 }}>Tổng doanh thu:</span>
          <strong style={{ color: "#4ade80" }}>{formatVND(totalVal)}</strong>
        </div>
      </div>
    );
  }
  return null;
};

export default function MonthlyRevenueChart({ monthlyData }) {
  const chartItems = Array.isArray(monthlyData) ? monthlyData : [];

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
            <span className="legend-color legend-color--primary" style={{ backgroundColor: "#4f46e5" }} />
            <span className="legend-text">Tiền thuê kho</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ width: 12, height: 12, backgroundColor: "#0284c7" }} />
            <span className="legend-text">Tiền cọc ký quỹ</span>
          </div>
          <div className="legend-item">
            <span className="legend-line-dashed" />
            <span className="legend-text text-muted">Mục tiêu: 12.000.000 ₫/tháng</span>
          </div>
        </div>
      </div>

      {/* Interactive Recharts Canvas */}
      <div className="biz-chart-body" style={{ width: "100%", height: 300, paddingTop: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartItems} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
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
            />
            <Tooltip content={<CustomBarTooltip />} />
            <ReferenceLine
              y={12000000}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{
                value: "MỤC TIÊU 12.0M ₫",
                fill: "#64748b",
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
            <Bar dataKey="rent" name="Tiền thuê kho" fill="#4f46e5" radius={[2, 2, 0, 0]} maxBarSize={45} />
            <Bar dataKey="deposits" name="Tiền cọc giữ" fill="#0284c7" radius={[2, 2, 0, 0]} maxBarSize={45} />
            <Bar dataKey="surcharge" name="Phụ thu" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={45} />
            <Legend
              wrapperStyle={{ paddingTop: 12, fontSize: "0.8rem" }}
              formatter={(val) => <span style={{ color: "var(--color-ink, #0f172a)", fontWeight: 600 }}>{val}</span>}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footnote" style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: "0.75rem", color: "var(--color-muted)" }}>
        <span>* Tháng 10 thể hiện số liệu hợp đồng thực tế đang chạy và dự kiến gia hạn.</span>
        <span className="font-mono">Đơn vị: Việt Nam Đồng (VND ₫)</span>
      </div>
    </section>
  );
}
