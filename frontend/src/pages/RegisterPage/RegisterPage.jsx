import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Check, Square } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { AuthValidator } from "../../validation";
import { LoginPanel } from "../LoginPage/LoginPage";
import "./RegisterPage.css";

export default function RegisterPage() {
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(true);

    const [generalError, setGeneralError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const passwordCriteria = AuthValidator.checkPasswordCriteria(password);

    // Tự động định dạng số điện thoại theo cụm 3-3-3 (ví dụ: 901 234 567)
    const formatPhoneNumber = (value = "") => {
        let digits = value.replace(/\D/g, "");
        if (digits.startsWith("0")) {
            digits = digits.slice(1);
        }
        digits = digits.slice(0, 9);

        if (digits.length <= 3) {
            return digits;
        } else if (digits.length <= 6) {
            return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        } else {
            return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        }
    };

    const handlePhoneChange = (e) => {
        setPhone(formatPhoneNumber(e.target.value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError("");

        const cleanDigits = phone.replace(/\D/g, "");
        const formattedPhoneForBackend = cleanDigits
            ? (cleanDigits.startsWith("0") ? cleanDigits : `0${cleanDigits}`)
            : "";

        const validation = AuthValidator.validateRegister({
            fullName,
            phone: formattedPhoneForBackend,
            email,
            password,
            confirmPassword,
            agreeTerms,
        });

        if (!validation.isValid) {
            setGeneralError(validation.firstError);
            return;
        }

        setSubmitting(true);
        try {
            const session = await register({
                fullName,
                phone: formattedPhoneForBackend,
                email,
                password,
                agreeTerms,
            });
            const destination = session.landingRoute || "/browse";
            navigate(destination, { replace: true });
        } catch (err) {
            if (err.status === 409 || err.code === "AUTH_EMAIL_EXISTS") {
                setGeneralError("Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.");
            } else if (err.status === 400) {
                setGeneralError(err.message || "Dữ liệu đăng ký không hợp lệ.");
            } else {
                setGeneralError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-page register-page">
            {/* ── Main: cột trái (info) + cột phải (form) ── */}
            <main className="login-main">
                {/* Cột trái dùng chung với LoginPage */}
                <LoginPanel />

                {/* Cột phải: form */}
                <div className="login-form-col">
                    <div className="login-card">
                        <div className="login-card__header">
                            <p className="login-card__eyebrow">StorageHub</p>
                            <h2 className="login-card__title">Đăng ký</h2>
                        </div>

                        <div className="login-card__body">
                            {/* Alert lỗi */}
                            {generalError && (
                                <div
                                    className="login-alert"
                                    role="alert"
                                    aria-live="assertive"
                                    id="register-error-banner"
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
                                aria-describedby={generalError ? "register-error-banner" : undefined}
                            >
                                {/* Họ và tên */}
                                <div className={`login-field ${fullName ? "login-field--has-value" : ""}`}>
                                    <label className="login-field__label" htmlFor="register-name">
                                        Họ và tên<span aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="register-name"
                                        className="login-field__input"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        disabled={submitting}
                                        placeholder="Nguyễn Văn A"
                                        aria-required="true"
                                    />
                                </div>

                                {/* Số điện thoại */}
                                <div className={`login-field login-field--phone ${phone ? "login-field--has-value" : ""}`}>
                                    <label className="login-field__label" htmlFor="register-phone">
                                        Số điện thoại<span aria-hidden="true">*</span>
                                    </label>
                                    <div className="phone-input-group">
                                        <span className="phone-prefix" aria-hidden="true">+84</span>
                                        <input
                                            id="register-phone"
                                            className="login-field__input phone-input"
                                            type="tel"
                                            autoComplete="tel"
                                            required
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            disabled={submitting}
                                            placeholder="123 456 789"
                                            aria-required="true"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className={`login-field ${email ? "login-field--has-value" : ""}`}>
                                    <label className="login-field__label" htmlFor="register-email">
                                        Email<span aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="register-email"
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

                                {/* Mật khẩu */}
                                <div className={`login-field ${password ? "login-field--has-value" : ""}`}>
                                    <label className="login-field__label" htmlFor="register-password">
                                        Mật khẩu<span aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="register-password"
                                        className="login-field__input"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={submitting}
                                        placeholder="••••••••"
                                        aria-required="true"
                                    />

                                    {/* Danh sách tiêu chí mật khẩu trực quan */}
                                    <ul className="pwd-requirements" aria-label="Tiêu chí mật khẩu">
                                        {passwordCriteria.map((item) => (
                                            <li
                                                key={item.id}
                                                className={`pwd-requirement-item ${item.met ? "pwd-requirement-item--met" : ""}`}
                                            >
                                                {item.met ? (
                                                    <Check size={13} weight="bold" className="pwd-rule-icon pwd-rule-icon--met" />
                                                ) : (
                                                    <Square size={6} weight="fill" className="pwd-rule-icon pwd-rule-icon--unmet" />
                                                )}
                                                <span>{item.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Xác nhận mật khẩu */}
                                <div className={`login-field ${confirmPassword ? "login-field--has-value" : ""}`}>
                                    <label className="login-field__label" htmlFor="register-confirm-password">
                                        Xác nhận mật khẩu<span aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="register-confirm-password"
                                        className="login-field__input"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={submitting}
                                        placeholder="Nhập lại mật khẩu"
                                        aria-required="true"
                                    />
                                </div>

                                {/* Checkbox điều khoản */}
                                <label className="register-terms">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                        disabled={submitting}
                                    />
                                    <span>
                                        Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của StorageHub
                                    </span>
                                </label>

                                <button
                                    id="register-submit"
                                    className="login-submit"
                                    type="submit"
                                    disabled={submitting}
                                >
                                    <span>
                                        {submitting ? "Đang xử lý..." : "Đăng ký tài khoản"}
                                    </span>
                                    <span className="login-submit__arrow" aria-hidden="true">
                                        →
                                    </span>
                                </button>
                            </form>
                        </div>

                        <div className="login-card__footer">
                            <span className="login-card__footer-text">Đã có tài khoản?</span>
                            <Link to="/login" className="login-link login-link--strong">
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
