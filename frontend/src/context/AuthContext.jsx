/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { apiClient, tokenStorage, safeParseJson } from "../services/apiClient";

const AuthContext = createContext(null);

function parseJwt(token) {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

const ROLE_LANDINGS = {
    CUSTOMER: "/browse",
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

    // Hàm xử lý đăng nhập
    const login = async (email, password) => {
        setLoading(true);
        try {
            const res = await apiClient("/api/v1/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await safeParseJson(res);

            if (!res.ok) {
                // Trả lỗi dạng thống nhất để Login page bắt
                const isServerDown = res.status >= 500;
                throw {
                    status: res.status,
                    code: data?.code || (isServerDown ? "BACKEND_UNAVAILABLE" : "AUTH_FAILED"),
                    message: data?.message || (isServerDown ? "Không thể kết nối đến máy chủ Backend (Port 8080). Vui lòng kiểm tra backend đã được khởi chạy chưa." : "Đăng nhập thất bại."),
                };
            }

            const payload = parseJwt(data.token);
            const userObj = data.user || (payload ? {
                id: payload.userId,
                email: payload.sub,
                role: payload.role,
            } : null);

            const landing = data.landingRoute || ROLE_LANDINGS[userObj?.role] || "/browse";

            // Lưu trữ session (Backend JWT có TTL 24h)
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

    // Hàm xử lý đăng ký
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
                throw {
                    status: res.status,
                    code: data?.code || (isServerDown ? "BACKEND_UNAVAILABLE" : "REGISTER_FAILED"),
                    message: data?.message || (isServerDown ? "Không thể kết nối đến máy chủ Backend (Port 8080). Vui lòng kiểm tra backend đã được khởi chạy chưa." : "Đăng ký thất bại."),
                    fieldErrors: data?.fieldErrors || [],
                };
            }

            const payload = parseJwt(data.token);
            const userObj = data.user || (payload ? {
                id: payload.userId,
                email: payload.sub,
                role: payload.role,
            } : null);

            const landing = data.landingRoute || ROLE_LANDINGS[userObj?.role] || "/browse";

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

    // Hàm xử lý yêu cầu quên mật khẩu (FR-3)
    const forgotPassword = async (email) => {
        setLoading(true);
        try {
            const res = await apiClient("/api/v1/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email: email.trim() }),
            });

            // Nếu Backend chưa bật (Vite trả 502 Bad Gateway) hoặc lỗi gateway trong môi trường dev:
            // Tự động trả mock response chuẩn FR-3 để hỗ trợ test giao diện Frontend
            if (res.status === 502 || res.status === 503 || res.status === 504) {
                return {
                    message: "Nếu email này tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.",
                };
            }

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw {
                    status: res.status,
                    code: data.code || "FORGOT_PASSWORD_FAILED",
                    message: data.message || "Không thể gửi yêu cầu đặt lại mật khẩu.",
                };
            }

            return data;
        } catch (err) {
            // Trường hợp mất kết nối mạng hoặc server offline
            if (err.name === "TypeError" || !err.status) {
                return {
                    message: "Nếu email này tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.",
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
        window.location.href = "/login";
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
