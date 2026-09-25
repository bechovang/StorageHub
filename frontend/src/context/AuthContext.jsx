import { createContext, useContext, useState, useEffect } from "react";
import { apiClient, tokenStorage } from "../services/apiClient";

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

            const data = await res.json();

            if (!res.ok) {
                // Trả lỗi dạng thống nhất để Login page bắt
                throw {
                    status: res.status,
                    code: data.code || "AUTH_FAILED",
                    message: data.message,
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

    const logout = () => {
        tokenStorage.clear();
        setToken(null);
        setUser(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
