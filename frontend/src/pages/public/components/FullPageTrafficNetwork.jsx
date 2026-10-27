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

  // ── 1. Tuyến Vành Đai Đông (East Arterial Corridor) ──
  const pathEast = `M ${w * 0.84} 100 Q ${w * 0.94} ${h * 0.12} ${w * 0.88} ${h * 0.22} T ${w * 0.93} ${h * 0.38} Q ${w * 0.85} ${h * 0.50} ${w * 0.91} ${h * 0.62} T ${w * 0.87} ${h * 0.76} Q ${w * 0.94} ${h * 0.88} ${w * 0.78} ${h - 120}`;

  // ── 2. Tuyến Vành Đai Tây (West Arterial Corridor) ──
  const pathWest = `M ${w * 0.14} 120 Q ${w * 0.05} ${h * 0.15} ${w * 0.10} ${h * 0.27} T ${w * 0.07} ${h * 0.44} Q ${w * 0.15} ${h * 0.59} ${w * 0.08} ${h * 0.74} T ${w * 0.16} ${h - 160}`;

  // ── 3. Tuyến Xuyên Tâm Uốn Lượn (Central Transversal Express) ──
  const pathTransversal = `M ${w * 0.75} 260 Q ${w * 0.52} ${h * 0.14} ${w * 0.36} ${h * 0.22} T ${w * 0.22} ${h * 0.34} Q ${w * 0.62} ${h * 0.48} ${w * 0.68} ${h * 0.54} T ${w * 0.35} ${h * 0.68} Q ${w * 0.76} ${h * 0.81} ${w * 0.50} ${h - 140}`;

  // ── 4. Tuyến Nối Ngang Vành Đai Giữa (Mid Ring Connector) ──
  const pathMidRing = `M ${w * 0.10} ${h * 0.38} Q ${w * 0.50} ${h * 0.35} ${w * 0.92} ${h * 0.40}`;

  // ── 5. Tuyến Nối Ngang Vành Đai Dưới (Lower Ring Connector) ──
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
            <circle cx="2" cy="2" r="1" fill="var(--color-line)" opacity="0.45" />
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

        {/* ── NÚT GIAO NGHỆ THUẬT (GEOMETRIC HUBS - 0 GHI CHÚ ĐỊA ĐIỂM) ── */}
        {/* Hub 1: Giao lộ Hero Đông */}
        <g transform={`translate(${w * 0.84}, 100)`}>
          <circle r="14" fill="none" stroke="var(--color-accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <circle r="4" fill="var(--color-accent)" />
        </g>

        {/* Hub 2: Giao lộ Sizes Tây */}
        <g transform={`translate(${w * 0.10}, ${h * 0.27})`}>
          <rect x="-6" y="-6" width="12" height="12" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="1.5" />
          <rect x="-2" y="-2" width="4" height="4" fill="var(--color-ink)" />
        </g>

        {/* Hub 3: Giao lộ Giữa Tuyến Xuyên Tâm & Vành Đai Đông */}
        <g transform={`translate(${w * 0.68}, ${h * 0.54})`}>
          <circle r="16" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" className="page-hub-pulse" />
          <rect x="-7" y="-7" width="14" height="14" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2" />
          <rect x="-2.5" y="-2.5" width="5" height="5" fill="var(--color-accent)" />
        </g>

        {/* Hub 4: Giao lộ Facilities Tây */}
        <g transform={`translate(${w * 0.08}, ${h * 0.74})`}>
          <circle r="12" fill="none" stroke="var(--color-line-strong)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
          <circle r="3.5" fill="var(--color-ink)" />
        </g>

        {/* Hub 5: Giao lộ Cuối CTA */}
        <g transform={`translate(${w * 0.50}, ${h - 140})`}>
          <circle r="18" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" className="page-hub-pulse" />
          <rect x="-6" y="-6" width="12" height="12" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2" />
          <rect x="-2" y="-2" width="4" height="4" fill="var(--color-accent)" />
        </g>

        {/* ── CÁC NODE XE CỘ DI CHUYỂN DỌC TOÀN TRANG (VEHICLE PACKETS) ── */}

        {/* ── Tuyến Đông (Path East) ── */}
        {/* Node E1: Đỏ chủ đạo */}
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

        {/* Node E2: Đỏ so le */}
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

        {/* Node E3: Đen Ink */}
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
        {/* Node W1: Đen Ink */}
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

        {/* Node W2: Đỏ Accent */}
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

        {/* Node W3: Đen Ink so le */}
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
        {/* Node T1: Đỏ chính chuyển động nhanh qua giữa trang */}
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

        {/* Node T2: Đỏ so le */}
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

        {/* Node T3: Đen Ink */}
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

        {/* Node T4: Đen Ink so le */}
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
        {/* Node M1: Chuyển động ngang ở giữa trang */}
        <circle r="4" fill="var(--color-secondary)" opacity="0.8">
          <animateMotion
            path={pathMidRing}
            dur="16s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* Node L1: Chuyển động ngang ở cuối trang */}
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
