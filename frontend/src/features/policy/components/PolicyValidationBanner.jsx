import { XCircle } from "@phosphor-icons/react";

export function PolicyValidationBanner({
  validationBanner,
  activeValidationErrors,
  capRulesRef,
}) {
  if (!validationBanner && activeValidationErrors.length === 0) return null;

  return (
    <div className="policy-banner policy-banner--error" role="alert">
      <div className="policy-banner__content">
        <div className="policy-banner__icon">
          <XCircle size={22} weight="fill" />
        </div>
        <div className="policy-banner__text">
          <strong className="policy-banner__title">Chính sách chưa thể lưu.</strong>
          <span className="policy-banner__desc">
            {validationBanner || activeValidationErrors[0]?.message}
          </span>
        </div>
      </div>
      <a
        href="#cap-rules"
        className="policy-banner__link"
        onClick={(e) => {
          e.preventDefault();
          capRulesRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        Xem quy định hạn mức an toàn →
      </a>
    </div>
  );
}
