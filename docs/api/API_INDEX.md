# STORAGEHUB REST API INDEX & CONTRACT SPECIFICATION

> **Single Source of Truth** cho toàn bộ API Endpoints của hệ thống StorageHub (Spring Boot Backend).
> AI Agent **BẮT BUỘC** phải tra cứu tệp này trước khi viết code gọi API phía frontend hoặc viết thêm endpoint phía backend.

---

## 1. Giao Thức Chung & Xác Thực

- **Base URL**: `/api/v1`
- **Authentication**: Header `Authorization: Bearer <storagehub_token>`
- **Token Storage (Frontend)**: `localStorage.getItem("storagehub_token")`
- **Mã lỗi chuẩn**:
  - `400 Bad Request`: Payload không hợp lệ hoặc vi phạm validate `@Valid`.
  - `401 Unauthorized`: Chưa đăng nhập hoặc token hết hạn.
  - `403 Forbidden`: Người dùng không có vai trò phù hợp (`@PreAuthorize`).
  - `404 Not Found`: Không tìm thấy thực thể theo ID.
  - `409 Conflict`: Xung đột trạng thái (ví dụ: kho đã được thuê, ca trực trùng lặp).

---

## 2. Bảng Chỉ Mục Endpoints Chi Tiết

### 🔑 2.1. Xác Thực & Người Dùng (`/api/v1/auth`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | `LoginRequest` (`email`, `password`) | `AuthSessionResponse` | Trả về JWT token & thông tin user |
| `POST` | `/api/v1/auth/register` | Public | `RegisterRequest` (`fullName`, `email`, `phone`, `password`) | `AuthSessionResponse` | Đăng ký khách hàng mới |
| `POST` | `/api/v1/auth/forgot-password` | Public | `ForgotPasswordRequest` (`email`) | `ForgotPasswordResponse` | Yêu cầu cấp lại mật khẩu |
| `GET` | `/api/v1/auth/me` | Authenticated | *None* | `MeResponse` | Lấy profile người dùng hiện tại |

---

### 👥 2.2. Quản Lý Người Dùng (`/api/v1/users`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | Admin / Ops | Query: `role`, `status`, `search`, `page`, `size` | `UserPageResponse` | Danh sách tài khoản phân trang |
| `POST` | `/api/v1/users` | Admin | `CreateUserRequest` | `CreateUserResponse` | Tạo tài khoản nội bộ (Staff/Manager) |
| `GET` | `/api/v1/users/{userId}` | Admin / Ops | Path: `userId` | `UserDetailResponse` | Chi tiết hồ sơ người dùng |
| `PATCH` | `/api/v1/users/{userId}/status` | Admin | Path: `userId`, Body: `UserStatusRequest` | `UserDetailResponse` | Khóa/Mở khóa tài khoản |
| `PATCH` | `/api/v1/users/{userId}/role` | Admin | Path: `userId`, Body: `UserRoleRequest` | `UserDetailResponse` | Đổi phân quyền vai trò |
| `POST` | `/api/v1/users/{userId}/reset-password` | Admin | Path: `userId` | `ResetPasswordResponse` | Reset mật khẩu mặc định |
| `GET` | `/api/v1/users/login-history` | Admin / Ops | Query: `userId`, `page`, `size` | `LoginHistoryPageResponse` | Nhật ký đăng nhập hệ thống |
| `GET` | `/api/v1/users/permissions` | Admin | *None* | `PermissionMatrixResponse` | Ma trận quyền hạn theo vai trò |

---

### 🏢 2.3. Cơ Sở & Mặt Bằng 3D (`/api/v1/facility`, `/api/v1/facilities`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/facilities` | Public | *None* | `List<FacilitySummaryResponse>` | Danh sách 3 cơ sở (Tân Bình, Thủ Đức, Bình Thạnh) |
| `GET` | `/api/v1/facility/{facilityId}/layout` | Public | Path: `facilityId`, Query: `start-date`, `end-date` | `FacilityLayoutResponse` | Sơ đồ tầng, khu vực & lưới tọa độ kho 3D |
| `GET` | `/api/v1/facilities/overview` | Manager / Ops | *None* | `FacilityOverviewResponse` | Chỉ số vận hành tổng quan toàn cơ sở |
| `GET` | `/api/v1/facilities/drilldown` | Manager / Ops | Query: `facilityId`, `status` | `FacilityDrilldownResponse` | Dữ liệu chi tiết phân bổ kho |

---

