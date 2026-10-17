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
                <p className="login-info__eyebrow">KHO TỰ QUẢN · CƠ SỞ TÂN BÌNH</p>
                <h1 className="login-info__headline">
                    Kho tự quản an toàn,<br />tiện lợi và linh hoạt.
                </h1>
                <p className="login-info__desc">
                    Thuê kho sạch sẽ, an ninh 24/7 và chủ động ra vào bằng mã PIN riêng ngay tại TP. Hồ Chí Minh.
                </p>

                {/* Cụm thông tin thực sự hữu ích thay cho danh sách role */}
                <div className="login-info__highlights">
                    <div className="login-highlight-item">
                        <span className="login-highlight-item__indicator" />
                        <span>Vào kho 24/7</span>
                    </div>
                    <div className="login-highlight-item">
                        <span className="login-highlight-item__indicator" />
                        <span>Mã PIN an toàn</span>
                    </div>
                    <div className="login-highlight-item">
                        <span className="login-highlight-item__indicator" />
                        <span>Thuê linh hoạt</span>
                    </div>
                </div>
            </div>

            <div className="login-info__footer">
                <p className="login-info__roles-hint">Kho sạch thoáng · An ninh 24/7 · Thuê theo tháng</p>
                <p className="login-info__footer-note">CƠ SỞ TÂN BÌNH · TP. HỒ CHÍ MINH</p>
            </div>
        </div>
    );
}
