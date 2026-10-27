# API Reference: Bảng Công Việc & 4 Nghi Thức (Staff Tasks & Rituals)

Các API quản lý thẻ công việc Kanban của nhân viên, đối soát thẻ nhận kho và thực thi 4 nghi thức nghiệp vụ nghiêm ngặt (Check-in, Checkout, Vệ sinh, Ký hợp đồng) kèm theo cơ chế lưu trữ minh chứng ảnh thực tế.

---

## 1. Lấy Danh Sách Nhiệm Vụ Nhân Viên

- **Method / URL**: `GET /api/v1/tasks`
- **Quyền hạn**: `STAFF`, `FACILITY_MANAGER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/taskService.js` ➔ `getStaffTasks()`
- **Response Thành Công (`200 OK`)**:
```json
{
  "items": [
    {
      "taskId": "task-01",
      "type": "CHECK_IN",
      "refCode": "BK-2031",
      "unitCode": "S-4",
      "customerName": "Nguyễn Thị Lan",
      "customerPhone": "0912 345 678",
      "dueTime": "09:30",
      "status": "TODO",
      "depositAmount": 34500,
      "ritual": {}
    }
  ],
  "total": 1
}
```

---

## 2. Hoàn Tất Nghi Thức & Cập Nhật Trạng Thái

- **Method / URL**: `PATCH /api/v1/tasks/{taskId}/status`
- **Quyền hạn**: `STAFF`, `FACILITY_MANAGER`, `SYSTEM_ADMIN`

### Chi Tiết Từng Nghi Thức Nghiệp Vụ:

---

### (A) Nghi thức Check-in Nhận Kho (`CHECK_IN`):

Giao diện thực hiện qua ngăn kéo **`CheckinRitualDrawer.jsx`** gồm 4 bước chuẩn hóa:

1. **Thẻ nhận kho cho Staff đối chiếu (Check-in Pass)**:
   - Hiển thị đầy đủ thông tin: Mã đơn đặt chỗ (`refCode`), Tên khách hàng, Số CCCD, Mã kho, và số tiền cọc 10% đã thanh toán online thành công (`depositVerified: true`).
   - Tích hợp mã QR đối soát: Nhân viên có thể nhấn để xem mã QR quét xác thực hoặc đối chiếu mã định danh trực tiếp.
   - Checkbox xác nhận: *“Đã đối chiếu thông tin CCCD / Hộ chiếu khớp với thông tin trên Thẻ nhận kho”*.

2. **Thu đủ 100% tiền thuê kho tại quầy (Rent Collection)**:
   - Nhân viên lựa chọn phương thức thu tiền còn lại: **Tiền mặt tại quầy (`CASH`)** hoặc **Chuyển khoản VietQR / POS thẻ ngân hàng (`BANK_TRANSFER`)**.
   - **BẮT BUỘC ĐÍNH KÈM ẢNH MINH CHỨNG (`paymentProofPhoto`)**:
     - Cho phép chọn file ảnh thật từ máy/thiết bị (`<input type="file" accept="image/*">`) hoặc bấm *“Chụp nhanh từ camera quầy”*.
     - Hệ thống từ chối hoàn tất nếu thiếu ảnh chụp biên nhận tiền mặt hoặc bill chuyển khoản ngân hàng.

3. **Ký hợp đồng thuê kho & Chụp ảnh lưu trữ (`contractPhotoUrl`)**:
   - Cung cấp nút xem nhanh văn bản mẫu Hợp đồng thuê kho điện tử chuẩn hóa (`ContractViewerModal.jsx`).
   - Khách hàng và đại diện StorageHub ký kết hợp đồng bằng văn bản tại quầy.
   - **BẮT BUỘC ĐÍNH KÈM ẢNH BẢN KÝ**: Tải lên ảnh chụp hợp đồng đã có chữ ký 2 bên.

4. **Kích hoạt & Bàn giao mã PIN ra vào 24/7 (`accessPin`)**:
   - Chỉ được mở khóa khi cả ảnh thu tiền và ảnh hợp đồng đã được đính kèm đầy đủ.
   - Nhân viên đọc và bàn giao mã số PIN định danh cho khách hàng.

---

### (B) Nghi thức Checkout & Tất Toán Trả Kho (`CHECKOUT`):

Giao diện thực hiện qua ngăn kéo **`CheckoutRitualDrawer.jsx`** gồm 4 bước kiểm tra và đối soát tài chính:

1. **Kiểm tra hiện trạng & Thu hồi tài sản (Inspection Checklist)**:
   - Kiểm tra 4 hạng mục bắt buộc: Thẻ từ / Khóa chip (`accessCard`), Ổ khóa số / Chốt an toàn (`padlock`), Vệ sinh sàn & tường (`cleanliness`), Kết cấu vách ngăn & cửa cuốn (`structure`).
   - Đánh giá theo 3 mức độ: `OK`, `MINOR` (Hư hại nhẹ), `MAJOR` (Nghiêm trọng).

