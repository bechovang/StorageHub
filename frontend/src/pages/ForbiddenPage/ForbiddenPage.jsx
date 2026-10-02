import { useNavigate } from "react-router";
import { ShieldWarning, ArrowLeft, SignOut } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext.jsx";
import AppShell from "../../components/AppShell/AppShell.jsx";
import "./ForbiddenPage.css";

const ROLE_LANDINGS = {
  CUSTOMER: { path: "/browse", name: "Browse Units" },
  STAFF: { path: "/tasks", name: "Task Board" },
  FACILITY_MANAGER: { path: "/facility", name: "Facility Overview" },
  BUSINESS_OPS: { path: "/overview", name: "Business Overview" },
  SYSTEM_ADMIN: { path: "/users", name: "User Management" },
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
            <span>HTTP 403 · FORBIDDEN</span>
          </div>

          <h1 className="forbidden-title">Không thể truy cập trang này</h1>

          <p className="forbidden-desc">
            Trang bạn đang tìm kiếm không khả dụng đối với tài khoản của bạn hoặc yêu cầu quyền hạn chuyên biệt.
          </p>

          <div className="forbidden-actions">
            <button
              type="button"
              className="forbidden-btn forbidden-btn--primary"
              onClick={() => navigate(userLanding.path, { replace: true })}
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Quay về trang chủ</span>
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
