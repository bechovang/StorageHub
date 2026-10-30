import { useEffect, useState } from "react";
import { X, ArrowsOutSimple, ArrowsInSimple } from "@phosphor-icons/react";
import "./Drawer.css";

export default function Drawer({
  open,
  isOpen,
  headerLabel,
  title,
  subtitle = null,
  badge = null,
  children,
  footer = null,
  onClose,
  className = "",
  size = "",
  width,
  allowExpand = true,
  initialExpanded = false,
}) {
  const isActualOpen = Boolean(open ?? isOpen);
  const resolvedHeaderLabel = headerLabel || title || "CHI TIẾT";
  const [isExpanded, setIsExpanded] = useState(Boolean(initialExpanded));

  useEffect(() => {
    if (!isActualOpen) {
      setIsExpanded(Boolean(initialExpanded));
      return undefined;
    }

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
  }, [isActualOpen, onClose, initialExpanded]);

  if (!isActualOpen) return null;

  const sizeClass = size ? `drawer--${size}` : "";
  const expandedClass = isExpanded ? "drawer--expanded" : "";

  return (
    <>
      <div
        className="overlay-scrim"
        role="presentation"
        onClick={() => onClose?.()}
      />

      <aside
        className={`drawer is-open ${sizeClass} ${expandedClass} ${className}`.trim()}
        style={width && !isExpanded ? { width, maxWidth: width } : undefined}
        aria-modal="true"
        role="dialog"
      >
        <div className="drawer__header">
          <div className="drawer__header-left">
            <div className="drawer__header-title-row">
              <span className="drawer__header-title">{resolvedHeaderLabel}</span>
              {badge && <div className="drawer__header-badge">{badge}</div>}
            </div>
            {subtitle && <div className="drawer__header-subtitle">{subtitle}</div>}
          </div>

          <div className="drawer__header-actions">
            {allowExpand && (
              <button
                type="button"
                className="drawer__header-btn drawer__header-btn--expand"
                aria-label={isExpanded ? "Thu nhỏ (Restore)" : "Mở rộng toàn màn hình (Maximize)"}
                title={isExpanded ? "Thu nhỏ về kích thước chuẩn" : "Phóng to toàn màn hình"}
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                {isExpanded ? (
                  <ArrowsInSimple size={16} weight="bold" />
                ) : (
                  <ArrowsOutSimple size={16} weight="bold" />
                )}
              </button>
            )}
            <button
              type="button"
              className="drawer__close"
              aria-label="Đóng ngăn chi tiết (Phím ESC)"
              title="Đóng (ESC)"
              onClick={() => onClose?.()}
            >
              <kbd className="drawer__kbd">ESC</kbd>
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        <div className="drawer__content">{children}</div>

        {footer && <div className="drawer__footer">{footer}</div>}
      </aside>
    </>
  );
}
