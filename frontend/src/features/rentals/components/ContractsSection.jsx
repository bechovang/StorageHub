import { Seal, Eye } from "@phosphor-icons/react";
import {
  fmtDate,
  CONTRACT_STATUS_LABEL,
} from "../../../pages/MyRentalsPage/rentalConstants.js";

export function ContractsSection({ contracts = [] }) {
  if (contracts.length === 0) {
    return (
      <p className="rd-empty-text">
        Chưa có hợp đồng nào. Hồ sơ hợp đồng được tự động khởi tạo sau khi thanh toán cọc thành công.
      </p>
    );
  }

  return (
    <div className="rd-contracts-list">
      {contracts.map((c, idx) => {
        const isActive = c.status === "ACTIVE" || c.status === "SIGNED";
        const isDraft = c.status === "DRAFT" || c.status === "AWAITING_SIGNATURE";

        return (
          <div
            key={c.code || c.id || idx}
            className={`rd-contract-item ${c.isLatest ? "rd-contract-item--latest" : ""}`}
          >
            <div className="rd-contract-item__left">
              <Seal
                size={20}
                weight={c.isLatest ? "fill" : "bold"}
                className="rd-contract-icon"
              />
              <div>
                <div className="rd-contract-item__top">
                  <span className="rd-contract-code font-mono">{c.code}</span>
                  <span className="rd-contract-kind">
                    {c.kind === "ORIGINAL" ? "Hợp đồng gốc" : "Phụ lục gia hạn"}
                  </span>
                  {c.isLatest && (
                    <span className="rd-contract-tag--latest">Hiện hành</span>
                  )}
                </div>
                {c.signatureDueDate && (
                  <p className="rd-contract-due">
                    Hạn ký bản cứng tại quầy:{" "}
                    <strong>{fmtDate(c.signatureDueDate)}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="rd-contract-item__right">
              <span
                className={`rd-status-chip ${
                  isActive || c.status === "CLOSED"
                    ? "rd-status-chip--success"
                    : isDraft
                    ? "rd-status-chip--warning"
                    : "rd-status-chip--neutral"
                }`}
              >
                {CONTRACT_STATUS_LABEL[c.status] || c.status}
              </span>

              {c.signedPhotoUrl && (
                <a
                  href={c.signedPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rd-contract-link"
                >
                  <Eye size={14} weight="bold" />
                  Xem bản ký
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
