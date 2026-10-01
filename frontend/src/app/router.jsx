import { Routes, Route, Navigate } from "react-router";
import DesignSystemPage from "../pages/DesignSystemPage/DesignSystemPage.jsx";
import LoginPage from "../pages/LoginPage/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/ForgotPasswordPage/ForgotPasswordPage.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/demo" element={<DesignSystemPage />} />
    </Routes>
  );
}
