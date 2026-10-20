import { CheckCircle, XCircle, Info } from "@phosphor-icons/react";
import { HARD_CAPS } from "../../../services/policyService.js";

export function PolicyCompliancePanel({
  persistedPolicy,
  draftLateFee,
  isLateFeeViolated,
  draftDeposit,
  isDepositViolated,
  draftBufferDays,
  isBufferViolated,
  pendingModifications,
  hasChanges,
  onDiscardChanges,
  capRulesRef,
}) {
  return (
    <div className="policy-col-side" id="cap-rules" ref={capRulesRef}>
      <div className="policy-side-card">
        {/* Header */}
        <div className="policy-side-header">
          <div>
            <h3 className="policy-side-title">Chu trình chính sách & Tuân thủ</h3>
            <p className="policy-side-subtitle font-mono text-xs">
              {persistedPolicy.version} · {persistedPolicy.status}
            </p>
          </div>
          <span className="policy-side-time">
            {new Date(persistedPolicy.updatedAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            bởi {persistedPolicy.updatedBy.split(" ")[0]}
          </span>
        </div>

        {/* 1. Automated Compliance Checklist */}
        <div className="policy-side-section">
          <div className="policy-side-label">Danh mục kiểm tra tuân thủ tự động</div>
          <div className="policy-checklist">
            <div className="policy-checklist__item policy-checklist__item--pass">
              <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
              <span>Chiết khấu cam kết thanh toán 3 tháng hợp lệ (7.5%)</span>
            </div>

            <div className="policy-checklist__item policy-checklist__item--pass">
              <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
              <span>Ngưỡng đền bù sơn sàn epoxy 15% đồng bộ phụ lục hợp đồng</span>
            </div>

            <div
              className={`policy-checklist__item ${
                isLateFeeViolated
                  ? "policy-checklist__item--fail"
                  : "policy-checklist__item--pass"
              }`}
            >
              {isLateFeeViolated ? (
                <XCircle size={18} weight="fill" className="text-error shrink-0" />
              ) : (
                <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
              )}
              <span className={isLateFeeViolated ? "font-bold text-error" : ""}>
                {isLateFeeViolated
                  ? `Phí trả trễ vượt trần tối đa (${draftLateFee}% > ${HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT}%)`
                  : "Phí phạt trả trễ tuân thủ trần quy định (≤ 10%)"}
              </span>
            </div>

            <div
              className={`policy-checklist__item ${
                isDepositViolated
                  ? "policy-checklist__item--fail"
                  : "policy-checklist__item--pass"
              }`}
            >
              {isDepositViolated ? (
                <XCircle size={18} weight="fill" className="text-error shrink-0" />
              ) : (
                <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
              )}
              <span className={isDepositViolated ? "font-bold text-error" : ""}>
                {isDepositViolated
                  ? `Tỷ lệ cọc dưới sàn tối thiểu (${draftDeposit}% < ${HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT}%)`
                  : "Tỷ lệ cọc bảo đảm tuân thủ sàn tối thiểu (≥ 10%)"}
              </span>
            </div>

            <div
              className={`policy-checklist__item ${
                isBufferViolated
                  ? "policy-checklist__item--fail"
                  : "policy-checklist__item--pass"
              }`}
            >
              {isBufferViolated ? (
                <XCircle size={18} weight="fill" className="text-error shrink-0" />
              ) : (
                <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
              )}
              <span className={isBufferViolated ? "font-bold text-error" : ""}>
                {isBufferViolated
                  ? `Thời gian đệm vi phạm khung 1 - 7 ngày (${draftBufferDays} ngày)`
                  : "Thời gian đệm vệ sinh hợp lệ (1 - 7 ngày)"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Hard Caps Reference */}
        <div className="policy-side-section">
          <div className="policy-side-label">Bảng tra cứu trần quy chế cứng (#CAPS)</div>
          <div className="policy-cap-box">
            <div className="policy-cap-row">
              <span className="policy-cap-name">Trần phụ thu trả trễ:</span>
              <span className="policy-cap-value policy-cap-value--error">
                {HARD_CAPS.LATE_CHECKOUT_MAX_PERCENT}.0%{" "}
                <span className="text-muted text-[10px] font-normal">(#CAP-04)</span>
              </span>
            </div>
            <div className="policy-cap-row">
              <span className="policy-cap-name">Sàn cọc bảo đảm:</span>
              <span className="policy-cap-value text-ink">
                {HARD_CAPS.SECURITY_DEPOSIT_MIN_PERCENT}% / 100.000 ₫{" "}
                <span className="text-muted text-[10px] font-normal">(#CAP-08)</span>
              </span>
            </div>
            <div className="policy-cap-row">
              <span className="policy-cap-name">Khung đệm vệ sinh:</span>
              <span className="policy-cap-value text-ink">
                {HARD_CAPS.TURNOVER_BUFFER_MIN_DAYS} - {HARD_CAPS.TURNOVER_BUFFER_MAX_DAYS} ngày{" "}
                <span className="text-muted text-[10px] font-normal">(#OPS-012)</span>
              </span>
            </div>
            <div className="policy-cap-row">
              <span className="policy-cap-name">Hạn ký phụ lục quầy:</span>
              <span className="policy-cap-value text-ink">
                7 ngày{" "}
                <span className="text-muted text-[10px] font-normal">(#CAP-14)</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. Pending Modifications List */}
        <div className="policy-side-section">
          <div className="policy-side-section__header">
            <span className="policy-side-label">Thay đổi chờ lưu ({pendingModifications.length})</span>
            {hasChanges && (
              <button
                type="button"
                className="policy-link-clear"
                onClick={onDiscardChanges}
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {pendingModifications.length === 0 ? (
            <div className="policy-empty-diff">
              Chưa có thay đổi nào so với bản chính sách đang lưu.
            </div>
          ) : (
            <div className="policy-diff-list">
              {pendingModifications.map((item) => (
                <div
                  key={item.id}
                  className={`policy-diff-item ${
                    item.isValid ? "policy-diff-item--valid" : "policy-diff-item--invalid"
                  }`}
                >
                  <div className="policy-diff-item__head">
                    <span className="font-semibold">{item.title}</span>
                    <span
                      className={`policy-diff-status ${
                        item.isValid
                          ? "policy-diff-status--valid"
                          : "policy-diff-status--blocked"
                      }`}
                    >
                      {item.isValid ? "Hợp lệ" : "Bị chặn"}
                    </span>
                  </div>
                  <div className="policy-diff-item__values">
                    <span className="text-muted">{item.from}</span>
                    <span className="text-muted">→</span>
                    <span className={item.isValid ? "font-bold text-ink" : "font-bold text-error"}>
                      {item.to}
                    </span>
                  </div>
                  {item.blockReason && (
                    <div className="policy-diff-item__reason">{item.blockReason}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Guidance Note */}
        <div className="policy-guidance-note">
          <Info size={16} className="text-muted shrink-0 mt-0.5" />
          <span>
            Để nâng các mức trần quy chuẩn vượt quá khung Rental Policy v3, cần có văn bản phê chuẩn ngoại lệ từ Ban Điều Hành Khu Vực.
          </span>
        </div>
      </div>
    </div>
  );
}
