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
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
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

  const isSoon = unit.availability === "soon";
  const availableLine = isSoon
    ? `Available ${formatDate(unit.availableFrom)}`
    : `Available from ${formatDate(unit.availableFrom)}`;
  const subline = isSoon
    ? unit.bufferNote || "Cleaning buffer"
    : "Matches the selected rental period";

  return (
    <article className={`unit-card ${className}`} data-unit-id={unit.id}>
      <button
        className="unit-card__visual"
        type="button"
        aria-label={`View details for unit ${unit.code}`}
        onClick={() => onViewDetails?.(unit)}
      >
        <UnitIllustration
          variant={unit.imageVariant || 1}
          zone={unit.zone || "Zone A"}
        />
        <span className="unit-card__code">{unit.code}</span>
      </button>

      <div className="unit-card__body">
        <div className="unit-card__header">
          <div>
            <h3 className="unit-card__title">
              {unit.sizeM2} m² {unit.type}
            </h3>
            <p className="unit-card__meta">
              {unit.zone} · Floor {unit.floor} · {unit.accessType}
            </p>
          </div>

          <Badge tone={isSoon ? "muted" : "success"}>
            {isSoon ? "Available soon" : "Available"}
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
            <strong>{formatVnd(unit.monthlyPrice)}</strong>
            <span>per month · Policy v3</span>
          </div>

          <div className="unit-card__actions">
            <Button
              variant="secondary"
              size="small"
              onClick={() => onViewDetails?.(unit)}
            >
              Details
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={() => onBook?.(unit)}
            >
              Book
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

