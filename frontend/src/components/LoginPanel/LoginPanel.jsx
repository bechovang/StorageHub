/**
 * Cột thông tin thương hiệu và giá trị dịch vụ dùng chung cho trang Auth (Login / Register)
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
                <p className="login-info__eyebrow">SELF-SERVICE STORAGE · TÂN BÌNH DEPOT</p>
                <h1 className="login-info__headline">
                    Giải pháp lưu trữ cá nhân<br />&amp; quản lý kho thông minh.
                </h1>
                <p className="login-info__desc">
                    Nền tảng thuê kho tự quản thông minh và quản lý vận hành cơ sở tập trung theo thời gian thực.
                </p>

                {/* Cụm thông tin thực sự hữu ích thay cho danh sách role */}
                <div className="login-info__highlights">
                    <div className="login-highlight-item">
                        <span className="login-highlight-item__indicator" />
                        <span>24/7 Access</span>
                    </div>
                    <div className="login-highlight-item">
                        <span className="login-highlight-item__indicator" />
                        <span>Secure PIN</span>
                    </div>
                    <div className="login-highlight-item">
                        <span className="login-highlight-item__indicator" />
                        <span>Flexible Rental</span>
                    </div>
                </div>
            </div>

            <div className="login-info__footer">
                <p className="login-info__roles-hint">Secure storage · Flexible terms · Digital access</p>
                <p className="login-info__footer-note">TÂN BÌNH DEPOT · TP. HỒ CHÍ MINH</p>
            </div>
        </div>
    );
}
