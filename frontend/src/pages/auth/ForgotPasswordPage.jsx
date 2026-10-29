import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle, ArrowLeft, PaperPlaneTilt } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { AuthValidator } from "../../validation";
import { AuthLayout, AuthField, AuthSubmitButton } from "./components";
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
        <AuthLayout
            pageClass="login-page forgot-password-page"
            title="Quên mật khẩu"
            error={generalError}
            errorId="forgot-error-banner"
            footer={
                !success && (
                    <>
                        <span className="login-card__footer-text">Đã nhớ mật khẩu?</span>
                        <Link to="/login" className="login-link login-link--strong">
                            Quay lại Đăng nhập
                        </Link>
                    </>
                )
            }
        >
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
                        Nhập địa chỉ email của bạn để nhận liên kết đặt lại mật khẩu.
                    </p>

                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                        noValidate
                        aria-describedby={generalError ? "forgot-error-banner" : undefined}
                    >
                        {/* Email */}
                        <AuthField
                            id="forgot-email"
                            label="Email đăng nhập"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={submitting}
                            placeholder="ban@example.com"
                        />

                        {/* Submit button */}
                        <AuthSubmitButton
                            id="forgot-submit"
                            submitting={submitting}
                            text="Gửi liên kết khôi phục"
                            loadingText="Đang gửi liên kết..."
                        />
                    </form>
                </>
            )}
        </AuthLayout>
    );
}
