/**
 * legalContentService.js — Dịch vụ lưu trữ và quản lý văn bản pháp lý (Terms & Privacy)
 * Hỗ trợ nội dung mặc định chuẩn nghiệp vụ StorageHub và cho phép Admin chỉnh sửa, lưu trữ cục bộ có phiên bản.
 */

export const DEFAULT_TERMS = {
  id: "terms",
  type: "TERMS",
  title: "Điều khoản Dịch vụ Thuê kho Tự quản",
  subtitle: "Quy định quyền lợi, nghĩa vụ và nguyên tắc an toàn vận hành hệ thống kho thông minh StorageHub",
  version: "v3.2.0",
  effectiveDate: "01/11/2026",
  lastUpdated: "2026-11-01T08:00:00Z",
  updatedBy: "Ban Quản lý Vận hành StorageHub",
  clauses: [
    {
      id: "clause-1",
      number: "ĐIỀU 1",
      title: "ĐỐI TƯỢNG VÀ PHẠM VI ÁP DỤNG",
      content:
        "Điều khoản Dịch vụ này áp dụng cho toàn bộ cá nhân, hộ kinh doanh và tổ chức (sau đây gọi là 'Khách hàng' hoặc 'Bên thuê') đăng ký, đặt chỗ hoặc sử dụng dịch vụ kho tự quản thuộc hệ thống StorageHub (sau đây gọi là 'StorageHub' hoặc 'Bên cho thuê'). Việc Khách hàng bấm tick xác nhận 'Tôi đồng ý với Điều khoản dịch vụ' hoặc thanh toán tiền cọc giữ chỗ cấu thành thỏa thuận pháp lý có giá trị ràng buộc tương đương văn bản hợp đồng theo Luật Giao dịch điện tử.",
      bullets: [
        "Hạ tầng kho tiêu chuẩn: Vách ngăn thép dập gân chịu lực, trần thông thủy 2.8m, cửa cuốn hoặc cửa thép dán seal an ninh.",
        "Tiện ích đi kèm: Hệ thống kiểm soát độ ẩm < 65%, quạt thông gió đối lưu liên tục, camera giám sát hành lang 24/7 và hệ thống khóa số PIN điện tử cá nhân.",
        "Địa bàn áp dụng: Toàn bộ hệ thống trung tâm lưu trữ StorageHub (hiện bao gồm Depot Tân Bình Gateway và các cơ sở liên kết).",
      ],
    },
    {
      id: "clause-2",
      number: "ĐIỀU 2",
      title: "QUY TRÌNH ĐẶT CHỖ & KÝ QUỸ ĐẶT CỌC (10%)",
      content:
        "Để đảm bảo kho được giữ chỗ chính thức trên hệ thống và tránh tình trạng đặt chỗ ảo, Khách hàng phải hoàn tất thanh toán khoản tiền ký quỹ bảo đảm giữ chỗ tương đương 10% tổng giá trị tiền thuê của kỳ cam kết.",
      bullets: [
        "Trạng thái giữ chỗ (RESERVED): Kho chỉ được khóa giữ chỗ trên hệ thống sau khi cổng thanh toán ghi nhận thành công giao dịch đặt cọc.",
        "Bảo toàn tiền cọc: Toàn bộ 100% tiền cọc được giữ an toàn tại tài khoản chuyên thu ký quỹ bảo đảm của StorageHub và được hoàn trả đầy đủ cho Khách hàng khi kết thúc hợp đồng.",
        "Quy định quá hạn nhận kho (No-Show): Nếu sau ngày bắt đầu thuê dự kiến mà Khách hàng không đến làm thủ tục nhận kho hoặc không thông báo gia hạn, hệ thống sẽ tự động hủy đơn giữ chỗ theo chính sách xử lý quá hạn.",
      ],
    },
    {
      id: "clause-3",
      number: "ĐIỀU 3",
      title: "THỦ TỤC NHẬN KHO TẠI QUẦY (CHECK-IN RITUAL)",
      content:
        "Khi đến nhận kho, Khách hàng xuất trình Thẻ nhận kho kỹ thuật số (Check-in Pass) tại quầy điều hành cơ sở để nhân viên đối chiếu và kích hoạt quyền ra vào kho.",
      bullets: [
        "Giấy tờ đối chiếu: Xuất trình CCCD/Hộ chiếu bản gốc còn hiệu lực trùng khớp với thông tin đã đăng ký tài khoản.",
        "Hợp đồng thuê kho: Hai bên tiến hành ký văn bản hợp đồng thuê kho (bản giấy hoặc điện tử) và nhân viên sẽ chụp ảnh lưu trữ hồ sơ đối soát.",
        "Thanh toán tiền thuê còn lại: Khách hàng hoàn tất thanh toán phần tiền thuê còn lại theo thỏa thuận kỳ hạn trước khi được cấp mã mở kho.",
        "Cấp mã PIN điện tử: Sau khi hoàn tất đối soát, hệ thống cấp mã PIN truy cập riêng biệt (Access PIN) có hiệu lực 24/7 trong suốt thời hạn thuê.",
      ],
    },
    {
      id: "clause-4",
      number: "ĐIỀU 4",
      title: "QUY CHẾ RA VÀO VÀ SỬ DỤNG MÃ PIN 24/7",
      content:
        "Khách hàng có toàn quyền chủ động ra vào kho của mình 24 giờ trong ngày, 7 ngày trong tuần thông qua hệ thống cổng và cửa kho bảo mật.",
      bullets: [
        "Bảo mật mã PIN: Khách hàng có nghĩa vụ tự bảo quản mã PIN được cấp. Không chia sẻ mã PIN cho người không có thẩm quyền.",
        "Đổi mã PIN: Khách hàng có thể yêu cầu đổi mã PIN tại quầy hoặc qua ứng dụng khi nghi ngờ mã bị lộ.",
        "Nhật ký ra vào: Mọi thao tác nhập mã mở cửa kho đều được ghi nhận tự động vào hệ thống nhật ký an ninh phục vụ công tác giám sát cơ sở.",
      ],
    },
    {
      id: "clause-5",
      number: "ĐIỀU 5",
      title: "DANH MỤC HÀNG HÓA NGHIÊM CẤM LƯU TRỮ",
      content:
        "Để đảm bảo an toàn tuyệt đối cho toàn bộ cơ sở và các kho lân cận, StorageHub nghiêm cấm tuyệt đối việc lưu trữ các mặt hàng sau trong bất kỳ hoàn cảnh nào:",
      bullets: [
        "Chất dễ cháy nổ, xăng dầu, bình gas khí nén, hóa chất ăn mòn, chất độc hại.",
        "Vũ khí, đạn dược, vật liệu nổ, trang thiết bị quân sự và các mặt hàng cấm lưu thông theo pháp luật Việt Nam.",
        "Động vật sống, côn trùng, thực vật tươi sống, thực phẩm dễ ôi thiu phát sinh mùi hoặc thu hút sâu bọ.",
        "Hàng hóa không rõ nguồn gốc xuất xứ, hàng buôn lậu, tiền mặt số lượng lớn, kim loại quý hoặc tài sản phi pháp.",
        "Chế tài vi phạm: Trường hợp phát hiện hàng cấm, StorageHub có quyền đơn phương chấm dứt hợp đồng ngay lập tức, phong tỏa kho và chuyển giao cơ quan chức năng có thẩm quyền xử lý theo quy định.",
      ],
    },
    {
      id: "clause-6",
      number: "ĐIỀU 6",
      title: "TRÁCH NHIỆM BẢO QUẢN & BỒI THƯỜNG THIỆT HẠI",
      content:
        "Khách hàng có trách nhiệm giữ gìn tình trạng kỹ thuật, cấu trúc vách ngăn và lớp sơn sàn Epoxy của kho trong suốt quá trình sử dụng.",
      bullets: [
        "Không tự ý hoán cải: Nghiêm cấm khoan, đục, đóng đinh, hàn cắt hoặc thay đổi kết cấu kho khi chưa có sự chấp thuận bằng văn bản.",
        "Trách nhiệm thiệt hại: Mọi hư hỏng do lỗi chủ quan của Bên thuê gây ra cho sàn kho, cửa cuốn, vách tôn hoặc hệ thống điện sẽ được bồi hoàn căn cứ theo Biểu phí khắc phục hiện hành ban hành bởi StorageHub.",
      ],
    },
    {
      id: "clause-7",
      number: "ĐIỀU 7",
      title: "GIA HẠN, CHẤM DỨT VÀ QUY TRÌNH TRẢ KHO (CHECKOUT)",
      content:
        "Khi hết thời hạn thuê hoặc có nhu cầu trả kho trước hạn, Khách hàng thực hiện theo quy trình đối soát minh bạch 4 bước:",
      bullets: [
        "Gia hạn thuê kho: Khách hàng có thể tạo yêu cầu gia hạn trên ứng dụng trước khi hợp đồng kết thúc ít nhất 03 ngày để đảm bảo giữ nguyên vị trí kho.",
        "Nghiệm thu 4 hạng mục trả kho: Nhân viên cơ sở cùng Khách hàng đối chiếu: (1) Thẻ/chìa khóa kho, (2) Khóa và tay nắm cửa, (3) Vệ sinh mặt sàn, (4) Kết cấu khung vách nguyên vẹn.",
        "Tất toán tiền cọc: Số tiền cọc 10% sẽ được hoàn trả đầy đủ vào tài khoản ngân hàng của Khách hàng ngay sau khi lập biên bản nghiệm thu (sau khi trừ các chi phí phụ thu hoặc tiền khắc phục hư hại nếu có).",
      ],
    },
    {
      id: "clause-8",
      number: "ĐIỀU 8",
      title: "HIỆU LỰC THI HÀNH & GIẢI QUYẾT TRANH CHẤP",
      content:
        "Điều khoản này có hiệu lực kể từ ngày công bố. Mọi tranh chấp phát sinh từ hoặc liên quan đến dịch vụ sẽ được ưu tiên thương lượng, hòa giải trên tinh thần thiện chí. Trường hợp không tự hòa giải được, tranh chấp sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại TP. Hồ Chí Minh theo quy định của pháp luật Việt Nam.",
      bullets: [
        "Sửa đổi điều khoản: StorageHub có quyền cập nhật, sửa đổi các điều khoản và thông báo trước công khai trên website.",
        "Kênh tiếp nhận ý kiến: Mọi thắc mắc vui lòng liên hệ Tổng đài CSKH 1900 6868 hoặc gửi email về hotro@storagehub.vn.",
      ],
    },
  ],
};

