import "./Footer.css";

export default function Footer({
  leftText = "STORAGEHUB · HỆ THỐNG CHO THUÊ KHO TỰ QUẢN",
  rightText = "CƠ SỞ TÂN BÌNH · 2026",
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
