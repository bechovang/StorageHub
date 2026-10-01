import Header from "../Header/Header.jsx";
import "./AppShell.css";

/**
 * Adaptive App Shell cho StorageHub (US-4 / FR-1).
 * Dùng chung 1 app frame duy nhất cho cả 5 roles.
 */
export default function AppShell({ children, brandHref, navLinks, roleLabel }) {
  return (
    <div className="app-shell">
      <Header brandHref={brandHref} navLinks={navLinks} roleLabel={roleLabel} />
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
