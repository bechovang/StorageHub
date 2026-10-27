import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  ArrowRight,
  ShieldCheck,
  Key,
  Receipt,
  FileText,
  Warehouse,
  Check,
  CaretDown,
  CaretUp,
  MapPin,
  Clock,
  InfoIcon,
  Truck,
  Elevator,
  LockSimple,
  Question,
  QuestionMarkIcon,
  Buildings,
  ArrowsDownUp,
  Package,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import Button from "../../components/Button/Button.jsx";
import "./LandingPage.css";

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
  },
];

// ── 4 Trụ cột giá trị StorageHub ──
const PILLARS = [
  {
    icon: Key,
    title: "Mã PIN cá nhân 100%",
    description:
      "Mở kho tức thì bằng bàn phím số riêng biệt, chủ động 24/7 không cần chờ lễ tân hay bảo vệ. Bạn là người duy nhất sở hữu mã mở cửa",
  },
  {
    icon: Receipt,
    title: "Cọc chỉ 10% & Minh bạch",
    description:
      "Không phát sinh phụ phí ẩn. Chỉ cọc 10% để xác nhận giữ kho. Hoàn cọc tự động qua tài khoản ngân hàng trong 24h sau khi kiểm tra trả kho",
  },
  {
    icon: ShieldCheck,
    title: "An ninh & PCCC đa lớp",
    description:
      "Hệ thống camera giám sát liên tục 24/7, đầu dò khói nhiệt PCCC tiêu chuẩn và kiểm soát độ ẩm chống ẩm mốc hư hại hàng hóa tuyệt đối",
  },
  {
    icon: FileText,
    title: "Hợp đồng số & Bàn giao ảnh",
    description:
      "Mọi lịch sử nhận/trả kho đều được chụp ảnh đối soát minh bạch qua Thẻ nhận kho kỹ thuật số và hợp đồng điện tử có giá trị pháp lý",
  },
];

