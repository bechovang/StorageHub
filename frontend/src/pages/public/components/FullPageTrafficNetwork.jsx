import { memo } from "react";
import "./FullPageTrafficNetwork.css";

/**
 * FullPageTrafficNetwork — Authentic Ho Chi Minh City Geospatial Blueprint & Traffic Flow
 * 
 * Implements Option A:
 * 1. High-resolution authentic cartographic blueprint of Ho Chi Minh City (2560x2304 WebP),
 *    displaying the true morphology of Saigon River (Thanh Da & Thu Thiem loops), waterways,
 *    expressways, and dense urban road networks in a delicate architectural watermark.
 * 2. Real-time GPU-accelerated logistics delivery nodes (<animateMotion>) continuously
 *    traveling along authentic transport corridors:
 *    - Pham Van Dong Expressway (TSN Airport -> Thu Duc)
 *    - Hanoi Highway / Vo Nguyen Giap (Cau Sai Gon -> Thao Dien -> Rach Chiec)
 *    - Vo Van Kiet - Mai Chi Tho (Cho Lon -> Ham Thu Thiem -> Cat Lai)
 *    - Nam Ky Khoi Nghia / Nguyen Van Troi (Airport to Ben Thanh Central)
 *    - Nguyen Van Linh (South Saigon / Phu My Hung corridor)
 *    - Saigon River maritime freight route
 * 3. Major logistics hubs with subtle radar pulses (Tan Binh flagship, Cat Lai, Thu Duc, Central).
 * 4. 100% Client-Side Rendering, 0 text labels, 100% canonical design tokens.
 */
