import { useEffect } from "react";
import Button from "../Button/Button.jsx";
import "./Modal.css";

export default function Modal({
  open,
  isOpen,
  title,
  children,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  onClose,
  showFooter,
}) {
  const isVisible = open !== undefined ? Boolean(open) : Boolean(isOpen);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isVisible, onClose]);

  if (!isVisible) {
    return null;
  }

  const shouldRenderFooter = showFooter !== undefined ? showFooter : Boolean(onConfirm);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="modal-title">{title}</h2>

          <button
            className="modal__close"
            type="button"
            aria-label="Đóng hộp thoại"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {shouldRenderFooter && (
          <footer className="modal__footer">
            {cancelLabel && (
              <Button variant="secondary" onClick={onClose}>
                {cancelLabel}
              </Button>
            )}

            {onConfirm && (
              <Button onClick={onConfirm}>
                {confirmLabel}
              </Button>
            )}
          </footer>
        )}
      </section>
    </div>
  );
}
