import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import "./RegisterPage.css";

const ROLES = [
    { key: "CUSTOMER", label: "Khách hàng" },
    { key: "STAFF", label: "Nhân viên kho" },
    { key: "FACILITY_MANAGER", label: "Quản lý cơ sở" },
    { key: "BUSINESS_OPS", label: "Quản lý vận hành" },
    { key: "SYSTEM_ADMIN", label: "Quản trị hệ thống" },
];

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError("");

        if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
            setGeneralError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
            return;
        }

        if (password.length < 6) {
            setGeneralError("Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }

        if (password !== confirmPassword) {
            setGeneralError("Mật khẩu xác nhận không khớp.");
            return;
        }

        if (!agreeTerms) {
            setGeneralError("Vui lòng đồng ý với Điều khoản dịch vụ để tiếp tục.");
            return;
        }

        setSubmitting(true);
        try {
            const session = await register({
                fullName,
                phone,
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
                                <div className="login-field">
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
                                <div className="login-field">
                                    <label className="login-field__label" htmlFor="register-phone">
                                        Số điện thoại<span aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="register-phone"
                                        className="login-field__input"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        disabled={submitting}
                                        placeholder="0901234567"
                                        aria-required="true"
                                    />
                                </div>

                                {/* Email */}
                                <div className="login-field">
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
                                        placeholder="example@storagehub.vn"
                                        aria-required="true"
                                    />
                                </div>

                                {/* Mật khẩu */}
                                <div className="login-field">
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
                                        placeholder="Tối thiểu 6 ký tự"
                                        aria-required="true"
                                    />
                                </div>

                                {/* Xác nhận mật khẩu */}
                                <div className="login-field">
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
