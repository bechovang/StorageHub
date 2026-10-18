/**
 * StorageHub Business Operations & Financial Reporting Service (US-31 / FR-31)
 *
 * Tiêu chí kỹ thuật nghiêm ngặt:
 * 1. Tiền cọc (Security Deposits) được quản lý trong tài khoản Escrow phong tỏa,
 *    tuyệt đối KHÔNG tính gộp vào doanh thu kinh doanh (Gross Revenue).
 * 2. Cung cấp 4 chỉ số KPI cốt lõi với drill-down sâu vào chi tiết chứng từ.
 * 3. Hỗ trợ lọc theo kỳ mặc định (Tháng này, Tháng trước, Quý này) và khoảng ngày tùy chọn.
 * 4. Xuất file CSV báo cáo tài chính chuẩn kiểm toán (VAS / IFRS compliant).
 */

export const REPORT_PERIODS = {
  THIS_MONTH: { id: "THIS_MONTH", label: "Tháng này (10/2026)", sub: "01/10/2026 – 31/10/2026" },
  LAST_MONTH: { id: "LAST_MONTH", label: "Tháng trước (09/2026)", sub: "01/09/2026 – 30/09/2026" },
  THIS_QUARTER: { id: "THIS_QUARTER", label: "Quý này (Q3 2026)", sub: "01/07/2026 – 30/09/2026" },
  YTD: { id: "YTD", label: "YTD 2026", sub: "01/01/2026 – 31/10/2026" },
  CUSTOM: { id: "CUSTOM", label: "Khoảng ngày tùy chọn", sub: "Tùy chỉnh" },
};

// Dữ liệu chứng từ doanh thu chi tiết (Thuê kho thực tế)
export const REVENUE_TRANSACTIONS = [
  { id: "TX-7801", contractRef: "CT-1042", tenant: "Nguyễn Thị Lan", unitCode: "S-3", category: "Thuê kho cố định", baseRent: 345000, surcharge: 0, total: 345000, method: "VietQR (NAPAS)", date: "01/10/2026", status: "COMPLETED" },
  { id: "TX-7802", contractRef: "CT-1038", tenant: "Lê Minh Trí", unitCode: "S-4", category: "Thuê kho cố định", baseRent: 345000, surcharge: 50000, total: 395000, method: "VietQR (NAPAS)", date: "02/10/2026", status: "COMPLETED" },
  { id: "TX-7803", contractRef: "CT-1040", tenant: "Đỗ Mai Hương", unitCode: "M-1", category: "Thuê kho cố định", baseRent: 380000, surcharge: 0, total: 380000, method: "Chuyển khoản NH", date: "03/10/2026", status: "COMPLETED" },
  { id: "TX-7804", contractRef: "CT-0941", tenant: "Công ty Alpha Logistics", unitCode: "M-3", category: "Thuê dài hạn (6 tháng)", baseRent: 2280000, surcharge: 0, total: 2280000, method: "VietQR (NAPAS)", date: "04/10/2026", status: "COMPLETED" },
  { id: "TX-7805", contractRef: "CT-0912", tenant: "Trần Anh Quân", unitCode: "L-1", category: "Thuê dài hạn (1 năm)", baseRent: 10680000, surcharge: 120000, total: 10800000, method: "VietQR (NAPAS)", date: "05/10/2026", status: "COMPLETED" },
  { id: "TX-7806", contractRef: "CT-0925", tenant: "Vũ Bảo Long", unitCode: "L-2", category: "Thuê kho cố định", baseRent: 890000, surcharge: 0, total: 890000, method: "Chuyển khoản NH", date: "06/10/2026", status: "COMPLETED" },
  { id: "TX-7807", contractRef: "CT-1011", tenant: "Trịnh Gia Huy", unitCode: "LOCK-2", category: "Thuê Locker quý", baseRent: 300000, surcharge: 0, total: 300000, method: "VietQR (NAPAS)", date: "07/10/2026", status: "COMPLETED" },
  { id: "TX-7808", contractRef: "CT-0988", tenant: "Hoàng Nam", unitCode: "M-2", category: "Gia hạn thêm 15 ngày", baseRent: 190000, surcharge: 120000, total: 310000, method: "VietQR (NAPAS)", date: "08/10/2026", status: "COMPLETED" },
  { id: "TX-7740", contractRef: "CT-0891", tenant: "Phạm Hải Đăng", unitCode: "M-5", category: "Thuê kho cố định (Tháng 9)", baseRent: 380000, surcharge: 0, total: 380000, method: "VietQR (NAPAS)", date: "15/09/2026", status: "COMPLETED" },
  { id: "TX-7741", contractRef: "CT-0870", tenant: "Vũ Thị Nguyệt", unitCode: "S-2", category: "Thuê kho cố định (Tháng 9)", baseRent: 345000, surcharge: 60000, total: 405000, method: "VietQR (NAPAS)", date: "18/09/2026", status: "COMPLETED" },
  { id: "TX-7742", contractRef: "CT-0855", tenant: "Đinh Quang Hiếu", unitCode: "L-3", category: "Thuê kho cố định (Tháng 8)", baseRent: 890000, surcharge: 0, total: 890000, method: "Chuyển khoản NH", date: "20/08/2026", status: "COMPLETED" },
  { id: "TX-7743", contractRef: "CT-0832", tenant: "Nguyễn Văn Hùng", unitCode: "LOCK-1", category: "Thuê kho cố định (Tháng 7)", baseRent: 100000, surcharge: 30000, total: 130000, method: "VietQR (NAPAS)", date: "10/07/2026", status: "COMPLETED" },
];

