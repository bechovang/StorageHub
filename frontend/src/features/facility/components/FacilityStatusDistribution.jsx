import { Thermometer, Car, ChartPieSlice } from "@phosphor-icons/react";
import FacilityStatusDonutChart from "./FacilityStatusDonutChart.jsx";

export default function FacilityStatusDistribution({
  statusStats,
  statusConfigs,
  onOpenDrilldown,
}) {
  return (
    <section className="facility-status-panel">
      <div className="facility-status-panel__head">
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
            [ TELEMETRY // REAL-TIME DISPOSITION MATRIX ]
          </div>
          <h2 className="facility-status-panel__title">Phân bổ trạng thái kho</h2>
          <p className="facility-status-panel__desc">
            Tỷ lệ kho trống, đã cọc và đang thuê tại cơ sở. Bấm vào từng nhóm hoặc lát cắt biểu đồ để xem chi tiết.
          </p>
        </div>
        <div className="facility-status-panel__total">
          <span className="text-muted">Tổng quy mô depot:</span>
          <strong className="tag-total-units">{statusStats.TOTAL} kho vật lý</strong>
        </div>
      </div>

      {/* Stacked Proportional Bar (Swiss Grid Alignment) */}
      <div className="stacked-status-bar" role="meter" aria-label="Tỷ trọng trạng thái kho">
        <div
          className="status-segment status-segment--available"
          style={{ width: `${(statusStats.AVAILABLE / statusStats.TOTAL) * 100}%` }}
          title={`Trống: ${statusStats.AVAILABLE} kho`}
          onClick={() => onOpenDrilldown("AVAILABLE")}
        />
        <div
          className="status-segment status-segment--reserved"
          style={{ width: `${(statusStats.RESERVED / statusStats.TOTAL) * 100}%` }}
          title={`Đã đặt cọc: ${statusStats.RESERVED} kho`}
          onClick={() => onOpenDrilldown("RESERVED")}
        />
        <div
          className="status-segment status-segment--rented"
          style={{ width: `${(statusStats.RENTED / statusStats.TOTAL) * 100}%` }}
          title={`Đang thuê: ${statusStats.RENTED} kho`}
          onClick={() => onOpenDrilldown("RENTED")}
        />
        <div
          className="status-segment status-segment--preparing"
          style={{ width: `${(statusStats.PREPARING / statusStats.TOTAL) * 100}%` }}
          title={`Đang vệ sinh/bàn giao: ${statusStats.PREPARING} kho`}
          onClick={() => onOpenDrilldown("PREPARING")}
        />
        <div
          className="status-segment status-segment--maintenance"
          style={{ width: `${(statusStats.MAINTENANCE / statusStats.TOTAL) * 100}%` }}
          title={`Bảo trì: ${statusStats.MAINTENANCE} kho`}
          onClick={() => onOpenDrilldown("MAINTENANCE")}
        />
        <div
          className="status-segment status-segment--retired"
          style={{ width: `${(statusStats.RETIRED / statusStats.TOTAL) * 100}%` }}
          title={`Ngừng thuê: ${statusStats.RETIRED} kho`}
          onClick={() => onOpenDrilldown("RETIRED")}
        />
      </div>

      {/* Main Visual Section: Donut Chart on Left, Interactive Grid on Right */}
      <div
        className="facility-status-main-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "250px 1fr",
          gap: "20px",
          marginTop: "16px",
          alignItems: "stretch",
        }}
      >
        {/* Interactive Donut Chart Panel (Swiss Box) */}
        <div
          className="facility-status-donut-box"
          style={{
            background: "var(--color-surface, #ffffff)",
            border: "var(--border, 1px solid var(--color-line))",
            borderRadius: 0,
            padding: "14px 10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "0 6px 8px 6px",
              borderBottom: "1px solid var(--color-line, #d7d7d7)",
              fontSize: "0.72rem",
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
              color: "var(--color-ink, #000000)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <ChartPieSlice size={14} style={{ color: "var(--color-accent, #dc2626)" }} />
              TỶ TRỌNG KHO
            </span>
            <span style={{ color: "var(--color-muted, #767676)", fontSize: "0.65rem" }}>[DONUT]</span>
          </div>

          <FacilityStatusDonutChart
            statusStats={statusStats}
            statusConfigs={statusConfigs}
            onOpenDrilldown={onOpenDrilldown}
          />

          <div
            style={{
              width: "100%",
              borderTop: "1px dashed var(--color-line, #d7d7d7)",
              paddingTop: 6,
              fontSize: "0.68rem",
              fontFamily: "var(--font-mono, monospace)",
              color: "var(--color-secondary, #555555)",
              textAlign: "center",
            }}
          >
            NHẤP VÀO LÁT CẮT ĐỂ XEM CHI TIẾT
          </div>
        </div>

        {/* Status Legend Grid & Telemetry */}
        <div className="facility-status-right-col" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {/* Interactive Status Pills Row */}
          <div className="status-legend-grid" style={{ marginTop: 0, paddingTop: 0, borderTop: "none", gap: "10px" }}>
            {Object.keys(statusConfigs)
              .filter((k) => k !== "ALL")
              .map((key) => {
                const cfg = statusConfigs[key];
                const count = statusStats[key] || 0;
                const pct = ((count / statusStats.TOTAL) * 100).toFixed(1);

                return (
                  <button
                    key={key}
                    type="button"
                    className="status-pill-btn"
                    onClick={() => onOpenDrilldown(key)}
                  >
                    <div className="status-pill-btn__dot" style={{ backgroundColor: cfg.color }} />
                    <div className="status-pill-btn__info">
                      <span className="status-pill-btn__label">{cfg.label.split(" ")[0]}</span>
                      <span className="status-pill-btn__nums">
                        <strong>{count}</strong> ({pct}%)
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Zone Telemetry Sub-strip */}
          <div className="zone-telemetry-bar" style={{ marginTop: "12px" }}>
            <div className="zone-telemetry-item">
              <Thermometer size={16} className="text-primary" />
              <span className="font-medium text-ink">Khu điều hòa khí (Zone A & B):</span>
              <span className="text-success font-semibold">88% lấp đầy</span>
              <span className="text-muted">(7/8 kho đã thuê)</span>
            </div>
            <div className="zone-telemetry-item">
              <Car size={16} className="text-primary" />
              <span className="font-medium text-ink">Hành lang Locker (Zone C):</span>
              <span className="text-rented font-semibold">50% lấp đầy</span>
              <span className="text-muted">(2/4 locker hoạt động)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
