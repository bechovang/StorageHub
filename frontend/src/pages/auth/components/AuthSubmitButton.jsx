/**
 * AuthSubmitButton — Standard submit CTA button with loading state & Swiss Neo-Brutalist arrow
 */
export default function AuthSubmitButton({
    id = "auth-submit",
    submitting = false,
    text = "Tiếp tục",
    loadingText = "Đang xử lý...",
    className = "",
    ...props
}) {
    return (
        <button
            id={id}
            className={`login-submit ${className}`}
            type="submit"
            disabled={submitting}
            {...props}
        >
            <span>{submitting ? loadingText : text}</span>
            <span className="login-submit__arrow" aria-hidden="true">
                →
            </span>
        </button>
    );
}