// Dữ liệu chứng từ tiền cọc giữ riêng trong Escrow (KHÔNG cộng vào doanh thu)
export const ESCROW_DEPOSITS = [
  { id: "DEP-401", contractRef: "CT-1042", tenant: "Nguyễn Thị Lan", unitCode: "S-3", depositAmount: 345000, escrowRef: "VNPAY-ESC-9081", vaultStatus: "ESCROW_LOCKED", dateReceived: "18/09/2026", expectedRelease: "18/10/2026", note: "Bảo đảm tài sản Small Unit" },
  { id: "DEP-402", contractRef: "CT-1038", tenant: "Lê Minh Trí", unitCode: "S-4", depositAmount: 345000, escrowRef: "VNPAY-ESC-9082", vaultStatus: "ESCROW_LOCKED", dateReceived: "19/09/2026", expectedRelease: "19/11/2026", note: "Bảo đảm tài sản Small Unit" },
  { id: "DEP-403", contractRef: "CT-1040", tenant: "Đỗ Mai Hương", unitCode: "M-1", depositAmount: 380000, escrowRef: "VNPAY-ESC-9083", vaultStatus: "ESCROW_LOCKED", dateReceived: "25/09/2026", expectedRelease: "25/12/2026", note: "Bảo đảm tài sản Medium Unit" },
  { id: "DEP-404", contractRef: "CT-0941", tenant: "Công ty Alpha Logistics", unitCode: "M-3", depositAmount: 760000, escrowRef: "VNPAY-ESC-8990", vaultStatus: "ESCROW_LOCKED", dateReceived: "15/06/2026", expectedRelease: "15/12/2026", note: "Cọc 2 tháng hợp đồng doanh nghiệp" },
  { id: "DEP-405", contractRef: "CT-0912", tenant: "Trần Anh Quân", unitCode: "L-1", depositAmount: 1780000, escrowRef: "VNPAY-ESC-8812", vaultStatus: "ESCROW_LOCKED", dateReceived: "10/01/2026", expectedRelease: "10/01/2027", note: "Cọc 2 tháng Large Unit dài hạn" },
  { id: "DEP-406", contractRef: "CT-0925", tenant: "Vũ Bảo Long", unitCode: "L-2", depositAmount: 890000, escrowRef: "VNPAY-ESC-8940", vaultStatus: "ESCROW_LOCKED", dateReceived: "01/05/2026", expectedRelease: "01/11/2026", note: "Cọc Large Unit" },
  { id: "DEP-407", contractRef: "CT-1011", tenant: "Trịnh Gia Huy", unitCode: "LOCK-2", depositAmount: 200000, escrowRef: "VNPAY-ESC-9011", vaultStatus: "ESCROW_LOCKED", dateReceived: "12/08/2026", expectedRelease: "12/11/2026", note: "Cọc thẻ từ & chìa khóa Locker" },
  { id: "DEP-408", contractRef: "CT-0988", tenant: "Hoàng Nam", unitCode: "M-2", depositAmount: 190000, escrowRef: "VNPAY-ESC-8960", vaultStatus: "PENDING_RELEASE", dateReceived: "20/07/2026", expectedRelease: "17/10/2026", note: "Đang nghiệm thu trả kho RT-0871" },
];

