import { useEffect } from "react";
import { useLocation, Outlet } from "react-router";
import "./PageTransition.css";

/**
 * Route Transition Wrapper (Fade + slight translate).
 * Sử dụng CSS keyframes thuần túy thay vì thư viện bên ngoài (220ms, ease cubic-bezier).
 */
export default function PageTransition() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="page-transition-shell">
      <Outlet />
    </div>
  );
}
