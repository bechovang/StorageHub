import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const CustomDonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const total = item.totalUnits || 16;
    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";

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
          minWidth: 180,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            paddingBottom: 5,
            marginBottom: 6,
            fontWeight: 700,
            fontSize: "0.8rem",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 0,
                backgroundColor: item.color,
                display: "inline-block",
              }}
            />
            {item.name}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ color: "#a3a3a3" }}>SỐ LƯỢNG:</span>
          <strong>{item.value} KHO</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#a3a3a3" }}>TỶ TRỌNG:</span>
          <strong style={{ color: "#ffffff" }}>{pct}%</strong>
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

  // Map to StorageHub canonical status colors (defined in tokens/constants)
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
    <div
      className="facility-donut-wrapper"
      style={{
        position: "relative",
        width: "100%",
        height: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={86}
            paddingAngle={1.5}
            dataKey="value"
            cursor="pointer"
            onClick={(entry) => onOpenDrilldown?.(entry.key)}
            isAnimationActive={true}
            animationDuration={600}
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.key}`}
                fill={entry.color}
                stroke="var(--color-surface, #ffffff)"
                strokeWidth={1.5}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomDonutTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Telemetry Readout (Swiss Typography) */}
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
            fontSize: "1.45rem",
            fontWeight: 800,
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--color-ink, #000000)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {occupancyPct}%
        </div>
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            fontFamily: "var(--font-display, sans-serif)",
            color: "var(--color-secondary, #555555)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginTop: 3,
          }}
        >
          LẤP ĐẦY
        </div>
        <div
          style={{
            fontSize: "0.64rem",
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--color-muted, #767676)",
            marginTop: 1,
          }}
        >
          {rented}/{total} KHO
        </div>
      </div>
    </div>
  );
}

export default FacilityStatusDonutChart;
