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
          <span style={{ color: "#a3a3a3" }}>THUÊ KHO:</span>
          <strong>{formatVND(rentVal)}</strong>
        </div>
        {surchargeVal > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
            <span style={{ color: "#fbbf24" }}>PHỤ THU:</span>
            <strong>{formatVND(surchargeVal)}</strong>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 5 }}>
          <span style={{ color: "#38bdf8" }}>CỌC ESCROW:</span>
          <strong>{formatVND(depositsVal)}</strong>
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
            <span className="legend-color legend-color--primary" style={{ backgroundColor: "#000000", borderRadius: 0 }} />
            <span className="legend-text">Tiền thuê kho</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ width: 12, height: 12, backgroundColor: "#0284c7", borderRadius: 0 }} />
            <span className="legend-text">Tiền cọc ký quỹ (Escrow)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ width: 12, height: 12, backgroundColor: "#f59e0b", borderRadius: 0 }} />
            <span className="legend-text">Phụ thu</span>
          </div>
          <div className="legend-item">
            <span className="legend-line-dashed" style={{ borderTop: "2px dashed #dc2626" }} />
            <span className="legend-text" style={{ color: "#dc2626", fontWeight: 700 }}>Mục tiêu: 12.0M ₫</span>
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
              stroke="var(--color-accent, #dc2626)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: "Mục tiêu: 12.0M ₫",
                fill: "#dc2626",
                fontSize: 10,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
                position: "insideTopRight",
              }}
            />
            {/* StorageHub Canonical Palette: Pure Black, Industrial Blue, Warning Amber. Radius: 0 */}
            <Bar dataKey="rent" name="Tiền thuê kho" fill="#000000" radius={[0, 0, 0, 0]} maxBarSize={38} />
            <Bar dataKey="deposits" name="Tiền cọc giữ (Escrow)" fill="#0284c7" radius={[0, 0, 0, 0]} maxBarSize={38} />
            <Bar dataKey="surcharge" name="Phụ thu" fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={38} />
            <Legend
              wrapperStyle={{ paddingTop: 10, fontSize: "0.75rem", fontFamily: "var(--font-mono, monospace)" }}
              formatter={(val) => <span style={{ color: "var(--color-ink, #000000)", fontWeight: 700 }}>{val}</span>}
            />
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
