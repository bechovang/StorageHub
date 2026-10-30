import { memo } from "react";
import { motion } from "motion/react";
import "./LogisticsTrafficMap.css";

const SOFT_EASE = [0.22, 1, 0.36, 1];

// ── TỌA ĐỘ CÁC TRỤC ĐẠI LỘ HUYẾT MẠCH TP.HCM (CLONE TỪ THỰC ĐỊA GOOGLE MAPS) ──
// Tuyến 1: Cửa ngõ Tân Sơn Nhất -> Bùng binh Lăng Cha Cả -> Nguyễn Văn Trỗi - Nam Kỳ Khởi Nghĩa -> Bến Thành -> Quận 7
const PATH_TSN_NKKN =
  "M 65 30 L 115 75 Q 165 125 210 165 T 290 230 Q 360 280 435 315";

// Tuyến 2: Trục xuyên tâm Cách Mạng Tháng Tám (CMTT) qua Ngã 6 Dân Chủ -> Bùng Binh Phù Đổng
const PATH_CMTT =
  "M 35 95 L 90 145 Q 145 195 195 235 T 285 285 L 360 320";

// Tuyến 3: Kênh Nhiêu Lộc - Thị Nghè & Tuyến Ven Kênh Hoàng Sa - Trường Sa (Uốn lượn tự nhiên)
const PATH_KENH_NHIEULOC =
  "M 45 200 Q 110 165 180 150 T 290 135 Q 380 120 445 90";

// Tuyến 4: Trục Vành đai Tây (Cộng Hòa - Lý Thường Kiệt - Võ Văn Kiệt)
const PATH_CONGHOA_VK =
  "M 25 50 L 115 75 Q 110 160 140 220 T 230 300 L 330 325";

// Tuyến 5: Trục Điện Biên Phủ - Vòng Xoay Hàng Xanh (Hướng Đông)
const PATH_DIENBIENPHU =
  "M 195 235 Q 260 195 320 160 T 450 115";

