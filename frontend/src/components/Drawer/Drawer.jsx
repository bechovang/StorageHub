import { useEffect } from "react";
import "./Drawer.css";

export default function Drawer({
  open,
  headerLabel = "ENTITY OVERVIEW",
  children,
  onClose,
  className = "",
}) {
  useEffect(() => {
    if (!open) return undefined;

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

  if (!open) return null;

  return (
    <>
      <div
        className="overlay-scrim"
        role="presentation"
        onClick={onClose}
      />

      <aside
        className={`drawer is-open ${className}`}
        aria-modal="true"
        role="dialog"
      >
        <div className="drawer__header">
          <span>{headerLabel}</span>
          <button
            type="button"
            className="drawer__close"
            aria-label="Close drawer"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="drawer__content">{children}</div>
      </aside>
    </>
  );
}
