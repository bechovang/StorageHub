import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import gsap from "gsap";
import LoginPanel from "../../../components/LoginPanel/LoginPanel";
import AuthCard from "./AuthCard";

export const AuthTransitionContext = createContext({
  direction: "forward",
  isTransitioning: false,
  startTransition: () => {},
});

export function useAuthTransition() {
  return useContext(AuthTransitionContext);
}

/**
 * AuthLayout — Persistent 2-Column Neo-Brutalist Layout with GSAP Route Transitions
 * Holds the left brand panel permanently mounted while orchestrating fluid bi-directional
 * slide & fade animations on the auth card stage when switching between Login, Register, and Forgot Password.
 */
export default function AuthLayout({
  pageClass = "",
  eyebrow = "StorageHub",
  title,
  error = "",
  errorId = "auth-error-banner",
  footer = null,
  children,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const stageRef = useRef(null);

  const [direction, setDirection] = useState("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingNavRef = useRef(null);

  // Automatically determine modifier class from current pathname
  const pathname = location.pathname;
  const autoModifier = pathname.includes("register")
    ? "register-page"
    : pathname.includes("forgot")
    ? "forgot-password-page"
    : "";

  const finalPageClass = pageClass || `login-page ${autoModifier}`.trim();

  // Bi-directional exit animation trigger
  const startTransition = useCallback(
    (toUrl, dir = "forward", options = {}) => {
      if (isTransitioning) return;
      if (toUrl === location.pathname) return;

      setIsTransitioning(true);
      setDirection(dir);
      pendingNavRef.current = { toUrl, dir, options };

      if (!stageRef.current) {
        navigate(toUrl, options);
        setIsTransitioning(false);
        return;
      }

      const offset = dir === "forward" ? -28 : 28;

      gsap.to(stageRef.current, {
        x: offset,
        opacity: 0,
        scale: 0.98,
        duration: 0.18,
        ease: "power2.in",
        onComplete: () => {
          navigate(toUrl, options);
        },
      });
    },
    [isTransitioning, location.pathname, navigate]
  );

  // Entrance animation triggered when location.pathname changes
  useEffect(() => {
    if (!stageRef.current) return;

    let currentDir = direction;
    if (pendingNavRef.current) {
      currentDir = pendingNavRef.current.dir;
      pendingNavRef.current = null;
    } else {
      // Auto-detect direction on browser back/forward buttons
      if (pathname.includes("login")) {
        currentDir = "backward";
      } else {
        currentDir = "forward";
      }
    }

    const enterOffset = currentDir === "forward" ? 28 : -28;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        stageRef.current,
        {
          x: enterOffset,
          opacity: 0,
          scale: 0.98,
        },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.32,
          ease: "power3.out",
          clearProps: "transform,opacity",
          onComplete: () => {
            setIsTransitioning(false);
          },
        }
      );
    }, stageRef);

    return () => ctx.revert();
  }, [pathname]);

  return (
    <AuthTransitionContext.Provider value={{ direction, isTransitioning, startTransition }}>
      <div className={finalPageClass}>
        <main className="login-main">
          {/* Cột trái: Bảng thông tin giá trị thương hiệu StorageHub (persistent, zero unmount) */}
          <LoginPanel />

          {/* Cột phải: Form thẻ đăng nhập / đăng ký / khôi phục với sân khấu chuyển động GSAP */}
          <div className="login-form-col">
            <div ref={stageRef} className="auth-card-stage">
              {children ? (
                <AuthCard
                  title={title}
                  eyebrow={eyebrow}
                  error={error}
                  errorId={errorId}
                  footer={footer}
                >
                  {children}
                </AuthCard>
              ) : (
                <Outlet />
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthTransitionContext.Provider>
  );
}
