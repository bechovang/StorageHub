import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Check, Square } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { AuthValidator } from "../../validation";
import { AuthLayout, AuthField, PasswordField, AuthSubmitButton } from "./components";
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
            const destination = session.landingRoute || "/";
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
        <AuthLayout
            pageClass="login-page register-page"
            title="Đăng ký"
            error={generalError}
            errorId="register-error-banner"
            footer={
                <>
                    <span className="login-card__footer-text">Đã có tài khoản?</span>
                    <Link to="/login" className="login-link login-link--strong">
                        Đăng nhập ngay
                    </Link>
                </>
            }
        >
            <form
                className="login-form"
                onSubmit={handleSubmit}
                noValidate
                aria-describedby={generalError ? "register-error-banner" : undefined}
            >
                {/* Họ và tên */}
                <AuthField
                    id="register-name"
                    label="Họ và tên"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={submitting}
                    placeholder="Nguyễn Văn A"
                />

                {/* Số điện thoại */}
                <AuthField
                    id="register-phone"
                    label="Số điện thoại"
                    required
                    className="login-field--phone"
                >
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
                </AuthField>

                {/* Email */}
                <AuthField
                    id="register-email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    placeholder="ban@example.com"
                />

                {/* Mật khẩu */}
                <PasswordField
                    id="register-password"
                    label="Mật khẩu"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    placeholder="••••••••"
                >
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
                </PasswordField>

                {/* Xác nhận mật khẩu */}
                <PasswordField
                    id="register-confirm-password"
                    label="Xác nhận mật khẩu"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    placeholder="Nhập lại mật khẩu"
                />

                {/* Checkbox điều khoản */}
                <label className="register-terms">
                    <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        disabled={submitting}
                    />
                    <span>
                        Tôi đồng ý với{" "}
                        <Link to="/terms" target="_blank" rel="noopener noreferrer">
                            Điều khoản dịch vụ
                        </Link>{" "}
                        và{" "}
                        <Link to="/privacy" target="_blank" rel="noopener noreferrer">
                            Chính sách bảo mật
                        </Link>{" "}
                        của StorageHub
                    </span>
                </label>

                {/* Submit button */}
                <AuthSubmitButton
                    id="register-submit"
                    submitting={submitting}
                    text="Đăng ký tài khoản"
                    loadingText="Đang khởi tạo tài khoản..."
                />
            </form>
        </AuthLayout>
    );
}