### 📦 2.4. Tìm Kiếm & Chi Tiết Kho (`/api/v1/units`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/units` | Public | Query: `facilityId`, `typeId`, `minPrice`, `maxPrice`, `status`, `startDate`, `endDate`, `page`, `size` | `UnitPageResponse` | Tìm kiếm & lọc kho theo ngày trống |
| `GET` | `/api/v1/units/{unitId}` | Public | Path: `unitId` | `UnitDetailResponse` | Chi tiết kho, kích thước, ảnh & lịch bận `blockedRanges` |
| `GET` | `/api/v1/units/{unitId}/quote` | Public | Path: `unitId`, Query: `startDate`, `endDate` | `QuoteResponse` | Tính báo giá thuê & tiền cọc dự kiến |
| `GET` | `/api/v1/units/filter-options` | Public | *None* | `UnitFilterOptionsResponse` | Danh sách bộ lọc kích thước, loại hình, tiện ích |
| `GET` | `/api/v1/units/relocation-candidates`| Staff / Ops | Query: `ticket-id` | `RelocationCandidatesResponse` | Danh sách kho phù hợp để điều chuyển sự cố |

---

### 🛠 2.5. Quản Trị Kho (`/api/v1/units` - Admin/Manager)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/units/admin` | Staff / Manager | Query: `facilityId`, `status` | `List<UnitAdminResponse>` | Bảng danh mục kho quản trị |
| `POST` | `/api/v1/units` | Manager / Admin | `UnitAdminRequest` | `UnitAdminResponse` | Khởi tạo ô kho mới |
| `PATCH` | `/api/v1/units/{unitId}/status` | Staff / Manager | Path: `unitId`, Body: `UnitStatusRequest` | `UnitAdminResponse` | Đổi trạng thái (`AVAILABLE`, `MAINTENANCE`, `LOCKED`) |
| `PATCH` | `/api/v1/units/{unitId}` | Manager / Admin | Path: `unitId`, Body: `UnitAdminRequest` | `UnitAdminResponse` | Cập nhật thông số kỹ thuật ô kho |
| `DELETE` | `/api/v1/units/{unitId}` | Manager / Admin | Path: `unitId` | `UnitAdminResponse` | Ngừng khai thác ô kho (Retire) |

---

### 📝 2.6. Hợp Đồng Thuê & Đặt Chỗ (`/api/v1/reservations`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reservations` | Customer | Query: `status`, `page`, `size` | `ReservationPageResponse` | Danh sách hợp đồng thuê của khách hàng |
| `GET` | `/api/v1/reservations/{reservationId}` | Customer / Staff | Path: `reservationId` | `ReservationDetailResponse` | Chi tiết hợp đồng, điều khoản, thanh toán |
| `GET` | `/api/v1/reservations/{reservationId}/check-in-pass` | Customer | Path: `reservationId` | `CheckInPassResponse` | Mã QR & mã PIN mở kho khi nhận phòng |
| `POST` | `/api/v1/reservations/{reservationId}/check-in` | Customer / Staff | Path: `reservationId` | `CheckInResultResponse` | Kích hoạt nhận kho (Check-in) |
| `POST` | `/api/v1/reservations/transfer` | Customer | `TransferRequest` | `TransferResponse` | Yêu cầu đổi sang ô kho khác |

---

### 🔄 2.7. Gia Hạn & Trả Kho Sớm (`/api/v1/reservations/{id}/...`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/reservations/{id}/extensions` | Customer | `ExtensionRequest` (`newEndDate`) | `ExtensionQuoteResponse` | Báo giá gia hạn thêm thời gian thuê |
| `POST` | `/api/v1/reservations/{id}/extensions/{extId}/confirm-zero-deposit` | Customer | Path: `id`, `extId` | `ResponseEntity<?>` | Xác nhận gia hạn nếu không phát sinh tiền cọc |
| `POST` | `/api/v1/reservations/{id}/checkout-request` | Customer | `CheckoutRequestPayload` (`expectedDate`, `timeSlot`) | `CheckoutRequestResponse` | Đăng ký ngày hẹn trả kho |
| `DELETE` | `/api/v1/reservations/{id}/checkout-request` | Customer | *None* | `CancelCheckoutResponse` | Hủy yêu cầu trả kho |
| `GET` | `/api/v1/reservations/{id}/checkout-request` | Customer / Staff | *None* | `CheckoutRequestResponse` | Xem trạng thái phiếu trả kho |
| `POST` | `/api/v1/reservations/{id}/checkout-request/forced` | Manager | `ForcedCheckoutRequest` | `Map<String, Object>` | Cưỡng chế thu hồi kho do vi phạm |
| `POST` | `/api/v1/reservations/{id}/liquidation` | Manager / Ops | `LiquidationRequest` (`reasonType`, `reason`) | `Map<String, Object>` | Thanh lý tài sản kho quá hạn/vi phạm |

---

