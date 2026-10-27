import { memo } from "react";
import { motion } from "motion/react";
import "./LogisticsTrafficMap.css";

const SOFT_EASE = [0.22, 1, 0.36, 1];

// Tuyến đường trục 1: Đường cong huyết mạch xuyên tâm
const PATH_ARTERIAL_1 =
  "M 60 50 L 130 95 Q 185 135 240 175 T 320 250 Q 375 290 420 310";

// Tuyến đường trục 2: Vành đai Tây - Nam
const PATH_ARTERIAL_2 =
  "M 40 130 L 130 95 Q 165 190 220 240 T 340 305 L 420 310";

// Tuyến đường trục 3: Nhánh Vành đai Đông kết nối
const PATH_ARTERIAL_3 =
  "M 420 60 Q 350 120 310 180 T 320 250 T 420 310";

// Tuyến đường nhánh 4: Tuyến nội bộ kết nối ngang
const PATH_ARTERIAL_4 =
  "M 130 95 Q 260 80 350 120 T 420 200";

function LogisticsTrafficMap() {
  return (
    <motion.div
      className="logistics-map-card"
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: SOFT_EASE, delay: 0.15 }}
      aria-label="Mô phỏng mạng lưới giao thông logistics"
    >
      {/* Top Technical Status Ribbon (Không chứa chữ địa điểm) */}
      <div className="logistics-map__top-bar">
        <div className="top-bar__left">
          <span className="top-bar__radar-dot" aria-hidden="true" />
          <span className="top-bar__radar-pulse" aria-hidden="true" />
          <span className="top-bar__tech-id">SYS // 01</span>
        </div>
        <div className="top-bar__center">
          <span className="top-bar__wave-bar" />
          <span className="top-bar__wave-bar" />
          <span className="top-bar__wave-bar" />
          <span className="top-bar__wave-bar" />
        </div>
        <div className="top-bar__right">
          <span className="top-bar__corner-cross">+</span>
        </div>
      </div>

      {/* SVG Traffic Schematic Canvas */}
      <div className="logistics-map__canvas-wrapper">
        <svg
          viewBox="0 0 480 340"
          className="logistics-map__svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern
              id="heroTrafficGrid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="0.6"
                strokeOpacity="0.4"
              />
            </pattern>

            {/* Glowing filter for vehicle nodes */}
            <filter id="glowAccent" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glowInk" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#heroTrafficGrid)" />

          {/* ── ARTERIAL ROADWAYS (CÁC ĐƯỜNG GIAO THÔNG MỜ MỜ) ── */}
          {/* Tuyến 4: Tuyến phụ nối ngang */}
          <path
            d={PATH_ARTERIAL_4}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="2.5"
            strokeDasharray="3 3"
            strokeOpacity="0.5"
          />

          {/* Tuyến 3: Trục phía Đông */}
          <path
            d={PATH_ARTERIAL_3}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="3.5"
            strokeDasharray="5 3"
            strokeOpacity="0.6"
          />

          {/* Tuyến 2: Trục Tây - Nam */}
          <path
            d={PATH_ARTERIAL_2}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="4"
            strokeOpacity="0.18"
            strokeLinecap="round"
          />
          <path
            d={PATH_ARTERIAL_2}
            fill="none"
            stroke="var(--color-surface)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={PATH_ARTERIAL_2}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />

          {/* Tuyến 1: Trục Huyết Mạch Chính */}
          {/* Casing viền đường ngoài */}
          <path
            d={PATH_ARTERIAL_1}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="8"
            strokeOpacity="0.12"
            strokeLinecap="round"
          />
          {/* Mặt đường chính */}
          <path
            d={PATH_ARTERIAL_1}
            fill="none"
            stroke="var(--color-surface)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d={PATH_ARTERIAL_1}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="2.5"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />
          {/* Dải phân cách phát xung pulse */}
          <path
            d={PATH_ARTERIAL_1}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.2"
            strokeDasharray="6 4"
            strokeOpacity="0.85"
            className="road-pulse-stream"
          />

          {/* ── GEOMETRIC INTERCHANGE NODES (ĐIỂM NÚT GIAO NGHỆ THUẬT - 0 CHỮ) ── */}
          {/* Nút giao 1 (Góc trên trái) */}
          <g transform="translate(60, 50)">
            <circle r="6" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="1.5" />
            <circle r="2.5" fill="var(--color-ink)" />
          </g>

          {/* Nút giao Depot trung tâm (Giao lộ Tuyến 1, 2, 4) */}
          <g transform="translate(130, 95)">
            <circle r="14" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" className="depot-pulse-ring" />
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
          </g>

          {/* Nút giao trung chuyển giữa */}
          <g transform="translate(240, 175)">
            <circle r="7" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="1.5" />
            <circle r="2.5" fill="var(--color-accent)" />
          </g>

          {/* Nút giao Tuyến 3 & 4 */}
          <g transform="translate(350, 120)">
            <circle r="5" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="1.5" />
            <circle r="2" fill="var(--color-ink)" />
          </g>

          {/* Nút giao Depot phía Nam */}
          <g transform="translate(420, 310)">
            <circle r="12" fill="none" stroke="var(--color-ink)" strokeWidth="1.2" strokeDasharray="3 2" />
            <rect
              x="-7"
              y="-7"
              width="14"
              height="14"
              fill="var(--color-surface)"
              stroke="var(--color-line-strong)"
              strokeWidth="2"
            />
            <rect x="-2.5" y="-2.5" width="5" height="5" fill="var(--color-ink)" />
          </g>

          {/* ── CÁC NODE XE CỘ DI CHUYỂN (VEHICLE PACKETS) ── */}
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
            {/* Đuôi sáng theo sau */}
            <circle r="2.5" fill="var(--color-accent)" opacity="0.45">
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
            <circle r="2" fill="var(--color-accent)" opacity="0.4">
              <animateMotion
                path={PATH_ARTERIAL_1}
                dur="5.5s"
                begin="2.82s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          </g>

          {/* Node 3: Xe tải trung chuyển Tuyến 2 (Màu đen ink) */}
          <g filter="url(#glowInk)">
            <circle r="4" fill="var(--color-ink)">
              <animateMotion
                path={PATH_ARTERIAL_2}
                dur="6.5s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
            <circle r="2" fill="var(--color-ink)" opacity="0.35">
              <animateMotion
                path={PATH_ARTERIAL_2}
                dur="6.5s"
                begin="0.15s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          </g>

          {/* Node 4: Xe tải Tuyến 2 (Màu đen ink - so le) */}
          <g filter="url(#glowInk)">
            <circle r="3.5" fill="var(--color-ink)">
              <animateMotion
                path={PATH_ARTERIAL_2}
                dur="6.5s"
                begin="3.2s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          </g>

          {/* Node 5: Xe hàng Tuyến 3 (Phía Đông) */}
          <circle r="3.5" fill="var(--color-accent)">
            <animateMotion
              path={PATH_ARTERIAL_3}
              dur="7.5s"
              begin="1s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>

          {/* Node 6: Xe trung chuyển Tuyến 4 (Ngang) */}
          <circle r="3" fill="var(--color-secondary)">
            <animateMotion
              path={PATH_ARTERIAL_4}
              dur="6s"
              begin="0.8s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </svg>
      </div>

      {/* Bottom Technical Frame Bar (Không chữ địa điểm) */}
      <div className="logistics-map__bottom-bar">
        <div className="bottom-bar__indicator">
          <span className="indicator-label">STATUS</span>
          <span className="indicator-live-tag">REAL-TIME</span>
        </div>
        <div className="bottom-bar__tracks">
          <span className="track-pill track-pill--active" />
          <span className="track-pill track-pill--active" />
          <span className="track-pill" />
        </div>
        <div className="bottom-bar__corner-cross">+</div>
      </div>
    </motion.div>
  );
}

export default memo(LogisticsTrafficMap);
