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

  // ── 1. Tuyến Vành Đai Đông (Hành Lang Cao Tốc Đô Thị Đông) ──
  const pathEast = `M ${w * 0.84} 100 Q ${w * 0.94} ${h * 0.12} ${w * 0.88} ${h * 0.22} T ${w * 0.93} ${h * 0.38} Q ${w * 0.85} ${h * 0.50} ${w * 0.91} ${h * 0.62} T ${w * 0.87} ${h * 0.76} Q ${w * 0.94} ${h * 0.88} ${w * 0.78} ${h - 120}`;

  // ── 2. Tuyến Vành Đai Tây (Hành Lang Vành Đai Tây - Tân Bình - Q6) ──
  const pathWest = `M ${w * 0.14} 120 Q ${w * 0.05} ${h * 0.15} ${w * 0.10} ${h * 0.27} T ${w * 0.07} ${h * 0.44} Q ${w * 0.15} ${h * 0.59} ${w * 0.08} ${h * 0.74} T ${w * 0.16} ${h - 160}`;

  // ── 3. Tuyến Xuyên Tâm Uốn Lượn (Trục Xuyên Tâm Huyết Mạch NKKN - CMTT - Nguyễn Văn Linh) ──
  const pathTransversal = `M ${w * 0.75} 260 Q ${w * 0.52} ${h * 0.14} ${w * 0.36} ${h * 0.22} T ${w * 0.22} ${h * 0.34} Q ${w * 0.62} ${h * 0.48} ${w * 0.68} ${h * 0.54} T ${w * 0.35} ${h * 0.68} Q ${w * 0.76} ${h * 0.81} ${w * 0.50} ${h - 140}`;

  // ── 4. Tuyến Nối Ngang Vành Đai Giữa (Vòng Đai Nội Đô Đi Vào Khu Bàn Cờ) ──
  const pathMidRing = `M ${w * 0.10} ${h * 0.38} Q ${w * 0.50} ${h * 0.35} ${w * 0.92} ${h * 0.40}`;

  // ── 5. Tuyến Nối Ngang Vành Đai Dưới (Đại Lộ Ven Kênh Tàu Hủ - Võ Văn Kiệt) ──
  const pathLowerRing = `M ${w * 0.08} ${h * 0.72} Q ${w * 0.48} ${h * 0.74} ${w * 0.88} ${h * 0.71}`;

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
          {/* Ambient Micro-Grid */}
          <pattern
            id="ambientTrafficGrid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="var(--color-line)" opacity="0.4" />
          </pattern>

          {/* Glow filter for accent nodes */}
          <filter id="pageGlowAccent" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Glow filter for ink nodes */}
          <filter id="pageGlowInk" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Subtle Dot Matrix */}
        <rect width="100%" height="100%" fill="url(#ambientTrafficGrid)" />

        {/* ── MẠNG LƯỚI HẺM XƯƠNG CÁ DÀY ĐẶC DỌC HAI HÀNH LANG (VIETNAMESE DENSITY) ── */}
        <g stroke="var(--color-line)" strokeWidth="0.8" opacity="0.4" fill="none">
          {/* Hẻm xương cá hành lang Tây */}
          {[0.14, 0.19, 0.24, 0.29, 0.35, 0.42, 0.48, 0.55, 0.62, 0.70, 0.78, 0.85].map((factor, idx) => (
            <g key={`alley-w-${idx}`}>
              <line
                x1={w * 0.08}
                y1={h * factor}
                x2={w * 0.03}
                y2={h * factor + 18}
              />
              <line
                x1={w * 0.10}
                y1={h * factor + 8}
                x2={w * 0.14}
                y2={h * factor + 26}
              />
            </g>
          ))}

          {/* Hẻm xương cá hành lang Đông */}
          {[0.12, 0.18, 0.25, 0.32, 0.39, 0.46, 0.53, 0.60, 0.68, 0.75, 0.83, 0.90].map((factor, idx) => (
            <g key={`alley-e-${idx}`}>
              <line
                x1={w * 0.90}
                y1={h * factor}
                x2={w * 0.96}
                y2={h * factor + 16}
              />
              <line
                x1={w * 0.88}
                y1={h * factor + 10}
                x2={w * 0.83}
                y2={h * factor + 28}
              />
            </g>
          ))}

          {/* Lưới ô cờ các khu phố bàn cờ tại các khoảng đệm giữa các section */}
          {/* Khoảng đệm 1: Giữa Hero & Storage Sizes */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={`grid-1-h-${i}`}
              x1={w * 0.15}
              y1={h * 0.18 + i * 14}
              x2={w * 0.28}
              y2={h * 0.18 + i * 14}
            />
          ))}
          {[0, 1, 2, 3, 4].map((j) => (
            <line
              key={`grid-1-v-${j}`}
              x1={w * 0.15 + j * 32}
              y1={h * 0.18}
              x2={w * 0.15 + j * 32}
              y2={h * 0.18 + 42}
            />
          ))}

          {/* Khoảng đệm 2: Giữa Pillars & Steps */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={`grid-2-h-${i}`}
              x1={w * 0.72}
              y1={h * 0.48 + i * 14}
              x2={w * 0.86}
              y2={h * 0.48 + i * 14}
            />
          ))}
          {[0, 1, 2, 3, 4].map((j) => (
            <line
              key={`grid-2-v-${j}`}
              x1={w * 0.72 + j * 32}
              y1={h * 0.48}
              x2={w * 0.72 + j * 32}
              y2={h * 0.48 + 42}
            />
          ))}
        </g>

        {/* ── ARTERIAL LINES (ĐƯỜNG GIAO THÔNG MỜ MỜ NỐI DÀI TOÀN TRANG) ── */}

        {/* Tuyến Nối Ngang Giữa */}
        <path
          d={pathMidRing}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2"
          strokeDasharray="4 6"
          strokeOpacity="0.4"
        />

        {/* Tuyến Nối Ngang Dưới */}
        <path
          d={pathLowerRing}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2"
          strokeDasharray="4 6"
          strokeOpacity="0.4"
        />

        {/* Tuyến Vành Đai Tây */}
        <path
          d={pathWest}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="5"
          strokeOpacity="0.08"
          strokeLinecap="round"
        />
        <path
          d={pathWest}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />
        <path
          d={pathWest}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1"
          strokeDasharray="6 6"
          strokeOpacity="0.4"
        />

        {/* Tuyến Vành Đai Đông */}
        <path
          d={pathEast}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="6"
          strokeOpacity="0.09"
          strokeLinecap="round"
        />
        <path
          d={pathEast}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2"
          strokeOpacity="0.55"
          strokeLinecap="round"
        />
        <path
          d={pathEast}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1"
          strokeDasharray="8 6"
          strokeOpacity="0.45"
        />

        {/* Tuyến Xuyên Tâm Uốn Lượn */}
        <path
          d={pathTransversal}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="7"
          strokeOpacity="0.10"
          strokeLinecap="round"
        />
        <path
          d={pathTransversal}
          fill="none"
          stroke="var(--color-surface)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        <path
          d={pathTransversal}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="2.2"
          strokeOpacity="0.45"
          strokeLinecap="round"
        />
        <path
          d={pathTransversal}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.2"
          strokeDasharray="6 4"
          strokeOpacity="0.75"
          className="traffic-flow-dash"
        />

        {/* ── NÚT GIAO VÒNG XOAY BÙNG BINH HÌNH HỌC (0 CHỮ ĐỊA DANH) ── */}
        {/* Hub 1: Bùng binh phía Bắc / Hero */}
        <g transform={`translate(${w * 0.84}, 100)`}>
          <circle r="18" fill="none" stroke="var(--color-accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <circle r="10" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="1.8" />
          <circle r="4" fill="var(--color-accent)" />
        </g>

        {/* Hub 2: Bùng binh Tây / Sizes */}
        <g transform={`translate(${w * 0.10}, ${h * 0.27})`}>
          <circle r="14" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.6" />
          <circle r="8" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="1.8" />
          <rect x="-2.5" y="-2.5" width="5" height="5" fill="var(--color-ink)" />
        </g>

        {/* Hub 3: Vòng xoay Trung Tâm / Pillars - Steps */}
        <g transform={`translate(${w * 0.68}, ${h * 0.54})`}>
          <circle r="22" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" className="page-hub-pulse" />
          <circle r="12" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.2" />
          <circle r="4.5" fill="var(--color-accent)" />
        </g>

        {/* Hub 4: Bùng binh Vành Đai Dưới / Facilities */}
        <g transform={`translate(${w * 0.08}, ${h * 0.74})`}>
          <circle r="16" fill="none" stroke="var(--color-line-strong)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
          <circle r="9" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="1.8" />
          <circle r="3.5" fill="var(--color-ink)" />
        </g>

        {/* Hub 5: Nút Giao Lõi Nam Sài Gòn / Bottom CTA */}
        <g transform={`translate(${w * 0.50}, ${h - 140})`}>
          <circle r="24" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" className="page-hub-pulse" />
          <circle r="12" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.4" />
          <circle r="4" fill="var(--color-accent)" />
        </g>

        {/* ── CÁC NODE XE CỘ DI CHUYỂN DỌC TOÀN TRANG (VEHICLE PACKETS) ── */}

        {/* ── Tuyến Đông (Path East) ── */}
        <g filter="url(#pageGlowAccent)">
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

        <g filter="url(#pageGlowAccent)">
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

        <g filter="url(#pageGlowInk)">
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

        {/* ── Tuyến Tây (Path West) ── */}
        <g filter="url(#pageGlowInk)">
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

        <g filter="url(#pageGlowAccent)">
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

        {/* ── Tuyến Xuyên Tâm (Path Transversal) ── */}
        <g filter="url(#pageGlowAccent)">
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

        <g filter="url(#pageGlowAccent)">
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

        <g filter="url(#pageGlowInk)">
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

        {/* ── Tuyến Ngang Nối (Mid & Lower Rings) ── */}
        <circle r="4" fill="var(--color-secondary)" opacity="0.8">
          <animateMotion
            path={pathMidRing}
            dur="16s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        <circle r="4" fill="var(--color-accent)" opacity="0.85">
          <animateMotion
            path={pathLowerRing}
            dur="15s"
            begin="3s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>
      </svg>
    </div>
  );
}

export default memo(FullPageTrafficNetwork);
