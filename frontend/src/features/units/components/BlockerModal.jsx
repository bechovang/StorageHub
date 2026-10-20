import { WarningCircle, Warning } from "@phosphor-icons/react";
import Modal from "../../../components/Modal/Modal.jsx";

export function BlockerModal({ blockerModalData, onClose }) {
  if (!blockerModalData) return null;

  return (
    <Modal
      open={Boolean(blockerModalData)}
      title="HÀNH ĐỘNG BỊ CHẶN (GUARD ENFORCED)"
      confirmLabel="Đã hiểu & Đóng"
      cancelLabel=""
      onConfirm={onClose}
      onClose={onClose}
    >
      <div className="blocker-modal-body">
        <div className="blocker-alert">
          <WarningCircle size={28} className="blocker-icon text-danger" />
          <div className="blocker-alert__text">
            <h4 className="font-semibold text-danger">
              {blockerModalData.blocker.title}
            </h4>
            <p>{blockerModalData.blocker.message}</p>
          </div>
        </div>

        <div className="blocker-details">
          <div className="blocker-row">
            <span className="blocker-label">Mã kho:</span>
            <span className="blocker-val font-bold font-mono">{blockerModalData.unit.code}</span>
          </div>
          {blockerModalData.blocker.tenant && (
            <div className="blocker-row">
              <span className="blocker-label">Khách hàng liên quan:</span>
              <span className="blocker-val font-semibold">{blockerModalData.blocker.tenant}</span>
            </div>
          )}
          {blockerModalData.blocker.contractRef && (
            <div className="blocker-row">
              <span className="blocker-label">Mã hợp đồng / Đơn đặt:</span>
              <span className="blocker-val font-mono">{blockerModalData.blocker.contractRef}</span>
            </div>
          )}
          {blockerModalData.blocker.nextEvent && (
            <div className="blocker-row">
              <span className="blocker-label">Diễn biến:</span>
              <span className="blocker-val text-muted">{blockerModalData.blocker.nextEvent}</span>
            </div>
          )}
        </div>

        <div className="blocker-advice">
          <Warning size={16} className="text-warning flex-shrink-0" />
          <span>{blockerModalData.blocker.actionAdvice}</span>
        </div>
      </div>
    </Modal>
  );
}
