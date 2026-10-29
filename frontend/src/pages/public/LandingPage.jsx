import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence, useInView, animate } from "motion/react";
import {
  ArrowRight,
  ShieldCheck,
  Key,
  Receipt,
  FileText,
  Warehouse,
  Check,
  CaretDown,
  MapPin,
  Clock,
  Info as InfoIcon,
  Truck,
  Elevator,
  LockSimple,
  Buildings,
  Question as QuestionMarkIcon,
  Cube,
  QrCode,
  Browsers,
  Camera,
  ImageSquare,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Button from "../../components/Button/Button.jsx";
import "./LandingPage.css";

// ── Soft Easing Curve (easeOutQuart canonical: [0.22, 1, 0.36, 1]) ──
const SOFT_EASE = [0.22, 1, 0.36, 1];

// ── Animation Variants ──
const heroTitleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const titleLineVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: SOFT_EASE,
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: SOFT_EASE,
    },
  },
};

/**
 * CounterNumber Component — Tự động nhảy số mượt mà từ 0 đến giá trị đích khi cuộn vào viewport
 */
function CounterNumber({ value, suffix = "", prefix = "", duration = 1.2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration,
      ease: SOFT_EASE,
      onUpdate(latest) {
        setDisplayValue(Math.floor(latest));
      },
    });
    return () => controls.stop();
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="stat-card__metric">
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

// ── Dữ liệu 4 loại kích thước kho tự quản ──
const STORAGE_SIZES = [
  {
    id: "LOCKER",
    typeKey: "LOCKER",
    name: "Locker Cá Nhân",
    sizeM2: "1.5 m²",
    dimensions: "1.0m × 1.5m × 2.4m",
    priceText: "~100.000 đ/tháng",
    badge: "TIẾT KIỆM",
    badgeType: "neutral",
    target: "Sinh viên, cá nhân cần cất tài liệu/đồ quý giá.",
    features: [
      "Chứa 8 - 12 thùng carton tiêu chuẩn",
      "Vali du lịch, balo, tài liệu hồ sơ",
      "Khóa số PIN điện tử riêng biệt 100%",
      "Kiểm soát nhiệt độ & chống ẩm mốc",
    ],
    visualAsset: {
      tag: "ASSET // 3D CUTAWAY",
      spec: "ISO RENDER 4:3 · 800×600",
      caption: "Mô hình 3D: 8-12 thùng carton, 2 vali du lịch, tài liệu & kệ treo mini",
    },
  },
  {
    id: "SMALL",
    typeKey: "SMALL",
    name: "Kho Mini S",
    sizeM2: "4.0 m²",
    dimensions: "2.0m × 2.0m × 2.7m",
    priceText: "~345.000 đ/tháng",
    badge: "TIÊU CHUẨN",
    badgeType: "neutral",
    target: "Người chuyển trọ, gia đình nhỏ sửa nhà.",
    features: [
      "Toàn bộ đồ đạc 1 phòng ngủ cá nhân",
      "Chỗ đỗ vừa 1 - 2 xe máy / xe đạp",
      "25 - 30 thùng đồ, nệm gấp, tủ quần áo",
      "Cảm biến nhiệt khói & PCCC tự động",
    ],
    visualAsset: {
      tag: "ASSET // 3D CUTAWAY",
      spec: "ISO RENDER 4:3 · 800×600",
      caption: "Mô hình 3D: Đồ 1 phòng ngủ, 1-2 xe máy, nệm gấp & 30 thùng đồ",
    },
  },
  {
    id: "MEDIUM",
    typeKey: "MEDIUM",
    name: "Kho Gia Đình M",
    sizeM2: "8.0 m²",
    dimensions: "2.5m × 3.2m × 2.7m",
    priceText: "~380.000 đ/tháng",
    badge: "PHỔ BIẾN NHẤT",
    badgeType: "accent",
    target: "Hộ gia đình chuyển nhà, shop kinh doanh lưu kho hàng.",
    features: [
      "Nội thất nguyên căn hộ 1 - 2 phòng ngủ",
      "Sofa, tủ lạnh, máy giặt, bàn ăn",
      "50+ thùng carton hàng hóa đóng gói",
      "Sát thang máy hàng tải trọng 2 tấn",
    ],
    visualAsset: {
      tag: "ASSET // 3D CUTAWAY",
      spec: "ISO RENDER 4:3 · 800×600",
      caption: "Mô hình 3D: Nội thất 2 phòng ngủ, sofa dài, tủ lạnh lớn & 50+ thùng",
    },
  },
  {
    id: "LARGE",
    typeKey: "LARGE",
    name: "Kho Doanh Nghiệp L",
    sizeM2: "16.0 m²",
    dimensions: "4.0m × 4.0m × 3.0m",
    priceText: "~900.000 đ/tháng",
    badge: "LÂU DÀI",
    badgeType: "neutral",
    target: "Doanh nghiệp thương mại điện tử, lưu trữ lâu dài.",
    features: [
      "Toàn bộ nội thất nhà phố / 3 phòng ngủ",
      "Kiện pallet hàng hóa kinh doanh, máy móc",
      "Cửa cuốn rộng 2.4m, sàn tải trọng 1 tấn/m²",
      "Hỗ trợ xe nâng tay & xe kéo hàng tại chỗ",
    ],
    visualAsset: {
      tag: "ASSET // 3D CUTAWAY",
      spec: "ISO RENDER 4:3 · 800×600",
      caption: "Mô hình 3D: Pallet kiện hàng công nghiệp, xe nâng tay & kệ cao 3m",
    },
  },
];

