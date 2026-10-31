import { useState } from "react";
import { ShieldWarning, ArrowsLeftRight } from "@phosphor-icons/react";
import ForcedCheckoutModal from "./ForcedCheckoutModal.jsx";
import TransferModal from "./TransferModal.jsx";

/**
 * ManagerActionsCard — Khu vực thao tác quản lý trên trang chi tiết đơn thuê
 * (chỉ dành cho nhân sự: STAFF / FACILITY_MANAGER / ...). Bao gồm:
 * 1. Buộc trả kho sớm (forced checkout)
 * 2. Đổi kho (transfer)
 */
export default function ManagerActionsCard({
  reservation,
  isManagerFeature,
  actionError,
  setActionError,
  clearActionError,
  submittingAction,
  availableUnits,
  loadingUnits,
  loadAvailableUnits,
  transferResult,
  setTransferResult,
  handleForcedCheckout,
  handleTransfer,
}) {
  const [showForcedModal, setShowForcedModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  if (!isManagerFeature || !reservation) return null;

  return (
    <>
      <article className="rd-card">
        <header className="rd-card__header">
          <div className="rd-card__title-wrap">
            <ShieldWarning size={18} weight="bold" />
            <h2 className="rd-card__title">Thao tác quản lý</h2>
          </div>
          <span className="font-mono rd-card__sub-badge">DÀNH CHO QUẢN LÝ</span>
        </header>

        <div className="rd-card__body">
          <p className="text-muted text-xs mb-2">
            Các thao tác vận hành đặc biệt cho đơn thuê đang CHECKED_IN. Mọi hành động đều được
            ghi nhật ký kiểm toán và có thể bị từ chối bởi quy tắc nghiệp vụ backend.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="rental-btn rental-btn--secondary"
              onClick={() => {
                clearActionError();
                setShowForcedModal(true);
              }}
            >
              <ShieldWarning size={16} weight="bold" />
              <span>Buộc trả kho</span>
            </button>
            <button
              type="button"
              className="rental-btn rental-btn--secondary"
              onClick={() => {
                clearActionError();
                setShowTransferModal(true);
              }}
            >
              <ArrowsLeftRight size={16} weight="bold" />
              <span>Đổi kho</span>
            </button>
          </div>
        </div>
      </article>

      <ForcedCheckoutModal
        isOpen={showForcedModal}
        onClose={() => setShowForcedModal(false)}
        reservation={reservation}
        onConfirm={handleForcedCheckout}
        submitting={submittingAction}
        error={actionError}
        onError={setActionError}
      />

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        reservation={reservation}
        onConfirm={handleTransfer}
        submitting={submittingAction}
        error={actionError}
        onError={setActionError}
        availableUnits={availableUnits}
        loadingUnits={loadingUnits}
        onLoadUnits={loadAvailableUnits}
        transferResult={transferResult}
        onClearResult={() => setTransferResult(null)}
      />
    </>
  );
}
