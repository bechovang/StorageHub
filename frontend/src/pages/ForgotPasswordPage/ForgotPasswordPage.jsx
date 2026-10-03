import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle, ArrowLeft, PaperPlaneTilt } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { AuthValidator } from "../../validation";
import LoginPanel from "../../components/LoginPanel/LoginPanel";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [generalError, setGeneralError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError("");

        const validation = AuthValidator.validateForgotPassword({ email });
        if (!validation.isValid) {
            setGeneralError(validation.firstError);
            return;
        }

        setSubmitting(true);
        try {
            const res = await forgotPassword(email);
            setSuccess(true);
            setSuccessMessage(
                res?.message ||
                "Nếu email này tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn."
            );
        } catch (err) {
            setGeneralError(
                err?.message ||
                "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại sau."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = () => {
        setSuccess(false);
        setGeneralError("");
    };

    return (
        <div className="login-page forgot-password-page">
            {/* ── Main: cột trái (info) + cột phải (form) ── */}
            <main className="login-main">
                {/* Cột trái: đồng bộ với LoginPage và RegisterPage */}
                <LoginPanel />

                {/* Cột phải: thẻ form khôi phục mật khẩu */}
                <div className="login-form-col">
                    <div className="login-card">
                        <div className="login-card__header">
                            <h2 className="login-card__title">Quên mật khẩu</h2>
                        </div>

                        <div className="login-card__body">
                            {success ? (
                                /* ── Màn hình thông báo thành công (FR-3 Generic Message) ── */
                                <div className="forgot-success">
                                    <div className="forgot-success__header" role="status">
                                        <CheckCircle
                                            size={26}
                                            weight="fill"
                                            className="forgot-success__icon"
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <h3 className="forgot-success__title">Kiểm tra email của bạn</h3>
                                            <p className="forgot-success__text">
                                                {successMessage}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="forgot-tip-card">
                                        <p style={{ margin: "0 0 6px 0" }}>
                                            Địa chỉ nhận tin: <span className="forgot-success__email">{email}</span>
                                        </p>

                                        <p style={{ margin: 0 }}>
                                            Đường link đặt lại mật khẩu có hiệu lực trong <strong>15 phút</strong>.
                                        </p>
                                    </div>

                                    <div className="forgot-actions">
                                        <Link to="/login" className="forgot-btn-primary">
                                            <ArrowLeft size={16} weight="bold" aria-hidden="true" />
                                            <span>Quay lại Đăng nhập</span>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleRetry}
                                            className="forgot-btn-secondary"
                                        >
                                            <PaperPlaneTilt size={16} aria-hidden="true" />
                                            <span>Gửi lại với email khác</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ── Form nhập email khôi phục ── */
                                <>
                                    <p className="forgot-desc">
                                        Nhập email đăng ký của bạn. Hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu an toàn.
                                    </p>

                                    {/* Alert lỗi validation hoặc server */}
                                    {generalError && (
                                        <div
                                            className="login-alert"
                                            role="alert"
                                            aria-live="assertive"
                                            id="forgot-error-banner"
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
                                        aria-describedby={generalError ? "forgot-error-banner" : undefined}
                                    >
                                        {/* Email */}
                                        <div className={`login-field ${email ? "login-field--has-value" : ""}`}>
                                            <label className="login-field__label" htmlFor="forgot-email">
                                                Email đăng nhập
                                            </label>
                                            <input
                                                id="forgot-email"
                                                className="login-field__input"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={submitting}
                                                placeholder="storagehub@example.com"
                                                aria-required="true"
                                            />
                                        </div>

                                        <button
                                            id="forgot-submit"
                                            className="login-submit"
                                            type="submit"
                                            disabled={submitting}
                                        >
                                            <span>
                                                {submitting ? "Đang gửi yêu cầu..." : "Gửi liên kết khôi phục"}
                                            </span>
                                            <span className="login-submit__arrow" aria-hidden="true">
                                                →
                                            </span>
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>

                        {!success && (
                            <div className="login-card__footer">
                                <span className="login-card__footer-text">Đã nhớ mật khẩu?</span>
                                <Link to="/login" className="login-link login-link--strong">
                                    Quay lại Đăng nhập
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
