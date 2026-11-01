/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { apiClient, tokenStorage, safeParseJson } from "../services/apiClient";
import { translateBackendMessage } from "../utils/statusLabels";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const ROLE_LANDINGS = {
  CUSTOMER: "/",
  STAFF: "/tasks",
  FACILITY_MANAGER: "/facility",
  BUSINESS_OPS: "/overview",
  SYSTEM_ADMIN: "/users",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("storagehub_user");
      if (saved && saved !== "undefined" && saved !== "null") {
        return JSON.parse(saved);
      }
    } catch {
      // ignore JSON error
    }
    const existingToken = tokenStorage.get();
    if (existingToken) {
      const payload = parseJwt(existingToken);
      if (payload) {
        return {
          id: payload.userId,
          email: payload.sub,
          role: payload.role,
        };
      }
    }
    return null;
  });
  const [token, setToken] = useState(() => tokenStorage.get());
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    const trimmedEmail = email.trim();
    try {
      const res = await apiClient("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await safeParseJson(res);

      if (!res.ok) {
        const isServerDown = res.status >= 500;
        const rawMsg =
          data?.message ||
          (isServerDown
            ? "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại."
            : "Email hoặc mật khẩu không chính xác.");
        throw {
          status: res.status,
          code: data?.code || (isServerDown ? "BACKEND_UNAVAILABLE" : "AUTH_FAILED"),
          message: translateBackendMessage(rawMsg),
        };
      }

      const payload = parseJwt(data.token);
      const userObj =
        data.user ||
        (payload
          ? {
              id: payload.userId,
              email: payload.sub,
              role: payload.role,
            }
          : null);

      const landing = data.landingRoute || ROLE_LANDINGS[userObj?.role] || "/";

      tokenStorage.set(data.token);
      if (userObj) {
        localStorage.setItem("storagehub_user", JSON.stringify(userObj));
      }
      if (data.expiresAt) {
        localStorage.setItem("storagehub_expires_at", data.expiresAt);
      }

      setToken(data.token);
      setUser(userObj);

      return {
        ...data,
        user: userObj,
        landingRoute: landing,
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ fullName, phone, email, password, agreeTerms = true }) => {
    setLoading(true);
    try {
      const res = await apiClient("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          agreeTerms,
        }),
      });

      const data = await safeParseJson(res);

      if (!res.ok) {
        const isServerDown = res.status >= 500;
        const rawMsg =
          data?.message ||
          (isServerDown
            ? "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại."
            : "Đăng ký tài khoản không thành công. Vui lòng kiểm tra lại thông tin.");
        throw {
          status: res.status,
          code: data?.code || (isServerDown ? "BACKEND_UNAVAILABLE" : "REGISTER_FAILED"),
          message: translateBackendMessage(rawMsg),
          fieldErrors: data?.fieldErrors || [],
        };
      }

      const payload = parseJwt(data.token);
      const userObj =
        data.user ||
        (payload
          ? {
              id: payload.userId,
              email: payload.sub,
              role: payload.role,
            }
          : null);

      const landing = data.landingRoute || ROLE_LANDINGS[userObj?.role] || "/";

      tokenStorage.set(data.token);
      if (userObj) {
        localStorage.setItem("storagehub_user", JSON.stringify(userObj));
      }
      if (data.expiresAt) {
        localStorage.setItem("storagehub_expires_at", data.expiresAt);
      }

      setToken(data.token);
      setUser(userObj);

      return {
        ...data,
        user: userObj,
        landingRoute: landing,
      };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const res = await apiClient("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.status === 502 || res.status === 503 || res.status === 504) {
        return {
          message:
            "Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi tới hộp thư của bạn.",
        };
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw {
          status: res.status,
          code: data.code || "FORGOT_PASSWORD_FAILED",
          message: translateBackendMessage(
            data.message || "Không thể gửi yêu cầu đặt lại mật khẩu."
          ),
        };
      }

      return {
        ...data,
        message: translateBackendMessage(
          data.message ||
            "Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi tới hộp thư của bạn."
        ),
      };
    } catch (err) {
      if (err.name === "TypeError" || !err.status) {
        throw {
          status: 0,
          code: "NETWORK_ERROR",
          message: "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.",
        };
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        forgotPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