// Dữ liệu chứng từ phụ thu chi tiết (Surcharges)
export const SURCHARGE_ITEMS = [
  { id: "SUR-011", refCode: "RT-0871", tenant: "Hoàng Nam", unitCode: "M-2", type: "Trễ hạn trả kho (Overtime)", amount: 120000, reason: "Bàn giao trễ 4 giờ so với thỏa thuận kết thúc hợp đồng", date: "08/10/2026", status: "COLLECTED" },
  { id: "SUR-012", refCode: "SR-0032", tenant: "Lê Minh Trí", unitCode: "S-4", type: "Hỗ trợ khẩn cấp / Dịch vụ cửa", amount: 50000, reason: "Phí mở cửa khẩn cấp ngoài giờ kỹ thuật", date: "02/10/2026", status: "COLLECTED" },
  { id: "SUR-013", refCode: "CL-0089", tenant: "Vũ Thị Nguyệt", unitCode: "S-2", type: "Phí vệ sinh tồn dư", amount: 60000, reason: "Bụi đóng gáy thùng carton sau khi trả kho", date: "18/09/2026", status: "COLLECTED" },
  { id: "SUR-014", refCode: "EX-0045", tenant: "Trần Anh Quân", unitCode: "L-1", type: "Phụ thu điện năng tải lạnh", amount: 120000, reason: "Vận hành thiết bị làm mát chuyên dụng liên tục", date: "05/10/2026", status: "COLLECTED" },
  { id: "SUR-015", refCode: "KEY-0012", tenant: "Nguyễn Văn Hùng", unitCode: "LOCK-1", type: "Phí cấp lại chìa phụ", amount: 30000, reason: "Khách yêu cầu cấp thêm thẻ từ phụ cho trợ lý", date: "10/07/2026", status: "COLLECTED" },
  { id: "SUR-016", refCode: "RT-0810", tenant: "Bùi Thị Mai", unitCode: "M-4", type: "Xử lý rác cồng kềnh", amount: 250000, reason: "Bỏ lại pallet hỏng không đem đi", date: "22/08/2026", status: "COLLECTED" },
  { id: "SUR-017", refCode: "DM-0004", tenant: "Phan Văn Nam", unitCode: "L-3", type: "Khắc phục xước sàn Epoxy", amount: 610000, reason: "Kéo lê vật nặng gây xước sâu sàn bảo vệ", date: "30/08/2026", status: "COLLECTED" },
];

