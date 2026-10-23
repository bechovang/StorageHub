import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute.jsx";

// Auth & Public Pages
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage.jsx";
import ForbiddenPage from "../pages/auth/ForbiddenPage.jsx";

// Customer Pages
import BrowsePage from "../pages/customer/BrowsePage.jsx";
import UnitDetailPage from "../pages/customer/UnitDetailPage.jsx";
import PaymentPage from "../pages/customer/PaymentPage.jsx";
import MyRentalsPage from "../pages/customer/MyRentalsPage.jsx";
import RentalDetailPage from "../pages/customer/RentalDetailPage.jsx";
import CheckInPassPage from "../pages/customer/CheckInPassPage.jsx";

// Staff Pages
import TaskBoardPage from "../pages/staff/TaskBoardPage.jsx";

// Facility Manager Pages
import FacilityOverviewPage from "../pages/facility/FacilityOverviewPage.jsx";
import UnitManagementPage from "../pages/facility/UnitManagementPage.jsx";
import StaffShiftsPage from "../pages/facility/StaffShiftsPage.jsx";

// Business Operations Pages
import BusinessOverviewPage from "../pages/business/BusinessOverviewPage.jsx";
import PolicyManagementPage from "../pages/business/PolicyManagementPage.jsx";
import ReportsPage from "../pages/business/ReportsPage.jsx";

// System Administrator Pages
import UserManagementPage from "../pages/admin/UserManagementPage.jsx";

// Shared / Common Pages
import ActivityLogPage from "../pages/common/ActivityLogPage.jsx";
import SupportPage from "../pages/common/SupportPage.jsx";

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      {/* ── 2. Customer Routes (contracts/routes.yaml) ── */}
      <Route path="/browse" element={<BrowsePage />} />
      <Route path="/units/:unitId" element={<UnitDetailPage />} />
      <Route
        path="/units/:unitId/book"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "SYSTEM_ADMIN"]}>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rentals"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "SYSTEM_ADMIN"]}>
            <MyRentalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rentals/:reservationId"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "SYSTEM_ADMIN"]}>
            <RentalDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rentals/:reservationId/check-in-pass"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "SYSTEM_ADMIN"]}>
            <CheckInPassPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "STAFF", "FACILITY_MANAGER", "SYSTEM_ADMIN"]}>
            <SupportPage />
          </ProtectedRoute>
        }
      />

      {/* ── 3. Payment Flow Routes (US-8) ── */}
      <Route
        path="/payment"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "SYSTEM_ADMIN"]}>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/:reservationId"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "SYSTEM_ADMIN"]}>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments/:paymentId"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "SYSTEM_ADMIN"]}>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route path="/checkout" element={<Navigate to="/payment" replace />} />

      {/* ── 4. Staff Routes (Chỉ STAFF & SYSTEM_ADMIN) ── */}
      <Route
        path="/tasks"
        element={
          <ProtectedRoute allowedRoles={["STAFF", "SYSTEM_ADMIN"]}>
            <TaskBoardPage />
          </ProtectedRoute>
        }
      />

      {/* ── 5. Facility Manager Routes (Chỉ FACILITY_MANAGER & SYSTEM_ADMIN) ── */}
      <Route
        path="/facility"
        element={
          <ProtectedRoute allowedRoles={["FACILITY_MANAGER", "SYSTEM_ADMIN"]}>
            <FacilityOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility/units"
        element={
          <ProtectedRoute allowedRoles={["FACILITY_MANAGER", "SYSTEM_ADMIN"]}>
            <UnitManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility/shifts"
        element={
          <ProtectedRoute allowedRoles={["FACILITY_MANAGER", "SYSTEM_ADMIN"]}>
            <StaffShiftsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility/activity"
        element={
          <ProtectedRoute allowedRoles={["FACILITY_MANAGER", "SYSTEM_ADMIN"]}>
            <ActivityLogPage />
          </ProtectedRoute>
        }
      />
      <Route path="/facility/*" element={<Navigate to="/facility" replace />} />

      {/* ── 6. Business Operations Routes (Chỉ BUSINESS_OPS & SYSTEM_ADMIN) ── */}
      <Route
        path="/overview"
        element={
          <ProtectedRoute allowedRoles={["BUSINESS_OPS", "SYSTEM_ADMIN"]}>
            <BusinessOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/policy"
        element={
          <ProtectedRoute allowedRoles={["BUSINESS_OPS", "SYSTEM_ADMIN"]}>
            <PolicyManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={["BUSINESS_OPS", "SYSTEM_ADMIN"]}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      {/* ── 7. System Administrator Routes (Chỉ SYSTEM_ADMIN) ── */}
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login-history"
        element={
          <ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}>
            <ActivityLogPage />
          </ProtectedRoute>
        }
      />

      {/* ── 8. Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
