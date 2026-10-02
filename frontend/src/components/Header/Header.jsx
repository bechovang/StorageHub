import "./Header.css";

export default function Header({
  brandName = "STORAGEHUB",
  brandHref = "#top",
  roleLabel = "REFERENCE",
  avatarText = "00",
  navLinks = [],
  rightContent = null,
  className = "",
}) {
  return (
    <header className={`app-header ${className}`}>
      <div className="app-header__inner">
        <a className="brand" href={brandHref} aria-label={`${brandName} home`}>
          <span className="brand__mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>{brandName}</span>
        </a>

        {navLinks && navLinks.length > 0 ? (
          <nav className="main-nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`main-nav__link ${link.active ? "is-active" : ""}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : (
          <div />
        )}

        <div className="account-tools">
          {roleLabel && <span className="role-label">{roleLabel}</span>}
          {avatarText && (
            <span className="avatar" aria-label="Profile avatar">
              {avatarText}
            </span>
          )}
          {rightContent}
        </div>
      </div>
    </header>
  );
}

