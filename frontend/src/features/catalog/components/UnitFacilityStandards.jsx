import {
  Thermometer,
  Key,
  Truck,
  Sparkle,
} from "@phosphor-icons/react";

export default function UnitFacilityStandards() {
  return (
    <article className="unit-detail-card">
      <div className="unit-detail-card__header">
        <h2 className="unit-detail-card__title">TIÊU CHUẨN KHO & TIỆN ÍCH CƠ SỞ</h2>
        <span className="unit-detail-badge-mono">AN TÂM LƯU TRỮ</span>
      </div>
      <div className="unit-detail-card__body">
        <div className="facility-standards-grid">
          <div className="standard-item">
            <div className="standard-item__icon">
              <Thermometer size={20} weight="bold" />
            </div>
            <div>
              <strong>Kiểm soát nhiệt ẩm 24/7</strong>
              <p>
                Duy trì 22°C - 24°C, độ ẩm &lt; 55% bảo vệ hàng điện tử, hồ sơ, đồ gỗ.
              </p>
            </div>
          </div>

          <div className="standard-item">
            <div className="standard-item__icon">
              <Key size={20} weight="bold" />
            </div>
            <div>
              <strong>Ra vào bằng mã PIN riêng</strong>
              <p>
                Chủ động vào kho 24/7 bằng mã PIN riêng, kích hoạt ngay sau khi đặt cọc.
              </p>
            </div>
          </div>

          <div className="standard-item">
            <div className="standard-item__icon">
              <Truck size={20} weight="bold" />
            </div>
            <div>
              <strong>Khu bốc dỡ & Thang nâng 3 tấn</strong>
              <p>
                Sân đỗ xe tải trực tiếp, thang nâng hàng chuyên dụng cách cửa kho 15m.
              </p>
            </div>
          </div>

          <div className="standard-item">
            <div className="standard-item__icon">
              <Sparkle size={20} weight="bold" />
            </div>
            <div>
              <strong>Khử khuẩn & Vệ sinh sạch sẽ</strong>
              <p>
                Kho luôn được quét dọn, khử khuẩn sạch sẽ trước khi bàn giao cho bạn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
