import { memo } from "react";
import "./FullPageTrafficNetwork.css";

/**
 * FullPageTrafficNetwork — Authentic Ho Chi Minh City Geospatial Blueprint Background
 * 
 * High-resolution authentic cartographic blueprint of Ho Chi Minh City (2560x2304 WebP),
 * displaying the true morphology of Saigon River (Thanh Da & Thu Thiem loops), waterways,
 * expressways, and dense urban road networks in a delicate architectural watermark.
 * Clean, minimal, zero text labels, 100% canonical design tokens.
 */
function FullPageTrafficNetwork() {
  return (
    <div className="full-page-traffic" aria-hidden="true">
      {/* ── Authentic Real-World Map Watermark Layer ── */}
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
    </div>
  );
}

export default memo(FullPageTrafficNetwork);
