import { useState } from "react";
import { Eye, EyeClosed } from "@phosphor-icons/react";

/**
 * PasswordField — Encapsulated Password Input with Visibility Toggle (Eye / EyeClosed)
 * Automatically manages show/hide state without code duplication across Login & Register.
 */
export default function PasswordField({
    id,
    label = "Mật khẩu",
    value = "",
    onChange,
    disabled = false,
    required = true,
    placeholder = "••••••••",
    autoComplete = "current-password",
    className = "",
    extraHeader = null,
    children = null,
    ...props
}) {
    const [showPassword, setShowPassword] = useState(false);
    const hasValue = Boolean(value);

    return (
        <div className={`login-field ${hasValue ? "login-field--has-value" : ""} ${className}`}>
            <label className="login-field__label" htmlFor={id}>
                {label}
                {required && <span aria-hidden="true">*</span>}
            </label>
            <div className="login-field__input-wrapper">
                <input
                    id={id}
                    className="login-field__input login-field__input--has-toggle"
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    aria-required="true"
                    {...props}
                />
                <button
                    type="button"
                    className="login-field__toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeClosed size={18} weight="bold" />
                    ) : (
                        <Eye size={18} weight="bold" />
                    )}
                </button>
            </div>
            {extraHeader}
            {children}
        </div>
    );
}
