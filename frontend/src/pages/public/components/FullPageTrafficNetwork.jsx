import { memo, useState, useEffect, useRef } from "react";
import "./FullPageTrafficNetwork.css";

function FullPageTrafficNetwork() {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1440, height: 4800 });

  useEffect(() => {
    const target = containerRef.current?.parentElement;
    if (!target) return;

    const updateSize = () => {
      const rect = target.getBoundingClientRect();
      const scrollHeight = target.scrollHeight || rect.height;
      setDimensions({
        width: Math.max(rect.width, 360),
        height: Math.max(scrollHeight, 2400),
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(target);
    window.addEventListener("resize", updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const { width: w, height: h } = dimensions;

  // ── 1. Tuyến Vành Đai Đông (Hành Lang Đại Lộ Phía Đông: Mai Chí Thọ - Xa Lộ) ──
  const pathEast = `M ${w * 0.84} 80 Q ${w * 0.94} ${h * 0.12} ${w * 0.88} ${h * 0.22} T ${w * 0.93} ${h * 0.38} Q ${w * 0.85} ${h * 0.50} ${w * 0.91} ${h * 0.62} T ${w * 0.87} ${h * 0.76} Q ${w * 0.94} ${h * 0.88} ${w * 0.78} ${h - 100}`;

  // ── 2. Tuyến Vành Đai Tây (Hành Lang Vành Đai Tây: Cộng Hòa - Lý Thường Kiệt - Q6) ──
  const pathWest = `M ${w * 0.14} 100 Q ${w * 0.05} ${h * 0.15} ${w * 0.10} ${h * 0.27} T ${w * 0.07} ${h * 0.44} Q ${w * 0.15} ${h * 0.59} ${w * 0.08} ${h * 0.74} T ${w * 0.16} ${h - 140}`;

  // ── 3. Tuyến Xuyên Tâm Huyết Mạch (Trường Sơn -> NKKN -> CMTT -> Nam Sài Gòn) ──
  const pathTransversal = `M ${w * 0.72} 180 Q ${w * 0.52} ${h * 0.14} ${w * 0.36} ${h * 0.22} T ${w * 0.22} ${h * 0.34} Q ${w * 0.62} ${h * 0.48} ${w * 0.68} ${h * 0.54} T ${w * 0.35} ${h * 0.68} Q ${w * 0.76} ${h * 0.81} ${w * 0.50} ${h - 120}`;

  // ── 4. Kênh Nhiêu Lộc - Thị Nghè (Dòng Thủy Lưu Uốn Lượn Tự Nhiên Đoạn Trên) ──
  const pathKenhNhieuLoc = `M ${w * 0.04} ${h * 0.12} Q ${w * 0.25} ${h * 0.08} ${w * 0.48} ${h * 0.13} T ${w * 0.78} ${h * 0.09} Q ${w * 0.92} ${h * 0.14} ${w * 0.98} ${h * 0.18}`;

  // ── 5. Kênh Tàu Hủ - Đại Lộ Võ Văn Kiệt (Dòng Kênh Uốn Lượn Đoạn Giữa) ──
  const pathKenhTauHu = `M ${w * 0.06} ${h * 0.62} Q ${w * 0.35} ${h * 0.58} ${w * 0.62} ${h * 0.64} T ${w * 0.95} ${h * 0.61}`;

  // ── 6. Sông Sài Gòn (Đường Cong Khổng Lồ Ôm Bờ Đông) ──
  const pathSongSaiGon = `M ${w * 0.88} -20 C ${w * 0.96} ${h * 0.10} ${w * 0.82} ${h * 0.25} ${w * 0.95} ${h * 0.40} C ${w * 0.85} ${h * 0.55} ${w * 0.98} ${h * 0.70} ${w * 0.89} ${h * 0.85} T ${w * 0.92} ${h + 50}`;

  // ── 7. Tuyến Vành Đai Nối Ngang Giữa ──
  const pathMidRing = `M ${w * 0.08} ${h * 0.38} Q ${w * 0.50} ${h * 0.35} ${w * 0.92} ${h * 0.40}`;

  // ── 8. Đại Lộ Nguyễn Văn Linh (Trục Nam Sài Gòn Phía Dưới) ──
  const pathNguyenVanLinh = `M ${w * 0.05} ${h * 0.88} Q ${w * 0.45} ${h * 0.89} ${w * 0.95} ${h * 0.87}`;

  return (
    <div
      ref={containerRef}
      className="full-page-traffic"
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="full-page-traffic__svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Ambient Micro Dot Matrix */}
          <pattern
            id="ambientUrbanGrid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="0.8" fill="var(--color-line)" opacity="0.45" />
          </pattern>

          {/* Glow filter for accent nodes */}
          <filter id="videoGlowAccent" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Glow filter for ink nodes */}
          <filter id="videoGlowInk" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── BASE BACKGROUND: AMBIENT DOT GRID ── */}
        <rect width="100%" height="100%" fill="url(#ambientUrbanGrid)" />

        {/* ── LAYER 0: WATERWAYS & CANALS (KÊNH RẠCH TỰ NHIÊN TP.HCM) ── */}
        {/* Sông Sài Gòn (Dải uốn lượn bờ Đông) */}
        <path
          d={pathSongSaiGon}
          fill="none"
          stroke="var(--color-neutral)"
          strokeWidth="32"
          opacity="0.75"
          strokeLinecap="round"
        />
        <path
          d={pathSongSaiGon}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="10"
          opacity="0.35"
          strokeLinecap="round"
        />

        {/* Kênh Nhiêu Lộc - Thị Nghè (Đoạn trên) */}
        <path
          d={pathKenhNhieuLoc}
          fill="none"
          stroke="var(--color-neutral)"
          strokeWidth="20"
          opacity="0.8"
          strokeLinecap="round"
        />
        <path
          d={pathKenhNhieuLoc}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="6"
          opacity="0.4"
          strokeLinecap="round"
        />

        {/* Kênh Tàu Hủ - Bến Nghé (Đoạn giữa) */}
        <path
          d={pathKenhTauHu}
          fill="none"
          stroke="var(--color-neutral)"
          strokeWidth="18"
          opacity="0.8"
          strokeLinecap="round"
        />
        <path
          d={pathKenhTauHu}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="5"
          opacity="0.35"
          strokeLinecap="round"
        />

        {/* ── LAYER 1: MẠNG LƯỚI HẺM XƯƠNG CÁ & Ô CỜ ĐẶC TRƯNG VIỆT NAM (DÀY ĐẶC DỌC TRANG) ── */}
        <g stroke="var(--color-line)" strokeWidth="0.8" opacity="0.45" fill="none">
          {/* Mạng hẻm xương cá hành lang Tây (14 cụm xương cá đan dọc mép trái) */}
          {[0.06, 0.11, 0.16, 0.22, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.70, 0.77, 0.84, 0.91].map((f, i) => (
            <g key={`alley-w-${i}`}>
              <line x1={w * 0.09} y1={h * f} x2={w * 0.03} y2={h * f + 16} />
              <line x1={w * 0.09} y1={h * f + 12} x2={w * 0.04} y2={h * f + 28} />
              <line x1={w * 0.09} y1={h * f + 24} x2={w * 0.03} y2={h * f + 40} />
              <line x1={w * 0.11} y1={h * f + 6} x2={w * 0.16} y2={h * f + 22} />
              <line x1={w * 0.11} y1={h * f + 18} x2={w * 0.15} y2={h * f + 34} />
            </g>
          ))}

          {/* Mạng hẻm xương cá hành lang Đông (14 cụm xương cá đan dọc mép phải) */}
          {[0.05, 0.10, 0.15, 0.21, 0.27, 0.34, 0.41, 0.48, 0.55, 0.62, 0.69, 0.76, 0.83, 0.90].map((f, i) => (
            <g key={`alley-e-${i}`}>
              <line x1={w * 0.89} y1={h * f} x2={w * 0.96} y2={h * f + 18} />
              <line x1={w * 0.89} y1={h * f + 12} x2={w * 0.95} y2={h * f + 30} />
              <line x1={w * 0.89} y1={h * f + 24} x2={w * 0.96} y2={h * f + 42} />
              <line x1={w * 0.87} y1={h * f + 8} x2={w * 0.82} y2={h * f + 24} />
              <line x1={w * 0.87} y1={h * f + 20} x2={w * 0.83} y2={h * f + 36} />
            </g>
          ))}

          {/* Khối ô cờ Bàn Cờ Quận 3 (Giữa Hero và Storage Sizes) */}
          {[0, 1, 2, 3, 4].map((idx) => (
            <line
              key={`grid-hero-h-${idx}`}
              x1={w * 0.58}
              y1={h * 0.06 + idx * 16}
              x2={w * 0.82}
              y2={h * 0.06 + idx * 16}
            />
          ))}
          {[0, 1, 2, 3, 4, 5].map((jdx) => (
            <line
              key={`grid-hero-v-${jdx}`}
              x1={w * 0.58 + jdx * 38}
              y1={h * 0.06}
              x2={w * 0.58 + jdx * 38}
              y2={h * 0.06 + 64}
            />
          ))}

          {/* Khối ô cờ Bàn Cờ (Giữa Sizes và Pillars) */}
          {[0, 1, 2, 3].map((idx) => (
            <line
              key={`grid-sizes-h-${idx}`}
              x1={w * 0.12}
              y1={h * 0.32 + idx * 14}
              x2={w * 0.32}
              y2={h * 0.32 + idx * 14}
            />
          ))}
          {[0, 1, 2, 3, 4].map((jdx) => (
            <line
              key={`grid-sizes-v-${jdx}`}
              x1={w * 0.12 + jdx * 36}
              y1={h * 0.32}
              x2={w * 0.12 + jdx * 36}
              y2={h * 0.32 + 42}
            />
          ))}

          {/* Khối ô cờ Bàn Cờ (Giữa Steps và Facilities) */}
          {[0, 1, 2, 3].map((idx) => (
            <line
              key={`grid-steps-h-${idx}`}
              x1={w * 0.68}
              y1={h * 0.65 + idx * 14}
              x2={w * 0.88}
              y2={h * 0.65 + idx * 14}
            />
          ))}
          {[0, 1, 2, 3, 4].map((jdx) => (
            <line
              key={`grid-steps-v-${jdx}`}
              x1={w * 0.68 + jdx * 36}
              y1={h * 0.65}
              x2={w * 0.68 + jdx * 36}
              y2={h * 0.65 + 42}
            />
          ))}
        </g>

        {/* ── LAYER 2: ĐẠI LỘ PHỤ & TUYẾN KẾT NỐI ── */}
        <path
          d={pathMidRing}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2.2"
          strokeDasharray="5 5"
          strokeOpacity="0.45"
        />

        <path
          d={pathNguyenVanLinh}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="4"
          strokeOpacity="0.10"
        />
        <path
          d={pathNguyenVanLinh}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="1.8"
          strokeOpacity="0.5"
          strokeDasharray="6 4"
        />

        {/* Tuyến Vành Đai Tây */}
        <path
          d={pathWest}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="6"
          strokeOpacity="0.10"
          strokeLinecap="round"
        />
        <path
          d={pathWest}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2.5"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />
        <path
          d={pathWest}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1"
          strokeDasharray="6 6"
          strokeOpacity="0.45"
        />

        {/* Tuyến Vành Đai Đông */}
        <path
          d={pathEast}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="6.5"
          strokeOpacity="0.11"
          strokeLinecap="round"
        />
        <path
          d={pathEast}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2.5"
          strokeOpacity="0.55"
          strokeLinecap="round"
        />
        <path
          d={pathEast}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.2"
          strokeDasharray="8 6"
          strokeOpacity="0.5"
        />

        {/* ── LAYER 3: TRỤC ĐẠI LỘ HUYẾT MẠCH XUYÊN TÂM CHÍNH ── */}
        {/* Casing đường ngoài */}
        <path
          d={pathTransversal}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="8"
          strokeOpacity="0.12"
          strokeLinecap="round"
        />
        {/* Lòng đường */}
        <path
          d={pathTransversal}
          fill="none"
          stroke="var(--color-surface)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        <path
          d={pathTransversal}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="2.4"
          strokeOpacity="0.45"
          strokeLinecap="round"
        />
        {/* Vạch tim đường xung nhịp phân luồng (Pulse Stream) */}
        <path
          d={pathTransversal}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.2"
          strokeDasharray="6 4"
          strokeOpacity="0.8"
          className="traffic-flow-dash"
        />

        {/* ── LAYER 4: CÁC NÚT GIAO VÒNG XOAY / BÙNG BINH ĐẶC TRƯNG VIỆT NAM (0 CHỮ ĐỊA DANH) ── */}
        {/* 1. Bùng binh Lăng Cha Cả (Hero area) */}
        <g transform={`translate(${w * 0.72}, 180)`}>
          <circle r="22" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" className="page-hub-pulse" />
          <circle r="12" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.4" />
          <circle r="4.5" fill="var(--color-accent)" />
        </g>

        {/* 2. Ngã 6 Dân Chủ (Sizes - Pillars) */}
        <g transform={`translate(${w * 0.10}, ${h * 0.27})`}>
          <circle r="16" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.6" />
          <circle r="9" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
          <rect x="-3" y="-3" width="6" height="6" fill="var(--color-ink)" />
        </g>

        {/* 3. Vòng xoay Bến Thành / Lõi Q1 (Pillars - Steps) */}
        <g transform={`translate(${w * 0.68}, ${h * 0.54})`}>
          <circle r="24" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" className="page-hub-pulse" />
          <circle r="13" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.4" />
          <circle r="5" fill="var(--color-accent)" />
        </g>

        {/* 4. Ngã 7 Lý Thái Tổ (Steps - Facilities) */}
        <g transform={`translate(${w * 0.35}, ${h * 0.68})`}>
          <circle r="18" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.7" />
          <circle r="10" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
          <circle r="3.5" fill="var(--color-ink)" />
        </g>

        {/* 5. Vòng xoay Hàng Xanh / Cầu Sài Gòn (Facilities - FAQ) */}
        <g transform={`translate(${w * 0.87}, ${h * 0.76})`}>
          <circle r="16" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.6" />
          <circle r="9" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
          <rect x="-2.5" y="-2.5" width="5" height="5" fill="var(--color-ink)" />
        </g>

        {/* 6. Vòng xoay Phú Mỹ Hưng / Nam Sài Gòn (Bottom CTA) */}
        <g transform={`translate(${w * 0.50}, ${h - 120})`}>
          <circle r="26" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" className="page-hub-pulse" />
          <circle r="14" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.5" />
          <circle r="5" fill="var(--color-accent)" />
        </g>

        {/* ── LAYER 5: CÁC NODE XE CỘ DI CHUYỂN TOÀN TRANG (VIDEO BACKGROUND EFFECT) ── */}

        {/* ── Luồng Tuyến Đông (Path East) ── */}
        <g filter="url(#videoGlowAccent)">
          <circle r="5" fill="var(--color-accent)">
            <animateMotion
              path={pathEast}
              dur="22s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
          <circle r="2.5" fill="var(--color-accent)" opacity="0.5">
            <animateMotion
              path={pathEast}
              dur="22s"
              begin="0.2s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        <g filter="url(#videoGlowAccent)">
          <circle r="4.5" fill="var(--color-accent)">
            <animateMotion
              path={pathEast}
              dur="22s"
              begin="11s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        <g filter="url(#videoGlowInk)">
          <circle r="4.5" fill="var(--color-ink)">
            <animateMotion
              path={pathEast}
              dur="26s"
              begin="5s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
          <circle r="2.2" fill="var(--color-ink)" opacity="0.35">
            <animateMotion
              path={pathEast}
              dur="26s"
              begin="5.2s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        {/* ── Luồng Tuyến Tây (Path West) ── */}
        <g filter="url(#videoGlowInk)">
          <circle r="4.5" fill="var(--color-ink)">
            <animateMotion
              path={pathWest}
              dur="24s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
          <circle r="2.2" fill="var(--color-ink)" opacity="0.35">
            <animateMotion
              path={pathWest}
              dur="24s"
              begin="0.22s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        <g filter="url(#videoGlowAccent)">
          <circle r="4.5" fill="var(--color-accent)">
            <animateMotion
              path={pathWest}
              dur="20s"
              begin="10s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        <circle r="3.5" fill="var(--color-ink)" opacity="0.75">
          <animateMotion
            path={pathWest}
            dur="24s"
            begin="16s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── Luồng Tuyến Xuyên Tâm (Path Transversal) ── */}
        <g filter="url(#videoGlowAccent)">
          <circle r="5.5" fill="var(--color-accent)">
            <animateMotion
              path={pathTransversal}
              dur="18s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
          <circle r="3" fill="var(--color-accent)" opacity="0.45">
            <animateMotion
              path={pathTransversal}
              dur="18s"
              begin="0.15s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        <g filter="url(#videoGlowAccent)">
          <circle r="4.5" fill="var(--color-accent)">
            <animateMotion
              path={pathTransversal}
              dur="18s"
              begin="9s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        <g filter="url(#videoGlowInk)">
          <circle r="4.5" fill="var(--color-ink)">
            <animateMotion
              path={pathTransversal}
              dur="22s"
              begin="4.5s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
          <circle r="2.2" fill="var(--color-ink)" opacity="0.35">
            <animateMotion
              path={pathTransversal}
              dur="22s"
              begin="4.7s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        <circle r="3.5" fill="var(--color-ink)" opacity="0.75">
          <animateMotion
            path={pathTransversal}
            dur="22s"
            begin="15s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── Luồng Ven Kênh Nhiêu Lộc (Đoạn trên) ── */}
        <circle r="4" fill="var(--color-secondary)" opacity="0.75">
          <animateMotion
            path={pathKenhNhieuLoc}
            dur="19s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── Luồng Tuyến Ngang Giữa (Path Mid Ring) ── */}
        <circle r="4" fill="var(--color-secondary)" opacity="0.8">
          <animateMotion
            path={pathMidRing}
            dur="16s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── Luồng Đại Lộ Nguyễn Văn Linh (Path Nguyen Van Linh) ── */}
        <circle r="4.5" fill="var(--color-accent)" opacity="0.85">
          <animateMotion
            path={pathNguyenVanLinh}
            dur="15s"
            begin="2s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>
      </svg>
    </div>
  );
}

export default memo(FullPageTrafficNetwork);
