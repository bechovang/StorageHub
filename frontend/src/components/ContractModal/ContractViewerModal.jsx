import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Printer, X, ShieldCheck, CheckCircle } from "@phosphor-icons/react";
import Button from "../Button/Button.jsx";
import "./ContractViewerModal.css";
import { formatVND, formatDate } from "../../utils/formatters.js";

export default function ContractViewerModal({
  isOpen,
  onClose,
  contract,
  reservation,
  unit,
  user,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const res = reservation || {};
  const u = unit || res.unit || {};
  const usr = user || {};

  const contractCode = contract?.code || (res.code ? `HĐ-${res.code}` : "HĐTK-SH");
  const customerName = usr.fullName || res.customerName || "Khách hàng";
  const customerPhone = usr.phone || res.customerPhone || "";
  const customerEmail = usr.email || "";
  const unitCode = u.code || res.unitCode || "—";
  const typeName = u.typeName || "Kho lưu trữ";
  const sizeM2 = u.sizeM2 || 0;
  const volumeM3 = (sizeM2 * 2.8).toFixed(1);
  const dailyRent = u.baseDailyRent || res.dailyRent || (u.baseMonthlyRent ? Math.round(u.baseMonthlyRent / 30) : 0);
  const durationDays = res.durationDays || res.quote?.durationDays || 0;
  const totalRent = res.totalRent ?? res.totalEstimatedPrice ?? res.quote?.totalRent ?? (dailyRent * durationDays);
  const depositPaid = res.depositAmount || Math.round(totalRent * 0.1);

  const startDate = res.startDate || "";
  const endDate = res.endDate || "";

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="contract-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="contract-modal-card"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Thanh công cụ Modal */}
        <div className="contract-modal-toolbar no-print">
          <div className="contract-modal-tag">
            <ShieldCheck size={16} weight="bold" color="#16a34a" />
            <span>HỒ SƠ HỢP ĐỒNG PHÁP LÝ ĐIỆN TỬ · STORAGEHUB VN</span>
          </div>

          <div className="contract-modal-actions">
            <Button size="small" variant="secondary" onClick={handlePrint}>
              <Printer size={16} weight="bold" />
              <span>In / Lưu PDF</span>
            </Button>
            <button
              type="button"
              className="contract-modal-close-btn"
              onClick={onClose}
              aria-label="Đóng hợp đồng"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>

        {/* Nội dung Hợp đồng in ấn (Legal Document) */}
        <div className="contract-document-body" id="printable-contract">
          <header className="contract-doc-header">
            <p className="contract-country-motto">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />
              <strong>Độc lập – Tự do – Hạnh phúc</strong>
            </p>
            <div className="contract-title-wrap">
              <h1 className="contract-main-title">
                HỢP ĐỒNG THUÊ KHO TỰ QUẢN
              </h1>
              <p className="contract-sub-title">
                (SELF-STORAGE LEASE & SERVICES AGREEMENT)
              </p>
              <span className="contract-serial-number font-mono">
                Số: {contractCode} / HĐTK-SH
              </span>
            </div>
          </header>

          <section className="contract-parties-section">
            <div className="contract-party-box">
              <h2 className="contract-party-title">BÊN CHO THUÊ (BÊN A):</h2>
              <dl className="contract-party-dl">
                <div>
                  <dt>Tổ chức:</dt>
                  <dd><strong>CÔNG TY TNHH STORAGEHUB VIỆT NAM</strong></dd>
                </div>
                <div>
                  <dt>Mã số doanh nghiệp:</dt>
                  <dd className="font-mono">0318928492 do Sở KH&ĐT TP.HCM cấp</dd>
                </div>
                <div>
                  <dt>Địa chỉ cơ sở kho:</dt>
                  <dd>Depot Tân Bình Gateway, Số 12 Tân Bình, TP. Hồ Chí Minh</dd>
                </div>
                <div>
                  <dt>Đại diện theo ủy quyền:</dt>
                  <dd>Phạm Tuấn · Chức vụ: Quản lý Điều hành Cơ sở</dd>
                </div>
                <div>
                  <dt>Tổng đài CSKH 24/7:</dt>
                  <dd className="font-mono">1900 6868 · hotro@storagehub.vn</dd>
                </div>
              </dl>
            </div>

            <div className="contract-party-box">
              <h2 className="contract-party-title">BÊN THUÊ KHO (BÊN B):</h2>
              <dl className="contract-party-dl">
                <div>
                  <dt>Họ và tên khách hàng:</dt>
                  <dd><strong>{customerName}</strong></dd>
                </div>
                <div>
                  <dt>Số điện thoại liên hệ:</dt>
                  <dd className="font-mono">{customerPhone}</dd>
                </div>
                <div>
                  <dt>Địa chỉ thư điện tử:</dt>
                  <dd>{customerEmail}</dd>
                </div>
                <div>
                  <dt>CCCD / Định danh:</dt>
                  <dd className="font-mono">079198002345 (đối chiếu tại quầy)</dd>
                </div>
                <div>
                  <dt>Mục đích lưu trữ:</dt>
                  <dd>Lưu trữ hàng hóa cá nhân / tài liệu gia dụng tiêu chuẩn</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Các điều khoản pháp lý */}
          <section className="contract-clauses">
            <div className="contract-clause-item">
              <h3 className="clause-title">ĐIỀU 1: ĐỐI TƯỢNG VÀ THÔNG SỐ KHO THUÊ</h3>
              <p>
                Bên A đồng ý cho Bên B thuê kho tự quản thuộc hệ thống kho thông minh StorageHub với các thông số kỹ thuật được xác thực sau:
              </p>
              <ul>
                <li>Mã định danh kho: <strong>{unitCode}</strong> thuộc {typeName}.</li>
                <li>Diện tích sàn sử dụng: <strong>{sizeM2} m²</strong> · Thể tích thông thủy: <strong>~{volumeM3} m³</strong> (Trần cao tiêu chuẩn 2.8m).</li>
                <li>Hạ tầng kỹ thuật: Cửa cuốn thép dập gân dán seal bảo vệ, hệ thống khóa số PIN điện tử riêng biệt, hệ thống quạt thông gió và kiểm soát độ ẩm &lt; 65%.</li>
              </ul>
            </div>

            <div className="contract-clause-item">
              <h3 className="clause-title">ĐIỀU 2: THỜI HẠN THUÊ VÀ ĐIỀU KHOẢN TÀI CHÍNH</h3>
              <p>
                2.1. <strong>Thời hạn thuê cam kết:</strong> {durationDays || "—"} ngày, bắt đầu từ ngày <strong>{formatDate(startDate)}</strong> đến hết ngày <strong>{formatDate(endDate)}</strong>.
              </p>
              <p>
                2.2. <strong>Giá thuê theo ngày:</strong> <strong>{formatVND(dailyRent)} / ngày</strong> (đã bao gồm phí chiếu sáng hành lang, camera an ninh 24/7 và dịch vụ bảo trì định kỳ).
              </p>
              <p>
                2.3. <strong>Tổng tiền thuê kỳ cam kết:</strong> <strong>{formatVND(totalRent)}</strong>.
              </p>
              <p>
                2.4. <strong>Tiền đặt cọc giữ chỗ bảo đảm (10%):</strong> Bên B đã nộp <strong>{formatVND(depositPaid)}</strong> vào tài khoản chuyên thu ký quỹ bảo đảm của Bên A. Khoản tiền cọc này được Bên A lưu giữ an toàn và cam kết hoàn trả 100% cho Bên B ngay khi hợp đồng chấm dứt và hoàn tất biên bản nghiệm thu trả kho.
              </p>
            </div>

            <div className="contract-clause-item">
              <h3 className="clause-title">ĐIỀU 3: QUY CHẾ RA VÀO VÀ NGUYÊN TẮC AN TOÀN</h3>
              <p>
                3.1. Bên B có toàn quyền ra vào kho của mình 24 giờ trong ngày, 7 ngày trong tuần thông qua mã PIN điện tử cá nhân được cấp tại quầy tiếp đón.
              </p>
              <p>
                3.2. Bên B tuyệt đối không được lưu trữ: hóa chất độc hại, chất lỏng dễ bắt lửa, chất nổ, vũ khí, động vật sống, thực phẩm tươi sống dễ ôi thiu hoặc tài sản phi pháp theo luật pháp Việt Nam.
              </p>
              <p>
                3.3. Bên B cam kết giữ gìn vệ sinh sàn kho Epoxy và cấu trúc vách tôn. Mọi hành vi làm hư hại sẽ được bồi hoàn căn cứ theo Biểu phí khắc phục hiện hành ban hành bởi Bên A.
              </p>
            </div>

            <div className="contract-clause-item">
              <h3 className="clause-title">ĐIỀU 4: CHỮ KÝ VÀ HIỆU LỰC HỢP ĐỒNG</h3>
              <p>
                Hợp đồng này được lập thành dữ liệu điện tử có giá trị pháp lý tương đương văn bản giấy theo Luật Giao dịch điện tử. Hợp đồng có hiệu lực kể từ thời điểm Bên B hoàn tất thanh toán cọc giữ chỗ thành công.
              </p>
            </div>
          </section>

          {/* Chữ ký số và con dấu xác thực */}
          <footer className="contract-signature-block">
            <div className="contract-sig-col">
              <p className="contract-sig-label">ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</p>
              <span className="contract-sig-sub">(Ký số, đóng dấu điện tử)</span>
              <div className="contract-stamp-box">
                <div className="contract-digital-stamp">
                  <CheckCircle size={28} weight="fill" color="#dc2626" />
                  <div>
                    <strong>CÔNG TY TNHH STORAGEHUB VN</strong>
                    <span>ĐÃ KÝ SỐ HỢP LỆ</span>
                    <small className="font-mono">Ngày: {formatDate(startDate)}</small>
                  </div>
                </div>
              </div>
              <p className="contract-sig-signer">Phạm Tuấn (Giám đốc Cơ sở)</p>
            </div>

            <div className="contract-sig-col">
              <p className="contract-sig-label">ĐẠI DIỆN BÊN THUÊ KHO (BÊN B)</p>
              <span className="contract-sig-sub">(Ký xác nhận điện tử / OTP)</span>
              <div className="contract-customer-sig-box">
                <span className="customer-sig-name">{customerName}</span>
                <span className="customer-sig-note">✓ Đã xác thực CCCD & Số điện thoại</span>
              </div>
              <p className="contract-sig-signer">{customerName}</p>
            </div>
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}