### 📜 2.8. Văn Bản Pháp Lý & Phụ Lục (`/api/v1/contracts`, `/api/v1/contract-addendums`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reservations/{id}/contracts` | Customer / Staff | Path: `id` | `List<ContractChainItemResponse>` | Lịch sử chuỗi hợp đồng gốc & phụ lục |
| `GET` | `/api/v1/contracts/{contractId}` | Customer / Staff | Path: `contractId` | `ContractDetailResponse` | Toàn văn bản hợp đồng pháp lý |
| `GET` | `/api/v1/contracts/{contractId}/chain` | Customer / Staff | Path: `contractId` | `ContractChainResponse` | Cây phả hệ hợp đồng qua các lần gia hạn |
| `POST` | `/api/v1/contract-addendums/{addendumId}/sign` | Customer | Path: `addendumId` | `ContractAddendumResponse` | Ký điện tử phụ lục hợp đồng |

---

### 💳 2.9. Cổng Thanh Toán (`/api/v1/payments`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/payments` | Customer | `PaymentRequest` (`reservationId`, `amount`, `method`) | `PaymentSessionResponse` | Tạo phiên thanh toán (PayOS / QR) |
| `GET` | `/api/v1/payments/{paymentId}` | Customer / Staff | Path: `paymentId` | `PaymentSessionResponse` | Trạng thái thanh toán của đơn |
| `POST` | `/api/v1/payments/{paymentId}/confirm` | Customer | Path: `paymentId`, Body: `ConfirmPaymentRequest` | `PaymentResultResponse` | Xác thực kết quả giao dịch |
| `POST` | `/api/v1/payments/{paymentId}/demo-complete` | Customer (Dev) | Path: `paymentId` | `PaymentSessionResponse` | Giả lập thanh toán thành công trong môi trường Dev |
| `POST` | `/api/v1/payments/webhooks/payos` | PayOS Gateway | Raw JSON Payload | `Map<String, String>` | Webhook nhận thông báo IPN từ PayOS |

---

### 📋 2.10. Tác Vụ Nhân Viên & Nghi Thức (`/api/v1/tasks`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tasks` | Staff / Manager | Query: `facilityId`, `status`, `type` | `List<TaskResponse>` | Danh sách tác vụ cần xử lý trong ca |
| `GET` | `/api/v1/tasks/shift-summary` | Staff / Manager / Admin | Query: `workDate` (YYYY-MM-DD) | `ShiftFinanceSummaryResponse` | Báo cáo tiền mặt/CK/POS thu tại quầy theo ca |
| `GET` | `/api/v1/tasks/{taskId}` | Staff / Manager | Path: `taskId` | `TaskResponse` | Chi tiết tác vụ, kho liên quan, checklist |
| `GET` | `/api/v1/tasks/{taskId}/contract-preview` | Staff / Manager | Path: `taskId` | `ContractPreviewResponse` | Xem trước hợp đồng kèm bằng chứng thanh toán |
| `PATCH` | `/api/v1/tasks/{taskId}/status` | Staff | Path: `taskId`, Body: `UpdateTaskStatusRequest` | `TaskResponse` | Nhận việc hoặc chuyển trạng thái |
| `POST` | `/api/v1/tasks/{taskId}/rituals/check-in` | Staff | Path: `taskId`, Body: `CheckinRitualRequest` | `TaskResponse` | Nghi thức kiểm tra bàn giao nhận kho |
| `POST` | `/api/v1/tasks/{taskId}/rituals/checkout` | Staff | Path: `taskId`, Body: `CheckoutRitualRequest` | `TaskResponse` | Nghi thức nghiệm thu trả kho, hoàn cọc |
| `POST` | `/api/v1/tasks/{taskId}/rituals/contract` | Staff | Path: `taskId`, Body: `ContractRitualRequest` | `TaskResponse` | Nghi thức xác nhận hồ sơ pháp lý |
| `POST` | `/api/v1/tasks/{taskId}/rituals/support` | Staff | Path: `taskId`, Body: `SupportRitualRequest` | `TaskResponse` | Nghi thức hỗ trợ kỹ thuật tại chỗ |

---

### 🎫 2.11. Vé Hỗ Trợ Khách Hàng (`/api/v1/tickets`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tickets` | Customer / Staff | Query: `status`, `priority`, `facilityId` | `List<TicketResponse>` | Danh sách ticket sự cố |
| `POST` | `/api/v1/tickets` | Customer | `CreateTicketRequest` (`unitId`, `title`, `description`) | `TicketResponse` | Tạo vé yêu cầu hỗ trợ mới |
| `POST` | `/api/v1/tickets/{ticketId}/dispatch` | Manager | Path: `ticketId`, Body: `DispatchTicketRequest` | `TicketResponse` | Điều phối nhân viên xử lý vé |
| `PATCH` | `/api/v1/tickets/{ticketId}/status` | Staff / Manager | Path: `ticketId`, Body: `UpdateTicketStatusRequest` | `TicketResponse` | Cập nhật tiến độ xử lý sự cố |

