import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";
import "./AppShell.css";

/**
 * Adaptive App Shell duy nhất cho toàn bộ hệ thống StorageHub (6 vai trò + Khách vãng lai).
 */
export default function AppShell({
  children,
  brandHref,
  navLinks,
  roleLabel,
  showFooter = false,
}) {
  return (
    <div className="app-shell">
      <Header brandHref={brandHref} navLinks={navLinks} roleLabel={roleLabel} />
      <main className="app-shell__main">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
