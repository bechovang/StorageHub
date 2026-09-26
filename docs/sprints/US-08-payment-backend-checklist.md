# US-8 — Payment Modal + Mock Gateway (Checklist BE hiệu chỉnh)

> **Trạng thái 2026-09-26:** BE hoàn thành — 4 endpoint + mock gateway + handler DEPOSIT;
> integration test MySQL `storagehub_test` 10/10 pass (`PaymentIntegrationTest`).
> Còn: tích hợp FE với Phú; RENT active chờ US-15 (Sprint 2).

> Bản hiệu chỉnh từ checklist gốc ngày 2026-09-26, đối chiếu 3 nguồn sự thật:
> `contracts/openapi.yaml` (dòng 418–545, 898–982) · `backend/…/db/migration/V1__model_v3.sql` (bảng `payments`, dòng 295–317) · `backend/…/entity/Payment.java`.
> Quy tắc: **openapi.yaml là nguồn duy nhất** — muốn đổi API phải sửa contract trước (AD-2/3).

## Phạm vi

- Cơ chế thanh toán dùng chung, Sprint 1 chỉ nhận purpose **DEPOSIT + RENT** (`openapi.yaml:425-427`); `EXTENSION_FEE` / `DAMAGE_FEE` / `EXTRA_FEE` để enum đầy đủ nhưng thuộc sprint sau
- 3 phương thức mock: **CARD / MOMO / VNPAY**. PayOS thật là **US-33** (không phải US-34), stretch Sprint 3
- FE Payment Modal do Phú làm — phối hợp qua contract, không qua code

## Task 0 — Review contract (KHÔNG tạo mới)

Contract đã có đủ 4 endpoint (`openapi.yaml:420-545`), chỉ review + bổ sung:

```text
POST /api/v1/payments                  createPayment   (PaymentSession)
GET  /api/v1/payments                  listPayments    FR-9, phân trang (PaymentPage)
GET  /api/v1/payments/{paymentId}      getPayment      FE poll khi PROCESSING
POST /api/v1/payments/{paymentId}/confirm  confirmPayment  MoMo OTP → terminal
```

Việc cần làm ở contract:
- [x] Ghi rõ OTP test MoMo = `123456` trong description (đang chỉ có example)
- [x] Chốt số thẻ test CARD (vd `4242424242424242` = thành công, thẻ khác = thất bại) — thống nhất với Phú
- [x] Đối chiếu error codes: `PAYMENT_DUPLICATE`, `PAYMENT_INVALID_STATE`, `PAYMENT_NOT_FOUND`, `PAYMENT_EXPIRED`

## Task 1 — Enum: DÙNG SẴN, không tạo mới

`Payment.java` đã có nested enum khớp contract + DB — **không tạo class enum mới, không đổi tên**:

```java
Purpose : DEPOSIT, RENT, EXTENSION_FEE, DAMAGE_FEE, EXTRA_FEE   // 5 giá trị, KHÔNG phải 4
Method  : CARD, MOMO, VNPAY                                      // không phải VNPAY_QR
Status  : PENDING, PROCESSING, SUCCEEDED, FAILED, EXPIRED        // KHÔNG có CANCELLED
```

- Không thêm `CANCELLED`: hết hạn → `EXPIRED`; khách hủy = tạo payment mới.

## Task 2 — DB: KHÔNG đụng schema, KHÔNG có bảng receipts

- Receipt **không phải bảng riêng** — là cột `receipt_code` (RT-…) trên bảng `payments`, UNIQUE (`V1__model_v3.sql:297,308`), sinh khi SUCCEEDED
- Nguồn giao dịch là **3 FK riêng** + CHECK đúng 1 NOT NULL (`reservation_id` / `extension_id` / `settlement_id`) — không có `reference_id` generic
- KHÔNG thêm cột `gateway`, `gateway_transaction_id`, `expires_at`, `failure_code` trong US-8. Mock gateway state (QR expire, OTP expire) giữ in-memory; `qrExpiresAt` / `otpExpiresAt` / `paidAt` trả về derive-on-read theo AD-4. Nếu sau này muốn persist gateway data → Flyway V2 với Phúc (BE owner schema)
- Tiền: `DECIMAL(15,0)` đã đúng ở schema; Java dùng `BigDecimal`, cấm `float`/`double`

