import LoginPanel from "../../../components/LoginPanel/LoginPanel";

/**
 * AuthLayout — Shared 2-Column Neo-Brutalist Layout for Auth Pages
 * Eliminates repetitive AppShell/LoginPanel/login-card scaffolding.
 */
export default function AuthLayout({
    pageClass = "login-page",
    eyebrow = "StorageHub",
    title,
    error = "",
    errorId = "auth-error-banner",
    footer = null,
    children,
}) {
    return (
        <div className={pageClass}>
            <main className="login-main">
                {/* Cột trái: Bảng thông tin giá trị thương hiệu StorageHub */}
                <LoginPanel />

                {/* Cột phải: Form thẻ đăng nhập / đăng ký / khôi phục */}
                <div className="login-form-col">
                    <div className="login-card">
                        <div className="login-card__header">
                            {eyebrow && <p className="login-card__eyebrow">{eyebrow}</p>}
                            {title && <h2 className="login-card__title">{title}</h2>}
                        </div>

                        <div className="login-card__body">
                            {error && (
                                <div
                                    className="login-alert"
                                    role="alert"
                                    aria-live="assertive"
                                    id={errorId}
                                >
                                    <span className="login-alert__icon" aria-hidden="true">
                                        ⚠
                                    </span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {children}
                        </div>

                        {footer && <div className="login-card__footer">{footer}</div>}
                    </div>
                </div>
            </main>
        </div>
    );
}