// Danh sách các phiên bản Rental Policy
export const POLICY_VERSIONS = [
  {
    version: "v3",
    effectiveDate: "01/10/2026",
    changedBy: "Hằng (Business Ops)",
    status: "ACTIVE",
    scope: "Ngưỡng khấu trừ hao mòn sàn Epoxy 15% & biểu phí quá hạn trả kho",
    diff: [
      { field: "Ngưỡng bồi hoàn xước sàn Epoxy", oldVal: "Tính theo hóa đơn nhà thầu thực tế", newVal: "Đồng giá tối đa 15% cọc giữ (tối đa 600.000 ₫/vết)" },
      { field: "Phụ thu quá giờ trả kho", oldVal: "50.000 ₫ / giờ", newVal: "30.000 ₫ / giờ (miễn phí 60 phút ân hạn đầu)" },
      { field: "Thời gian hoàn cọc tối đa", oldVal: "7 ngày làm việc", newVal: "Ngay khi ký biên bản Checkout (qua VietQR)" },
    ],
  },
  {
    version: "v2",
    effectiveDate: "01/07/2026",
    changedBy: "Hằng (Business Ops)",
    status: "SUPERSEDED",
    scope: "Chính sách ưu đãi cam kết thanh toán trước 3 tháng / 6 tháng",
    diff: [
      { field: "Chiết khấu trả trước 3 tháng", oldVal: "0%", newVal: "Giảm 5% tổng tiền thuê" },
      { field: "Chiết khấu trả trước 6 tháng", oldVal: "0%", newVal: "Giảm 10% + Miễn phí cấp thẻ từ phụ" },
    ],
  },
  {
    version: "v1",
    effectiveDate: "15/01/2026",
    changedBy: "Quân (Facility Lead)",
    status: "ARCHIVED",
    scope: "Khung quy chế vận hành cơ sở ban đầu tại Tân Bình Gateway VN-SGN-01",
    diff: [
      { field: "Mức cọc cơ bản", oldVal: "Không có", newVal: "100% tiền thuê 1 tháng" },
      { field: "Buffer dọn dẹp chuyển giao", oldVal: "Không", newVal: "2 giờ sau mỗi lượt thuê" },
    ],
  },
];

// Báo cáo hiệu suất theo Zone
export const ZONE_PERFORMANCE = [
  { zone: "Zone A (Small)", unitCount: 14, rentedCount: 12, rate: "85.7%", baseRev: 4140000, surcharge: 110000, total: 4250000, avgDuration: "2.4 tháng", status: "HEALTHY" },
  { zone: "Zone B (Medium & Large)", unitCount: 18, rentedCount: 17, rate: "94.4%", baseRev: 10260000, surcharge: 980000, total: 11240000, avgDuration: "5.8 tháng", status: "HIGH_DEMAND" },
  { zone: "Zone C (Lockers)", unitCount: 10, rentedCount: 8, rate: "80.0%", baseRev: 800000, surcharge: 150000, total: 950000, avgDuration: "1.5 tháng", status: "STABLE" },
];

/**
 * Lấy số liệu tổng hợp Business Overview & KPIs
 * @param {string} periodId - ID của kỳ
 * @param {object} [customRange] - { startDate, endDate }
 */