export const DEFAULT_PRIVACY = {
  id: "privacy",
  type: "PRIVACY",
  title: "Chính sách Bảo mật & Quyền Riêng tư",
  subtitle: "Cam kết bảo vệ dữ liệu định danh, hình ảnh giám sát và quyền riêng tư của Khách hàng tại StorageHub",
  version: "v3.2.0",
  effectiveDate: "01/11/2026",
  lastUpdated: "2026-11-01T08:00:00Z",
  updatedBy: "Bộ phận Pháp chế & An toàn Thông tin StorageHub",
  clauses: [
    {
      id: "clause-1",
      number: "ĐIỀU 1",
      title: "MỤC ĐÍCH VÀ PHẠM VI THU THẬP THÔNG TIN",
      content:
        "StorageHub chỉ thu thập các thông tin cá nhân cần thiết phục vụ cho việc xác thực định danh Khách hàng, tạo lập hợp đồng thuê kho và đảm bảo an ninh vận hành tại cơ sở theo quy định pháp luật Việt Nam.",
      bullets: [
        "Thông tin tài khoản: Họ và tên, số điện thoại, địa chỉ email đăng ký.",
        "Thông tin định danh pháp lý: Số CCCD/Hộ chiếu, ngày cấp, nơi cấp phục vụ việc ký kết hợp đồng thuê kho điện tử.",
        "Thông tin phương tiện: Biển số xe đăng ký ra vào cơ sở tiếp nhận và bốc dỡ hàng hóa.",
        "Thông tin giao dịch: Lịch sử đặt cọc, thanh toán tiền thuê, hóa đơn điện tử và các phụ lục hợp đồng.",
      ],
    },
    {
      id: "clause-2",
      number: "ĐIỀU 2",
      title: "GIÁM SÁT CAMERA AN NINH 24/7 & NHẬT KÝ KHÓA SỐ",
      content:
        "Nhằm đảm bảo an toàn tài sản tuyệt đối cho cộng đồng khách thuê, hệ thống camera giám sát được bố trí khoa học tại các khu vực công cộng của kho:",
      bullets: [
        "Vị trí camera an ninh: Chỉ lắp đặt tại hành lang chung, lối đi chính, khu vực cổng kiểm soát ra vào và bãi bốc dỡ xe hàng.",
        "Tôn trọng không gian riêng tư: Tuyệt đối không lắp đặt camera bên trong khoang chứa kho riêng của Khách hàng.",
        "Lưu trữ dữ liệu camera: Băng ghi hình được lưu trữ tự động trong hệ thống máy chủ an ninh trong vòng 30 ngày và chỉ được trích xuất khi có yêu cầu điều tra sự cố hoặc yêu cầu từ cơ quan chức năng.",
        "Nhật ký mã PIN điện tử: Hệ thống tự động ghi nhận thời gian mở khóa kho để đối soát khi xảy ra tranh chấp.",
      ],
    },
    {
      id: "clause-3",
      number: "ĐIỀU 3",
      title: "MỤC ĐÍCH SỬ DỤNG DỮ LIỆU",
      content:
        "Toàn bộ dữ liệu thu thập được StorageHub sử dụng cho các mục đích chính đáng sau:",
      bullets: [
        "Tạo lập và xác thực hợp đồng thuê kho hợp lệ theo quy định pháp luật.",
        "Cấp phát mã PIN, tạo thẻ nhận kho kỹ thuật số và kiểm soát phân quyền ra vào depot.",
        "Gửi thông báo nhắc hạn thanh toán, thông báo tiếp nhận trả kho hoặc thông báo lịch bảo trì định kỳ.",
        "Hỗ trợ giải quyết khiếu nại, phản hồi sự cố kỹ thuật và chăm sóc khách hàng 24/7.",
      ],
    },
    {
      id: "clause-4",
      number: "ĐIỀU 4",
      title: "TIÊU CHUẨN AN TOÀN & BẢO MẬT THÔNG TIN",
      content:
        "StorageHub áp dụng các tiêu chuẩn an ninh thông tin nghiêm ngặt để bảo vệ dữ liệu cá nhân của người dùng:",
      bullets: [
        "Mã hóa truyền tải: Toàn bộ dữ liệu truyền giữa trình duyệt và máy chủ được mã hóa qua chuẩn TLS 1.3/HTTPS 256-bit.",
        "Mã hóa mật khẩu: Mật khẩu người dùng được băm một chiều bằng thuật toán BCrypt với salt ngẫu nhiên, không thể giải mã ngược.",
        "Phân quyền nội bộ (RBAC): Chỉ nhân viên được phân công nhiệm vụ cụ thể mới có quyền tiếp cận hồ sơ khách hàng phục vụ nghiệp vụ ký kết.",
      ],
    },
    {
      id: "clause-5",
      number: "ĐIỀU 5",
      title: "CAM KẾT KHÔNG CHIA SẺ DỮ LIỆU CHO BÊN THỨ BA",
      content:
        "StorageHub cam kết không bán, không cho thuê, không trao đổi thông tin cá nhân của Khách hàng cho bất kỳ bên thứ ba nào vì mục đích thương mại hoặc quảng cáo trái phép.",
      bullets: [
        "Trường hợp ngoại lệ: Chúng tôi chỉ cung cấp thông tin cho cơ quan Công an, Tòa án hoặc cơ quan chức năng Nhà nước có thẩm quyền khi có văn bản yêu cầu chính thức theo quy định pháp luật Việt Nam.",
        "Đơn vị cung cấp dịch vụ hạ tầng: Các đối tác cổng thanh toán (VNPay/Momo) được kết nối qua API bảo mật tuân thủ chứng chỉ an ninh PCI-DSS.",
      ],
    },
    {
      id: "clause-6",
      number: "ĐIỀU 6",
      title: "QUYỀN CỦA KHÁCH HÀNG ĐỐI VỚI DỮ LIỆU CÁ NHÂN",
      content:
        "Khách hàng có toàn quyền kiểm soát thông tin cá nhân của mình trên hệ thống StorageHub:",
      bullets: [
        "Quyền tra cứu và cập nhật: Khách hàng có thể đăng nhập tài khoản để kiểm tra hoặc cập nhật số điện thoại, mật khẩu bất kỳ lúc nào.",
        "Quyền yêu cầu đóng tài khoản: Sau khi đã tất toán mọi khoản tiền thuê và nhận lại tiền cọc đầy đủ, Khách hàng có quyền yêu cầu xóa hoặc khóa tài khoản vĩnh viễn.",
      ],
    },
    {
      id: "clause-7",
      number: "ĐIỀU 7",
      title: "THÔNG TIN LIÊN HỆ & KHIẾU NẠI BẢO MẬT",
      content:
        "Mọi thắc mắc, đề nghị giải đáp hoặc khiếu nại liên quan đến chính sách quyền riêng tư và dữ liệu cá nhân, Khách hàng vui lòng liên hệ:",
      bullets: [
        "Đơn vị chủ quản: Công ty Cổ phần Giải pháp Lưu trữ Thông minh StorageHub Việt Nam.",
        "Trụ sở Depot: Depot Tân Bình Gateway, Số 12 Tân Bình, TP. Hồ Chí Minh.",
        "Tổng đài hỗ trợ 24/7: 1900 6868 · Thư điện tử: privacy@storagehub.vn / hotro@storagehub.vn.",
      ],
    },
  ],
};