// ── 4 Trụ cột giá trị StorageHub ──
const PILLARS = [
  {
    icon: Key,
    title: "Mã PIN cá nhân 100%",
    description:
      "Mở kho tức thì bằng bàn phím số riêng biệt, chủ động 24/7 không cần chờ lễ tân hay bảo vệ. Bạn là người duy nhất sở hữu mã mở cửa",
    techTag: "SCHEMATIC // 256-BIT PIN",
    techBadge: "HARDWARE",
    techSpec: "Bàn phím mã số vật lý độc lập tại từng ô kho · Zero-trust",
  },
  {
    icon: Receipt,
    title: "Cọc chỉ 10% & Minh bạch",
    description:
      "Không phát sinh phụ phí ẩn. Chỉ cọc 10% để xác nhận giữ kho. Hoàn cọc tự động qua tài khoản ngân hàng trong 24h sau khi kiểm tra trả kho",
    techTag: "FLOW // 10% ESCROW",
    techBadge: "FINTECH",
    techSpec: "Ký quỹ giữ chỗ VietQR tức thì · Hoàn cọc tự động qua STK trong 24h",
  },
  {
    icon: ShieldCheck,
    title: "An ninh & PCCC đa lớp",
    description:
      "Hệ thống camera giám sát liên tục 24/7, đầu dò khói nhiệt PCCC tiêu chuẩn và kiểm soát độ ẩm chống ẩm mốc hư hại hàng hóa tuyệt đối",
    techTag: "IOT // TELEMETRY",
    techBadge: "SECURITY",
    techSpec: "CCTV AI 4K hồng ngoại · Đầu dò nhiệt khói & ẩm kế tự động",
  },
  {
    icon: FileText,
    title: "Hợp đồng số & Bàn giao ảnh",
    description:
      "Mọi lịch sử nhận/trả kho đều được chụp ảnh đối soát minh bạch qua Thẻ nhận kho kỹ thuật số và hợp đồng điện tử có giá trị pháp lý",
    techTag: "AUDIT // DIGITAL PASS",
    techBadge: "VERIFIED",
    techSpec: "Biên bản bàn giao số gắn timestamp & đối soát ảnh hiện trạng",
  },
];

// ── 3 Bước thuê kho ──
const STEPS = [
  {
    step: "01",
    title: "Chọn kho trực tuyến",
    description:
      "Khám phá sơ đồ kho 3D trực quan, lọc diện tích từ 1.5m² đến 16m² phù hợp chính xác ngân sách và lượng đồ đạc của bạn",
    visualAsset: {
      tag: "ASSET // 3D UNIT MAP PICKER",
      spec: "INTERACTIVE UI [16:9 · GIF / WEBP]",
      caption: "Sơ đồ mặt bằng 3D trực quan tương tác đa tầng & bộ lọc diện tích theo nhu cầu",
      icon: Browsers,
    },
  },
  {
    step: "02",
    title: "Đặt cọc 10% & Nhận PIN",
    description:
      "Thanh toán cọc 10% an toàn trực tuyến. Hệ thống lập tức kích hoạt hợp đồng điện tử và cấp mã PIN mở kho riêng cho bạn",
    visualAsset: {
      tag: "ASSET // VIETQR & INSTANT PIN",
      spec: "CHECKOUT FLOW [16:9 · UI SCREEN]",
      caption: "Giao diện thanh toán VietQR động tự động khớp lệnh & sinh mã PIN trong 5 giây",
      icon: QrCode,
    },
  },
  {
    step: "03",
    title: "Tự do mở kho 24/7",
    description:
      "Đến cơ sở bất kỳ lúc nào ngày hay đêm, nhập mã PIN tại cửa ra vào và ô kho. Quản lý kho hoàn toàn chủ động và riêng tư",
    visualAsset: {
      tag: "ASSET // 24/7 SMART KEYPAD",
      spec: "HARDWARE ACCESS [16:9 · PHOTO]",
      caption: "Bàn phím số công nghiệp hiện đại, mở cửa ra vào cơ sở & ô kho không cần gặp lễ tân",
      icon: LockSimple,
    },
  },
];