function FullPageTrafficNetwork() {
  // Key Logistics Routes aligned to the 1920x1080 map projection:
  // 1. Pham Van Dong Corridor (Airport / Tan Binh to Thu Duc)
  const pathPhamVanDong = "M 480 540 L 600 500 L 900 435 L 1200 385 L 1425 340 L 1650 300";

  // 2. Hanoi Highway / Vo Nguyen Giap (Cau Sai Gon across Thu Duc)
  const pathXaLoHaNoi = "M 885 640 L 990 635 L 1088 596 L 1238 544 L 1460 445 L 1750 350";

  // 3. Vo Van Kiet & Mai Chi Tho (East-West Highway via Ham Thu Thiem)
  const pathVoVanKiet = "M 420 880 L 638 844 L 735 814 L 885 799 L 1035 770 L 1238 740 L 1500 700";

  // 4. North-South Airport Corridor (Tan Son Nhat -> Lang Cha Ca -> Ben Thanh)
  const pathNamKyKhoiNghia = "M 585 540 L 630 589 L 735 660 L 810 720 L 885 785 L 940 850";

  // 5. Nguyen Van Linh Corridor (South Saigon / District 7 / Phu My Hung)
  const pathNguyenVanLinh = "M 500 990 L 720 980 L 960 960 L 1150 940 L 1350 920";

  // 6. Saigon River Maritime Freight Flow (Waterway transport route)
  const pathWaterwaySaigon = "M 850 340 C 920 370, 960 440, 930 480 C 890 530, 980 580, 1020 540 C 1080 480, 1150 540, 1070 610 C 990 680, 970 720, 900 800 C 880 850, 950 900, 1020 880 C 1100 860, 1220 890, 1260 760";

  return (
    <div className="full-page-traffic" aria-hidden="true">
      {/* ── 1. Authentic Real-World Map Watermark Layer ── */}
      <div className="full-page-traffic__map-layer">
        <img
          src="/images/hcm_map_blueprint.webp"
          alt=""
          className="full-page-traffic__map-img"
          loading="eager"
          decoding="async"
        />
        <div className="full-page-traffic__map-overlay" />
      </div>

      {/* ── 2. SVG Real-Time Logistics Nodes & Corridors ── */}
      <svg
        className="full-page-traffic__svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Accent red vehicle glow */}
          <filter id="trafficGlowAccent" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dark ink vehicle glow */}
          <filter id="trafficGlowInk" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Route Guide Lines (Subtle Technical Dash) ── */}
        <path
          d={pathPhamVanDong}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          opacity="0.3"
          className="traffic-route-dash"
        />
        <path
          d={pathXaLoHaNoi}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.2"
          strokeDasharray="3 5"
          opacity="0.25"
          className="traffic-route-dash"
        />
        <path
          d={pathVoVanKiet}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          opacity="0.3"
          className="traffic-route-dash"
        />
        <path
          d={pathNamKyKhoiNghia}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          opacity="0.28"
          className="traffic-route-dash"
        />
        <path
          d={pathNguyenVanLinh}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="1.2"
          strokeDasharray="3 6"
          opacity="0.3"
          className="traffic-route-dash"
        />
        <path
          d={pathWaterwaySaigon}
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth="1.5"
          strokeDasharray="2 6"
          opacity="0.25"
          className="traffic-route-dash"
        />

        {/* ── 3. Major Logistics Node Radar Pulses ── */}
        {/* Hub 1: StorageHub Flagship - Tan Binh Facility (Airport vicinity) */}
        <g transform="translate(585, 544)">
          <circle r="4" fill="var(--color-accent)" />
          <circle r="6" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" className="traffic-hub-pulse" />
          <circle r="12" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.6" />
        </g>

        {/* Hub 2: Thu Duc Regional Logistics Center */}
        <g transform="translate(1200, 385)">
          <circle r="3.5" fill="var(--color-ink)" opacity="0.8" />
          <circle r="6" fill="none" stroke="var(--color-ink)" strokeWidth="1.2" className="traffic-hub-pulse" />
        </g>

        {/* Hub 3: Ben Thanh Central Interchange */}
        <g transform="translate(885, 785)">
          <circle r="4" fill="var(--color-accent)" />
          <circle r="6" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" className="traffic-hub-pulse" />
        </g>

        {/* Hub 4: Cat Lái Maritime Port & Container Depot */}
        <g transform="translate(1238, 740)">
          <circle r="4.5" fill="var(--color-accent)" />
          <circle r="6" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" className="traffic-hub-pulse" />
          <circle r="14" fill="none" stroke="var(--color-accent)" strokeWidth="0.8" opacity="0.5" />
        </g>

        {/* Hub 5: Phu My Hung / South Logistics Hub */}
        <g transform="translate(960, 960)">
          <circle r="3.5" fill="var(--color-ink)" opacity="0.8" />
          <circle r="6" fill="none" stroke="var(--color-ink)" strokeWidth="1" className="traffic-hub-pulse" />
        </g>

        {/* ── 4. Continuous Moving Logistics Packet Nodes ── */}
        {/* ── Flow 1: Pham Van Dong (Airport -> Thu Duc) ── */}
        <g filter="url(#trafficGlowAccent)">
          <circle r="4.5" fill="var(--color-accent)">
            <animateMotion
              path={pathPhamVanDong}
              dur="13s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <circle r="3.5" fill="var(--color-ink)" opacity="0.8">
          <animateMotion
            path={pathPhamVanDong}
            dur="13s"
            begin="4.5s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── Flow 2: Hanoi Highway / Vo Nguyen Giap ── */}
        <g filter="url(#trafficGlowAccent)">
          <circle r="4.5" fill="var(--color-accent)">
            <animateMotion
              path={pathXaLoHaNoi}
              dur="14s"
              begin="1s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <g filter="url(#trafficGlowInk)">
          <circle r="4" fill="var(--color-ink)">
            <animateMotion
              path={pathXaLoHaNoi}
              dur="16s"
              begin="8s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        {/* ── Flow 3: Vo Van Kiet / Mai Chi Tho ── */}
        <g filter="url(#trafficGlowAccent)">
          <circle r="5" fill="var(--color-accent)">
            <animateMotion
              path={pathVoVanKiet}
              dur="15s"
              begin="2s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <circle r="3.8" fill="var(--color-ink)" opacity="0.75">
          <animateMotion
            path={pathVoVanKiet}
            dur="17s"
            begin="9s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── Flow 4: North-South Airport Corridor (TSN -> Central) ── */}
        <g filter="url(#trafficGlowAccent)">
          <circle r="4.5" fill="var(--color-accent)">
            <animateMotion
              path={pathNamKyKhoiNghia}
              dur="11s"
              begin="3s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>
        <circle r="3.5" fill="var(--color-ink)" opacity="0.85">
          <animateMotion
            path={pathNamKyKhoiNghia}
            dur="11s"
            begin="8.5s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>

        {/* ── Flow 5: Nguyen Van Linh (South Corridor) ── */}
        <g filter="url(#trafficGlowAccent)">
          <circle r="4.5" fill="var(--color-accent)">
            <animateMotion
              path={pathNguyenVanLinh}
              dur="14s"
              begin="5s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </g>

        {/* ── Flow 6: Saigon River Maritime Logistics Flow ── */}
        <circle r="4.5" fill="var(--color-secondary)" opacity="0.8">
          <animateMotion
            path={pathWaterwaySaigon}
            dur="22s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>
        <circle r="3" fill="var(--color-secondary)" opacity="0.5">
          <animateMotion
            path={pathWaterwaySaigon}
            dur="22s"
            begin="0.25s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </circle>
      </svg>
    </div>
  );
}

export default memo(FullPageTrafficNetwork);
