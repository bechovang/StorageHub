/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { apiClient, tokenStorage, safeParseJson } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("storagehub_user");
        return saved ? JSON.parse(saved) : null;
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

            // Lưu trữ session (Backend JWT có TTL 24h)
            tokenStorage.set(data.token);
            localStorage.setItem("storagehub_user", JSON.stringify(data.user));
            localStorage.setItem("storagehub_expires_at", data.expiresAt);

            setToken(data.token);
            setUser(data.user);

            return data; // Chứa { token, user, landingRoute, expiresAt }
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

            tokenStorage.set(data.token);
            localStorage.setItem("storagehub_user", JSON.stringify(data.user));
            localStorage.setItem("storagehub_expires_at", data.expiresAt);

            setToken(data.token);
            setUser(data.user);

            return data;
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
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