---

### ⏱ 2.12. Phân Ca Trực Nhân Viên (`/api/v1/shifts`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/shifts` | Staff / Manager | Query: `facilityId`, `startDate`, `endDate` | `List<ShiftAssignmentResponse>` | Lịch trực nhân sự theo tuần |
| `POST` | `/api/v1/shifts` | Manager | `CreateShiftRequest` | `List<ShiftAssignmentResponse>` | Phân ca cho nhân viên |
| `POST` | `/api/v1/shifts/batch` | Manager | `BatchShiftUpdateRequest` | `List<ShiftAssignmentResponse>` | Cập nhật hàng loạt ca trực |
| `DELETE` | `/api/v1/shifts/{assignmentId}` | Manager | Path: `assignmentId` | `Void` | Hủy ca trực |
| `GET` | `/api/v1/shifts/roster` | Manager | Query: `startDate`, `facilityId` | `List<StaffRosterMember>` | Bảng danh sách nhân sự sẵn sàng nhận ca |

---

### ⚖️ 2.13. Quản Trị Chính Sách & Bảng Giá (`/api/v1/policies`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/policies/active` | Ops / Admin | Query: `facilityId` | `PolicyActiveResponse` | Chính sách hiệu lực (giá thuê, cọc, phí trễ) |
| `POST` | `/api/v1/policies` | Ops / Admin | `PolicySaveRequest` | `PolicyActiveResponse` | Lưu cấu hình chính sách mới (tạo version mới) |
| `POST` | `/api/v1/policies/reset` | Ops / Admin | Query: `facilityId` | `PolicyActiveResponse` | Khôi phục chính sách về cấu hình mặc định ban đầu |

---

### 🚪 2.14. Quản Lý Trả Kho & Thanh Lý Quá Hạn (`/api/v1/checkout-cases`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/checkout-cases` | Manager | Query: `status`, `q`, `page`, `page-size` | `List<LateCheckoutCaseResponse>` | Danh sách ca trả kho trễ hạn / tranh chấp |
| `GET` | `/api/v1/checkout-cases/active-rentals` | Manager | Query: `q`, `page`, `page-size` | `List<LateCheckoutActiveRentalResponse>` | Danh sách hợp đồng đang thuê cần theo dõi |
| `POST` | `/api/v1/checkout-cases/{caseId}/decision` | Manager | Path: `caseId`, Body: `LateCheckoutDecisionRequest` | `Map<String, Object>` | Quyết định gia hạn (`EXTEND`) hoặc thanh lý kho (`LIQUIDATE`) |

---

### 📊 2.15. Báo Cáo Doanh Thu & Vận Hành (`/api/v1/reports`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/financial-summary` | Admin / Ops | Query: `from`, `to`, `facilityId` | `FinancialSummaryResponse` | Báo cáo doanh thu, tiền cọc, nợ đọng |
| `GET` | `/api/v1/reports/monthly-revenue` | Admin / Ops | Query: `year`, `facilityId` | `List<MonthlyRevenueItemResponse>` | Biểu đồ doanh thu 12 tháng |
| `GET` | `/api/v1/reports/drilldown` | Admin / Ops | Query: `metric`, `period` | `DrilldownResponse` | Phân tích sâu theo cơ sở và loại kho |
| `GET` | `/api/v1/reports/export` | Admin / Ops | Query: `type`, `from`, `to` | `String` (CSV Text) | Xuất báo cáo CSV kế toán |

---

### 🔔 2.16. Thông Báo & Nhật Ký Hệ Thống (`/api/v1/notifications`, `/api/v1/activity-logs`)
| Method | Endpoint | Quyền hạn | Request Body / Params | Response Type | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Authenticated | Query: `page`, `size` | `NotificationPageResponse` | Danh sách thông báo cá nhân |
| `GET` | `/api/v1/notifications/unread-count` | Authenticated | *None* | `UnreadCountResponse` | Số lượng thông báo chưa đọc |
| `POST` | `/api/v1/notifications/{id}/read` | Authenticated | Path: `id` | `Void` | Đánh dấu đã đọc 1 thông báo |
| `POST` | `/api/v1/notifications/mark-all-read` | Authenticated | *None* | `Void` | Đánh dấu đã đọc tất cả |
| `GET` | `/api/v1/activity-logs` | Admin / Ops / Manager | Query: `query`, `entityType` (List), `startDate`, `endDate`, `page`, `pageSize` | `ActivityLogPageResponse` | Audit trail hệ thống (Manager bị giới hạn theo cơ sở) |
