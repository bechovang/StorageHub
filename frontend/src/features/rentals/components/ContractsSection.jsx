import { useState } from "react";
import { Seal, Eye, FileText } from "@phosphor-icons/react";
import {
  fmtDate,
  CONTRACT_STATUS_LABEL,
} from "../../../utils/rentalConstants.js";
import ContractViewerModal from "../../../components/ContractModal/ContractViewerModal.jsx";

export function ContractsSection({ contracts = [], reservation, unit, user }) {
  const [selectedContract, setSelectedContract] = useState(null);

  if (contracts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <p className="rd-empty-text">
          Chưa có hợp đồng nào. Hồ sơ hợp đồng được tự động khởi tạo sau khi thanh toán cọc thành công.
        </p>
        <button
          type="button"
          className="rd-contract-link"
          style={{ background: "none", border: "1px dashed #cbd5e1", padding: "8px 14px", marginTop: "8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
          onClick={() => setSelectedContract({ code: reservation?.code ? `HĐ-${reservation.code}` : "HĐ-GOC" })}
        >
          <FileText size={16} />
          <span>Xem bản hợp đồng mẫu tiêu chuẩn</span>
        </button>

        <ContractViewerModal
          isOpen={Boolean(selectedContract)}
          onClose={() => setSelectedContract(null)}
          contract={selectedContract}
          reservation={reservation}
          unit={unit}
          user={user}
        />
      </div>
    );
  }

  return (
    <>
      <div className="rd-contracts-list">
        {contracts.map((c, idx) => {
          const isActive = c.status === "ACTIVE" || c.status === "SIGNED";
          const isDraft = c.status === "DRAFT" || c.status === "AWAITING_SIGNATURE";

          return (
            <div
              key={c.code || c.id || idx}
              className={`rd-contract-item ${c.isLatest ? "rd-contract-item--latest" : ""}`}
              onClick={() => setSelectedContract(c)}
              style={{ cursor: "pointer" }}
              title="Bấm để xem toàn văn hợp đồng điện tử"
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

                <button
                  type="button"
                  className="rd-contract-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedContract(c);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-primary, #0f172a)", fontWeight: 600 }}
                >
                  <Eye size={14} weight="bold" />
                  Xem HĐ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ContractViewerModal
        isOpen={Boolean(selectedContract)}
        onClose={() => setSelectedContract(null)}
        contract={selectedContract}
        reservation={reservation}
        unit={unit}
        user={user}
      />
    </>
  );
}