// ── 3 Bước thuê kho ──
const STEPS = [
  {
    step: "01",
    title: "Chọn kho trực tuyến",
    description:
      "Khám phá sơ đồ kho 3D trực quan, lọc diện tích từ 1.5m² đến 16m² phù hợp chính xác ngân sách và lượng đồ đạc của bạn",
  },
  {
    step: "02",
    title: "Đặt cọc 10% & Nhận PIN",
    description:
      "Thanh toán cọc 10% an toàn trực tuyến. Hệ thống lập tức kích hoạt hợp đồng điện tử và cấp mã PIN mở kho riêng cho bạn",
  },
  {
    step: "03",
    title: "Tự do mở kho 24/7",
    description:
      "Đến cơ sở bất kỳ lúc nào ngày hay đêm, nhập mã PIN tại cửa ra vào và ô kho. Quản lý kho hoàn toàn chủ động và riêng tư",
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
            {/* Main H1 */}
            <h1 className="landing-hero__title">
              Lưu Trữ Thông Minh.
              <br />
              <span className="landing-hero__title-accent">Tự Quản Tuyệt Đối.</span>
              <br />
              Bảo Mật 24/7.
            </h1>

            {/* Lead Paragraph */}
            <p className="landing-hero__lead">
              Giải pháp cho thuê kho tự quản thông minh dành cho cá nhân và doanh
              nghiệp tại TP.HCM. Đặt kho trực tuyến chỉ trong 3 phút, cọc 10% giữ
              chỗ tức thì, chủ động ra vào 24/7 không hẹn trước với mã PIN cá
              nhân bảo mật tuyệt đối.
            </p>

            {/* Action CTAs */}
            <div className="landing-hero__actions">
              <Button
                variant="primary"
                size="large"
                className="landing-hero__btn-primary"
                onClick={() => navigate("/browse")}
              >
                Khám phá kho ngay
                <ArrowRight size={18} weight="bold" />
              </Button>
              <Button
                variant="secondary"
                size="large"
                className="landing-hero__btn-secondary"
                onClick={handleScrollToSizes}
              >
                Chọn kho nào cho hợp lí
                <QuestionMarkIcon size={18} weight="bold" />
              </Button>
            </div>

            {/* Quick Stats Ribbon (4 metric cards) */}
            <div className="landing-hero__stats" role="region" aria-label="Thống kê cơ sở">
              <div className="stat-card">
                <span className="stat-card__metric">40+</span>
                <span className="stat-card__label">Kho đang sẵn sàng</span>
                <span className="stat-card__sub">Cơ sở Tân Bình</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__metric">100%</span>
                <span className="stat-card__label">Tự quản bằng mã PIN riêng</span>
                <span className="stat-card__sub">Không cần lễ tân</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__metric">10%</span>
                <span className="stat-card__label">Đặt cọc trực tuyến</span>
                <span className="stat-card__sub">Giữ chỗ tức thì</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__metric">24/7</span>
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
            <div className="landing-section-header">
              <h2 id="sizes-heading" className="landing-section-title landing-sizes__headline">
                Chiếc <span className="highlight-keyword">túi xách</span> nhỏ hay cả{" "}
                <span className="highlight-keyword">căn nhà</span> đều được
              </h2>
            </div>

            {/* Grid 4 Unit Types */}
            <div className="sizes-grid">
              {STORAGE_SIZES.map((unit) => (
                <article
                  key={unit.id}
                  className={`size-card ${unit.badgeType === "accent" ? "size-card--featured" : ""
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
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. WHY CHOOSE STORAGEHUB - 4 PILLARS ── */}
        <section className="landing-section landing-pillars" aria-labelledby="pillars-heading">
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 id="pillars-heading" className="landing-section-title">
                Hơn <span className="highlight-keyword">1000+</span> Khách Hàng Tin Tưởng ?
              </h2>
            </div>

            <div className="pillars-grid">
              {PILLARS.map((p, idx) => {
                const IconComponent = p.icon;
                return (
                  <div key={idx} className="pillar-card">
                    <div className="pillar-card__icon-wrapper">
                      <IconComponent size={28} weight="bold" />
                    </div>
                    <div className="pillar-card__number">0{idx + 1}</div>
                    <h3 className="pillar-card__title">{p.title}</h3>
                    <p className="pillar-card__desc">{p.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 4. 3-STEP PROCESS ── */}
        <section className="landing-section landing-steps" aria-labelledby="steps-heading">
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 id="steps-heading" className="landing-section-title">
                Thuê Kho Chỉ Trong <span className="highlight-keyword">3</span> Bước
              </h2>
            </div>

            <div className="steps-grid">
              {STEPS.map((s, idx) => (
                <div key={idx} className="step-card">
                  <div className="step-card__badge">BƯỚC {s.step}</div>
                  <h3 className="step-card__title">{s.title}</h3>
                  <p className="step-card__desc">{s.description}</p>
                  <div className="step-card__footer">
                    {idx === 0 && <span className="step-sub">3D Catalog trực tuyến</span>}
                    {idx === 1 && <span className="step-sub">VietQR & Hợp đồng số</span>}
                    {idx === 2 && <span className="step-sub">Bàn giao số qua Check-in Pass</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. FACILITIES SHOWCASE ── */}
        <section
          className="landing-section landing-facilities"
          aria-labelledby="facilities-heading"
        >
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 id="facilities-heading" className="landing-section-title">
                vị trí giao thông <span className="highlight-keyword">huyết mạch TP.HCM</span>
              </h2>
            </div>

            <div className="facilities-grid">
              {/* Cơ sở Tân Bình */}
              <article className="facility-card facility-card--active">
                <div className="facility-card__header">
                  <span className="facility-badge facility-badge--active">
                    ● Đang hoạt động
                  </span>
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
              </article>

              {/* Cơ sở Quận 7 */}
              <article className="facility-card facility-card--upcoming">
                <div className="facility-card__header">
                  <span className="facility-badge facility-badge--upcoming">
                    ▲ Sắp khai trương
                  </span>
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
              </article>
            </div>
          </div>
        </section>

        {/* ── 6. INTERACTIVE FAQ ACCORDION ── */}
        <section className="landing-section landing-faq" aria-labelledby="faq-heading">
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 id="faq-heading" className="landing-section-title">
                Câu Hỏi Thường Gặp
              </h2>
              <p className="landing-section-subtitle">
                Mọi thông tin bạn cần biết trước khi bắt đầu thuê kho tại StorageHub.
              </p>
            </div>

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
                      <span className="faq-question-icon" aria-hidden="true">
                        {isOpen ? (
                          <CaretUp size={20} weight="bold" />
                        ) : (
                          <CaretDown size={20} weight="bold" />
                        )}
                      </span>
                    </button>
                    {isOpen && (
                      <div
                        id={`faq-answer-${index}`}
                        role="region"
                        aria-labelledby={`faq-question-${index}`}
                        className="faq-answer"
                      >
                        <p>{item.a}</p>
                      </div>
                    )}
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
          <div className="landing-container landing-cta-banner__inner">
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
            <div className="landing-cta-banner__actions">
              <Button
                variant="primary"
                size="large"
                className="cta-banner-btn"
                onClick={() => navigate("/browse")}
              >
                Khám phá tất cả 40 kho ngay
                <ArrowRight size={20} weight="bold" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
