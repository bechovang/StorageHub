import Badge from "../Badge/Badge.jsx";
import Button from "../Button/Button.jsx";
import "./UnitCard.css";

const PLACEHOLDER_UNIT_IMAGE = "/placeholder.svg";


const formatVnd = (amount) =>
  `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;

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

export default function UnitCard({
  unit,
  onOpenDrawer,
  onViewDetails,
  onBook,
  className = "",
}) {
  if (!unit) return null;

  // Xử lý trạng thái khả dụng cho khách hàng
  const rawStatus =
    typeof unit.availability === "object"
      ? unit.availability?.status
      : unit.availability;
  const availableDate =
    typeof unit.availability === "object"
      ? unit.availability?.availableFromDate
      : unit.availableFrom;
  const isSoon =
    rawStatus === "AVAILABLE_SOON" ||
    rawStatus === "soon" ||
    rawStatus === "PREPARING" ||
    rawStatus === "RENTED" ||
    Boolean(availableDate);

  const availableLine = isSoon
    ? (availableDate ? `Dự kiến trống từ ${formatDate(availableDate)}` : "Sắp có kho trống")
    : "Đang có sẵn · Nhận kho ngay";

  const subline = isSoon
    ? "Đang hoàn tất vệ sinh & kiểm tra kỹ thuật"
    : "Tự quản bằng mã PIN riêng 24/7";

  const price = unit.baseMonthlyRent ?? unit.monthlyPrice ?? 0;
  const typeLabel = unit.typeName || unit.type || "Tiêu chuẩn";
  const facilityLabel = unit.facilityName || "Cơ sở Tân Bình";
  const volumeM3 = (unit.sizeM2 * 2.8).toFixed(1);

  const handleCardClick = (e) => {
    // Chỉ kích hoạt mở drawer nếu người dùng không click vào button hành động
    if (e.target.closest("button") || e.target.closest("a")) return;
    if (onOpenDrawer) {
      onOpenDrawer(unit);
    } else {
      onViewDetails?.(unit);
    }
  };

  return (
    <article
      className={`unit-card ${className}`}
      data-unit-id={unit.id}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (e.target.tagName !== "BUTTON" && e.target.tagName !== "A") {
            e.preventDefault();
            handleCardClick(e);
          }
        }
      }}
      aria-label={`Xem tổng quan gói kho ${typeLabel} ${unit.sizeM2} m²`}
    >
      <div className="unit-card__visual">
        <img
          src={unit.photoUrls?.[0] || unit.photoUrl || PLACEHOLDER_UNIT_IMAGE}
          alt={`Kho ${typeLabel} ${unit.sizeM2} m²`}
          className="unit-card__img"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_UNIT_IMAGE;
          }}
          loading="lazy"
        />
        <span className="unit-card__code">{typeLabel}</span>

        {/* Badge trạng thái ở góc dưới bên phải minh họa (vị trí người dùng chỉ định) kèm tooltip khi hover */}
        <div
          className="unit-card__badge-wrapper"
          tabIndex={0}
          role="note"
          aria-label={`${isSoon ? "Đang được thuê" : "Còn trống"}: ${availableLine}. ${subline}`}
          title={`${availableLine} — ${subline}`}
        >
          <Badge tone={isSoon ? "warning" : "success"} className="unit-card__status-badge">
            {isSoon ? "Đang được thuê" : "Còn trống"}
          </Badge>

          <div className="unit-card__tooltip" role="tooltip">
            <span className="unit-card__tooltip-title">{availableLine}</span>
            <span className="unit-card__tooltip-desc">{subline}</span>
          </div>
        </div>
      </div>

      <div className="unit-card__body">
        <div className="unit-card__header">
          <h3 className="unit-card__title">
            {unit.sizeM2} m² · {typeLabel}
          </h3>
          <p className="unit-card__meta">
            {facilityLabel} · Thể tích ~{volumeM3} m³ · Trần cao 2.8m
          </p>
        </div>

        {unit.features && unit.features.length > 0 && (
          <div className="unit-card__features">
            {unit.features.slice(0, 3).map((feature) => (
              <span key={feature} className="unit-card__feature">
                {feature}
              </span>
            ))}
          </div>
        )}

        <div className="unit-card__footer">
          <div className="unit-card__price">
            <strong>{formatVnd(price)}</strong>
            <span>/ tháng · Cọc 1 tháng (hoàn lại)</span>
          </div>

          <div className="unit-card__actions" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(unit);
              }}
            >
              Chi tiết
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onBook?.(unit);
              }}
            >
              Đặt kho
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