export function getFinancialSummary(periodId = "THIS_QUARTER", customRange = null) {
  // Tính toán tùy biến theo kỳ được chọn
  let grossRevenue = 37450000;
  let depositsHeld = 4890000;
  let surcharges = 1240000;
  let occupancyRate = 88.1;
  let occupiedUnits = 37;
  let totalUnits = 42;
  let periodLabel = "Q3 2026 (01/07 – 30/09/2026)";
  let revenueGrowth = "+4.2% vs Q2";
  let surchargeGrowth = "+11.8% vs tháng trước";
  let occupancyStatus = "−1.1% so với mục tiêu 90%";

  if (periodId === "THIS_MONTH") {
    grossRevenue = 13200000;
    depositsHeld = 4890000;
    surcharges = 400000;
    occupancyRate = 88.1;
    occupiedUnits = 37;
    periodLabel = "Tháng 10/2026 (01/10 – 31/10/2026)";
    revenueGrowth = "+2.7% vs Tháng 9";
    surchargeGrowth = "+8.1% vs Tháng 9";
  } else if (periodId === "LAST_MONTH") {
    grossRevenue = 12850000;
    depositsHeld = 4890000;
    surcharges = 310000;
    occupancyRate = 85.7;
    occupiedUnits = 36;
    periodLabel = "Tháng 09/2026 (01/09 – 30/09/2026)";
    revenueGrowth = "+2.8% vs Tháng 8";
    surchargeGrowth = "-35.4% vs Tháng 8";
  } else if (periodId === "YTD") {
    grossRevenue = 118600000;
    depositsHeld = 4890000;
    surcharges = 3890000;
    occupancyRate = 88.1;
    occupiedUnits = 37;
    periodLabel = "YTD 2026 (01/01 – 31/10/2026)";
    revenueGrowth = "+18.5% YoY";
    surchargeGrowth = "+14.2% YoY";
  } else if (periodId === "CUSTOM" && customRange?.startDate && customRange?.endDate) {
    periodLabel = `${customRange.startDate} – ${customRange.endDate}`;
    grossRevenue = 15400000;
    depositsHeld = 4890000;
    surcharges = 520000;
    revenueGrowth = "Kỳ tùy chỉnh";
  }

  // TIỀN CỌC ĐƯỢC GIỮ RIÊNG Ở TÀI KHOẢN ESCROW, KHÔNG GỘP VÀO DOANH THU
  const baseRentCollected = grossRevenue - surcharges;

  return {
    periodId,
    periodLabel,
    grossRevenue,
    baseRentCollected,
    depositsHeld, // CHÚ Ý: Cọc không tính vào Doanh thu!
    surcharges,
    occupancyRate,
    occupiedUnits,
    totalUnits,
    revenueGrowth,
    surchargeGrowth,
    occupancyStatus,
  };
}

/**
 * Dữ liệu biểu đồ doanh thu theo 6 tháng gần nhất
 */
export function getMonthlyRevenueChartData() {
  return [
    { month: "Tháng 5", rent: 9950000, surcharge: 250000, total: 10200000, deposits: 1500000, heightPct: 68 },
    { month: "Tháng 6", rent: 11070000, surcharge: 380000, total: 11450000, deposits: 1700000, heightPct: 76.3 },
    { month: "Tháng 7", rent: 11650000, surcharge: 450000, total: 12100000, deposits: 1830000, heightPct: 80.6 },
    { month: "Tháng 8", rent: 12020000, surcharge: 480000, total: 12500000, deposits: 1820000, heightPct: 83.3 },
    { month: "Tháng 9", rent: 12540000, surcharge: 310000, total: 12850000, deposits: 1240000, heightPct: 85.6 },
    { month: "Tháng 10*", rent: 12800000, surcharge: 400000, total: 13200000, deposits: 1900000, heightPct: 88, isProjected: true },
  ];
}

/**
 * Trả về danh sách dữ liệu chi tiết cho Drill-down Drawer khi click vào 4 KPI
 * @param {'revenue' | 'deposits' | 'surcharges' | 'occupancy'} kpiKey
 */
