import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import ForbiddenPage from "../../pages/ForbiddenPage/ForbiddenPage.jsx";

/**
 * Route Guard chặn người dùng chưa đăng nhập hoặc truy cập chéo vai trò (US-4 / FR-1).
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - Danh sách role được phép vào route này.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p style={{ font: "600 0.9rem var(--font-mono)", color: "var(--color-muted)" }}>
          ĐANG TẢI PHIÊN LÀM VIỆC...
        </p>
      </div>
    );
  }

  // 1. Chưa đăng nhập -> Chuyển về Login kèm vị trí ban đầu
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Đã đăng nhập nhưng không thuộc role cho phép -> Trả về 403 Forbidden
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || "CUSTOMER";
    if (!allowedRoles.includes(userRole)) {
      return <ForbiddenPage requiredRoles={allowedRoles} />;
    }
  }

  return children;
}