const STORAGE_KEY_TERMS = "storagehub_legal_terms";
const STORAGE_KEY_PRIVACY = "storagehub_legal_privacy";

/**
 * Lấy nội dung Điều khoản dịch vụ
 */
export function getTermsContent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TERMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.clauses)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not load custom terms from storage, using default:", err);
  }
  return DEFAULT_TERMS;
}

/**
 * Lưu nội dung Điều khoản dịch vụ (dành cho Admin)
 */
export function saveTermsContent(content, author = "Quản trị viên") {
  const payload = {
    ...content,
    lastUpdated: new Date().toISOString(),
    updatedBy: author,
  };
  localStorage.setItem(STORAGE_KEY_TERMS, JSON.stringify(payload));
  return payload;
}

/**
 * Khôi phục Điều khoản dịch vụ về bản mặc định
 */
export function resetTermsContent() {
  localStorage.removeItem(STORAGE_KEY_TERMS);
  return DEFAULT_TERMS;
}

/**
 * Lấy nội dung Chính sách bảo mật
 */
export function getPrivacyContent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRIVACY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.clauses)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not load custom privacy from storage, using default:", err);
  }
  return DEFAULT_PRIVACY;
}

/**
 * Lưu nội dung Chính sách bảo mật (dành cho Admin)
 */
export function savePrivacyContent(content, author = "Quản trị viên") {
  const payload = {
    ...content,
    lastUpdated: new Date().toISOString(),
    updatedBy: author,
  };
  localStorage.setItem(STORAGE_KEY_PRIVACY, JSON.stringify(payload));
  return payload;
}

/**
 * Khôi phục Chính sách bảo mật về bản mặc định
 */
export function resetPrivacyContent() {
  localStorage.removeItem(STORAGE_KEY_PRIVACY);
  return DEFAULT_PRIVACY;
}