// ── 5 Câu hỏi thường gặp ──
const FAQ_ITEMS = [
  {
    q: "Thời gian thuê kho tối thiểu tại StorageHub là bao lâu?",
    a: "Thời gian thuê kho tại StorageHub vô cùng linh hoạt, tối thiểu từ 1 tháng. Bạn có thể gia hạn tự động hàng tháng hoặc kết thúc hợp đồng bất kỳ lúc nào tùy theo nhu cầu thực tế.",
  },
  {
    q: "Tiền đặt cọc 10% được hoàn trả như thế nào?",
    a: "Tiền cọc 10% nhằm đảm bảo giữ chỗ và trang thiết bị kho. Sau khi bạn làm thủ tục trả kho và đối soát hình ảnh hiện trạng, tiền cọc sẽ được hoàn trả tự động qua chuyển khoản ngân hàng trong vòng 24 giờ.",
  },
  {
    q: "Tôi có thể vào kho lúc đêm khuya hoặc ngày lễ không?",
    a: "Hoàn toàn được! Toàn bộ cơ sở StorageHub vận hành tự động 24/7/365. Bạn chỉ cần nhập mã PIN cá nhân tại cửa ra vào và ô kho của mình để vào bất kỳ lúc nào mà không cần báo trước.",
  },
  {
    q: "Hàng hóa trong kho có được bảo hiểm không?",
    a: "Tất cả các kho đều được bảo vệ trong hệ thống kiểm soát môi trường chống ẩm mốc, hệ thống PCCC tiêu chuẩn và được bao gồm trong gói bảo hiểm trách nhiệm cơ sở vật chất của StorageHub.",
  },
  {
    q: "Nếu cần đổi sang kho lớn hơn hoặc nhỏ hơn thì làm thế nào?",
    a: "Bạn có thể gửi yêu cầu hỗ trợ qua trang Hỗ trợ (/support) hoặc liên hệ trực tiếp ban quản lý cơ sở. Chúng tôi sẽ hỗ trợ đổi kho nhanh chóng và cấn trừ chi phí tương ứng.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // SEO: Update Title, Meta tags, and Structured Data (JSON-LD)
  useEffect(() => {
    const originalTitle = document.title;
    document.title =
      "StorageHub · Hệ thống Cho thuê Kho tự quản Thông minh TP.HCM";

    // Update or create meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    const prevDesc = metaDescription?.getAttribute("content") || "";
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "StorageHub - Hệ thống cho thuê kho tự quản thông minh hàng đầu TP.HCM. 40+ kho sạch sẽ, an ninh đa lớp 24/7, cọc 10% trực tuyến, mở kho tự do bằng mã PIN riêng."
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content =
        "StorageHub - Hệ thống cho thuê kho tự quản thông minh hàng đầu TP.HCM. 40+ kho sạch sẽ, an ninh đa lớp 24/7, cọc 10% trực tuyến, mở kho tự do bằng mã PIN riêng.";
      document.head.appendChild(meta);
    }

    // JSON-LD Structured Data
    const ldJsonScript = document.createElement("script");
    ldJsonScript.type = "application/ld+json";
    ldJsonScript.id = "storagehub-landing-schema";
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SelfStorage",
          "@id": "https://storagehub.vn/#organization",
          name: "StorageHub Vietnam - Kho Tự Quản Thông Minh",
          url: "https://storagehub.vn",
          telephone: "+84 28 3844 8899",
          priceRange: "100.000 VND - 2.500.000 VND",
          image: "https://storagehub.vn/og-storagehub.jpg",
          description:
            "Hệ thống cho thuê kho tự quản thông minh cá nhân và doanh nghiệp tại TP.HCM. Mở cửa 24/7 bằng mã PIN riêng, cọc 10%, an ninh camera PCCC đa lớp.",
          address: {
            "@type": "PostalAddress",
            streetAddress: "123 Hoàng Văn Thụ, Phường 2",
            addressLocality: "Quận Tân Bình",
            addressRegion: "Thành phố Hồ Chí Minh",
            postalCode: "700000",
            addressCountry: "VN",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 10.7992,
            longitude: 106.6668,
          },
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ],
              opens: "00:00",
              closes: "23:59",
            },
          ],
        },
        {
          "@type": "FAQPage",
          "@id": "https://storagehub.vn/#faq",
          mainEntity: FAQ_ITEMS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        },
      ],
    };
    ldJsonScript.text = JSON.stringify(schemaData);
    document.head.appendChild(ldJsonScript);

    return () => {
      document.title = originalTitle;
      const script = document.getElementById("storagehub-landing-schema");
      if (script) script.remove();
      if (metaDescription && prevDesc) {
        metaDescription.setAttribute("content", prevDesc);
      }
    };
  }, []);

  const handleScrollToSizes = (e) => {
    e.preventDefault();
    const elem = document.getElementById("storage-sizes");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <AppShell brandHref="/" showFooter={true}>
      <div className="landing-page">
        {/* ── 1. HERO SECTION ── */}
        <section className="landing-hero" aria-label="Giới thiệu StorageHub">
          <div className="landing-hero__inner">
            <div className="landing-hero__grid">
              <div className="landing-hero__content">
                {/* Main H1 with Kinetic Text Reveal */}
                <motion.h1
                  className="landing-hero__title"
                  variants={heroTitleVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.span className="hero-title-line" variants={titleLineVariants}>
                    Lưu Trữ Thông Minh
                  </motion.span>
                  <motion.span
                    className="hero-title-line landing-hero__title-accent"
                    variants={titleLineVariants}
                  >
                    Tự Quản Tuyệt Đối
                  </motion.span>
                  <motion.span className="hero-title-line" variants={titleLineVariants}>
                    Bảo Mật 24/7
                  </motion.span>
                </motion.h1>

                {/* Lead Paragraph */}
                <motion.p
                  className="landing-hero__lead"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: SOFT_EASE, delay: 0.35 }}
                >
                  Giải pháp cho thuê kho tự quản thông minh dành cho cá nhân và doanh
                  nghiệp tại TP.HCM. Đặt kho trực tuyến chỉ trong 3 phút, cọc 10% giữ
                  chỗ tức thì, chủ động ra vào 24/7 không hẹn trước với mã PIN cá
                  nhân bảo mật tuyệt đối.
                </motion.p>

                {/* Action CTAs with Hover & Tap Interactions */}
                <motion.div
                  className="landing-hero__actions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: SOFT_EASE, delay: 0.45 }}
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15, ease: SOFT_EASE }}
                  >
                    <Button
                      variant="primary"
                      size="large"
                      className="landing-hero__btn-primary"
                      onClick={() => navigate("/browse")}
                    >
                      Khám phá kho ngay
                      <ArrowRight size={18} weight="bold" />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15, ease: SOFT_EASE }}
                  >
                    <Button
                      variant="secondary"
                      size="large"
                      className="landing-hero__btn-secondary"
                      onClick={handleScrollToSizes}
                    >
                      Chọn kho nào cho hợp lí
                      <QuestionMarkIcon size={18} weight="bold" />
                    </Button>
                  </motion.div>
                </motion.div>
              </div>

              {/* Right Column: Reserved for Future Interactive Visual Slider */}
              <div className="landing-hero__visual">
                <div className="landing-hero__slider-placeholder">
                  <div className="slider-placeholder__content">
                    <div className="slider-placeholder__icon-wrap">
                      <ImageSquare size={32} weight="duotone" className="slider-placeholder__icon" />
                    </div>
                    <span className="slider-placeholder__badge">
                      ASSET // HERO SHOWCASE SLIDER
                    </span>
                    <span className="slider-placeholder__spec">
                      16:10 INTERACTIVE CAROUSEL [1920×1200]
                    </span>
                    <span className="slider-placeholder__hint">
                      Chuỗi slide ảnh cơ sở thực tế, hành lang kho sạch sẽ & thao tác mở kho 24/7
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Ribbon with Smooth Counter Numbers */}
            <div
              className="landing-hero__stats"
              role="region"
              aria-label="Thống kê cơ sở"
            >
              <div className="stat-card">
                <CounterNumber value={40} suffix="+" />
                <span className="stat-card__label">Kho đang sẵn sàng</span>
                <span className="stat-card__sub">Cơ sở Tân Bình</span>
              </div>
              <div className="stat-card">
                <CounterNumber value={100} suffix="%" />
                <span className="stat-card__label">Tự quản bằng mã PIN riêng</span>
                <span className="stat-card__sub">Không cần lễ tân</span>
              </div>
              <div className="stat-card">
                <CounterNumber value={10} suffix="%" />
                <span className="stat-card__label">Đặt cọc trực tuyến</span>
                <span className="stat-card__sub">Giữ chỗ tức thì</span>
              </div>
              <div className="stat-card">
                <motion.span
                  className="stat-card__metric"
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.5, ease: SOFT_EASE }}
                >
                  24/7
                </motion.span>
                <span className="stat-card__label">Ra vào tự do không hẹn trước</span>
                <span className="stat-card__sub">365 ngày/năm</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. STORAGE SIZES VISUAL CALCULATOR / GUIDE ── */}
        <section
          id="storage-sizes"
          className="landing-section landing-sizes"
          aria-labelledby="sizes-heading"
        >
          <div className="landing-container">
            <motion.div
              className="landing-section-header"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: SOFT_EASE }}
            >
              <h2 id="sizes-heading" className="landing-section-title landing-sizes__headline">
                Chiếc <span className="highlight-keyword">túi xách</span> nhỏ hay cả{" "}
                <span className="highlight-keyword">căn nhà</span> đều được
              </h2>
            </motion.div>

            {/* Grid 4 Unit Types with Stagger Entrance and Lift Hover */}
            <motion.div
              className="sizes-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
            >
              {STORAGE_SIZES.map((unit) => (
                <motion.article
                  key={unit.id}
                  variants={itemVariants}
                  whileHover={{
                    y: -4,
                    boxShadow: "5px 5px 0px var(--color-ink)",
                    transition: { duration: 0.15, ease: SOFT_EASE },
                  }}
                  className={`size-card ${
                    unit.badgeType === "accent" ? "size-card--featured" : ""
                  }`}
                >
                  <div className="size-card__top">
                    <div className="size-card__meta">
                      <span className="size-card__badge">{unit.badge}</span>
                      <span className="size-card__dimensions">{unit.dimensions}</span>
                    </div>
                    <h3 className="size-card__name">{unit.name}</h3>
                    <div className="size-card__area">{unit.sizeM2}</div>
                  </div>

                  {/* 3D Isometric Cutaway Visual Slot */}
                  <div className="size-card__visual-slot" aria-label={`Bản vẽ 3D minh họa ${unit.name}`}>
                    <div className="visual-placeholder visual-placeholder--size">
                      <div className="visual-placeholder__inner">
                        <div className="visual-placeholder__icon-wrap">
                          <Cube size={26} weight="duotone" className="visual-placeholder__icon" />
                        </div>
                        <div className="visual-placeholder__meta">
                          <span className="visual-placeholder__tag">{unit.visualAsset.tag}</span>
                          <span className="visual-placeholder__spec">{unit.visualAsset.spec}</span>
                        </div>
                        <p className="visual-placeholder__caption">{unit.visualAsset.caption}</p>
                      </div>
                    </div>
                  </div>

                  <div className="size-card__pricing">
                    <span className="size-card__price">{unit.priceText}</span>
                    <span className="size-card__deposit-tag">Cọc online 10%</span>
                  </div>

                  <div className="size-card__details">
                    <div className="size-card__detail-block">
                      <span className="detail-label">Phù hợp cho:</span>
                      <p className="detail-value detail-value--highlight">
                        {unit.target}
                      </p>
                    </div>

                    <div className="size-card__checklist">
                      <span className="detail-label">Tiêu chuẩn trang bị:</span>
                      <ul className="checklist-list">
                        {unit.features.map((feat, i) => (
                          <li key={i} className="checklist-item">
                            <Check size={16} weight="bold" className="check-icon" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="size-card__action">
                    <Button
                      variant={unit.badgeType === "accent" ? "primary" : "secondary"}
                      fullWidth
                      size="medium"
                      onClick={() => navigate("/browse")}
                    >
                      Tìm kho loại này
                      <ArrowRight size={16} weight="bold" />
                    </Button>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 3. WHY CHOOSE STORAGEHUB - 4 PILLARS ── */}
        <section className="landing-section landing-pillars" aria-labelledby="pillars-heading">
          <div className="landing-container">
            <motion.div
              className="landing-section-header"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: SOFT_EASE }}
            >
              <h2 id="pillars-heading" className="landing-section-title">
                Hơn <span className="highlight-keyword">1000+</span> Khách Hàng Tin Tưởng ?
              </h2>
            </motion.div>

            <motion.div
              className="pillars-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {PILLARS.map((p, idx) => {
                const IconComponent = p.icon;
                return (
                  <motion.div
                    key={idx}
                    className="pillar-card"
                    variants={itemVariants}
                    whileHover={{
                      y: -4,
                      boxShadow: "5px 5px 0px var(--color-ink)",
                      transition: { duration: 0.15, ease: SOFT_EASE },
                    }}
                  >
                    <motion.div
                      className="pillar-card__icon-wrapper"
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.05 }}
                      transition={{ duration: 0.3, ease: SOFT_EASE }}
                    >
                      <IconComponent size={28} weight="bold" />
                    </motion.div>
                    <div className="pillar-card__number">0{idx + 1}</div>
                    <h3 className="pillar-card__title">{p.title}</h3>
                    <p className="pillar-card__desc">{p.description}</p>

                    {/* Micro-Technical Schematic Slot */}
                    <div className="pillar-card__tech-slot">
                      <div className="visual-placeholder visual-placeholder--pillar">
                        <div className="visual-placeholder__pillar-header">
                          <span className="visual-placeholder__tag">{p.techTag}</span>
                          <span className="visual-placeholder__badge-mini">{p.techBadge}</span>
                        </div>
                        <span className="visual-placeholder__spec">{p.techSpec}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ── 4. 3-STEP PROCESS ── */}
        <section className="landing-section landing-steps" aria-labelledby="steps-heading">
          <div className="landing-container">
            <motion.div
              className="landing-section-header"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: SOFT_EASE }}
            >
              <h2 id="steps-heading" className="landing-section-title">
                Thuê Kho Chỉ Trong <span className="highlight-keyword">3</span> Bước
              </h2>
            </motion.div>

            <div className="steps-container-wrapper">
              {/* Connecting progress path line across 3 steps */}
              <div className="steps-connector" aria-hidden="true">
                <motion.div
                  className="steps-connector__bar"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.7, ease: SOFT_EASE, delay: 0.15 }}
                />
              </div>

              <motion.div
                className="steps-grid"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.15,
                      delayChildren: 0.1,
                    },
                  },
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
              >
                {STEPS.map((s, idx) => {
                  const StepIcon = s.visualAsset.icon;
                  return (
                    <motion.div
                      key={idx}
                      className="step-card"
                      variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.5, ease: SOFT_EASE },
                        },
                      }}
                      whileHover={{
                        y: -4,
                        boxShadow: "6px 6px 0px var(--color-ink)",
                        transition: { duration: 0.15, ease: SOFT_EASE },
                      }}
                    >
                      <div className="step-card__badge">BƯỚC {s.step}</div>
                      <h3 className="step-card__title">{s.title}</h3>
                      <p className="step-card__desc">{s.description}</p>

                      {/* Step Media Preview Placeholder */}
                      <div className="step-card__visual-slot" aria-label={`Minh họa bước ${s.step}: ${s.title}`}>
                        <div className="visual-placeholder visual-placeholder--step">
                          <div className="visual-placeholder__inner">
                            <div className="visual-placeholder__icon-wrap">
                              <StepIcon size={26} weight="duotone" className="visual-placeholder__icon" />
                            </div>
                            <div className="visual-placeholder__meta">
                              <span className="visual-placeholder__tag">{s.visualAsset.tag}</span>
                              <span className="visual-placeholder__spec">{s.visualAsset.spec}</span>
                            </div>
                            <p className="visual-placeholder__caption">{s.visualAsset.caption}</p>
                          </div>
                        </div>
                      </div>

                      <div className="step-card__footer">
                        {idx === 0 && <span className="step-sub">3D Catalog trực tuyến</span>}
                        {idx === 1 && <span className="step-sub">VietQR & Hợp đồng số</span>}
                        {idx === 2 && <span className="step-sub">Bàn giao số qua Check-in Pass</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── 5. FACILITIES SHOWCASE ── */}
        <section
          className="landing-section landing-facilities"
          aria-labelledby="facilities-heading"
        >
          <div className="landing-container">
            <motion.div
              className="landing-section-header"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: SOFT_EASE }}
            >
              <h2 id="facilities-heading" className="landing-section-title">
                vị trí giao thông <span className="highlight-keyword">huyết mạch TP.HCM</span>
              </h2>
            </motion.div>

            <motion.div
              className="facilities-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {/* Cơ sở Tân Bình */}
              <motion.article
                className="facility-card facility-card--active"
                variants={{
                  hidden: { opacity: 0, scale: 0.97, y: 20 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: SOFT_EASE },
                  },
                }}
                whileHover={{
                  y: -4,
                  boxShadow: "6px 6px 0px var(--color-ink)",
                  transition: { duration: 0.15, ease: SOFT_EASE },
                }}
              >
                <div className="facility-card__header">
                  <span className="facility-badge facility-badge--active">
                    <span className="status-dot-pulse-mini" aria-hidden="true" />
                    Đang hoạt động
                  </span>
                  <span className="facility-card__code">SGN-TB01</span>
                </div>

                {/* High-Impact Visual Slot: Tân Bình Facade & Loading Bay */}
                <div className="facility-card__visual-slot" aria-label="Hình ảnh cơ sở Tân Bình">
                  <div className="visual-placeholder visual-placeholder--facility">
                    <div className="visual-placeholder__inner">
                      <div className="visual-placeholder__icon-wrap">
                        <Camera size={30} weight="duotone" className="visual-placeholder__icon" />
                      </div>
                      <div className="visual-placeholder__meta">
                        <span className="visual-placeholder__tag">ASSET // FACILITY PHOTOGRAPHY</span>
                        <span className="visual-placeholder__spec">FACADE & 5T LOADING BAY [16:9 · 1920×1080]</span>
                      </div>
                      <p className="visual-placeholder__caption">
                        Ảnh chụp thực tế mặt tiền 123 Hoàng Văn Thụ, sảnh đỗ xe tải 5 tấn & hệ thống cửa cuốn tự động 24/7
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="facility-card__name">Cơ sở Tân Bình</h3>
                <div className="facility-card__address">
                  <MapPin size={18} weight="bold" className="icon-red" />
                  <span>123 Hoàng Văn Thụ, Phường 2, Quận Tân Bình, TP.HCM</span>
                </div>
                <div className="facility-card__specs">
                  <div className="spec-row">
                    <Clock size={16} weight="bold" />
                    <span>Giờ mở cửa: 24/7/365 liên tục</span>
                  </div>
                  <div className="spec-row">
                    <Truck size={16} weight="bold" />
                    <span>Gần sân bay Tân Sơn Nhất, đường xe tải 5 tấn đỗ tận cửa</span>
                  </div>
                  <div className="spec-row">
                    <Elevator size={16} weight="bold" />
                    <span>Thang máy hàng tải trọng 2 tấn, xe nâng tay hỗ trợ tại chỗ</span>
                  </div>
                  <div className="spec-row">
                    <Warehouse size={16} weight="bold" />
                    <span>Quy mô 40 kho tự quản sẵn sàng đón khách ngay hôm nay</span>
                  </div>
                </div>
                <div className="facility-card__footer">
                  <Button
                    variant="primary"
                    size="medium"
                    fullWidth
                    onClick={() => navigate("/browse")}
                  >
                    Xem kho tại cơ sở này
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </div>
              </motion.article>

              {/* Cơ sở Quận 7 */}
              <motion.article
                className="facility-card facility-card--upcoming"
                variants={{
                  hidden: { opacity: 0, scale: 0.97, y: 20 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: SOFT_EASE, delay: 0.1 },
                  },
                }}
                whileHover={{
                  y: -4,
                  boxShadow: "6px 6px 0px var(--color-ink)",
                  transition: { duration: 0.15, ease: SOFT_EASE },
                }}
              >
                <div className="facility-card__header">
                  <span className="facility-badge facility-badge--upcoming">
                    ▲ Sắp khai trương
                  </span>
                  <span className="facility-card__code">SGN-Q702</span>
                </div>

                {/* High-Impact Visual Slot: Quận 7 Concept Render */}
                <div className="facility-card__visual-slot" aria-label="Phối cảnh cơ sở Quận 7">
                  <div className="visual-placeholder visual-placeholder--facility">
                    <div className="visual-placeholder__inner">
                      <div className="visual-placeholder__icon-wrap">
                        <Buildings size={30} weight="duotone" className="visual-placeholder__icon" />
                      </div>
                      <div className="visual-placeholder__meta">
                        <span className="visual-placeholder__tag">ASSET // ARCHITECTURAL CGI</span>
                        <span className="visual-placeholder__spec">CONCEPT RENDERING [16:9 · 1920×1080]</span>
                      </div>
                      <p className="visual-placeholder__caption">
                        Bản vẽ phối cảnh 3D kiến trúc cơ sở thông minh Nam Sài Gòn, hệ thống kho vi khí hậu nhiệt-ẩm tiêu chuẩn cao
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="facility-card__name">Cơ sở Quận 7</h3>
                <div className="facility-card__address">
                  <MapPin size={18} weight="bold" className="icon-muted" />
                  <span>Khu đô thị Phú Mỹ Hưng, Quận 7, TP.HCM</span>
                </div>
                <div className="facility-card__specs">
                  <div className="spec-row">
                    <Clock size={16} weight="bold" />
                    <span>Dự kiến khai trương: Quý 4 / 2026</span>
                  </div>
                  <div className="spec-row">
                    <Buildings size={16} weight="bold" />
                    <span>Trung tâm tài chính Nam Sài Gòn, giao thông Nguyễn Văn Linh</span>
                  </div>
                  <div className="spec-row">
                    <ShieldCheck size={16} weight="bold" />
                    <span>Tiêu chuẩn kho lạnh & kiểm soát vi khí hậu nhiệt-ẩm cao cấp</span>
                  </div>
                  <div className="spec-row">
                    <Warehouse size={16} weight="bold" />
                    <span>Quy mô dự kiến 120+ khoang tự quản công nghệ mới</span>
                  </div>
                </div>
                <div className="facility-card__footer">
                  <Button
                    variant="secondary"
                    size="medium"
                    fullWidth
                    onClick={() => navigate("/support")}
                  >
                    Đăng ký nhận thông tin ưu đãi
                    <InfoIcon size={16} weight="bold" />
                  </Button>
                </div>
              </motion.article>
            </motion.div>
          </div>
        </section>

        {/* ── 6. INTERACTIVE FAQ ACCORDION (With AnimatePresence Height Transition) ── */}
        <section className="landing-section landing-faq" aria-labelledby="faq-heading">
          <div className="landing-container">
            <motion.div
              className="landing-section-header"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: SOFT_EASE }}
            >
              <h2 id="faq-heading" className="landing-section-title">
                Câu Hỏi Thường Gặp
              </h2>
              <p className="landing-section-subtitle">
                Mọi thông tin bạn cần biết trước khi bắt đầu thuê kho tại StorageHub.
              </p>
            </motion.div>

            <div className="faq-accordion" role="region" aria-label="Danh sách câu hỏi thường gặp">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className={`faq-item ${isOpen ? "faq-item--open" : ""}`}
                  >
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      id={`faq-question-${index}`}
                    >
                      <span className="faq-question-index">0{index + 1}.</span>
                      <span className="faq-question-text">{item.q}</span>
                      <motion.span
                        className="faq-question-icon"
                        aria-hidden="true"
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: SOFT_EASE }}
                      >
                        <CaretDown size={20} weight="bold" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`faq-answer-${index}`}
                          role="region"
                          aria-labelledby={`faq-question-${index}`}
                          className="faq-answer-wrapper"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: SOFT_EASE }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="faq-answer">
                            <p>{item.a}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 7. HIGH-IMPACT BOTTOM CTA BANNER ── */}
        <section
          className="landing-cta-banner"
          aria-label="Kêu gọi hành động thuê kho"
        >
          <motion.div
            className="landing-container landing-cta-banner__inner"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: SOFT_EASE }}
          >
            <div className="landing-cta-banner__badge">
              <LockSimple size={16} weight="bold" />
              <span>GIẢI PHÁP LƯU TRỮ SỐ 1 TP.HCM</span>
            </div>
            <h2 className="landing-cta-banner__title">
              Giải Phóng Không Gian Ngay Hôm Nay
            </h2>
            <p className="landing-cta-banner__desc">
              Đăng ký thuê kho tự quản thông minh chỉ từ 100.000 đ/tháng. Đặt cọc
              online 10% nhận ngay mã PIN cá nhân ra vào 24/7.
            </p>
            <motion.div
              className="landing-cta-banner__actions"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: SOFT_EASE }}
            >
              <Button
                variant="primary"
                size="large"
                className="cta-banner-btn"
                onClick={() => navigate("/browse")}
              >
                Khám phá tất cả 40 kho ngay
                <ArrowRight size={20} weight="bold" />
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </AppShell>
  );
}
