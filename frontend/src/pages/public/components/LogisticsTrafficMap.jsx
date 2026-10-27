import { memo } from "react";
import { motion } from "motion/react";
import { MapPin, NavigationArrow, ShieldCheck, Warehouse } from "@phosphor-icons/react";
import "./LogisticsTrafficMap.css";

const SOFT_EASE = [0.22, 1, 0.36, 1];

// Đường dẫn trục huyết mạch thực tế TP.HCM
// Tuyến 1: Sân bay Tân Sơn Nhất -> Hoàng Văn Thụ (Tân Bình Depot) -> Nam Kỳ Khởi Nghĩa -> Nguyễn Văn Linh (Quận 7 Hub)
const PATH_ARTERIAL_1 =
  "M 90 60 L 140 105 Q 185 140 230 175 T 310 245 Q 360 285 410 320";

// Tuyến 2: Trục Vành đai Tây / Cộng Hòa -> Lý Thường Kiệt -> Võ Văn Kiệt
const PATH_ARTERIAL_2 =
  "M 50 140 L 140 105 Q 170 190 220 235 T 330 310 L 410 320";

// Tuyến 3: Trục Phía Đông / Mai Chí Thọ -> Cầu Thủ Thiêm -> Nam Sài Gòn
const PATH_ARTERIAL_3 =
  "M 430 70 Q 360 130 320 190 T 310 245 T 410 320";

