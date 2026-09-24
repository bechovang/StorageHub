import { useEffect } from "react";
import Button from "../Button/Button.jsx";
import "./Modal.css";

export default function Modal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

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
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="modal__body">{children}</div>

        <footer className="modal__footer">
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>

          <Button onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </footer>
      </section>
    </div>
  );
}