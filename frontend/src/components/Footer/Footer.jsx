import "./Footer.css";

export default function Footer({
  leftText = "STORAGEHUB / COMPONENT REFERENCE",
  rightText = "VERSION 1.0 · 2026",
  className = "",
}) {
  return (
    <footer className={`site-footer ${className}`}>
      <div className="site-footer__inner">
        <span>{leftText}</span>
        <span>{rightText}</span>
      </div>
    </footer>
  );
}

