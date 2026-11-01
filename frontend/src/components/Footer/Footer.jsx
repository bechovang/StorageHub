import { Link } from "react-router";
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
        <div className="site-footer__links">
          <Link to="/terms" className="site-footer__link">
            Điều khoản dịch vụ
          </Link>
          <span className="site-footer__sep">·</span>
          <Link to="/privacy" className="site-footer__link">
            Chính sách bảo mật
          </Link>
        </div>
        <span>{rightText}</span>
      </div>
    </footer>
  );
}
