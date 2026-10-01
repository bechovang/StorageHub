import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { AuthValidator } from "../../validation";

import "./LoginPage.css";

import LoginPanel from "../../components/LoginPanel/LoginPanel";

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
                location.state?.from?.pathname || session.landingRoute || "/browse";
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
        <div className="login-page">
            {/* ── Main: cột trái (info) + cột phải (form) ── */}
            <main className="login-main">
                {/* Cột trái */}
                <LoginPanel />

                {/* Cột phải: form */}
                <div className="login-form-col">
                    <div className="login-card">
                        <div className="login-card__header">
                            <p className="login-card__eyebrow">StorageHub</p>
                            <h2 className="login-card__title">Đăng nhập</h2>
                        </div>

                        <div className="login-card__body">
                            {/* Alert lỗi chung — không tiết lộ field nào sai (FR-1) */}
                            {generalError && (
                                <div
                                    className="login-alert"
                                    role="alert"
                                    aria-live="assertive"
                                    id="login-error-banner"
                                >
                                    <span className="login-alert__icon" aria-hidden="true">
                                        ⚠
                                    </span>
                                    <span>{generalError}</span>
                                </div>
                            )}

                            <form
                                className="login-form"
                                onSubmit={handleSubmit}
                                noValidate
                                aria-describedby={generalError ? "login-error-banner" : undefined}
                            >
                                {/* Email */}
                                <div className={`login-field ${email ? "login-field--has-value" : ""}`}>
                                    <label className="login-field__label" htmlFor="login-email">
                                        Email đăng nhập<span aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="login-email"
                                        className="login-field__input"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={submitting}
                                        placeholder="example@storagehub.vn"
                                        aria-required="true"
                                    />
                                </div>

                                {/* Password */}
                                <div className={`login-field ${password ? "login-field--has-value" : ""}`}>
                                    <label className="login-field__label" htmlFor="login-password">
                                        Mật khẩu<span aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="login-password"
                                        className="login-field__input"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={submitting}
                                        placeholder="••••••••"
                                        aria-required="true"
                                    />
                                    <div className="login-field__header">
                                        <Link to="/forgot-password" className="login-link login-link--forgot">
                                            Quên mật khẩu?
                                        </Link>
                                    </div>
                                </div>

                                <button
                                    id="login-submit"
                                    className="login-submit"
                                    type="submit"
                                    disabled={submitting}
                                >
                                    <span>
                                        {submitting ? "Đang xác thực..." : "Đăng nhập"}
                                    </span>
                                    <span className="login-submit__arrow" aria-hidden="true">
                                        →
                                    </span>
                                </button>
                            </form>
                        </div>

                        <div className="login-card__footer">
                            <span className="login-card__footer-text">Chưa có tài khoản?</span>
                            <Link to="/register" className="login-link login-link--strong">
                                Đăng ký ngay
                            </Link> 
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
