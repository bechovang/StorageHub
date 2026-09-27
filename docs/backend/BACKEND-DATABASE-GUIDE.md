# Hướng Dẫn Sửa Database (Flyway + JPA Entity)

Tài liệu cho đội Backend (An / Phúc / Huy) — quy trình **duy nhất** khi mọi thay đổi liên quan database: thêm/sửa cột, thêm bảng, đổi seed. Tuân thủ quyết định kiến trúc **AD-6** (xem `docs/architecture/ARCHITECTURE-SPINE.md`): *Flyway sở hữu schema, Hibernate chỉ `validate` — cấm auto DDL.*

> Cách làm chuẩn (SQL-first): **viết migration SQL tay → chạy app cho Flyway áp dụng → sửa entity khớp theo**. Khỏi đầu tư tooling, lỗi thì đoán được ngay.

---

## 1. Bốn Nguyên Tắc Bắt Buộc

1. **Schema chỉ đổi qua file migration Flyway.** Cấm sửa bảng bằng tay trong MySQL Workbench / IntelliJ Database Console / DBeaver — máy khác không có thay đổi đó, mọi người mỗi người một schema.
2. **Một thay đổi schema = 1 file `V<n>` mới + entity tương ứng, cùng 1 commit.** Commit nào có file `V*.sql` mà không có sửa entity kèm theo (hoặc ngược lại) là commit lỗi.
3. **Không bao giờ sửa, xóa, đổi tên file migration đã chạy chung.** Muốn đổi schema → viết file mới. Lý do và cách xử lý lỗi liên quan ở mục 5.
4. **App không boot được sau khi đổi SQL là bình thường** (`ddl-auto: validate`) — nghĩa là entity chưa khớp. Đây là cơ chế kiểm soát, không phải bug: nó chỉ đúng chỗ thiếu để sửa 1 dòng.

| Việc | Nơi làm |
| --- | --- |
| Đổi cấu trúc (bảng, cột, FK, CHECK, index) | File SQL trong `db/migration/` |
| Map Java ↔ bảng | Entity (`@Entity`, `@Column`...) |
| Dữ liệu demo cho dev | File SQL trong `db/seed/` |
| Ai được ghi entity nào | Ownership matrix trong AD-6 |

---

## 2. Hai Thư Mục Flyway & Đặt Tên File

```
backend/src/main/resources/db/
├── migration/            # chạy ở MỌI môi trường
│   └── V1__model_v3.sql          (22 bảng, model V3)
└── seed/                 # CHỈ chạy khi profile "dev"
    └── V2__seed_demo.sql         (dữ liệu demo)
```

- Tên file: `V<số>__<mô_tả_snake_case>.sql` — **hai gạch dưới** sau số.
- Số version là **một chuỗi chung** cho cả `migration/` lẫn `seed/`. File mới lấy số = **số lớn nhất hiện có ở cả hai thư mục + 1**. Hiện tại có V1, V2 → file kế tiếp là **V3**.
- Không nhảy số (V3 → V7), không dùng số đã dùng lại.
- Flyway áp file lúc app khởi động — không cần chạy tay gì cả. Xem kết quả ở console hoặc bảng `flyway_schema_history` trong DB.

---

## 3. Workflow Chuẩn

### 3A. Thêm cột (hay gặp nhất) — ví dụ: `users` thêm `phone`

**Bước 1** — tạo `db/migration/V3__users_add_phone.sql`:

```sql
ALTER TABLE users
  ADD COLUMN phone VARCHAR(20) NULL;
```

**Bước 2** — chạy app. Console hiện `Successfully applied ... V3` (hoặc tương tự) là Flyway đã áp.

**Bước 3** — sửa entity khớp:

```java
// User.java
@Column(name = "phone", length = 20)
private String phone;
```

**Bước 4** — chạy lại app. Boot thành công = xong.

Tổng: ~5 phút, 2 file, 1 commit: `feat: add users.phone (V3 + entity)`.
Nếu quên Bước 3 → app fail ngay lúc khởi động với thông báo kiểu `Schema-validation: missing column [phone] in table [users]` — thêm field rồi chạy lại.

### 3B. Thêm bảng mới

1. Viết `CREATE TABLE` trong file `V<n>` mới. FK đặt tên rõ: `CONSTRAINT fk_reservations_users FOREIGN KEY ...`; thêm index (`KEY idx_...`) cho các cột hay dùng để query/lọc.
2. Chạy app cho Flyway áp.
3. Tạo entity + repository, gắn vào service **chủ sở hữu** theo ownership matrix AD-6 (bảng đó service nào được ghi duy nhất).
4. Chạy lại app — validate pass.

### 3C. Đổi type / xóa cột

- Vẫn là file `V<n>` mới với `ALTER TABLE ... MODIFY / DROP`.
- Đổi type cột **đang có dữ liệu**: viết thêm `UPDATE` migrate dữ liệu trong cùng file nếu cần.
- **Xóa cột = mất dữ liệu vĩnh viễn trên mọi máy** khi họ pull về chạy. Chắc chắn rồi mới làm, và báo nhóm trước trong PR.

