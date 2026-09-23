# Hướng Dẫn Bắt Đầu Phát Triển Backend (StorageHub)

Tài liệu này dành cho thành viên đội ngũ Backend (BE) để thiết lập môi trường phát triển trên **IntelliJ IDEA**, cấu hình biến môi trường `.env` qua plugin **EnvFile**, và kết nối cơ sở dữ liệu **MySQL**.

---

## 1. Checkout Branch Cá Nhân

Sau khi clone repo về máy, **không commit/code trực tiếp trên `master`**:

```bash
# Mở Terminal trong IntelliJ (Alt + F12)
# Chuyển sang branch cá nhân theo phân công:
git checkout be/an        # Nếu là An
git checkout be/phuc      # Nếu là Phúc
git checkout be/huy       # Nếu là Huy

# Cập nhật code mới nhất từ master
git pull origin master
```

---

## 2. Cấu hình JDK & Maven trong IntelliJ IDEA

1. **Cấu hình JDK:**
   - Vào `File` $\rightarrow$ `Project Structure...` (`Ctrl + Alt + Shift + S`).
   - Tab **Project**: Chọn **SDK: Java 21** (hoặc Java 25), **Language Level: 21**.
   - Tab **Modules**: Đảm bảo `backend/src/main/java` là **Sources** (màu xanh dương) và `backend/src/main/resources` là **Resources** (màu cam).
2. **Tải Dependencies Maven:**
   - Mở tab **Maven** ở cạnh phải màn hình IntelliJ $\rightarrow$ Bấm nút **Reload All Maven Projects** (biểu tượng 2 mũi tên xoay tròn).

---

## 3. Cấu hình Biến Môi Trường (.env) bằng Plugin EnvFile

Dự án không lưu mật khẩu hay thông tin nhạy cảm trên git. Bạn sẽ dùng file `.env` local.

### Bước 3.1: Cài đặt Plugin EnvFile
1. Trong IntelliJ, vào `File` $\rightarrow$ `Settings` (`Ctrl + Alt + S`) $\rightarrow$ chọn **Plugins**.
2. Chọn tab **Marketplace**, gõ tìm **`EnvFile`** $\rightarrow$ bấm **Install** $\rightarrow$ Restart IDE nếu được yêu cầu.

### Bước 3.2: Tạo file `.env`
1. Vào thư mục `backend/`, copy file template:
   ```bash
   # Trong thư mục backend
   cp .env.example .env
   ```
2. Mở file `backend/.env` và cập nhật đúng mật khẩu MySQL máy bạn:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=storagehub
   DB_USER=root
   DB_PASS=mat_khau_mysql_cua_ban
   SERVER_PORT=8080
   ```

### Bước 3.3: Kích hoạt EnvFile trong Run Configuration
1. Ở góc trên bên phải IntelliJ (cạnh nút Run tam giác xanh), click vào cấu hình chạy $\rightarrow$ chọn **Edit Configurations...**
2. Chọn **`StorageHubApplication`** (dưới mục Spring Boot hoặc Application).
3. Chuyển sang tab **EnvFile**:
   - Tích chọn **`Enable EnvFile`**.
   - Bấm vào biểu tượng dấu **`+`** ở góc dưới $\rightarrow$ chọn **`.env file`**.
   - Tìm và chọn file `backend/.env` vừa tạo.
4. Bấm **Apply** $\rightarrow$ **OK**.

---

## 4. Kết nối MySQL Database trong IntelliJ IDEA

IntelliJ IDEA hỗ trợ quản lý và xem dữ liệu trực tiếp trong IDE:

1. Mở tab **Database** ở thanh công cụ ngoài cùng bên phải (hoặc menu `View` $\rightarrow$ `Tool Windows` $\rightarrow$ `Database`).
2. Bấm dấu **`+`** $\rightarrow$ **Data Source** $\rightarrow$ **MySQL**.
3. Điền các thông số:
   - **Host:** `localhost`
   - **Port:** `3306`
   - **User:** `root`
   - **Password:** Mật khẩu MySQL của bạn
   - **Database:** `storagehub`
4. Nếu thấy dòng đỏ *Download Missing Driver Files* $\rightarrow$ Bấm nút **Download** màu xanh.
5. Bấm **Test Connection**:
   - Nếu hiện thông báo màu xanh **`Succeeded`** $\rightarrow$ Bấm **Apply** $\rightarrow$ **OK**.
   - *Nếu báo lỗi `Unknown database 'storagehub'`*: Hãy mở SQL Console trong IntelliJ và chạy lệnh tạo database:
     ```sql
     CREATE DATABASE storagehub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```

---

## 5. Chạy Ứng Dụng & Kiểm Tra

1. Mở file [`backend/src/main/java/com/storagehub/StorageHubApplication.java`](file:///D:/FPT_Ky5/SWP/StorageHub/backend/src/main/java/com/storagehub/StorageHubApplication.java).
2. Nhấn nút **Run** (tam giác xanh) hoặc `Shift + F10`.
3. Khi khởi động, **Flyway** sẽ tự động thực thi file migration `V1__model_v3.sql` để tạo toàn bộ 22 bảng dữ liệu vào MySQL.
4. Kiểm tra trên trình duyệt:
   - **Health Check:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health) (kết quả `{"status":"UP"}`).
   - **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html).

---

## 6. Quy Trình Commit & Đẩy Code

Khi hoàn thành một tính năng (feature/fix):
```bash
git add .
git commit -m "feat(auth): thêm API login"
git push origin be/<ten_ban>
```
Lên GitHub tạo **Pull Request (PR)** vào branch `master` để các thành viên khác review trước khi merge.
