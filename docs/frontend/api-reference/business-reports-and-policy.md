# API Reference: Báo Cáo Tài Chính & Chính Sách Giá (Business & Reports)

Các API dành cho Vận hành kinh doanh (Business Ops) theo dõi doanh thu và cấu hình quy tắc tính giá.

---

## 1. Báo Cáo Tổng Hợp Số Liệu Tài Chính

- **Method / URL**: `GET /api/v1/reports/financial-summary`
- **Quyền hạn**: `BUSINESS_OPS`, `SYSTEM_ADMIN`
- **Query Params**: `period` (`THIS_MONTH`, `THIS_QUARTER`, `YEAR_TO_DATE`), `customRange`
- **Hàm Service**: `src/services/reportService.js` ➔ `getFinancialSummary(period)`
- **Response Thành Công (`200 OK`)**:
```json
{
  "period": "THIS_QUARTER",
  "totalRevenue": 28450000,
  "rentRevenue": 24500000,
  "extensionRevenue": 3200000,
  "surchargeRevenue": 750000,
  "activeDeposits": 2845000,
  "forfeitedDeposits": 150000
}
```

---

## 2. Doanh Thu Theo Tháng (Dữ Liệu Cho Biểu Đồ Recharts)

- **Method / URL**: `GET /api/v1/reports/monthly-revenue`
- **Quyền hạn**: `BUSINESS_OPS`, `SYSTEM_ADMIN`
- **Query Params**: `months` (số tháng lịch sử, mặc định `6`)
- **Hàm Service**: `src/services/reportService.js` ➔ `getMonthlyRevenueChartData(months)`
- **Response Thành Công (`200 OK`)**:
```json
{
  "items": [
    { "month": "2026-05", "revenue": 18200000, "rent": 16000000, "extension": 2200000 },
    { "month": "2026-06", "revenue": 21400000, "rent": 19000000, "extension": 2400000 },
    { "month": "2026-07", "revenue": 25100000, "rent": 22000000, "extension": 3100000 },
    { "month": "2026-08", "revenue": 27800000, "rent": 24500000, "extension": 3300000 },
    { "month": "2026-09", "revenue": 28900000, "rent": 25400000, "extension": 3500000 },
    { "month": "2026-10", "revenue": 31200000, "rent": 27500000, "extension": 3700000 }
  ]
}
```
*Ghi chú: Frontend render dữ liệu này bằng Recharts BarChart với sắc độ đơn sắc đỏ (Swiss Red Palette: `--sh-red-600`, `--sh-red-400`, `--sh-red-200`).*

---

## 3. Xuất Báo Cáo Kiểm Toán Tài Chính (CSV)

- **Method / URL**: `GET /api/v1/reports/export`
- **Quyền hạn**: `BUSINESS_OPS`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/reportService.js` ➔ `exportFinancialAuditCSV()`
- **Response**: File tải về định dạng `text/csv`.
