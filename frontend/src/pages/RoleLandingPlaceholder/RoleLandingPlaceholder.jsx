import { Link } from "react-router";
import {
  Kanban,
  Buildings,
  ChartLineUp,
  UsersThree,
  Lifebuoy,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "@phosphor-icons/react";
import AppShell from "../../components/AppShell/AppShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import "./RoleLandingPlaceholder.css";

const PLACEHOLDER_CONFIGS = {
  "/tasks": {
    role: "STAFF",
    icon: Kanban,
    title: "Task Board · Kanban Kho Tân Bình",
    eyebrow: "STAFF WORKSPACE · US-14 (SPRINT 2)",
    desc: "Bảng quản lý công việc tại quầy và kho bãi: Check-in, Checkout, Dọn dẹp kho (Turnover Buffer) và Hỗ trợ kỹ thuật.",
    kpis: [
      { label: "TASK HÔM NAY", value: "8 thẻ", status: "NORMAL" },
      { label: "CHỜ CHECK-IN", value: "3 đơn", status: "URGENT" },
      { label: "KHO CẦN DỌN", value: "2 ô kho", status: "WARNING" },
    ],
  },
  "/facility": {
    role: "FACILITY_MANAGER",
    icon: Buildings,
    title: "Facility Overview · Cơ sở Tân Bình Gateway",
    eyebrow: "FACILITY MANAGER · SPRINT 2",
    desc: "Giám sát toàn diện 40 ô kho, ca trực nhân viên, tình trạng bảo trì và nhật ký vận hành kho tại địa điểm.",
    kpis: [
      { label: "TỶ LỆ LẤP ĐẦY", value: "85%", status: "NORMAL" },
      { label: "UNIT KHẢ DỤNG", value: "6 ô", status: "NORMAL" },
      { label: "SỰ CỐ CHỜ XỬ LÝ", value: "1 vụ", status: "WARNING" },
    ],
  },
  "/overview": {
    role: "BUSINESS_OPS",
    icon: ChartLineUp,
    title: "Business Overview · Vận hành & Doanh thu",
    eyebrow: "BUSINESS OPERATIONS · SPRINT 3",
    desc: "Theo dõi doanh thu toàn hệ thống, hiệu suất kinh doanh, chính sách giá thuê (Rental Policy v3) và báo cáo tài chính.",
    kpis: [
      { label: "DOANH THU THÁNG", value: "148.500.000 ₫", status: "NORMAL" },
      { label: "CỌC ĐANG GIỮ", value: "24.600.000 ₫", status: "NORMAL" },
      { label: "TĂNG TRƯỞNG", value: "+12.4%", status: "NORMAL" },
    ],
  },
  "/users": {
    role: "SYSTEM_ADMIN",
    icon: UsersThree,
    title: "User Management · Quản trị người dùng (SYS-01)",
    eyebrow: "SYSTEM ADMINISTRATOR · SPRINT 3",
    desc: "Quản trị danh sách tài khoản 5 vai trò, cấp phát mật khẩu tạm, kích hoạt/khóa tài khoản và đối soát ma trận phân quyền.",
    kpis: [
      { label: "TỔNG TÀI KHOẢN", value: "28 users", status: "NORMAL" },
      { label: "KHÁCH HÀNG", value: "19 users", status: "NORMAL" },
      { label: "NHÂN SỰ VẬN HÀNH", value: "9 users", status: "NORMAL" },
    ],
  },
  "/support": {
    role: "CUSTOMER",
    icon: Lifebuoy,
    title: "Trung tâm Hỗ trợ & Sự cố (Support Ticket)",
    eyebrow: "CUSTOMER SUPPORT · US-23 (SPRINT 3)",
    desc: "Gửi yêu cầu trợ giúp trực tiếp cho nhân viên trực ca tại kho Tân Bình (mất thẻ, khóa hỏng, vệ sinh hoặc sự cố).",
    kpis: [
      { label: "TICKET ĐANG MỞ", value: "0", status: "NORMAL" },
      { label: "THỜI GIAN PHẢN HỒI", value: "< 15 phút", status: "NORMAL" },
      { label: "HOTLINE TRỰC BAN", value: "1900 8888", status: "NORMAL" },
    ],
  },
};

export default function RoleLandingPlaceholder({ path }) {
  const { user } = useAuth();
  const config =
    PLACEHOLDER_CONFIGS[path] || {
      role: user?.role || "CUSTOMER",
      icon: Clock,
      title: "Khu vực làm việc chuyên biệt",
      eyebrow: "STORAGEHUB ADAPTIVE SHELL",
      desc: "Trang này thuộc kế hoạch triển khai của Sprint tiếp theo.",
      kpis: [],
    };

  const IconComponent = config.icon;

  return (
    <AppShell>
      <div className="placeholder-page">
        <div className="placeholder-hero">
          <div className="placeholder-hero__badge">
            <span className="placeholder-hero__dot" />
            <span>{config.eyebrow}</span>
          </div>

          <div className="placeholder-hero__header">
            <div className="placeholder-hero__icon">
              <IconComponent size={28} weight="bold" />
            </div>
            <div>
              <h1 className="placeholder-hero__title">{config.title}</h1>
              <p className="placeholder-hero__desc">{config.desc}</p>
            </div>
          </div>
        </div>

        {/* KPI Preview */}
        {config.kpis.length > 0 && (
          <div className="placeholder-kpi-grid">
            {config.kpis.map((kpi) => (
              <div key={kpi.label} className="placeholder-kpi-card">
                <span className="placeholder-kpi-card__label">{kpi.label}</span>
                <span className="placeholder-kpi-card__val">{kpi.value}</span>
                <span className="placeholder-kpi-card__note">Dữ liệu seed demo V2</span>
              </div>
            ))}
          </div>
        )}

        {/* Status Callout */}
        <div className="placeholder-status-card">
          <div className="placeholder-status-card__left">
            <ShieldCheck size={24} weight="fill" className="placeholder-status-card__shield" />
            <div>
              <h3 className="placeholder-status-card__title">
                Phiên làm việc vai trò {user?.role || config.role} hợp lệ
              </h3>
              <p className="placeholder-status-card__text">
                Bạn đã đăng nhập thành công với mã định danh người dùng: <strong>{user?.fullName}</strong> ({user?.email}).
                Top bar Adaptive Shell ở phía trên đã tự động kích hoạt các chức năng tương ứng với quyền hạn của bạn.
              </p>
            </div>
          </div>

          <div className="placeholder-status-card__right">
            <Link to="/payment" className="placeholder-btn placeholder-btn--primary">
              <span>Thử nghiệm trang Thanh toán (US-8)</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
