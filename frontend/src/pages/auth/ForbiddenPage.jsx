import { useNavigate } from "react-router";
import { ShieldWarning, ArrowLeft, SignOut } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import AppShell from "../../components/AppShell/AppShell.jsx";
import "./ForbiddenPage.css";

const ROLE_LANDINGS = {
  CUSTOMER: { path: "/browse", name: "Khám phá kho" },
  STAFF: { path: "/tasks", name: "Bảng công việc" },
  FACILITY_MANAGER: { path: "/facility", name: "Tổng quan cơ sở" },
  BUSINESS_OPS: { path: "/overview", name: "Tổng quan kinh doanh" },
  SYSTEM_ADMIN: { path: "/users", name: "Quản trị tài khoản" },
};

export default function ForbiddenPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role || "CUSTOMER";
  const userLanding = ROLE_LANDINGS[userRole] || { path: "/browse", name: "Trang chủ" };

  return (
    <AppShell>
      <div className="forbidden-page">
        <div className="forbidden-card">
          <div className="forbidden-badge">
            <ShieldWarning size={20} weight="fill" />
            <span>KHÔNG CÓ QUYỀN TRUY CẬP</span>
          </div>

          <h1 className="forbidden-title">Bạn không có quyền truy cập trang này</h1>

          <p className="forbidden-desc">
            Tài khoản hiện tại không được phân quyền mở khu vực này. Bạn có thể quay về màn hình làm việc chính hoặc đăng nhập bằng tài khoản khác.
          </p>

          <div className="forbidden-actions">
            <button
              type="button"
              className="forbidden-btn forbidden-btn--primary"
              onClick={() => navigate(userLanding.path, { replace: true })}
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Về {userLanding.name}</span>
            </button>

            <button
              type="button"
              className="forbidden-btn forbidden-btn--secondary"
              onClick={logout}
            >
              <SignOut size={16} />
              <span>Đổi tài khoản</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
