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
    const totalOperating = rentVal + surchargeVal;

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
          minWidth: 210,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            paddingBottom: 5,
            marginBottom: 6,
            fontSize: "0.8rem",
          }}
        >
          <span>{label}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: "#dc2626" }}>TIỀN THUÊ KHO:</span>
          <strong>{formatVND(rentVal)}</strong>
        </div>
        {surchargeVal > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
            <span style={{ color: "#f87171" }}>PHỤ THU:</span>
            <strong>{formatVND(surchargeVal)}</strong>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 5 }}>
          <span style={{ color: "#fca5a5" }}>CỌC ESCROW (NỢ):</span>
          <strong style={{ color: "#a3a3a3" }}>{formatVND(depositsVal)}</strong>
        </div>
        <div
          style={{
            borderTop: "1px dashed rgba(255,255,255,0.25)",
            paddingTop: 5,
            marginTop: 4,
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 800,
          }}
        >
          <span>TỔNG DOANH THU:</span>
          <strong style={{ color: "#ffffff" }}>{formatVND(totalOperating)}</strong>
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
            Cơ cấu Doanh thu thực thu (Tiền thuê + Phụ thu) và Quỹ cọc ký quỹ Escrow (6 tháng gần nhất)
          </p>
        </div>
        <div className="biz-chart-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ width: 12, height: 12, backgroundColor: "#dc2626", borderRadius: 0 }} />
            <span className="legend-text">Tiền thuê kho</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ width: 12, height: 12, backgroundColor: "#f87171", borderRadius: 0 }} />
            <span className="legend-text">Phụ thu</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ width: 12, height: 12, backgroundColor: "#450a0a", borderRadius: 0 }} />
            <span className="legend-text">Cọc giữ (Escrow)</span>
          </div>
          <div className="legend-item">
            <span className="legend-line-dashed" style={{ borderTop: "2px dashed #000000" }} />
            <span className="legend-text" style={{ color: "#000000", fontWeight: 700 }}>Mục tiêu: 12.0M ₫</span>
          </div>
        </div>
      </div>

      {/* Industrial Recharts Canvas */}
      <div className="biz-chart-body" style={{ width: "100%", height: 280, paddingTop: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartItems} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
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
            />
            <Tooltip content={<CustomBarTooltip />} />
            <ReferenceLine
              y={12000000}
              stroke="#000000"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: "Mục tiêu: 12.0M ₫",
                fill: "#000000",
                fontSize: 10,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                position: "insideTopRight",
              }}
            />
            {/* Stacked Operating Revenue (Rent + Surcharge) + Distinct Escrow Bar */}
            <Bar dataKey="rent" name="Tiền thuê kho" stackId="revenue" fill="#dc2626" radius={[0, 0, 0, 0]} maxBarSize={36} />
            <Bar dataKey="surcharge" name="Phụ thu" stackId="revenue" fill="#f87171" radius={[0, 0, 0, 0]} maxBarSize={36} />
            <Bar dataKey="deposits" name="Tiền cọc giữ (Escrow)" fill="#450a0a" radius={[0, 0, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className="chart-footnote"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 14,
          paddingTop: 10,
          borderTop: "1px dashed var(--color-line, #d7d7d7)",
          fontSize: "0.72rem",
          fontFamily: "var(--font-mono, monospace)",
          color: "var(--color-muted, #767676)",
        }}
      >
        <span>* Tháng 10 thể hiện số liệu hợp đồng đang chạy và dự kiến gia hạn.</span>
        <span>Đơn vị tính: VNĐ</span>
      </div>
    </section>
  );
}
