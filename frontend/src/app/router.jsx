import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import DesignSystemPage from "../pages/DesignSystemPage/DesignSystemPage.jsx";
import LoginPage from "../pages/LoginPage/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage/RegisterPage.jsx";
import PaymentPage from "../pages/PaymentPage/PaymentPage.jsx";
import ForbiddenPage from "../pages/ForbiddenPage/ForbiddenPage.jsx";
import RoleLandingPlaceholder from "../pages/RoleLandingPlaceholder/RoleLandingPlaceholder.jsx";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute.jsx";
import MyRentalsPage from "../pages/MyRentalsPage/MyRentalsPage.jsx";
import RentalDetailPage from "../pages/RentalDetailPage/RentalDetailPage.jsx";
import CheckInPassPage from "../pages/CheckInPassPage/CheckInPassPage.jsx";

const ROLE_LANDINGS = {
  CUSTOMER: "/browse",
  STAFF: "/tasks",
  FACILITY_MANAGER: "/facility",
  BUSINESS_OPS: "/overview",
  SYSTEM_ADMIN: "/users",
};

/**
 * Root "/" không phải route — FE redirect theo landingRoute của vai trò (routes.yaml).
 */
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const target = ROLE_LANDINGS[user?.role] || "/browse";
  return <Navigate to={target} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* ── 1. Public & Root Routes ── */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/demo" element={<DesignSystemPage />} />

      {/* ── 2. Customer Routes (contracts/routes.yaml) ── */}
      <Route path="/browse" element={<DesignSystemPage />} />
      <Route path="/units/:unitId" element={<DesignSystemPage />} />
      <Route path="/units/:unitId/book" element={<PaymentPage />} />
      <Route path="/rentals" element={<MyRentalsPage />} />
      <Route path="/rentals/:reservationId" element={<RentalDetailPage />} />
      <Route path="/rentals/:reservationId/check-in-pass" element={<CheckInPassPage />} />
      <Route path="/support" element={<RoleLandingPlaceholder path="/support" />} />

      {/* ── 3. Payment Flow Routes (US-8) ── */}
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/payment/:reservationId" element={<PaymentPage />} />
      <Route path="/payments/:paymentId" element={<PaymentPage />} />
      <Route path="/checkout" element={<Navigate to="/payment" replace />} />

      {/* ── 4. Staff Routes (Chỉ STAFF & SYSTEM_ADMIN) ── */}
      <Route
        path="/tasks"
        element={
          <ProtectedRoute allowedRoles={["STAFF", "SYSTEM_ADMIN"]}>
            <RoleLandingPlaceholder path="/tasks" />
          </ProtectedRoute>
        }
      />

      {/* ── 5. Facility Manager Routes (Chỉ FACILITY_MANAGER & SYSTEM_ADMIN) ── */}
      <Route
        path="/facility"
        element={
          <ProtectedRoute allowedRoles={["FACILITY_MANAGER", "SYSTEM_ADMIN"]}>
            <RoleLandingPlaceholder path="/facility" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility/*"
        element={
          <ProtectedRoute allowedRoles={["FACILITY_MANAGER", "SYSTEM_ADMIN"]}>
            <RoleLandingPlaceholder path="/facility" />
          </ProtectedRoute>
        }
      />

      {/* ── 6. Business Operations Routes (Chỉ BUSINESS_OPS & SYSTEM_ADMIN) ── */}
      <Route
        path="/overview"
        element={
          <ProtectedRoute allowedRoles={["BUSINESS_OPS", "SYSTEM_ADMIN"]}>
            <RoleLandingPlaceholder path="/overview" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/policy"
        element={
          <ProtectedRoute allowedRoles={["BUSINESS_OPS", "SYSTEM_ADMIN"]}>
            <RoleLandingPlaceholder path="/overview" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={["BUSINESS_OPS", "SYSTEM_ADMIN"]}>
            <RoleLandingPlaceholder path="/overview" />
          </ProtectedRoute>
        }
      />

      {/* ── 7. System Administrator Routes (Chỉ SYSTEM_ADMIN) ── */}
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}>
            <RoleLandingPlaceholder path="/users" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login-history"
        element={
          <ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}>
            <RoleLandingPlaceholder path="/users" />
          </ProtectedRoute>
        }
      />

      {/* ── 8. Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
