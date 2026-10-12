import { useEffect } from "react";
import { useLocation, useOutlet } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import "./PageTransition.css";

const TRANSITION_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const TRANSITION_CONFIG = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
};

/**
 * Route Transition Wrapper (Fade + slight translate).
 * Cảm giác chuyển trang dứt khoát, mượt mà chuẩn neo-brutalist (220ms, ease cubic-bezier).
 */
export default function PageTransition() {
  const location = useLocation();
  const element = useOutlet();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {element && (
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={TRANSITION_VARIANTS}
          transition={TRANSITION_CONFIG}
          className="page-transition-shell"
        >
          {element}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