function LogisticsTrafficMap() {
  return (
    <motion.div
      className="logistics-map-card"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: SOFT_EASE, delay: 0.2 }}
      aria-label="Mô phỏng mạng lưới giao thông logistics StorageHub TP.HCM"
    >
      {/* HUD Header Bar */}
      <div className="logistics-map__hud-header">
        <div className="hud-header__left">
          <span className="hud-radar-dot" aria-hidden="true" />
          <span className="hud-title">MẠNG LƯỚI GIAO THÔNG LOGISTICS TP.HCM</span>
        </div>
        <div className="hud-header__right">
          <span className="hud-coords">10°49'N 106°39'E</span>
          <span className="hud-live-tag">REAL-TIME</span>
        </div>
      </div>

      {/* SVG Traffic Simulation Canvas */}
      <div className="logistics-map__canvas-wrapper">
        <svg
          viewBox="0 0 480 360"
          className="logistics-map__svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern
              id="trafficGrid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="0.6"
                strokeOpacity="0.45"
              />
            </pattern>

            {/* Glowing filter for vehicle nodes */}
            <filter id="glowAccent" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glowInk" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#trafficGrid)" />

          {/* Landmark Area Badges in Background */}
          <text x="60" y="42" className="svg-label-area">K/V SÂN BAY TÂN SƠN NHẤT</text>
          <text x="320" y="348" className="svg-label-area">K/V NAM SÀI GÒN - Q.7</text>

          {/* ── ARTERIAL ROADWAYS (ĐƯỜNG GIAO THÔNG MỜ MỜ) ── */}
          {/* Tuyến 3 (Tuyến phía Đông) */}
          <path
            d={PATH_ARTERIAL_3}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="3"
            strokeDasharray="4 3"
            className="road-line road-line--tertiary"
          />

          {/* Tuyến 2 (Trục Cộng Hòa - Võ Văn Kiệt) */}
          <path
            d={PATH_ARTERIAL_2}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="3.5"
            strokeOpacity="0.22"
            className="road-line road-line--secondary"
          />

          {/* Tuyến 1 (Trục Huyết Mạch Chính: Hoàng Văn Thụ - Nam Kỳ Khởi Nghĩa - Nguyễn Văn Linh) */}
          {/* Lớp viền ngoài đường */}
          <path
            d={PATH_ARTERIAL_1}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="7"
            strokeOpacity="0.12"
            strokeLinecap="round"
          />
          {/* Làn đường chính */}
          <path
            d={PATH_ARTERIAL_1}
            fill="none"
            stroke="var(--color-surface)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d={PATH_ARTERIAL_1}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="2.5"
            strokeOpacity="0.55"
            strokeLinecap="round"
          />
          <path
            d={PATH_ARTERIAL_1}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.2"
            strokeDasharray="6 4"
            strokeOpacity="0.8"
            className="road-pulse-stream"
          />

          {/* ── ROAD LABELS (TÊN TUYẾN ĐƯỜNG THỰC TẾ) ── */}
          <text x="105" y="80" className="svg-road-name" transform="rotate(35 105 80)">
            Đ. Hoàng Văn Thụ
          </text>
          <text x="215" y="160" className="svg-road-name" transform="rotate(38 215 160)">
            Đ. Nam Kỳ Khởi Nghĩa
          </text>
          <text x="325" y="270" className="svg-road-name" transform="rotate(35 325 270)">
            Đ. Nguyễn Văn Linh
          </text>

          {/* ── MOVING VEHICLE / PACKET NODES (CÁC NODE XE CỘ DI CHUYỂN) ── */}
          {/* Node 1: Xe tải chính (Màu đỏ chủ đạo - design token) */}
          <g filter="url(#glowAccent)">
            <circle r="4.5" fill="var(--color-accent)">
              <animateMotion
                path={PATH_ARTERIAL_1}
                dur="5.5s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
            {/* Vệt sáng đuôi (Trailing Node) */}
            <circle r="2.5" fill="var(--color-accent)" opacity="0.5">
              <animateMotion
                path={PATH_ARTERIAL_1}
                dur="5.5s"
                begin="0.12s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          </g>

          {/* Node 2: Xe luân chuyển kho số 2 (Đỏ - xuất phát so le) */}
          <g filter="url(#glowAccent)">
            <circle r="4" fill="var(--color-accent)">
              <animateMotion
                path={PATH_ARTERIAL_1}
                dur="5.5s"
                begin="2.7s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
            <circle r="2" fill="var(--color-accent)" opacity="0.45">
              <animateMotion
                path={PATH_ARTERIAL_1}
                dur="5.5s"
                begin="2.82s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          </g>

          {/* Node 3: Xe tải trung chuyển trên Tuyến 2 (Màu đen - design token ink) */}
          <g filter="url(#glowInk)">
            <circle r="4" fill="var(--color-ink)">
              <animateMotion
                path={PATH_ARTERIAL_2}
                dur="6.5s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
            <circle r="2" fill="var(--color-ink)" opacity="0.4">
              <animateMotion
                path={PATH_ARTERIAL_2}
                dur="6.5s"
                begin="0.15s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          </g>

          {/* Node 4: Xe hàng nhánh phía Đông (Tuyến 3) */}
          <circle r="3.5" fill="var(--color-secondary)">
            <animateMotion
              path={PATH_ARTERIAL_3}
              dur="7.5s"
              begin="1s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>

          {/* ── STATIONS & DEPOTS (CÁC TRẠM KHO & SÂN BAY) ── */}
          {/* 1. Sân bay Tân Sơn Nhất */}
          <g className="svg-hub-airport" transform="translate(90, 60)">
            <circle r="5" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
            <circle r="2" fill="var(--color-ink)" />
            <text x="10" y="4" className="svg-station-title">SÂN BAY TÂN SƠN NHẤT</text>
            <text x="10" y="14" className="svg-station-sub">Cửa ngõ vận tải hàng không</text>
          </g>

          {/* 2. Cơ sở Tân Bình (DEPOT-01 - Đang hoạt động) */}
          <g className="svg-hub-depot svg-hub-depot--active" transform="translate(140, 105)">
            {/* Pulsing Signal Ring */}
            <circle r="12" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" className="depot-pulse-ring" />
            {/* Square Station Box */}
            <rect
              x="-8"
              y="-8"
              width="16"
              height="16"
              fill="var(--color-surface)"
              stroke="var(--color-accent)"
              strokeWidth="2.5"
            />
            <rect x="-3" y="-3" width="6" height="6" fill="var(--color-accent)" />
            {/* Label Card */}
            <g transform="translate(14, -14)">
              <rect x="0" y="0" width="138" height="34" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="1.5" className="depot-tag-bg" />
              <text x="8" y="14" className="depot-tag-title">DEPOT-01: TÂN BÌNH</text>
              <text x="8" y="26" className="depot-tag-status">● 40 KHO KHẢ DỤNG · 24/7</text>
            </g>
          </g>

          {/* 3. Cơ sở Quận 7 (DEPOT-02 - Sắp khai trương) */}
          <g className="svg-hub-depot svg-hub-depot--upcoming" transform="translate(410, 320)">
            <circle r="10" fill="none" stroke="var(--color-status-warning)" strokeWidth="1.2" strokeDasharray="3 2" />
            <rect
              x="-7"
              y="-7"
              width="14"
              height="14"
              fill="var(--color-surface)"
              stroke="var(--color-line-strong)"
              strokeWidth="2"
            />
            <rect x="-2" y="-2" width="4" height="4" fill="var(--color-status-warning)" />
            {/* Label Card */}
            <g transform="translate(-144, -10)">
              <rect x="0" y="0" width="136" height="34" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="1.5" className="depot-tag-bg" />
              <text x="8" y="14" className="depot-tag-title">DEPOT-02: QUẬN 7</text>
              <text x="8" y="26" className="depot-tag-sub">▲ KHAI TRƯƠNG Q4/2026</text>
            </g>
          </g>
        </svg>
      </div>

      {/* HUD Telemetry Footer Bar */}
      <div className="logistics-map__hud-footer">
        <div className="telemetry-item">
          <span className="telemetry-label">TRỤC KẾT NỐI:</span>
          <span className="telemetry-value">TÂN BÌNH ⇄ QUẬN 7</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">THỜI GIAN LƯU THÔNG:</span>
          <span className="telemetry-value highlight-red">~18 PHÚT XE TẢI</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">TRẠNG THÁI:</span>
          <span className="telemetry-value">THÔNG SUỐT 24/7</span>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(LogisticsTrafficMap);