export function getDrilldownItems(kpiKey) {
  switch (kpiKey) {
    case "revenue":
      return {
        title: "Chi tiết Doanh thu (Gross Revenue)",
        subtitle: "Hợp đồng thuê, tiền thuê cơ bản và phụ thu đã thu trong kỳ (Không gồm tiền cọc)",
        columns: [
          { key: "id", label: "Mã giao dịch" },
          { key: "contractRef", label: "Hợp đồng" },
          { key: "tenant", label: "Khách hàng" },
          { key: "unitCode", label: "Unit" },
          { key: "category", label: "Loại hợp đồng" },
          { key: "baseRent", label: "Tiền thuê", isMoney: true },
          { key: "surcharge", label: "Phụ thu", isMoney: true },
          { key: "total", label: "Tổng thực thu", isMoney: true, isHighlight: true },
          { key: "date", label: "Ngày thu" },
          { key: "method", label: "Phương thức" },
        ],
        rows: REVENUE_TRANSACTIONS,
      };

    case "deposits":
      return {
        title: "Chi tiết Tiền cọc đang giữ (Escrow Vaulted Deposits)",
        subtitle: "Các khoản đặt cọc bảo đảm tài sản được giữ riêng biệt tại cổng trung gian Escrow (VNPay / Ngân hàng)",
        warningNotice: "Theo chuẩn kế toán VAS & Quy chế StorageHub: Tiền cọc là nghĩa vụ nợ bảo đảm, tuyệt đối KHÔNG tính vào doanh thu hoạt động.",
        columns: [
          { key: "id", label: "Mã cọc" },
          { key: "contractRef", label: "Hợp đồng" },
          { key: "tenant", label: "Khách hàng" },
          { key: "unitCode", label: "Unit" },
          { key: "depositAmount", label: "Số tiền cọc", isMoney: true, isHighlight: true },
          { key: "escrowRef", label: "Mã Escrow" },
          { key: "vaultStatus", label: "Trạng thái ký quỹ" },
          { key: "dateReceived", label: "Ngày nhận" },
          { key: "expectedRelease", label: "Dự kiến hoàn trả" },
          { key: "note", label: "Mục đích cọc" },
        ],
        rows: ESCROW_DEPOSITS,
      };

    case "surcharges":
      return {
        title: "Chi tiết Phụ thu & Phí dịch vụ (Surcharges & Extra Fees)",
        subtitle: "Các khoản phát sinh: Trễ hạn bàn giao, phí vệ sinh hoàn trả, dịch vụ kỹ thuật khẩn cấp",
        columns: [
          { key: "id", label: "Mã biên lai" },
          { key: "refCode", label: "Mã sự vụ / Task" },
          { key: "tenant", label: "Khách hàng" },
          { key: "unitCode", label: "Unit" },
          { key: "type", label: "Khoản mục phụ thu" },
          { key: "amount", label: "Số tiền", isMoney: true, isHighlight: true },
          { key: "reason", label: "Lý do phát sinh" },
          { key: "date", label: "Ngày lập" },
        ],
        rows: SURCHARGE_ITEMS,
      };

    case "occupancy":
      return {
        title: "Chi tiết Công suất & Tỷ lệ lấp đầy (Capacity & Occupancy)",
        subtitle: "Danh sách 37/42 kho đang được thuê và khai thác tại cơ sở VN-SGN-01",
        columns: [
          { key: "unitCode", label: "Mã kho" },
          { key: "spec", label: "Quy cách" },
          { key: "zone", label: "Zone" },
          { key: "tenant", label: "Người thuê" },
          { key: "contractRef", label: "Hợp đồng" },
          { key: "monthlyRent", label: "Giá thuê/tháng", isMoney: true },
          { key: "expiryDate", label: "Hạn hợp đồng" },
          { key: "status", label: "Trạng thái" },
        ],
        rows: [
          { unitCode: "S-3", spec: "Small · 5 m²", zone: "Zone A", tenant: "Nguyễn Thị Lan", contractRef: "CT-1042", monthlyRent: 345000, expiryDate: "18/10/2026", status: "RENTED" },
          { unitCode: "S-4", spec: "Small · 5 m²", zone: "Zone A", tenant: "Lê Minh Trí", contractRef: "CT-1038", monthlyRent: 345000, expiryDate: "19/11/2026", status: "RENTED" },
          { unitCode: "M-1", spec: "Medium · 8 m²", zone: "Zone A", tenant: "Đỗ Mai Hương", contractRef: "CT-1040", monthlyRent: 380000, expiryDate: "25/12/2026", status: "RENTED" },
          { unitCode: "M-3", spec: "Medium · 8 m²", zone: "Zone B", tenant: "Công ty Alpha Logistics", contractRef: "CT-0941", monthlyRent: 380000, expiryDate: "15/12/2026", status: "RENTED" },
          { unitCode: "L-1", spec: "Large · 15 m²", zone: "Zone B", tenant: "Trần Anh Quân", contractRef: "CT-0912", monthlyRent: 890000, expiryDate: "10/01/2027", status: "RENTED" },
          { unitCode: "L-2", spec: "Large · 15 m²", zone: "Zone B", tenant: "Vũ Bảo Long", contractRef: "CT-0925", monthlyRent: 890000, expiryDate: "01/11/2026", status: "RENTED" },
          { unitCode: "LOCK-2", spec: "Locker · 1.5 m²", zone: "Zone C", tenant: "Trịnh Gia Huy", contractRef: "CT-1011", monthlyRent: 100000, expiryDate: "12/11/2026", status: "RENTED" },
          { unitCode: "M-5", spec: "Medium · 8 m²", zone: "Zone B", tenant: "Phạm Thị Trang", contractRef: "BK-1044", monthlyRent: 380000, expiryDate: "19/10/2026", status: "RESERVED" },
          { unitCode: "LOCK-3", spec: "Locker · 1.5 m²", zone: "Zone C", tenant: "Bùi Tuyết Mai", contractRef: "BK-1046", monthlyRent: 100000, expiryDate: "20/10/2026", status: "RESERVED" },
          { unitCode: "S-1", spec: "Small · 5 m²", zone: "Zone A", tenant: "— (Đang dọn dẹp)", contractRef: "—", monthlyRent: 345000, expiryDate: "—", status: "PREPARING" },
          { unitCode: "M-2", spec: "Medium · 8 m²", zone: "Zone B", tenant: "Hoàng Nam (Nghiệm thu)", contractRef: "CT-0988", monthlyRent: 380000, expiryDate: "17/10/2026", status: "PREPARING" },
          { unitCode: "M-4", spec: "Medium · 8 m²", zone: "Zone B", tenant: "— (Bảo trì SmartLock)", contractRef: "—", monthlyRent: 380000, expiryDate: "—", status: "MAINTENANCE" },
        ],
      };

    default:
      return null;
  }
}

