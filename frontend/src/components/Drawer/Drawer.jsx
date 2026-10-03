import { useEffect, useState, useRef } from "react";
import "./Drawer.css";

const ANIMATION_DURATION = 220; // Khớp với thời gian animation trong Drawer.css

export default function Drawer({
  open,
  headerLabel = "ENTITY OVERVIEW",
  children,
  footer = null,
  onClose,
  className = "",
}) {
  const [isRendered, setIsRendered] = useState(open);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);

  // Giữ lại nội dung cũ trong quá trình chạy hiệu ứng đóng (disappear) để không bị nháy trắng
  const lastChildrenRef = useRef(children);
  const lastFooterRef = useRef(footer);
  const lastHeaderLabelRef = useRef(headerLabel);

  if (open) {
    lastChildrenRef.current = children;
    lastFooterRef.current = footer;
    lastHeaderLabelRef.current = headerLabel;
  }

  // Quản lý trạng thái xuất hiện (appear) và biến mất (disappear)
  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        closeTimerRef.current = null;
      }, ANIMATION_DURATION);
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [open, isRendered]);

  // Xử lý phím Escape và khóa cuộn body khi Drawer đang mở
  useEffect(() => {
    if (!isRendered) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isClosing) {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isRendered, isClosing, onClose]);

  if (!isRendered) return null;

  const contentToRender = open ? children : lastChildrenRef.current;
  const footerToRender = open ? footer : lastFooterRef.current;
  const labelToRender = open ? headerLabel : lastHeaderLabelRef.current;

  return (
    <>
      <div
        className={`overlay-scrim ${isClosing ? "is-closing" : ""}`}
        role="presentation"
        onClick={() => {
          if (!isClosing) {
            onClose?.();
          }
        }}
      />

      <aside
        className={`drawer is-open ${isClosing ? "is-closing" : ""} ${className}`}
        aria-modal="true"
        role="dialog"
      >
        <div className="drawer__header">
          <span>{labelToRender}</span>
          <button
            type="button"
            className="drawer__close"
            aria-label="Close drawer"
            onClick={() => {
              if (!isClosing) {
                onClose?.();
              }
            }}
          >
            ×
          </button>
        </div>

        <div className="drawer__content">{contentToRender}</div>

        {footerToRender && <div className="drawer__footer">{footerToRender}</div>}
      </aside>
    </>
  );
}
