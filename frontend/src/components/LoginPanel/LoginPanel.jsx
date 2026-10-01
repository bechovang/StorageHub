const ROLES = [
    { key: "CUSTOMER", label: "Khách hàng" },
    { key: "STAFF", label: "Nhân viên kho" },
    { key: "FACILITY_MANAGER", label: "Quản lý cơ sở" },
    { key: "BUSINESS_OPS", label: "Quản lý vận hành" },
    { key: "SYSTEM_ADMIN", label: "Quản trị hệ thống" },
];

/**
 * Cột thông tin thương hiệu và vai trò hệ thống dùng chung cho trang Auth (Login / Register)
 */
export default function LoginPanel() {
    return (
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
    );
}
