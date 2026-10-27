import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ShareNetwork,
  Check,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { Badge, Button } from "../../components";
import {
  useUnitDetailView,
  UnitImageSlider,
  UnitPricingCalculator,
  UnitFacilityStandards,
} from "../../features/catalog/index.js";
import "./UnitDetailPage.css";

export default function UnitDetailPage() {
  const navigate = useNavigate();
  const {
    unit,
    loading,
    copiedLink,
    durationMonths,
    setDurationMonths,
    startDate,
    setStartDate,
    quoteLoading,
    handleCopyLink,
    handleBookNow,
    isSoon,
    availableDate,
    typeLabel,
    facilityLabel,
    monthlyRent,
    volumeM3,
    totalRent,
    depositAmount,
    dueNow,
    endDate,
    policyVersion,
  } = useUnitDetailView();

  if (loading) {
    return (
      <AppShell showFooter={true}>
        <div
          className="unit-detail-container"
          style={{ padding: "80px 0", textAlign: "center" }}
        >
          <p style={{ color: "var(--color-secondary)" }}>
            Đang tải thông số và bảng giá kho...
          </p>
        </div>
      </AppShell>
    );
  }

  if (!unit) {
    return (
      <AppShell showFooter={true}>
        <div
          className="unit-detail-container"
          style={{ padding: "80px 0", textAlign: "center" }}
        >
          <h2>Không tìm thấy thông tin kho lưu trữ</h2>
          <p style={{ color: "var(--color-secondary)", margin: "16px 0 24px" }}>
            Mã kho này không tồn tại hoặc đã được cập nhật lại trạng thái quản lý.
          </p>
          <Button variant="primary" onClick={() => navigate("/browse")}>
            Quay lại danh sách kho
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showFooter={true}>
      <div className="unit-detail-page-inner">
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
                Ô kho {typeLabel} ({unit.sizeM2} m²)
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
              <span>CƠ SỞ: VN-SGN-01 (Tân Bình)</span>
            </div>
          </section>

        {/* ── 4. Hai cột cấu trúc (7 cols : 5 cols / Swiss Grid) ── */}
        <div className="unit-detail-layout">
          {/* ═══════════ CỘT TRÁI: HÌNH ẢNH & THÔNG SỐ CƠ SỞ (7 COLS) ═══════════ */}
          <div className="unit-detail-left-col">
            {/* Slider hình ảnh kho */}
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
                  THÔNG SỐ KỸ THUẬT Ô KHO
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
                      Tòa nhà B · Tầng {unit.floor || 1} · Khu {unit.zoneCode || "A"}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>

            {/* Tiêu chuẩn vận hành cơ sở */}
            <UnitFacilityStandards />
          </div>

          {/* ═══════════ CỘT PHẢI: BẢNG GIÁ MINH BẠCH & DỰ TOÁN THUÊ (5 COLS) ═══════════ */}
          <aside className="unit-detail-right-col">
            <UnitPricingCalculator
              durationMonths={durationMonths}
              setDurationMonths={setDurationMonths}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              monthlyRent={monthlyRent}
              totalRent={totalRent}
              depositAmount={depositAmount}
              dueNow={dueNow}
              policyVersion={policyVersion}
              quoteLoading={quoteLoading}
              isSoon={isSoon}
              availableDate={availableDate}
              onBookNow={handleBookNow}
            />
          </aside>
        </div>
      </main>
      </div>
    </AppShell>
  );
}