2. **Kê khai phụ phí hư hại (Damage Charges Declaration)**:
   - Nếu có hư hại: Bắt buộc kê khai tên hạng mục, số tiền bồi thường (> 0) và **lý do giải trình cụ thể**.
   - Nếu không có hư hại: Tự động ghi nhận `charges = []`, hoàn trả 100% tiền cọc.

3. **Bảng đối soát tất toán cọc (Settlement Reconciliation)**:
   - Công thức tài chính:
     - `depositHeld` = Tiền cọc ban đầu StorageHub đang giữ.
     - `totalCharges` = Tổng phụ phí hư hại.
     - `refundAmount = Math.max(0, depositHeld - totalCharges)`.
     - `extraDue = Math.max(0, totalCharges - depositHeld)`.
   - **Trường hợp A - Dư cọc (`refundAmount > 0`)**: StorageHub hoàn trả tiền cọc cho khách qua Chuyển khoản VietQR hoặc Tiền mặt tại quầy.
   - **Trường hợp B - Thiếu cọc / Phụ phí vượt cọc (`extraDue > 0`)**: Khách hàng phải thanh toán thêm khoản chênh lệch phụ phí cho StorageHub qua Quét mã VietQR hoặc Tiền mặt.
   - **Trường hợp C - Cân bằng 100% (`0₫ chênh lệch`)**: Tiền cọc vừa đủ cấn trừ hoặc không có hư hại và cọc bằng 0.

4. **Lưu ảnh chứng từ đối soát tất toán (`settlementPhotoUrl`) (Bắt buộc)**:
   - Nếu hoàn cọc: Bắt buộc ảnh ủy nhiệm chi, màn hình chuyển khoản VietQR hoặc giấy nhận tiền mặt của khách.
   - Nếu thu thêm phụ phí: Bắt buộc ảnh biên lai thu tiền phụ phí hoặc màn hình chuyển khoản thành công của khách.
   - Nếu cân bằng: Bắt buộc ảnh chụp Biên bản nghiệm thu bàn giao và thanh lý hợp đồng.
   - Tự động lưu trữ vào `localStorage` theo `taskId` để bảo lưu vĩnh viễn không bị mất ảnh.
   - Sau khi hoàn tất, hệ thống tự động phát sinh nhiệm vụ dọn kho **`CLEANING`** cho ô kho vừa trả.

---

### (C) Nghi thức Vệ sinh kho (`CLEANING`):

Thực hiện dọn dẹp, kiểm tra độ ẩm, tra dầu ổ khóa và xác nhận ô kho sẵn sàng bàn giao cho khách mới (`readyForTenant: true`).

---

## 3. Cơ Chế Lưu Trữ Ảnh Thực Tế & Snap-back Chống Done Ảo

### (A) Lưu trữ ảnh thực tế (Photo Persistence):
- Mọi hình ảnh chụp bằng camera hoặc upload từ tệp (Biên lai thu tiền check-in, ảnh hợp đồng ký, chứng từ hoàn/thu tiền checkout) được mã hóa Base64 và lưu trữ đa tầng:
  1. `localStorage.setItem('storagehub_payment_photo_' + taskId, dataUrl)`
  2. `localStorage.setItem('storagehub_contract_photo_' + taskId, dataUrl)`
  3. `localStorage.setItem('storagehub_settlement_photo_' + taskId, dataUrl)`
  4. Đồng bộ trong đối tượng `task.ritual` thông qua `storagehub_ritual_overrides`.
- Khi người dùng tải lại trang (F5), mở lại ngăn kéo Drawer hoặc chuyển ca làm việc, toàn bộ ảnh minh chứng và thông tin đối soát vẫn được giữ nguyên vẹn 100%.

### (B) Ràng buộc Snap-Back Chống "Done Ảo":
Hàm `checkSnapBackViolation(task)` kiểm tra nghiêm ngặt:
- Nếu kéo thẻ sang `DONE` hoặc bấm chốt đơn khi:
  - Chưa đính kèm ảnh thu tiền mặt / chuyển khoản check-in ➔ **Chặn thao tác & bắn thông báo cảnh báo**.
  - Chưa đính kèm ảnh hợp đồng có chữ ký ➔ **Chặn thao tác**.
  - Chưa đính kèm ảnh chứng từ đối soát hoàn tiền / thu thêm tiền checkout ➔ **Chặn thao tác**.
  - Thiếu lý do trong phụ phí hư hại ➔ **Chặn thao tác**.
- Thẻ công việc sẽ tự động nảy ngược (Snap-back) về cột `IN_PROGRESS` kèm theo Toast cảnh báo chỉ rõ tiêu chí vi phạm.