function LogisticsTrafficMap() {
  return (
    <motion.div
      className="logistics-map-card"
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: SOFT_EASE, delay: 0.15 }}
      aria-label="Sa hình mô phỏng mật độ giao thông đô thị TP.HCM"
    >
      {/* Top Technical Status Ribbon (0 ghi chú địa danh) */}
      <div className="logistics-map__top-bar">
        <div className="top-bar__left">
          <span className="top-bar__radar-dot" aria-hidden="true" />
          <span className="top-bar__radar-pulse" aria-hidden="true" />
          <span className="top-bar__tech-id">VN-HCM // NET-01</span>
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
            {/* Ambient Base Grid */}
            <pattern
              id="hcmUrbanGrid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="0.6" fill="var(--color-line)" opacity="0.5" />
            </pattern>

            {/* Glowing filter for vehicle nodes */}
            <filter id="heroGlowAccent" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="heroGlowInk" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#hcmUrbanGrid)" />

          {/* ── LAYER 0: DẢI KÊNH NHIÊU LỘC - THỊ NGHÈ UỐN LƯỢN TỰ NHIÊN ── */}
          <path
            d={PATH_KENH_NHIEULOC}
            fill="none"
            stroke="var(--color-neutral)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d={PATH_KENH_NHIEULOC}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* ── LAYER 1: MẠNG LƯỚI HẺM XƯƠNG CÁ & BÀN CỜ ĐẶC TRƯNG VIỆT NAM (DÀY ĐẶC) ── */}
          {/* Lưới hẻm bàn cờ khu vực Quận 3 (Giữa NKKN và CMTT) */}
          <g stroke="var(--color-line)" strokeWidth="0.8" opacity="0.6" fill="none">
            {/* Các nhánh hẻm cắt vuông góc trục NKKN */}
            <line x1="140" y1="100" x2="165" y2="75" />
            <line x1="155" y1="115" x2="180" y2="90" />
            <line x1="170" y1="130" x2="195" y2="105" />
            <line x1="185" y1="145" x2="210" y2="120" />
            <line x1="200" y1="160" x2="225" y2="135" />
            <line x1="215" y1="175" x2="240" y2="150" />
            <line x1="230" y1="190" x2="255" y2="165" />
            <line x1="245" y1="205" x2="270" y2="180" />
            <line x1="260" y1="220" x2="285" y2="195" />
            <line x1="275" y1="235" x2="300" y2="210" />

            {/* Các nhánh hẻm song hành trục NKKN */}
            <line x1="150" y1="90" x2="280" y2="200" strokeDasharray="3 3" />
            <line x1="165" y1="80" x2="295" y2="190" strokeDasharray="2 3" />

            {/* Hệ xương cá khu vực Tân Bình (Dọc Hoàng Văn Thụ & CMTT) */}
            <line x1="75" y1="110" x2="55" y2="125" />
            <line x1="90" y1="125" x2="70" y2="140" />
            <line x1="105" y1="140" x2="85" y2="155" />
            <line x1="120" y1="155" x2="100" y2="170" />
            <line x1="135" y1="170" x2="115" y2="185" />
            <line x1="150" y1="185" x2="130" y2="200" />
            <line x1="165" y1="200" x2="145" y2="215" />
            <line x1="180" y1="215" x2="160" y2="230" />

            {/* Lưới ô cờ nghiêng Quận 1 (Phía Đông Nam) */}
            <line x1="300" y1="220" x2="330" y2="190" />
            <line x1="315" y1="235" x2="345" y2="205" />
            <line x1="330" y1="250" x2="360" y2="220" />
            <line x1="345" y1="265" x2="375" y2="235" />
            <line x1="360" y1="280" x2="390" y2="250" />
            <line x1="375" y1="295" x2="405" y2="265" />
            <line x1="310" y1="205" x2="390" y2="275" strokeDasharray="4 3" />
            <line x1="325" y1="190" x2="405" y2="260" strokeDasharray="3 3" />

            {/* Mạng hẻm Chợ Lớn / Tây Nam */}
            <line x1="60" y1="210" x2="120" y2="210" />
            <line x1="60" y1="225" x2="120" y2="225" />
            <line x1="60" y1="240" x2="120" y2="240" />
            <line x1="60" y1="255" x2="120" y2="255" />
            <line x1="80" y1="200" x2="80" y2="265" />
            <line x1="100" y1="200" x2="100" y2="265" />
          </g>

          {/* ── LAYER 2: CÁC ĐƯỜNG LIÊN QUẬN & TUYẾN THỨ CẤP ── */}
          {/* Trục Điện Biên Phủ nối dài */}
          <path
            d={PATH_DIENBIENPHU}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="2.4"
            strokeOpacity="0.3"
            strokeDasharray="5 3"
          />

          {/* Cặp đường song hành Hoàng Sa - Trường Sa ven kênh */}
          <path
            d={PATH_KENH_NHIEULOC}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            transform="translate(0, -6)"
          />
          <path
            d={PATH_KENH_NHIEULOC}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            transform="translate(0, 6)"
          />

          {/* Trục Cộng Hòa - Lý Thường Kiệt */}
          <path
            d={PATH_CONGHOA_VK}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="3.2"
            strokeOpacity="0.22"
            strokeLinecap="round"
          />

          {/* ── LAYER 3: CÁC TRỤC ĐẠI LỘ HUYẾT MẠCH (PRIMARY ARTERIALS) ── */}
          {/* Trục Cách Mạng Tháng Tám (CMTT) */}
          <path
            d={PATH_CMTT}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="6"
            strokeOpacity="0.12"
            strokeLinecap="round"
          />
          <path
            d={PATH_CMTT}
            fill="none"
            stroke="var(--color-surface)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d={PATH_CMTT}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="1.6"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />

          {/* Trục Cửa ngõ Sân bay TSN - Lăng Cha Cả - Nam Kỳ Khởi Nghĩa - Nguyễn Văn Linh */}
          {/* Casing viền đường ngoài */}
          <path
            d={PATH_TSN_NKKN}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="8"
            strokeOpacity="0.15"
            strokeLinecap="round"
          />
          {/* Làn đường chính */}
          <path
            d={PATH_TSN_NKKN}
            fill="none"
            stroke="var(--color-surface)"
            strokeWidth="4.8"
            strokeLinecap="round"
          />
          <path
            d={PATH_TSN_NKKN}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="2.4"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />
          {/* Vạch xung nhịp phân luồng trung tâm (Pulse Stream) */}
          <path
            d={PATH_TSN_NKKN}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.2"
            strokeDasharray="6 4"
            strokeOpacity="0.9"
            className="road-pulse-stream"
          />

          {/* ── LAYER 4: CÁC VÒNG XOAY / BÙNG BINH ĐẶC TRƯNG VIỆT NAM (0 CHỮ) ── */}
          {/* 1. Bùng binh Lăng Cha Cả (Nút giao 5 nhánh Tân Bình) */}
          <g transform="translate(115, 75)">
            <circle r="16" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" className="depot-pulse-ring" />
            <circle r="10" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.5" />
            <circle r="4" fill="var(--color-accent)" />
          </g>

          {/* 2. Cửa ngõ Sân bay Tân Sơn Nhất */}
          <g transform="translate(65, 30)">
            <circle r="7" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="1.5" />
            <circle r="2.5" fill="var(--color-ink)" />
          </g>

          {/* 3. Nút giao Cầu Công Lý (Cắt Kênh Nhiêu Lộc) */}
          <g transform="translate(210, 165)">
            <circle r="7" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="1.8" />
            <rect x="-2.5" y="-2.5" width="5" height="5" fill="var(--color-accent)" />
          </g>

          {/* 4. Ngã 6 Dân Chủ (Vòng xoay 6 nhánh CMTT - 3/2 - Võ Thị Sáu) */}
          <g transform="translate(195, 235)">
            <circle r="13" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.2" strokeDasharray="3 2" />
            <circle r="8" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
            <circle r="3" fill="var(--color-ink)" />
          </g>

          {/* 5. Vòng xoay Bến Thành / Lõi Quận 1 */}
          <g transform="translate(290, 230)">
            <circle r="12" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" className="depot-pulse-ring" />
            <rect
              x="-7"
              y="-7"
              width="14"
              height="14"
              fill="var(--color-surface)"
              stroke="var(--color-accent)"
              strokeWidth="2.2"
            />
            <rect x="-2.5" y="-2.5" width="5" height="5" fill="var(--color-accent)" />
          </g>

          {/* 6. Depot / Trục Nam Sài Gòn (Nguyễn Văn Linh - Quận 7) */}
          <g transform="translate(435, 315)">
            <circle r="11" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.2" strokeDasharray="3 2" />
            <rect
              x="-6"
              y="-6"
              width="12"
              height="12"
              fill="var(--color-surface)"
              stroke="var(--color-line-strong)"
              strokeWidth="2"
            />
            <rect x="-2" y="-2" width="4" height="4" fill="var(--color-ink)" />
          </g>

          {/* ── LAYER 5: CÁC NODE XE CỘ DI CHUYỂN (VEHICLE PACKETS) ── */}
          {/* Node 1: Xe tải chính trên trục NKKN (Đỏ accent) */}
          <g filter="url(#heroGlowAccent)">
            <circle r="4.5" fill="var(--color-accent)">
              <animateMotion
                path={PATH_TSN_NKKN}
                dur="5.2s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
            <circle r="2.5" fill="var(--color-accent)" opacity="0.45">
              <animateMotion
                path={PATH_TSN_NKKN}
                dur="5.2s"
                begin="0.12s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          </g>

          {/* Node 2: Xe trung chuyển số 2 trên trục NKKN (Đỏ accent - so le) */}
          <g filter="url(#heroGlowAccent)">
            <circle r="4" fill="var(--color-accent)">
              <animateMotion
                path={PATH_TSN_NKKN}
                dur="5.2s"
                begin="2.6s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          </g>

          {/* Node 3: Xe vận tải trên trục CMTT (Đen ink) */}
          <g filter="url(#heroGlowInk)">
            <circle r="4" fill="var(--color-ink)">
              <animateMotion
                path={PATH_CMTT}
                dur="6.2s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
            <circle r="2" fill="var(--color-ink)" opacity="0.35">
              <animateMotion
                path={PATH_CMTT}
                dur="6.2s"
                begin="0.15s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          </g>

          {/* Node 4: Xe luân chuyển trên trục Cộng Hòa (Đen ink) */}
          <g filter="url(#heroGlowInk)">
            <circle r="3.5" fill="var(--color-ink)">
              <animateMotion
                path={PATH_CONGHOA_VK}
                dur="6.8s"
                repeatCount="indefinite"
                rotate="auto"
              />
            </circle>
          </g>

          {/* Node 5: Xe hàng hướng Đông qua Điện Biên Phủ */}
          <circle r="3.5" fill="var(--color-accent)">
            <animateMotion
              path={PATH_DIENBIENPHU}
              dur="6.5s"
              begin="1.2s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>

          {/* Node 6: Xe ven kênh Nhiêu Lộc */}
          <circle r="3" fill="var(--color-secondary)" opacity="0.8">
            <animateMotion
              path={PATH_KENH_NHIEULOC}
              dur="7.2s"
              begin="0.5s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </circle>
        </svg>
      </div>

      {/* Bottom Technical Frame Bar (0 ghi chú địa danh) */}
      <div className="logistics-map__bottom-bar">
        <div className="bottom-bar__indicator">
          <span className="indicator-label">RADAR GRID</span>
          <span className="indicator-live-tag">LIVE DENSITY</span>
        </div>
        <div className="bottom-bar__tracks">
          <span className="track-pill track-pill--active" />
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