/**
 * Xuất dữ liệu báo cáo tài chính ra file CSV (chuẩn UTF-8 có BOM)
 */
export function exportFinancialAuditCSV(periodLabel = "Q3_2026") {
  const headers = ["Mã giao dịch", "Hợp đồng", "Khách hàng", "Mã kho", "Hạng mục", "Tiền thuê (VND)", "Phụ thu (VND)", "Tổng thu (VND)", "Phương thức", "Ngày lập", "Trạng thái"];
  
  const rows = REVENUE_TRANSACTIONS.map((tx) => [
    `"${tx.id}"`,
    `"${tx.contractRef}"`,
    `"${tx.tenant}"`,
    `"${tx.unitCode}"`,
    `"${tx.category}"`,
    tx.baseRent,
    tx.surcharge,
    tx.total,
    `"${tx.method}"`,
    `"${tx.date}"`,
    `"${tx.status}"`,
  ]);

  const summary = [
    [],
    ["# TỔNG HỢP KIỂM TOÁN TÀI CHÍNH STORAGEHUB"],
    ["Kỳ báo cáo", `"${periodLabel}"`],
    ["Doanh thu thuần", 36210000],
    ["Phụ thu phát sinh", 1240000],
    ["TỔNG DOANH THU KINH DOANH (GROSS REVENUE)", 37450000],
    ["TIỀN CỌC ĐANG GIỮ TRONG ESCROW (KHÔNG TÍNH VÀO DOANH THU)", 4890000],
    ["Tỷ lệ lấp đầy cơ sở", "88.1% (37/42 kho)"],
    ["Chứng chỉ kiểm toán", "VN VAS Audit Conformance / VNPT-CA Signed"],
    ["Thời gian xuất báo cáo", `"${new Date().toLocaleString("vi-VN")}"`],
  ];

  const csvContent =
    "\uFEFF" +
    [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      ...summary.map((r) => r.join(",")),
    ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `StorageHub_Financial_Audit_${periodLabel.replace(/[^a-zA-Z0-9_]/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
