import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AuthValidator } from "../../validation";

import "./LoginPage.css";

const ROLES = [
    { key: "CUSTOMER", label: "Khách hàng" },
    { key: "STAFF", label: "Nhân viên kho" },
    { key: "FACILITY_MANAGER", label: "Quản lý cơ sở" },
    { key: "BUSINESS_OPS", label: "Quản lý vận hành" },
    { key: "SYSTEM_ADMIN", label: "Quản trị hệ thống" },
];

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
                <div className="login-info" aria-hidden="true">
                    <div>
                        <div className="login-brand login-brand--light" style={{ marginBottom: "2.5rem" }}>
                            <span className="login-brand__mark" aria-hidden="true">
                                <i /><i /><i />
                            </span>
                            <span>STORAGEHUB</span>
                        </div>
                        <p className="login-info__eyebrow">SELF-SERVICE STORAGE / TAN BINH</p>
                        <h1 className="login-info__headline">
                            Một hệ thống.<br />Năm vai trò.
                        </h1>
                        <p className="login-info__desc">
                            Khách hàng tự đặt kho, nhân viên vận hành trên kanban, quản lý
                            theo dõi toàn bộ cơ sở — cùng một ứng dụng, cùng một URL.
                        </p>
                    </div>

                    <div className="login-info__roles">
                        <p className="login-info__roles-label">Hệ thống phục vụ</p>
                        {ROLES.map((r) => (
                            <span key={r.key} className="role-chip">
                                <span className="role-chip__dot" aria-hidden="true" />
                                {r.key}
                                <span
                                    style={{
                                        color: "rgba(255,255,255,0.4)",
                                        fontWeight: 400,
                                        letterSpacing: 0,
                                    }}
                                >
                                    — {r.label}
                                </span>
                            </span>
                        ))}
                        <p className="login-info__footer-note">TAN BINH DEPOT · VND PRICING</p>
                    </div>
                </div>

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
                                <div className="login-field">
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
                                <div className="login-field">
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
