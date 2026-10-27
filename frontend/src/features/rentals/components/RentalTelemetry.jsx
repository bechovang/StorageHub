import { Buildings, Clock } from "@phosphor-icons/react";

export default function RentalTelemetry() {
  return (
    <div className="rental-telemetry" aria-label="Thông tin trạng thái cơ sở lưu trữ">
      <div className="rental-telemetry__item">
        <Buildings size={15} weight="bold" className="rental-telemetry__icon" />
        <span>
          Cơ sở: <strong>Tân Bình</strong>
        </span>
      </div>

      <div className="rental-telemetry__divider" aria-hidden="true" />

      <div className="rental-telemetry__item">
        <span className="rental-telemetry__dot" aria-hidden="true" />
        <span>
          Cổng kiểm soát: <strong>Trực tuyến (24/7)</strong>
        </span>
      </div>

      <div className="rental-telemetry__divider" aria-hidden="true" />

      <div className="rental-telemetry__item">
        <Clock size={15} weight="bold" className="rental-telemetry__icon" />
        <span>
          Quầy dịch vụ: <strong>08:00 – 20:00 hàng ngày</strong>
        </span>
      </div>
    </div>
  );
}
