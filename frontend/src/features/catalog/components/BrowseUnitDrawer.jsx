import { Package } from "@phosphor-icons/react";
import Drawer from "../../../components/Drawer/Drawer.jsx";
import Badge from "../../../components/Badge/Badge.jsx";
import Button from "../../../components/Button/Button.jsx";
import { formatVND, PLACEHOLDER_UNIT_IMAGE } from "../../../utils/formatters.js";
import { getCapacityHint } from "../utils.js";

function DrawerVisual({ unit }) {
  const sizeM2 = unit?.sizeM2 || 3.5;
  const volumeM3 = (sizeM2 * 2.8).toFixed(1);
  const photo = unit?.photoUrls?.[0] || unit?.photoUrl || PLACEHOLDER_UNIT_IMAGE;

  return (
    <div className="browse-drawer-visual" aria-label={`Hình ảnh không gian kho ${sizeM2} m²`}>
      <img
        src={photo}
        alt={`Kho ${unit?.typeName || "Tiêu chuẩn"} ${sizeM2} m²`}
        className="browse-drawer-visual__img"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = PLACEHOLDER_UNIT_IMAGE;
        }}
        loading="lazy"
      />

      {/* Thông số kích thước trực quan ghim trên ảnh */}
      <div className="browse-drawer-visual__badges">
        <span className="browse-drawer-visual__pill">
          Diện tích <strong>{sizeM2} m²</strong>
        </span>
        <span className="browse-drawer-visual__pill">
          Thể tích <strong>~{volumeM3} m³</strong>
        </span>
        <span className="browse-drawer-visual__pill">
          Trần cao <strong>2.8m</strong>
        </span>
      </div>
    </div>
  );
}

export default function BrowseUnitDrawer({
  selectedUnit,
  onClose,
  onViewDetails,
  onBook,
}) {
  if (!selectedUnit) return null;

  const typeName =
    selectedUnit.typeName ||
    selectedUnit.type ||
    "Tiêu chuẩn";
  const facilityName =
    selectedUnit.facilityName || "Cơ sở Tân Bình (TP.HCM)";
  const price =
    selectedUnit.baseMonthlyRent ||
    selectedUnit.monthlyPrice ||
    0;
  const capacity = getCapacityHint(selectedUnit.sizeM2);
  const isSoon =
    (typeof selectedUnit.availability === "object"
      ? selectedUnit.availability?.status
      : selectedUnit.availability) === "AVAILABLE_SOON" ||
    selectedUnit.availability === "soon";
  const availableDate =
    typeof selectedUnit.availability === "object"
      ? selectedUnit.availability?.availableFromDate
      : selectedUnit.availableFrom;

  return (
    <Drawer
      open={Boolean(selectedUnit)}
      headerLabel={`CHI TIẾT GÓI KHO · ${(typeName).toUpperCase()} (${selectedUnit.sizeM2} M²)`}
      onClose={onClose}
      footer={
        <div className="browse-drawer-footer">
          <div className="browse-drawer-footer__price">
            <div className="browse-drawer-footer__price-val">
              <strong>{formatVND(price)}</strong>
              <span className="browse-drawer-footer__price-period">/ tháng</span>
            </div>
          </div>
          <div className="browse-drawer-footer__actions">
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                onViewDetails(selectedUnit);
              }}
            >
              Chi tiết
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onBook(selectedUnit);
              }}
            >
              Đặt kho & Thanh toán cọc
            </Button>
          </div>
        </div>
      }
    >
      <div className="browse-drawer-body">
        {/* Tiêu đề & Giá gói thuê */}
        <div className="browse-drawer-header">
          <p className="browse-drawer-eyebrow">{facilityName.toUpperCase()}</p>
          <h2 className="browse-drawer-title">
            {selectedUnit.sizeM2} m² · Kho {typeName}
          </h2>
          <div className="browse-drawer-status-bar">
            <Badge tone={isSoon ? "warning" : "success"}>
              {isSoon ? "Sắp khả dụng" : "Còn trống · Cọc để giữ chỗ"}
            </Badge>
            <span className="browse-drawer-rent-pill">
              {formatVND(price)} / tháng
            </span>
          </div>
        </div>

        {/* Hình ảnh trực quan không gian kho */}
        <DrawerVisual unit={selectedUnit} />

        {/* Gợi ý sức chứa thực tế cho khách thuê */}
        <div className="browse-drawer-capacity">
          <div className="browse-drawer-capacity__header">
            <Package size={17} weight="bold" />
            <span>{capacity.title}</span>
          </div>
          <p className="browse-drawer-capacity__desc">{capacity.detail}</p>
        </div>

        {/* Thông số không gian thiết thực */}
        <h3 className="browse-drawer-section-title">THÔNG SỐ KHÔNG GIAN</h3>
        <dl className="spec-list">
          <div className="spec-row">
            <dt>Diện tích sàn sử dụng</dt>
            <dd style={{ fontWeight: 700 }}>{selectedUnit.sizeM2} m²</dd>
          </div>
          <div className="spec-row">
            <dt>Chiều cao trần</dt>
            <dd>2.8 m (tối đa xếp chồng thùng đồ)</dd>
          </div>
          <div className="spec-row">
            <dt>Thể tích chứa đồ ước tính</dt>
            <dd>~{(selectedUnit.sizeM2 * 2.8).toFixed(1)} m³</dd>
          </div>
          <div className="spec-row">
            <dt>Cơ chế truy cập</dt>
            <dd>Mã PIN bảo mật riêng 24/7</dd>
          </div>
          <div className="spec-row">
            <dt>Địa điểm cơ sở</dt>
            <dd>{facilityName}</dd>
          </div>
        </dl>

        {/* Tiện ích an ninh & bảo vệ tài sản */}
        {selectedUnit.features && selectedUnit.features.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3 className="browse-drawer-section-title">TIỆN ÍCH KHO</h3>
            <div className="browse-drawer-features">
              {selectedUnit.features.map((feat) => (
                <span key={feat} className="browse-drawer-feature-tag">
                  {feat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chi phí & Chính sách thuê minh bạch */}
        <div style={{ marginTop: "20px" }}>
          <h3 className="browse-drawer-section-title">
            CHI PHÍ & CHÍNH SÁCH THUÊ
          </h3>
          <dl className="spec-list">
            <div className="spec-row">
              <dt>Giá thuê niêm yết</dt>
              <dd style={{ color: "var(--color-ink)", fontWeight: 700 }}>
                {formatVND(price)} / tháng
              </dd>
            </div>
            <div className="spec-row">
              <dt>Tiền đặt cọc (hoàn lại khi trả kho)</dt>
              <dd>{formatVND(price)} (1 tháng)</dd>
            </div>
            <div className="spec-row">
              <dt>Thời gian bàn giao</dt>
              <dd>
                {isSoon && availableDate
                  ? `Bàn giao từ ${availableDate}`
                  : "Sẵn sàng bàn giao ngay"}
              </dd>
            </div>
            <div className="spec-row">
              <dt>Thời hạn thuê</dt>
              <dd>Thuê theo tháng · Gia hạn linh hoạt khi có nhu cầu</dd>
            </div>
          </dl>
        </div>
      </div>
    </Drawer>
  );
}
