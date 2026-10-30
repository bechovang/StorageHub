/**
 * AuthField — Reusable input field for Authentication pages (Login, Register, Forgot Password)
 * Handles floating label detection and required asterisk consistently.
 */
export default function AuthField({
    id,
    label,
    type = "text",
    value = "",
    onChange,
    disabled = false,
    required = false,
    placeholder = "",
    autoComplete,
    className = "",
    ariaRequired = true,
    children,
    ...props
}) {
    const hasValue = Boolean(value);

    return (
        <div className={`login-field ${hasValue ? "login-field--has-value" : ""} ${className}`}>
            <label className="login-field__label" htmlFor={id}>
                {label}
                {required && <span aria-hidden="true">*</span>}
            </label>
            {children || (
                <input
                    id={id}
                    className="login-field__input"
                    type={type}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    aria-required={ariaRequired}
                    {...props}
                />
            )}
        </div>
    );
}
