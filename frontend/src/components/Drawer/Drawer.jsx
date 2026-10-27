import { useEffect } from "react";
import "./Drawer.css";

export default function Drawer({
  open,
  isOpen,
  headerLabel,
  title,
  children,
  footer = null,
  onClose,
  className = "",
  size = "",
  width,
}) {
  const isActualOpen = Boolean(open ?? isOpen);
  const resolvedHeaderLabel = headerLabel || title || "CHI TIẾT";

  useEffect(() => {
    if (!isActualOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isActualOpen, onClose]);

  if (!isActualOpen) return null;

  return (
    <>
      <div
        className="overlay-scrim"
        role="presentation"
        onClick={() => onClose?.()}
      />

      <aside
        className={`drawer is-open ${size ? `drawer--${size}` : ""} ${className}`}
        style={width ? { width, maxWidth: width } : undefined}
        aria-modal="true"
        role="dialog"
      >
        <div className="drawer__header">
          <span>{resolvedHeaderLabel}</span>
          <button
            type="button"
            className="drawer__close"
            aria-label="Đóng ngăn chi tiết"
            onClick={() => onClose?.()}
          >
            ×
          </button>
        </div>

        <div className="drawer__content">{children}</div>

        {footer && <div className="drawer__footer">{footer}</div>}
      </aside>
    </>
  );
}