### 3D. Thêm / sửa seed (chỉ dev)

- File seed mới đặt trong `db/seed/`, số version **lớn hơn mọi file hiện có** (kể cả migration).
- Lưu ý thứ tự chạy: Flyway chạy **một chuỗi số chung, tăng dần** — seed V4 chạy trước migration V5. Hệ quả: seed muốn dùng cột do migration V5 tạo thì phải đánh số seed ≥ V6.
- Seed cũng chỉ chạy một lần như migration — muốn thêm data mới thì thêm file mới, không sửa file seed cũ đã chạy.

---

## 4. Sửa File Cũ — Khi Nào Được?

- **Cửa sổ hiện tại (dự án mới):** sửa `V1`/`V2` *được* nếu thấy sai — nhưng mọi người khác phải **DROP database và chạy lại** mới nhận được, và mất dữ liệu local của họ. Chỉ làm khi thống nhất trong nhóm.
- **Sau khi đã có dữ liệu demo / chấm / nhiều máy phụ thuộc:** CẤM sửa file cũ, mọi thay đổi đi qua file `V<n>` mới. Quy tắc này khóa **ngay từ đầu Sprint 1** cho quen — sai chỗ nào trong V1 thì sửa bằng V3, V4... như thường.

---

## 5. Lỗi `Checksum mismatch` — Xử Lý

**Nguyên nhân:** file `V<n>` cũ đã chạy bị ai đó sửa nội dung (kể cả thêm dòng trắng). Flyway lưu checksum file trong bảng `flyway_schema_history` — nội dung đổi → lệch checksum → app từ chối boot.

Xử lý theo thứ tự:

1. `git diff` xem file migration nào bị đổi so với master — hoặc hỏi trong nhóm.
2. **Sửa nhầm** → revert nội dung file về bản trên git (`git checkout origin/master -- <file>`) → chạy lại app.
3. **DB local không cần giữ** → drop database và dựng lại theo mục 6 (nhanh nhất khi đang dev).
4. ❌ **Không** sửa tay bảng `flyway_schema_history`, **không** tắt validate/checksum của Flyway để "cho chạy được" — hai cách này chỉ giấu lỗi và nổ về sau.

---

## 6. Dựng Lại DB Từ Đầu (máy mới / reset / demo)

```sql
DROP DATABASE storagehub;
```

(Vì connection string có `createDatabaseIfNotExist=true`, app tự tạo lại database khi chạy.)

Sau đó chạy app với profile dev — Flyway tự áp **V1 (schema) + V2 (seed demo)** theo thứ tự:

```bash
# Trong thư mục backend/ (hoặc Run Config IntelliJ đã có EnvFile + profile dev)
mvn spring-boot:run -Dspring.profiles.active=dev
```

Kết quả: DB sạch, đúng schema model V3, có sẵn dữ liệu demo — đúng trạng thái tái lập từ 0 để demo chấm.

---

## 7. Giới Hạn Của `validate` — SQL Phải Tự Review

`ddl-auto: validate` chỉ kiểm tra **entity khớp bảng** (cột tồn tại, kiểu cơ bản). Nó **không** kiểm tra:

- CHECK constraint (V1 đang có 10 cái) — entity không diễn tả được CHECK
- FK thiếu / sai chiều
- Index có hay không
- Độ dài chính xác VARCHAR

→ Phần SQL trong PR phải review bằng mắt: đọc migration, chạy app boot OK, mở `flyway_schema_history` xem đủ version.

---

## 8. Checklist Khi PR Có Đổi Database

- [ ] File `V<n>__...` **mới**, số = max(cả `migration/` + `seed/`) + 1, không đụng file cũ
- [ ] Entity tương ứng sửa **cùng commit**
- [ ] App boot OK trên máy review (validate pass)
- [ ] Cần cập nhật seed không? (nếu có → file seed số cao hơn)
- [ ] SQL có đặt tên FK + index cho cột query chính
- [ ] Có `DROP COLUMN` / đổi type dữ liệu cũ? → đã báo nhóm trong PR

---

## 9. TL;DR

- Đổi schema → **luôn viết file SQL mới** trong `db/migration/`
- File SQL + entity đi **cùng một commit**
- **Không sửa file V cũ** đã chạy chung
- Đổi SQL xong app không boot → thiếu entity, thêm field rồi chạy lại — có thông báo chỉ chỗ thiếu
- Sự cố DB dev khó xử → **DROP + chạy lại profile dev**, 2 phút
- Tool DDL tay (Workbench...) chỉ dùng để **nhìn**, không dùng để **sửa**

*Xem thêm: [BACKEND-GETTING-STARTED.md](BACKEND-GETTING-STARTED.md) (setup môi trường) · [architecture/ARCHITECTURE-SPINE.md](architecture/ARCHITECTURE-SPINE.md) mục AD-6 (quyết định sở hữu schema & entity ownership).*