## Task 3 — DTO theo tên schema có sẵn trong contract

| Contract schema | Dùng cho |
|---|---|
| `PaymentSession` | Response của createPayment + getPayment (FE poll) — thay cho "PaymentStatusResponse" |
| `PaymentRecord` + `PaymentPage` | Response listPayments (FR-9) |
| `PaymentResult` | Response confirmPayment: `payment` + `receipt` + `reservation` (đã flip) + `contract` + notification |
| Request create | `{ purpose, reservationId, method, card?{number,expiry,cvc}, momoPhone? }` |
| Request confirm | `{ otp }` (6 ký tự) |

- Request **KHÔNG có** `amount`, `status`, `userId` — server tự tính từ Reservation + RentalPolicy, tự lấy user từ JWT
- **Không lưu** số thẻ / CVV / OTP vào DB hay log

## Task 4 — `PaymentGateway` interface + `MockPaymentGateway`

```java
public interface PaymentGateway {
    // trả kết quả; KHÔNG đụng database
}
```

Mock flow **theo đúng contract** (`openapi.yaml:430-434`):

| Method | Trả về ban đầu | Terminal |
|---|---|---|
| CARD | `PROCESSING` | FE poll GET → thẻ test hợp lệ `SUCCEEDED`, thẻ khác `FAILED` |
| MOMO | `PENDING` + `otpRequired` + `otpExpiresAt` | POST confirm: OTP `123456` → `SUCCEEDED`, sai → `FAILED` |
| VNPAY | `PENDING` + `qrPayload` + `qrExpiresAt` (~5 phút, server quyết) | poll: mock auto-complete ~2s → `SUCCEEDED`; quá 5 phút → `EXPIRED` |

- Inject `Clock` để test được case hết hạn QR/OTP
- US-33 (PayOS) sau này chỉ thêm impl `PayOsPaymentGateway` — interface giữ nguyên

## Task 5 — `PaymentService` (interface) + `PaymentServiceImpl` (`service/impl/`)

Theo pattern chuẩn vừa áp dụng cho AuthService. Flow createPayment:

1. Lấy user từ JWT (`Authentication`)
2. Ownership: reservation phải **của user đó** → sai trả `403`
3. State check theo purpose: DEPOSIT yêu cầu reservation `PENDING_PAYMENT` → sai trả `409 PAYMENT_INVALID_STATE`
4. Duplicate check: đã có payment (PENDING/PROCESSING chưa hết hạn hoặc SUCCEEDED) cho (reservation, purpose) → `409 PAYMENT_DUPLICATE`
5. **Tự tính amount** từ Reservation + RentalPolicy (deposit % theo policy)
6. Tạo payment `PENDING` (chưa có receipt_code)
7. Gọi gateway, map trạng thái về PaymentSession response

Flow confirmPayment (MoMo): verify OTP hết hạn (`PAYMENT_EXPIRED`) → gateway confirm → terminal.

## Task 6 — Handler theo purpose, gọi QUA owner service (không ghi DB trực tiếp)

Ownership matrix (ARCHITECTURE-SPINE.md) — PaymentService **không được** tự UPDATE reservations / INSERT contracts / notifications:

```text
DepositPaymentSuccessHandler:
  1. reservation: PENDING_PAYMENT → RESERVED     qua ReservationService (US-10, cũng của An)
  2. contract draft sinh tự động                  qua ContractService (US-11 — CỦA PHÚC, cần chốt interface sớm)
  3. receipt_code RT-… sinh trên payment          (PaymentService tự ghi — owner của payments)
  4. ActivityLog CONTRACT/PAYMENT…                qua LogService, cùng transaction
  5. NotificationEvent trong response             FE bắn toast từ response (Conventions)
```

