import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ShieldCheck,
  Lock,
  Package,
  ShareNetwork,
  Copy,
  Check,
  CalendarCheck,
  Info,
  Warehouse,
  ArrowsOutCardinal,
  Key,
  Truck,
  Sparkle,
  Thermometer,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";

import { Header, Footer, Badge, Button } from "../../components";
import { useAuth } from "../../context/AuthContext";
import { getUnitDetail, getUnitQuote } from "../../services/unitService";
import "./UnitDetailPage.css";

const formatVnd = (amount) =>
  `${new Intl.NumberFormat("vi-VN").format(Math.round(amount || 0))} ₫`;

const formatDate = (isoDate) => {
  if (!isoDate) return "";
  try {
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${isoDate}T00:00:00`));
  } catch {
    return isoDate;
  }
};

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

/**
 * Ảnh placeholder duy nhất dự phòng khi kho chưa có ảnh thật hoặc ảnh tải thất bại
 */
const PLACEHOLDER_UNIT_IMAGE = "/placeholder.svg";

/**
 * ── Image Slider Trình chiếu ảnh kho (Hỗ trợ ảnh thật & fallback về 1 ảnh placeholder) ──
 */
function UnitImageSlider({ photos = [], typeName = "Tiêu chuẩn", sizeM2 = 5 }) {
  const rawPhotos = Array.isArray(photos) ? photos.filter(Boolean) : [];
  const [failedUrls, setFailedUrls] = useState(new Set());
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset failedUrls khi prop photos đổi
  useEffect(() => {
    setFailedUrls(new Set());
    setCurrentSlide(0);
  }, [photos]);

  // Lọc bỏ những URL ảnh thật đã bị lỗi tải
  const validRealPhotos = rawPhotos.filter((url) => !failedUrls.has(url));

  // Nếu còn ảnh thật tải được thì dùng danh sách đó, ngược lại hiển thị ĐÚNG 1 TẤM ẢNH PLACEHOLDER duy nhất
  const displayPhotos =
    validRealPhotos.length > 0 ? validRealPhotos : [PLACEHOLDER_UNIT_IMAGE];
  const totalSlides = displayPhotos.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const handleKeyDown = (e) => {
    if (totalSlides <= 1) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    }
  };

  const handleImageError = (url) => {
    setFailedUrls((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  return (
    <div
      className="unit-slider"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Hình ảnh không gian kho"
    >
      <div className="unit-slider__viewport">
        <div
          className="unit-slider__track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {displayPhotos.map((src, idx) => (
            <div key={`${src}-${idx}`} className="unit-slider__slide">
              <img
                src={src}
                alt={`Kho ${typeName} ${sizeM2} m² - Hình ảnh ${idx + 1}`}
                className="unit-slider__img"
                onError={() => handleImageError(src)}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Nút điều hướng Trước / Kế tiếp (Chỉ hiển thị khi có từ 2 ảnh thật trở lên) */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              className="unit-slider__nav-btn unit-slider__nav-btn--prev"
              onClick={prevSlide}
              aria-label="Ảnh trước"
            >
              <CaretLeft size={20} weight="bold" />
            </button>

            <button
              type="button"
              className="unit-slider__nav-btn unit-slider__nav-btn--next"
              onClick={nextSlide}
              aria-label="Ảnh kế tiếp"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </>
        )}

        {/* Thanh chỉ báo số ảnh và bước chuyển chuẩn Swiss Grid (Chỉ hiển thị khi có từ 2 ảnh thật trở lên) */}
        {totalSlides > 1 && (
          <div className="unit-slider__indicator" role="tablist" aria-label="Chỉ số ảnh kho">
            <span className="unit-slider__counter">
              0{currentSlide + 1} / 0{totalSlides}
            </span>
            <div className="unit-slider__steps">
              {displayPhotos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`unit-slider__step ${idx === currentSlide ? "is-active" : ""}`}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Xem ảnh ${idx + 1}`}
                  role="tab"
                  aria-selected={idx === currentSlide}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnitDetailPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Bộ chọn thời gian thuê
  const [durationMonths, setDurationMonths] = useState(3);
  const [startDate, setStartDate] = useState(getTomorrowDate());

  // Bảng giá minh bạch tính từ PricingEngine theo Rental Policy v3
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // 1. Tải thông tin chi tiết của kho
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getUnitDetail(unitId)
      .then((data) => {
        if (isMounted) {
          setUnit(data);
          if (data.availability?.availableFromDate) {
            setStartDate(data.availability.availableFromDate);
          }
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải chi tiết kho:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [unitId]);

  // 2. Tính toán bảng giá minh bạch khi thay đổi ngày hoặc thời hạn thuê
  const fetchQuote = useCallback(async (currentUnitId, date, months) => {
    if (!currentUnitId) return;
    setQuoteLoading(true);
    try {
      const q = await getUnitQuote(currentUnitId, {
        startDate: date,
        durationMonths: months,
      });
      setQuote(q);
    } catch (err) {
      console.error("Lỗi khi tính toán bảng giá:", err);
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (unit?.id) {
      fetchQuote(unit.id, startDate, durationMonths);
    }
  }, [unit?.id, startDate, durationMonths, fetchQuote]);

  // Xử lý sao chép liên kết chia sẻ
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Điều hướng sang trang thanh toán / đặt kho
  const handleBookNow = () => {
    const params = new URLSearchParams({
      startDate,
      durationMonths: String(durationMonths),
    });
    navigate(`/units/${unitId}/book?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="unit-detail-page">
        <Header
          brandName="STORAGEHUB"
          brandHref="/browse"
          roleLabel="KHÁCH HÀNG"
          navLinks={[
            { label: "Tìm thuê kho", href: "/browse" },
            { label: "Kho của tôi", href: "/rentals" },
            { label: "Hỗ trợ", href: "#support" },
          ]}
        />
        <main
          className="unit-detail-container"
          style={{ padding: "80px 0", textAlign: "center" }}
        >
          <p style={{ color: "var(--color-secondary)" }}>
            Đang tải thông số và bảng giá kho...
          </p>
        </main>
        <Footer
          leftText="STORAGEHUB / CƠ SỞ TÂN BÌNH — HỆ THỐNG KHO TỰ QUẢN"
          rightText="PHIÊN BẢN 1.0 · 2026"
        />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="unit-detail-page">
        <Header
          brandName="STORAGEHUB"
          brandHref="/browse"
          roleLabel="KHÁCH HÀNG"
        />
        <main
          className="unit-detail-container"
          style={{ padding: "80px 0", textAlign: "center" }}
        >
          <h2>Không tìm thấy thông tin kho lưu trữ</h2>
          <p style={{ color: "var(--color-secondary)", margin: "16px 0 24px" }}>
            Mã kho này không tồn tại hoặc đã được cập nhật lại trạng thái quản
            lý.
          </p>
          <Button variant="primary" onClick={() => navigate("/browse")}>
            Quay lại danh sách kho
          </Button>
        </main>
        <Footer
          leftText="STORAGEHUB / CƠ SỞ TÂN BÌNH — HỆ THỐNG KHO TỰ QUẢN"
          rightText="PHIÊN BẢN 1.0 · 2026"
        />
      </div>
    );
  }

  const rawStatus =
    typeof unit.availability === "object"
      ? unit.availability?.status
      : unit.availability;
  const isSoon =
    rawStatus === "AVAILABLE_SOON" ||
    rawStatus === "soon" ||
    rawStatus === "PREPARING";
  const availableDate =
    typeof unit.availability === "object"
      ? unit.availability?.availableFromDate
      : unit.availableFrom;

  const typeLabel = unit.typeName || unit.type || "Tiêu chuẩn";
  const facilityLabel = unit.facilityName || "Cơ sở Tân Bình (VN-SGN-01)";
  const monthlyRent = unit.baseMonthlyRent || unit.monthlyPrice || 345000;
  const volumeM3 = (unit.sizeM2 * 2.8).toFixed(1);

  // Dữ liệu bảng giá minh bạch
  const totalRent = quote ? quote.totalRent : monthlyRent * durationMonths;
  const depositAmount = quote
    ? quote.depositAmount
    : Math.round((totalRent * 10) / 100);
  const dueNow = quote ? quote.dueNow : depositAmount;
  const endDate = quote ? quote.endDate : "";
  const policyVersion = quote?.policyVersion || "v3";

  return (
    <div className="unit-detail-page">
      {/* ── 1. Top Navigation Header ── */}
      <Header
        brandName="STORAGEHUB"
        brandHref="/browse"
        roleLabel="KHÁCH HÀNG"
        avatarText={
          user?.fullName ? user.fullName.trim().charAt(0).toUpperCase() : "KH"
        }
        navLinks={[
          { label: "Tìm thuê kho", href: "/browse", active: true },
          { label: "Kho của tôi", href: "/rentals" },
          { label: "Hỗ trợ", href: "#support" },
        ]}
      />

      <main className="unit-detail-container">
        {/* ── 2. Breadcrumbs & Header Strip ── */}
        <section className="unit-detail-breadcrumb-bar">
          <div className="unit-detail-breadcrumbs">
            <Link to="/browse" className="unit-detail-back-link">
              <ArrowLeft size={16} weight="bold" />
              <span>Tìm thuê kho</span>
            </Link>
            <span className="unit-detail-sep">/</span>
            <span className="unit-detail-crumb-current">
              Gói {typeLabel} ({unit.sizeM2} m²)
            </span>
          </div>

          <div className="unit-detail-quick-actions">
            <button
              type="button"
              className="unit-detail-share-btn"
              onClick={handleCopyLink}
              title="Sao chép liên kết"
            >
              {copiedLink ? (
                <Check size={16} color="#16a34a" weight="bold" />
              ) : (
                <ShareNetwork size={16} />
              )}
              <span>{copiedLink ? "Đã sao chép!" : "Chia sẻ"}</span>
            </button>
          </div>
        </section>

        {/* ── 3. Title & Status Banner ── */}
        <section className="unit-detail-banner">
          <div>
            <div className="unit-detail-title-row">
              <h1 className="unit-detail-title">
                Kho {typeLabel} · {unit.sizeM2} m²
              </h1>
              <Badge tone={isSoon ? "warning" : "success"}>
                {isSoon ? "Sắp khả dụng" : "Đang trống · Nhận kho ngay"}
              </Badge>
            </div>
            <p className="unit-detail-meta">
              {facilityLabel} · Thể tích chứa ~{volumeM3} m³ · Bàn giao tự quản
              với mã số PIN 24/7
            </p>
          </div>

          <div className="unit-detail-depot-tag">
            <span>CƠ SỞ: VN-SGN-01</span>
          </div>
        </section>

        {/* ── 4. Hai cột cấu trúc (7 cols : 5 cols / Swiss Grid) ── */}
        <div className="unit-detail-layout">
          {/* ═══════════ CỘT TRÁI: HÌNH ẢNH & THÔNG SỐ CƠ SỞ (7 COLS) ═══════════ */}
          <div className="unit-detail-left-col">
            {/* Slider hình ảnh kho - thuần ảnh, không mô tả */}
            <article className="unit-detail-card unit-detail-slider-card">
              <UnitImageSlider
                photos={unit.photoUrls?.length ? unit.photoUrls : unit.photoUrl ? [unit.photoUrl] : []}
                sizeM2={unit.sizeM2}
                typeName={typeLabel}
              />
            </article>

            {/* Thông số kỹ thuật không gian kho */}
            <article className="unit-detail-card">
              <div className="unit-detail-card__header">
                <h2 className="unit-detail-card__title">
                  THÔNG SỐ KỸ THUẬT PHÒNG KHO
                </h2>
                <span className="unit-detail-badge-mono">TIÊU CHUẨN ISO</span>
              </div>
              <div className="unit-detail-card__body">
                <dl className="spec-list">
                  <div className="spec-row">
                    <dt>Diện tích sàn sử dụng</dt>
                    <dd style={{ fontWeight: 700 }}>{unit.sizeM2} m²</dd>
                  </div>
                  <div className="spec-row">
                    <dt>Thể tích chứa ước tính</dt>
                    <dd>~{volumeM3} m³ (trần cao 2.8m thông thoáng)</dd>
                  </div>
                  <div className="spec-row">
                    <dt>Kích thước chuẩn (Dài × Rộng × Cao)</dt>
                    <dd>{unit.dimensions || "2.0 × 2.5 × 2.8 m"}</dd>
                  </div>
                  <div className="spec-row">
                    <dt>Cơ chế truy cập & Khóa</dt>
                    <dd>
                      Cửa cuốn thép dập gân + Bảng số PIN điện tử riêng 24/7
                    </dd>
                  </div>
                  <div className="spec-row">
                    <dt>Hệ thống giám sát</dt>
                    <dd>
                      Camera CCTV 24/7 toàn hành lang + Cảm biến chuyển động
                    </dd>
                  </div>
                  <div className="spec-row">
                    <dt>Tải trọng sàn kỹ thuật</dt>
                    <dd>
                      500 kg/m² (đạt chuẩn chứa pallet & hàng gia dụng nặng)
                    </dd>
                  </div>
                  <div className="spec-row">
                    <dt>Vị trí trong kho</dt>
                    <dd>
                      Tòa nhà B · Tầng {unit.floor || 1} · Khu{" "}
                      {unit.zoneCode || "A"}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>

            {/* Tiêu chuẩn vận hành cơ sở (Facility Operational Standards) */}
            <article className="unit-detail-card">
              <div className="unit-detail-card__header">
                <h2 className="unit-detail-card__title">
                  TIÊU CHUẨN VẬN HÀNH CƠ SỞ (RENTAL POLICY V3)
                </h2>
                <span className="unit-detail-badge-mono">
                  HIỆU LỰC TOÀN HỆ THỐNG
                </span>
              </div>
              <div className="unit-detail-card__body">
                <div className="facility-standards-grid">
                  <div className="standard-item">
                    <div className="standard-item__icon">
                      <Thermometer size={20} weight="bold" />
                    </div>
                    <div>
                      <strong>Kiểm soát nhiệt ẩm 24/7</strong>
                      <p>
                        Duy trì 22°C - 24°C, độ ẩm &lt; 55% bảo vệ hàng điện tử,
                        hồ sơ, đồ gỗ.
                      </p>
                    </div>
                  </div>

                  <div className="standard-item">
                    <div className="standard-item__icon">
                      <Key size={20} weight="bold" />
                    </div>
                    <div>
                      <strong>Tự quản bằng mã PIN riêng</strong>
                      <p>
                        Không qua trung gian, nhận mã PIN số bảo mật kích hoạt
                        ngay khi cọc.
                      </p>
                    </div>
                  </div>

                  <div className="standard-item">
                    <div className="standard-item__icon">
                      <Truck size={20} weight="bold" />
                    </div>
                    <div>
                      <strong>Khu bốc dỡ & Thang nâng 3 tấn</strong>
                      <p>
                        Sân đỗ xe tải trực tiếp, thang nâng hàng chuyên dụng
                        cách cửa kho 15m.
                      </p>
                    </div>
                  </div>

                  <div className="standard-item">
                    <div className="standard-item__icon">
                      <Sparkle size={20} weight="bold" />
                    </div>
                    <div>
                      <strong>Khử khuẩn & Đệm bàn giao sạch</strong>
                      <p>
                        Quy trình vệ sinh ozone và kiểm tra kỹ thuật trước mỗi
                        đợt bàn giao.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* ═══════════ CỘT PHẢI: BẢNG GIÁ MINH BẠCH & DỰ TOÁN THUÊ (5 COLS) ═══════════ */}
          <aside className="unit-detail-right-col">
            <div className="unit-detail-pricing-panel">
              {/* Header bảng giá */}
              <div className="pricing-panel-header">
                <div>
                  <h2 className="pricing-panel-title">BẢNG GIÁ</h2>
                  <p className="pricing-panel-sub">
                    Chính sách: Rental Policy {policyVersion} (Hiệu lực 2026)
                  </p>
                </div>
              </div>

              {/* Bộ chọn thời gian thuê (Lease Duration Selector) */}
              <div className="pricing-selector-group">
                <label
                  htmlFor="duration-select"
                  className="pricing-selector-label"
                >
                  THỜI HẠN THUÊ CAM KẾT
                </label>
                <div className="pricing-duration-buttons">
                  {[
                    { months: 1, label: "1 tháng", hint: "Linh hoạt" },
                    { months: 3, label: "3 tháng", hint: "Phổ biến" },
                    { months: 6, label: "6 tháng", hint: "Tiết kiệm 5%" },
                    { months: 12, label: "12 tháng", hint: "Ưu đãi 10%" },
                  ].map((item) => (
                    <button
                      key={item.months}
                      type="button"
                      className={`pricing-duration-btn ${durationMonths === item.months ? "is-selected" : ""}`}
                      onClick={() => setDurationMonths(item.months)}
                    >
                      <span className="pricing-duration-btn__months">
                        {item.label}
                      </span>
                      <span className="pricing-duration-btn__hint">
                        {item.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bộ chọn ngày nhận kho (Start Date) */}
              <div className="pricing-selector-group">
                <label
                  htmlFor="start-date-input"
                  className="pricing-selector-label"
                >
                  NGÀY BẮT ĐẦU THUÊ DỰ KIẾN
                </label>
                <input
                  id="start-date-input"
                  type="date"
                  className="pricing-date-input"
                  value={startDate}
                  min={
                    isSoon && availableDate ? availableDate : getTomorrowDate()
                  }
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {endDate && (
                  <p className="pricing-cycle-hint">
                    <CalendarCheck size={14} weight="bold" />
                    <span>
                      Chu kỳ thuê: <strong>{formatDate(startDate)}</strong> →{" "}
                      <strong>{formatDate(endDate)}</strong> ({durationMonths}{" "}
                      tháng)
                    </span>
                  </p>
                )}
              </div>

              <div className="pricing-divider" />

              {/* ── TỪNG DÒNG CHI PHÍ THEO RENTAL POLICY ĐANG HIỆU LỰC ── */}
              <div className="pricing-breakdown-list">
                <span className="pricing-breakdown-heading">
                  CHI TIẾT DÒNG TIỀN (RENTAL POLICY {policyVersion})
                </span>

                {/* 1. Dòng tiền thuê cơ bản: Rent × Duration */}
                <div className="pricing-breakdown-row">
                  <div className="pricing-row-left">
                    <span className="pricing-row-label">Tiền thuê kho</span>
                    <span className="pricing-row-sub">
                      {formatVnd(monthlyRent)}/tháng × {durationMonths} tháng
                    </span>
                  </div>
                  <strong className="pricing-row-amount">
                    {formatVnd(totalRent)}
                  </strong>
                </div>

                {/* 2. Dòng phụ thu: Phí quản lý cơ sở & bảo trì */}
                <div className="pricing-breakdown-row">
                  <div className="pricing-row-left">
                    <span className="pricing-row-label">
                      Phí dịch vụ & giám sát an ninh 24/7
                    </span>
                    <span className="pricing-row-sub">
                      Rental Policy {policyVersion}
                    </span>
                  </div>
                  <span className="pricing-row-status is-included">
                    Bao gồm (0 ₫)
                  </span>
                </div>

                {/* 3. Dòng phụ thu: Bảo hiểm tài sản lưu trữ */}
                <div className="pricing-breakdown-row">
                  <div className="pricing-row-left">
                    <span className="pricing-row-label">
                      Bảo hiểm tài sản tiêu chuẩn
                    </span>
                    <span className="pricing-row-sub">
                      Gói bảo vệ hàng hóa cơ bản
                    </span>
                  </div>
                  <span className="pricing-row-status is-included">
                    Bao gồm (0 ₫)
                  </span>
                </div>

                {/* 4. Dòng phụ thu: Cấp mã số PIN khoá điện tử */}
                <div className="pricing-breakdown-row">
                  <div className="pricing-row-left">
                    <span className="pricing-row-label">
                      Khởi tạo mã PIN khoá tự quản
                    </span>
                    <span className="pricing-row-sub">
                      Cấp phát tự động tức thời
                    </span>
                  </div>
                  <div className="pricing-row-waived">
                    <del>50.000 ₫</del>
                    <span className="pricing-row-status is-included">
                      Miễn phí (0 ₫)
                    </span>
                  </div>
                </div>

                {/* 5. Tổng giá trị hợp đồng thuê */}
                <div className="pricing-total-contract-row">
                  <span>Tổng giá trị tiền thuê ({durationMonths} tháng):</span>
                  <strong>{formatVnd(totalRent)}</strong>
                </div>
              </div>

              {/* ── HỘP TẬP TRUNG TIỀN CỌC KÈM NHÃN REFUNDABLE (HOÀN LẠI) ── */}
              <div className="pricing-deposit-box">
                <div className="deposit-box-header">
                  <div className="deposit-box-title-wrap">
                    <ShieldCheck size={20} color="#16a34a" weight="bold" />
                    <div>
                      <span className="deposit-box-title">
                        Tiền đặt cọc giữ kho (10%)
                      </span>
                      <span className="deposit-box-badge-refundable">
                        HOÀN LẠI (REFUNDABLE)
                      </span>
                    </div>
                  </div>
                  <strong className="deposit-box-amount">
                    {formatVnd(depositAmount)}
                  </strong>
                </div>

                <p className="deposit-box-explanation">
                  ✓ Khoản tiền cọc này bảo đảm khóa vị trí kho và được{" "}
                  <strong>hoàn trả 100%</strong> vào tài khoản của quý khách
                  ngay khi thanh lý hợp đồng và bàn giao kho nguyên trạng.
                </p>
              </div>

              {/* ── SỐ TIỀN PHẢI THANH TOÁN NGAY HÔM NAY (DUE NOW) ── */}
              <div className="pricing-due-now-box">
                <div className="due-now-row">
                  <div>
                    <span className="due-now-label">
                      CẦN THANH TOÁN HÔM NAY (DUE NOW):
                    </span>
                    <span className="due-now-sub">
                      Tiền cọc giữ chỗ để khóa vị trí kho
                    </span>
                  </div>
                  <strong className="due-now-amount">
                    {formatVnd(dueNow)}
                  </strong>
                </div>
                <p className="due-now-subnote">
                  (Tiền thuê còn lại {formatVnd(totalRent)} sẽ thanh toán vào
                  ngày nhận kho)
                </p>
              </div>

              {/* ── NÚT HÀNH ĐỘNG ĐẶT KHO ── */}
              <button
                type="button"
                className="pricing-submit-btn"
                onClick={handleBookNow}
                disabled={quoteLoading}
              >
                <span>TIẾN HÀNH ĐẶT KHO & THANH TOÁN CỌC</span>
                <span className="pricing-submit-btn__arrow">→</span>
              </button>

              {/* Cam kết bảo mật & Hủy miễn phí */}
              <div className="pricing-guarantees">
                <div className="guarantee-item">
                  <Lock size={15} weight="bold" />
                  <span>
                    Cổng thanh toán mã hóa an toàn · Hỗ trợ Thẻ / MoMo / VNPay
                  </span>
                </div>
                <div className="guarantee-item">
                  <Clock size={15} weight="bold" />
                  <span>
                    Hủy miễn phí trong vòng 24 giờ trước ngày nhận kho, hoàn
                    100% cọc
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Global Footer ── */}
      <Footer
        leftText="STORAGEHUB / CƠ SỞ TÂN BÌNH — HỆ THỐNG KHO TỰ QUẢN"
        rightText="PHIÊN BẢN 1.0 · 2026"
      />
    </div>
  );
}
