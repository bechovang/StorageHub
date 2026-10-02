import Badge from "../Badge/Badge.jsx";
import Button from "../Button/Button.jsx";
import "./UnitCard.css";

function UnitIllustration({ variant = 1, zone = "A" }) {
  const doorWidth = 92 + variant * 3;
  const offset = 54 - variant;
  return (
    <svg viewBox="0 0 360 180" role="img" aria-label="Storage unit illustration">
      <rect width="360" height="180" fill="#eeeeee" />
      <path d="M0 145H360M0 152H360" stroke="#c8c8c8" />
      <rect
        x={offset}
        y="25"
        width={doorWidth}
        height="120"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="2"
      />
      <path
        d={`M${offset + 12} 42H${offset + doorWidth - 12}M${offset + 12} 58H${offset + doorWidth - 12}M${offset + 12} 74H${offset + doorWidth - 12}M${offset + 12} 90H${offset + doorWidth - 12}M${offset + 12} 106H${offset + doorWidth - 12}M${offset + 12} 122H${offset + doorWidth - 12}`}
        stroke="#777777"
      />
      <rect
        x={offset + doorWidth - 26}
        y="80"
        width="8"
        height="15"
        fill="#dc2626"
      />
      <path
        d={`M${offset + doorWidth + 26} 25V145M${offset + doorWidth + 42} 25V145M${offset + doorWidth + 58} 25V145`}
        stroke="#bdbdbd"
      />
      <text
        x="302"
        y="42"
        fill="#000000"
        fontFamily="Arial, sans-serif"
        fontSize="11"
        textAnchor="end"
      >
        {zone.toUpperCase()}
      </text>
    </svg>
  );
}

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
  onViewDetails,
  onBook,
  className = "",
}) {
  if (!unit) return null;

  // Hỗ trợ cả backend DTO (status: "AVAILABLE" | "AVAILABLE_SOON") và mock data
  const rawStatus =
    typeof unit.availability === "object"
      ? unit.availability?.status
      : unit.availability;
  const isSoon =
    rawStatus === "AVAILABLE_SOON" || rawStatus === "soon" || rawStatus === "PREPARING";
  const availableDate =
    typeof unit.availability === "object"
      ? unit.availability?.availableFromDate
      : unit.availableFrom;

  const availableLine = isSoon
    ? (availableDate ? `Khả dụng từ ${formatDate(availableDate)}` : "Sắp khả dụng")
    : (availableDate ? `Khả dụng từ ${formatDate(availableDate)}` : "Đang trống · Đặt ngay");

  const subline = isSoon
    ? unit.bufferNote || "Đệm dọn dẹp vệ sinh kho (Turnover buffer)"
    : "Sẵn sàng nhận kho theo lịch";

  const price = unit.baseMonthlyRent ?? unit.monthlyPrice ?? 0;
  const typeLabel = unit.typeName || unit.type || "Tiêu chuẩn";
  const zoneLabel = unit.zoneCode ? `Khu ${unit.zoneCode}` : (unit.zone || "Khu A");
  const floorLabel = unit.floor ? `Tầng ${unit.floor}` : "Tầng 1";
  const accessLabel =
    unit.accessType === "PIN"
      ? "Mã PIN 24/7"
      : unit.accessType === "QR"
      ? "Mã QR"
      : unit.accessType === "smart lock"
      ? "Khoá thông minh"
      : unit.accessType || "Mã PIN 24/7";

  return (
    <article className={`unit-card ${className}`} data-unit-id={unit.id}>
      <button
        className="unit-card__visual"
        type="button"
        aria-label={`Xem chi tiết kho ${unit.code}`}
        onClick={() => onViewDetails?.(unit)}
      >
        <UnitIllustration
          variant={unit.imageVariant || (unit.id % 4) + 1}
          zone={unit.zoneCode || unit.zone || "A"}
        />
        <span className="unit-card__code">{unit.code}</span>
      </button>

      <div className="unit-card__body">
        <div className="unit-card__header">
          <div>
            <h3 className="unit-card__title">
              {unit.sizeM2} m² · {typeLabel}
            </h3>
            <p className="unit-card__meta">
              {zoneLabel} · {floorLabel} · {accessLabel}
            </p>
          </div>

          <Badge tone={isSoon ? "warning" : "success"}>
            {isSoon ? "Đang được thuê" : "Còn trống"}
          </Badge>
        </div>

        {unit.features && unit.features.length > 0 && (
          <div className="unit-card__features">
            {unit.features.map((feature) => (
              <span key={feature} className="unit-card__feature">
                {feature}
              </span>
            ))}
          </div>
        )}

        <div
          className={`unit-card__availability ${isSoon ? "is-soon" : ""}`}
        >
          <strong>{availableLine}</strong>
          <span>{subline}</span>
        </div>

        <div className="unit-card__footer">
          <div className="unit-card__price">
            <strong>{formatVnd(price)}</strong>
            <span>mỗi tháng · Chính sách v3</span>
          </div>

          <div className="unit-card__actions">
            <Button
              variant="secondary"
              size="small"
              onClick={() => onViewDetails?.(unit)}
            >
              Chi tiết
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={() => onBook?.(unit)}
            >
              Đặt kho
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

