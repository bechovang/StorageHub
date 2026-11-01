import { WarningCircle, ArrowRight, X } from "@phosphor-icons/react";

export function SnapbackToast({
  toastData,
  onClose,
  onOpenCheckin,
  onOpenCheckout,
  onOpenCleaning,
  onOpenSupport,
  onOpenContract,
}) {
  if (!toastData) return null;

  const handleFixNow = () => {
    const targetTask = toastData.task;
    onClose();
    if (targetTask.type === "CHECK_IN") onOpenCheckin(targetTask);
    else if (targetTask.type === "CHECKOUT") onOpenCheckout(targetTask);
    else if (targetTask.type === "CLEANING") onOpenCleaning(targetTask);
    else if (targetTask.type === "SUPPORT") onOpenSupport(targetTask);
    else if (targetTask.type === "CONTRACT") onOpenContract(targetTask);
  };

  return (
    <aside className="snapback-toast" role="alert">
      <div className="snapback-toast__badge">
        <WarningCircle size={16} weight="fill" />
        <span>CHÆ¯A Äá»¦ ÄIá»€U KIá»†N HOÃ€N THÃ€NH</span>
      </div>
      <div className="snapback-toast__body">
        <p className="snapback-toast__title">ChÆ°a thá»ƒ Ä‘Ã¡nh dáº¥u hoÃ n thÃ nh:</p>
        <p className="snapback-toast__desc">{toastData.message}</p>
      </div>
      <div className="snapback-toast__actions">
        <button
          type="button"
          className="snapback-toast__btn-fix"
          onClick={handleFixNow}
        >
          <span>Xá»­ lÃ½ ngay</span>
          <ArrowRight size={14} weight="bold" />
        </button>
        <button
          type="button"
          className="snapback-toast__close"
          onClick={onClose}
          aria-label="ÄÃ³ng thÃ´ng bÃ¡o"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
    </aside>
  );
}
