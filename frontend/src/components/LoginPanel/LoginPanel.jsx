import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Cột thông tin thương hiệu và giá trị dịch vụ dùng chung cho trang Auth (Login / Register / Forgot Password)
 * Tích hợp hoạt họa GSAP phối hợp thanh lịch trên desktop
 */
export default function LoginPanel() {
    const panelRef = useRef(null);

    useEffect(() => {
        if (!panelRef.current) return;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            tl.fromTo(
                ".login-brand__mark i",
                { scaleY: 0, transformOrigin: "bottom center" },
                { scaleY: 1, duration: 0.45, stagger: 0.08 }
            )
            .fromTo(
                ".login-brand span, .login-info__eyebrow",
                { opacity: 0, x: -14 },
                { opacity: 1, x: 0, duration: 0.4, stagger: 0.08 },
                "-=0.2"
            )
            .fromTo(
                ".login-info__headline",
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.55 },
                "-=0.25"
            )
            .fromTo(
                ".login-info__desc",
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.45 },
                "-=0.3"
            )
            .fromTo(
                ".login-highlight-item",
                { opacity: 0, scale: 0.94, y: 8 },
                { opacity: 1, scale: 1, y: 0, duration: 0.35, stagger: 0.07, ease: "back.out(1.4)" },
                "-=0.2"
            )
            .fromTo(
                ".login-info__footer",
                { opacity: 0 },
                { opacity: 1, duration: 0.45 },
                "-=0.1"
            );
        }, panelRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={panelRef} className="login-info" aria-hidden="true">
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

                {/* Cụm thông tin giá trị thương hiệu */}
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
