import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * AuthCard — Swiss Neo-Brutalist Card with internal GSAP field staggered entrance and micro-shake alert.
 */
export default function AuthCard({
  title,
  eyebrow = "StorageHub",
  error = "",
  errorId = "auth-error-banner",
  footer = null,
  children,
  className = "",
  maxWidth = 400,
}) {
  const cardRef = useRef(null);
  const bodyRef = useRef(null);
  const errorRef = useRef(null);

  // Stagger animation for fields on mount / title switch
  useEffect(() => {
    if (!bodyRef.current) return;
    const ctx = gsap.context(() => {
      const elements = bodyRef.current.querySelectorAll(
        ".login-field, .pwd-requirements, .register-terms, .login-submit, .forgot-tip-card, .forgot-actions, .forgot-success, .forgot-desc"
      );

      if (elements.length > 0) {
        gsap.fromTo(
          elements,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.32,
            stagger: 0.04,
            ease: "power2.out",
            clearProps: "all",
          }
        );
      }
    }, bodyRef);

    return () => ctx.revert();
  }, [title]);

  // Micro-haptic shake & smooth expand when an error occurs
  useEffect(() => {
    if (!error || !errorRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        errorRef.current,
        { opacity: 0, y: -6, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: "back.out(1.5)" }
      );

      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { x: -5 },
          { x: 0, duration: 0.35, ease: "elastic.out(1.2, 0.3)", clearProps: "x" }
        );
      }
    }, cardRef);

    return () => ctx.revert();
  }, [error]);

  return (
    <div
      ref={cardRef}
      className={`login-card ${className}`}
      style={{ maxWidth: `${maxWidth}px` }}
    >
      <div className="login-card__header">
        {eyebrow && <p className="login-card__eyebrow">{eyebrow}</p>}
        {title && <h2 className="login-card__title">{title}</h2>}
      </div>

      <div ref={bodyRef} className="login-card__body">
        {error && (
          <div
            ref={errorRef}
            className="login-alert"
            role="alert"
            aria-live="assertive"
            id={errorId}
          >
            <span className="login-alert__icon" aria-hidden="true">
              ⚠
            </span>
            <span>{error}</span>
          </div>
        )}

        {children}
      </div>

      {footer && <div className="login-card__footer">{footer}</div>}
    </div>
  );
}
