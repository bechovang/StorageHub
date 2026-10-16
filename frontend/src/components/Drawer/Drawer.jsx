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
  const [savedContent, setSavedContent] = useState({
    children,
    footer,
    headerLabel,
  });
  const [prevOpen, setPrevOpen] = useState(open);
  const closeTimerRef = useRef(null);

  // Cập nhật snapshot khi open thay đổi (theo React recommended pattern)
  if (open) {
    if (
      savedContent.children !== children ||
      savedContent.footer !== footer ||
      savedContent.headerLabel !== headerLabel
    ) {
      setSavedContent({ children, footer, headerLabel });
    }
  }

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
    }
  }

  useEffect(() => {
    if (isClosing) {
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, ANIMATION_DURATION);
      return () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      };
    }
  }, [isClosing]);

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

  const contentToRender = open ? children : savedContent.children;
  const footerToRender = open ? footer : savedContent.footer;
  const labelToRender = open ? headerLabel : savedContent.headerLabel;

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