- Sprint 1: implement đầy đủ **DEPOSIT**; **RENT** chỉ khung (check-in ritual là US-15 Sprint 2); 3 purpose còn lại chỉ để enum
- Nếu `ContractService` của Phúc chưa xong: code theo interface An định nghĩa sẵn, tạm no-op stub — không tự INSERT contracts
- Cả flow thành công chạy trong **1 transaction**; handler chỉ chạy đúng 1 lần (guard bằng status: chỉ handler khi transition → SUCCEEDED)

## Task 7 — Chống trùng (idempotency theo contract, KHÔNG thêm header mới)

- Payment đã `SUCCEEDED` → request create lại nhận `409 PAYMENT_DUPLICATE`; GET /{id} luôn idempotent trả trạng thái cũ
- Unique `receipt_code` ở DB là bảo mật cuối; set khi transition → SUCCEEDED
- KHÔNG thêm `Idempotency-Key` header — không có trong contract; muốn thêm thì sửa contract trước
- Confirm gọi 2 lần: lần 2 thấy payment đã terminal → trả kết quả cũ, không handler lại

## Task 8 — Thất bại đúng nghiệp vụ

- `FAILED` / `EXPIRED`: KHÔNG flip reservation, KHÔNG contract, KHÔNG receipt_code, KHÔNG notification "thành công"
- FE Retry / đổi phương thức = **tạo payment mới** (payment cũ giữ nguyên làm lịch sử — thỏa "mỗi lần thử lưu được lịch sử")
- Lịch sử thử: tự nhiên có qua các row payment cũ + ActivityLog

## Task 9 — Bảo mật

- [x] `/api/v1/payments/**` yêu cầu JWT (SecurityConfig)
- [x] Customer chỉ thanh toán reservation của mình (`403`)
- [x] Không trả card/OTP về response
- [x] ActivityLog cho: payment thành công (2 entry: PAYMENT + RESERVATION transition); payment thất bại bỏ qua — "nếu cần audit"

## Task 10 — Test bắt buộc

1. Deposit CARD hợp lệ → poll → `SUCCEEDED`, reservation `RESERVED`, đúng 1 receipt RT-…
2. CARD thất bại → `FAILED`, reservation vẫn `PENDING_PAYMENT`, không receipt
3. MoMo OTP `123456` → `SUCCEEDED` (kèm PaymentResult đầy đủ)
4. MoMo OTP sai → `FAILED`, retry được bằng CARD
5. VNPay QR quá 5 phút (Clock giả) → `EXPIRED`
6. User không sở hữu reservation → `403`
7. Request không có amount — server tính đúng từ reservation/policy (assert amount nguồn server)
8. Pay 2 lần (reservation, DEPOSIT) → lần 2 `409 PAYMENT_DUPLICATE`, vẫn 1 receipt
9. Confirm 2 lần → handler nghiệp vụ chạy đúng 1 lần
10. Tạo payment khi reservation `RESERVED` (sai phase) → `409 PAYMENT_INVALID_STATE`

## Phối hợp với Phú (FE)

- PaymentSession đủ field countdown: `otpRequired`, `otpExpiresAt`, `qrPayload`, `qrExpiresAt`
- Error codes + trạng thái chốt ở Task 0
- Quy tắc FE: đang `PROCESSING` không đóng modal; terminal do GET/confirm quyết; Retry/Switch = tạo payment mới
- Thống nhất số thẻ test + OTP test trước khi tích hợp

## Thứ tự code

```text
Contract review (Task 0)
→ ReservationService interface + method confirm (khung US-10)
→ DTO + PaymentController khung
→ PaymentGateway + MockPaymentGateway (Clock injectable)
→ PaymentServiceImpl: create + get + list
→ DepositPaymentSuccessHandler (+ContractService stub)
→ confirm + idempotency
→ Security + ownership
→ Test (Task 10)
→ Tích hợp FE với Phú
```

## Done khi

- 4 endpoint khớp `openapi.yaml` (bao gồm GET list FR-9)
- Kết quả do server quyết; FE không gửi được amount/status
- Thành công: đúng 1 receipt RT-…, reservation flip đúng, handler chạy 1 lần
- Thất bại/hết hạn: không đổi trạng thái nghiệp vụ nào; retry + đổi phương thức hoạt động
- Test Task 10 pass toàn bộ
