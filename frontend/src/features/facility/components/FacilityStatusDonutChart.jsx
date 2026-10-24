import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const CustomDonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const total = item.totalUnits || 16;
    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
    return (
      <div
        style={{
          background: "var(--color-ink, #0f172a)",
          color: "#ffffff",
          padding: "8px 12px",
          fontSize: "0.8rem",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "2px 2px 0px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: item.color,
              display: "inline-block",
            }}
          />
          <span>{item.name}</span>
        </div>
        <div style={{ marginTop: 4, color: "#94a3b8" }}>
          Số lượng: <strong style={{ color: "#ffffff" }}>{item.value} kho</strong> ({pct}%)
        </div>
        <div style={{ marginTop: 2, fontSize: "0.72rem", color: "#38bdf8" }}>
          Nhấp để xem danh sách chi tiết →
        </div>
      </div>
    );
  }
  return null;
};

export function FacilityStatusDonutChart({ statusStats, statusConfigs, onOpenDrilldown }) {
  const total = Number(statusStats?.TOTAL) || 16;
  const rented = Number(statusStats?.RENTED) || 0;
  const occupancyPct = total > 0 ? ((rented / total) * 100).toFixed(1) : "0.0";

  const data = Object.keys(statusConfigs || {})
    .filter((key) => key !== "ALL")
    .map((key) => {
      const cfg = statusConfigs[key];
      const count = Number(statusStats?.[key]) || 0;
      return {
        key,
        name: cfg.label,
        value: count,
        color: cfg.color,
        totalUnits: total,
      };
    })
    .filter((item) => item.value > 0);

  return (
    <div className="facility-donut-wrapper" style={{ position: "relative", width: "100%", height: 230 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            cursor="pointer"
            onClick={(entry) => onOpenDrilldown?.(entry.key)}
            isAnimationActive={true}
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.key}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomDonutTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label (Occupancy Metric) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            fontSize: "1.35rem",
            fontWeight: 800,
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--color-ink, #0f172a)",
            lineHeight: 1.1,
          }}
        >
          {occupancyPct}%
        </div>
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "var(--color-secondary, #64748b)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Lấp đầy
        </div>
      </div>
    </div>
  );
}

export default FacilityStatusDonutChart;
