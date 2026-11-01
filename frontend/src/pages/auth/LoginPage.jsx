import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { AuthValidator } from "../../validation";
import { AuthCard, AuthLink, AuthField, PasswordField, AuthSubmitButton } from "./components";
import "./LoginPage.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [generalError, setGeneralError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError("");

        const validation = AuthValidator.validateLogin({ email, password });
        if (!validation.isValid) {
            setGeneralError(validation.firstError);
            return;
        }

        setSubmitting(true);
        try {
            const session = await login(email, password);
            const destination =
                location.state?.from?.pathname || session.landingRoute || "/";
            navigate(destination, { replace: true });
        } catch (err) {
            // Không tiết lộ field nào sai — chỉ thông báo chung (FR-1)
            if (err.status === 423) {
                setGeneralError(
                    "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."
                );
            } else if (err.status === 401 || err.status === 400) {
                setGeneralError("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.");
            } else {
                setGeneralError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthCard
            title="Đăng nhập"
            error={generalError}
            errorId="login-error-banner"
            maxWidth={400}
            footer={
                <>
                    <span className="login-card__footer-text">Chưa có tài khoản?</span>
                    <AuthLink to="/register" direction="forward" className="login-link login-link--strong">
                        Đăng ký ngay
                    </AuthLink>
                </>
            }
        >
            <form
                className="login-form"
                onSubmit={handleSubmit}
                noValidate
                aria-describedby={generalError ? "login-error-banner" : undefined}
            >
                {/* Email đăng nhập */}
                <AuthField
                    id="login-email"
                    label="Email đăng nhập"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    placeholder="ban@example.com"
                />

                {/* Mật khẩu kèm icon ẩn/hiện */}
                <PasswordField
                    id="login-password"
                    label="Mật khẩu"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    placeholder="••••••••"
                    extraHeader={
                        <div className="login-field__header">
                            <AuthLink to="/forgot-password" direction="forward" className="login-link login-link--forgot">
                                Quên mật khẩu?
                            </AuthLink>
                        </div>
                    }
                />

                {/* Submit button */}
                <AuthSubmitButton
                    id="login-submit"
                    submitting={submitting}
                    text="Đăng nhập"
                    loadingText="Đang đăng nhập..."
                />
            </form>
        </AuthCard>
    );
}
