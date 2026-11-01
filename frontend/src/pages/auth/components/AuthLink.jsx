import { forwardRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthTransition } from "./AuthLayout";

/**
 * AuthLink — High-performance GSAP transition link for Auth views.
 * Plays directional slide & fade animation before navigating to prevent abrupt screen jumps.
 */
export const AuthLink = forwardRef(function AuthLink(
  { to, className, children, direction = "forward", onClick, replace = false, ...props },
  ref
) {
  const navigate = useNavigate();
  const transition = useAuthTransition();

  const handleClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return; // Maintain native browser behavior for opening in a new tab
    }
    e.preventDefault();
    if (onClick) onClick(e);

    if (transition?.startTransition) {
      transition.startTransition(to, direction, { replace });
    } else {
      navigate(to, { replace });
    }
  };

  return (
    <Link ref={ref} to={to} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
});

export default AuthLink;
