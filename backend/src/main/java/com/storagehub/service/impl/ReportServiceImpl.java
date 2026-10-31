package com.storagehub.service.impl;

import com.storagehub.dto.report.DrilldownColumn;
import com.storagehub.dto.report.DrilldownResponse;
import com.storagehub.dto.report.FinancialSummaryResponse;
import com.storagehub.dto.report.MonthlyRevenueItemResponse;
import com.storagehub.entity.Contract;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Unit;
import com.storagehub.repository.ContractRepository;
import com.storagehub.repository.PaymentRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.service.ReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Báo cáo tài chính đọc TRỰC TIẾP từ bảng payments/units/contracts — không số liệu giả.
 * Doanh thu = payment SUCCEEDED (RENT + EXTENSION_FEE); phụ thu = DAMAGE_FEE +
 * EXTRA_FEE; cọc Escrow = DEPOSIT (không tính vào doanh thu).
 */
@Service
public class ReportServiceImpl implements ReportService {

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VN_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PaymentRepository paymentRepository;
    private final UnitRepository unitRepository;
    private final ContractRepository contractRepository;
    private final com.storagehub.repository.ReservationRepository reservationRepository;

    public ReportServiceImpl(
            PaymentRepository paymentRepository,
            UnitRepository unitRepository,
            ContractRepository contractRepository,
            com.storagehub.repository.ReservationRepository reservationRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.unitRepository = unitRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
    }

    private record Bucket(long netRevenue, long surchargeRevenue, long escrowDeposit) {
        long gross() {
            return netRevenue + surchargeRevenue;
        }
    }

    private Bucket bucketFor(LocalDate rangeStart, LocalDate rangeEnd, List<Payment> succeededPayments) {
        long net = 0;
        long surcharge = 0;
        long escrow = 0;
        for (Payment p : succeededPayments) {
            LocalDate pDate = p.getCreatedAt() != null
                    ? p.getCreatedAt().atZone(ZoneId.of("UTC")).withZoneSameInstant(ICT_ZONE).toLocalDate()
                    : null;
            if (pDate == null || pDate.isBefore(rangeStart) || pDate.isAfter(rangeEnd)) {
                continue;
            }
            long amt = p.getAmount() != null ? p.getAmount().longValue() : 0L;
            switch (p.getPurpose()) {
                case RENT, EXTENSION_FEE -> net += amt;
                case DAMAGE_FEE, EXTRA_FEE -> surcharge += amt;
                case DEPOSIT -> escrow += amt;
            }
        }
        return new Bucket(net, surcharge, escrow);
    }

    private String growthText(long current, long previous) {
        if (previous <= 0) {
            return current > 0 ? "Kỳ trước chưa có doanh thu" : "Chưa có doanh thu trong kỳ";
        }
        double pct = Math.round(((double) (current - previous) / previous) * 1000.0) / 10.0;
        return (pct >= 0 ? "+" : "") + pct + "% so với kỳ trước";
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialSummaryResponse getFinancialSummary(String period, LocalDate startDate, LocalDate endDate) {
        String periodKey = (period != null && !period.isBlank()) ? period.toUpperCase(Locale.ROOT) : "THIS_MONTH";
        LocalDate today = LocalDate.now(ICT_ZONE);

        LocalDate rangeStart;
        LocalDate rangeEnd;
        LocalDate prevStart;
        LocalDate prevEnd;
        String periodLabel;

        switch (periodKey) {
            case "LAST_MONTH" -> {
                rangeStart = today.minusMonths(1).withDayOfMonth(1);
                rangeEnd = rangeStart.withDayOfMonth(rangeStart.lengthOfMonth());
                prevStart = rangeStart.minusMonths(1);
                prevEnd = prevStart.withDayOfMonth(prevStart.lengthOfMonth());
                periodLabel = "Tháng trước (" + rangeStart.format(DateTimeFormatter.ofPattern("MM/yyyy")) + ")";
            }
            case "THIS_QUARTER" -> {
                int qStart = ((today.getMonthValue() - 1) / 3) * 3 + 1;
                rangeStart = LocalDate.of(today.getYear(), qStart, 1);
                rangeEnd = rangeStart.plusMonths(3).minusDays(1);
                prevStart = rangeStart.minusMonths(3);
                prevEnd = rangeEnd.minusMonths(3);
                periodLabel = "Quý này (" + rangeStart.getYear() + " Q" + ((qStart - 1) / 3 + 1) + ")";
            }
            case "YTD" -> {
                rangeStart = today.withDayOfYear(1);
                rangeEnd = today;
                prevStart = rangeStart.minusYears(1);
                prevEnd = rangeEnd.minusYears(1);
                periodLabel = "YTD " + today.getYear();
            }
            case "CUSTOM" -> {
                rangeStart = startDate != null ? startDate : today.withDayOfMonth(1);
                rangeEnd = endDate != null ? endDate : today;
                long days = Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(rangeStart, rangeEnd) + 1);
                prevStart = rangeStart.minusDays(days);
                prevEnd = rangeStart.minusDays(1);
                periodLabel = "Tùy chọn (" + rangeStart + " – " + rangeEnd + ")";
            }
            default -> { // THIS_MONTH
                rangeStart = today.withDayOfMonth(1);
                rangeEnd = today.withDayOfMonth(today.lengthOfMonth());
                prevStart = rangeStart.minusMonths(1);
                prevEnd = rangeEnd.minusMonths(1);
                periodLabel = "Tháng này (" + rangeStart.format(DateTimeFormatter.ofPattern("MM/yyyy")) + ")";
            }
        }

        List<Payment> succeededPayments = paymentRepository.findByStatus(Payment.Status.SUCCEEDED);
        Bucket current = bucketFor(rangeStart, rangeEnd, succeededPayments);
        Bucket previous = bucketFor(prevStart, prevEnd, succeededPayments);

        long rentedUnits = unitRepository.countByStatus(Unit.Status.RENTED);
        long totalUnits = unitRepository.countByStatusNot(Unit.Status.RETIRED);

        double occupancyRate = totalUnits > 0
                ? Math.round(((double) rentedUnits / totalUnits) * 1000.0) / 10.0
                : 0.0;
        String occupancyBreakdown = rentedUnits + " / " + totalUnits + " kho đang cho thuê";

        return new FinancialSummaryResponse(
                periodLabel,
                current.gross(),
                growthText(current.gross(), previous.gross()),
                current.netRevenue(),
                current.escrowDeposit(),
                "Tài khoản giữ hộ cọc — tách biệt 100% khỏi doanh thu kinh doanh",
                current.surchargeRevenue(),
                "Bao gồm phí quá giờ, hư hại và xử lý phát sinh",
                occupancyRate,
                occupancyBreakdown,
                "So sánh theo dữ liệu thực tế trong kỳ"
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<MonthlyRevenueItemResponse> getMonthlyRevenueChart(int months) {
        LocalDate thisMonth = LocalDate.now(ICT_ZONE).withDayOfMonth(1);
        int n = Math.max(1, Math.min(months, 24));
        LocalDate firstMonth = thisMonth.minusMonths(n - 1L);

        List<Payment> succeededPayments = paymentRepository.findByStatus(Payment.Status.SUCCEEDED);
        Map<String, long[]> byMonth = new LinkedHashMap<>();
        DateTimeFormatter label = DateTimeFormatter.ofPattern("MM/yyyy");
        for (int i = 0; i < n; i++) {
            byMonth.put(firstMonth.plusMonths(i).format(label), new long[4]);
        }

        for (Payment p : succeededPayments) {
            if (p.getCreatedAt() == null) {
                continue;
            }
            LocalDate d = p.getCreatedAt().atZone(ZoneId.of("UTC")).withZoneSameInstant(ICT_ZONE).toLocalDate();
            long[] acc = byMonth.get(d.withDayOfMonth(1).format(label));
            if (acc == null) {
                continue;
            }
            long amt = p.getAmount() != null ? p.getAmount().longValue() : 0L;
            switch (p.getPurpose()) {
                case RENT -> acc[0] += amt;
                case EXTENSION_FEE -> acc[1] += amt;
                case DAMAGE_FEE, EXTRA_FEE -> acc[2] += amt;
                default -> { }
            }
        }

        List<MonthlyRevenueItemResponse> items = new ArrayList<>();
        byMonth.forEach((k, acc) -> items.add(new MonthlyRevenueItemResponse(
                // rentRevenue | surcharge (phụ thu) | escrowHold (cọc, không vào doanh thu) | total
                k, acc[0], acc[2], 0L, acc[0] + acc[1] + acc[2])));
        return items;
    }

    @Override
    @Transactional(readOnly = true)
    public DrilldownResponse getReportDrilldown(String key, String query) {
        String normalizedKey = key != null ? key.trim().toUpperCase(Locale.ROOT) : "REVENUE";

        List<DrilldownColumn> columns;
        String title;
        List<Map<String, Object>> rows;

        switch (normalizedKey) {
            case "DEPOSIT" -> {
                title = "Chi tiết Tiền cọc an ninh ký quỹ (Tài khoản Escrow)";
                columns = List.of(
                        new DrilldownColumn("depositId", "Mã ký quỹ"),
                        new DrilldownColumn("contractRef", "Hợp đồng"),
                        new DrilldownColumn("tenant", "Người ký quỹ"),
                        new DrilldownColumn("unitCode", "Kho áp dụng"),
                        new DrilldownColumn("amount", "Tiền cọc", true),
                        new DrilldownColumn("heldDate", "Ngày nộp cọc"),
                        new DrilldownColumn("status", "Trạng thái cọc")
                );
                rows = getDepositRows();
            }
            case "SURCHARGE" -> {
                title = "Chi tiết các khoản Phụ thu & Phí dịch vụ phát sinh";
                columns = List.of(
                        new DrilldownColumn("id", "Mã chứng từ"),
                        new DrilldownColumn("contractRef", "Hợp đồng"),
                        new DrilldownColumn("tenant", "Khách hàng"),
                        new DrilldownColumn("unitCode", "Mã kho"),
                        new DrilldownColumn("type", "Loại phụ thu"),
                        new DrilldownColumn("amount", "Số tiền", true),
                        new DrilldownColumn("date", "Ngày ghi nhận")
                );
                rows = getSurchargeRows();
            }
            case "OCCUPANCY" -> {
                title = "Chi tiết Tỷ lệ lấp đầy & Tình trạng sử dụng từng kho";
                columns = List.of(
                        new DrilldownColumn("unitCode", "Mã kho"),
                        new DrilldownColumn("spec", "Quy cách"),
                        new DrilldownColumn("zone", "Zone"),
                        new DrilldownColumn("tenant", "Người thuê"),
                        new DrilldownColumn("contractRef", "Hợp đồng"),
                        new DrilldownColumn("expiryDate", "Hạn hợp đồng"),
                        new DrilldownColumn("status", "Trạng thái")
                );
                rows = getOccupancyRows();
            }
            default -> { // REVENUE
                title = "Chi tiết chứng từ Doanh thu kinh doanh";
                columns = List.of(
                        new DrilldownColumn("id", "Mã giao dịch"),
                        new DrilldownColumn("contractRef", "Hợp đồng"),
                        new DrilldownColumn("tenant", "Khách hàng"),
                        new DrilldownColumn("unitCode", "Mã kho"),
                        new DrilldownColumn("category", "Hạng mục"),
                        new DrilldownColumn("baseRent", "Tiền thuê", true),
                        new DrilldownColumn("surcharge", "Phụ thu", true),
                        new DrilldownColumn("total", "Tổng thu", true),
                        new DrilldownColumn("method", "Phương thức"),
                        new DrilldownColumn("date", "Ngày lập"),
                        new DrilldownColumn("status", "Trạng thái")
                );
                rows = getRevenueRows();
            }
        }

        // Lọc theo search query nếu có
        if (query != null && !query.isBlank()) {
            String q = query.toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(row ->
                    row.values().stream().anyMatch(val ->
                            val != null && String.valueOf(val).toLowerCase(Locale.ROOT).contains(q))
            ).toList();
        }

        return new DrilldownResponse(normalizedKey, title, columns, rows);
    }

    @Override
    public String exportReportCSV(String period) {
        String periodLabel = (period != null && !period.isBlank()) ? period : "ALL";
        String bom = "\uFEFF";
        StringBuilder sb = new StringBuilder(bom);

        sb.append("\"Mã giao dịch\",\"Hợp đồng\",\"Khách hàng\",\"Mã kho\",\"Hạng mục\",\"Tiền thuê (VND)\",\"Phụ thu (VND)\",\"Tổng thu (VND)\",\"Phương thức\",\"Ngày lập\",\"Trạng thái\"\r\n");

        List<Map<String, Object>> revenueRows = getRevenueRows();
        for (Map<String, Object> r : revenueRows) {
            sb.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%s,%s,%s,\"%s\",\"%s\",\"%s\"\r\n",
                    r.get("id"),
                    r.get("contractRef"),
                    r.get("tenant"),
                    r.get("unitCode"),
                    r.get("category"),
                    r.get("baseRent"),
                    r.get("surcharge"),
                    r.get("total"),
                    r.get("method"),
                    r.get("date"),
                    r.get("status")
            ));
        }

        long baseRent = revenueRows.stream().mapToLong(r -> ((Number) r.get("baseRent")).longValue()).sum();
        long surcharge = revenueRows.stream().mapToLong(r -> ((Number) r.get("surcharge")).longValue()).sum();
        long escrow = getDepositRows().stream().mapToLong(r -> ((Number) r.get("amount")).longValue()).sum();
        long rented = unitRepository.countByStatus(Unit.Status.RENTED);
        long total = unitRepository.countByStatusNot(Unit.Status.RETIRED);

        sb.append("\r\n");
        sb.append("\"# TỔNG HỢP KIỂM TOÁN TÀI CHÍNH STORAGEHUB\"\r\n");
        sb.append(String.format("\"Kỳ báo cáo\",\"%s\"\r\n", periodLabel));
        sb.append(String.format("\"Doanh thu thuần\",%d\r\n", baseRent));
        sb.append(String.format("\"Phụ thu phát sinh\",%d\r\n", surcharge));
        sb.append(String.format("\"TỔNG DOANH THU KINH DOANH (GROSS REVENUE)\",%d\r\n", baseRent + surcharge));
        sb.append(String.format("\"TIỀN CỌC ĐANG GIỮ (KHÔNG TÍNH VÀO DOANH THU)\",%d\r\n", escrow));
        sb.append(String.format("\"Tỷ lệ lấp đầy cơ sở\",\"%.1f%% (%d/%d kho)\"\r\n",
                total > 0 ? rented * 100.0 / total : 0.0, rented, total));
        sb.append(String.format("\"Thời gian xuất báo cáo\",\"%s\"\r\n",
                LocalDateTime.now(ICT_ZONE).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))));

        return sb.toString();
    }

    private String contractRefOf(Reservation reservation) {
        if (reservation == null) {
            return "—";
        }
        return contractRepository.findByReservation_ReservationIdAndIsLatestTrue(reservation.getReservationId())
                .map(Contract::getCode)
                .orElseGet(() -> reservation.getCode());
    }

    private String unitCodeOf(Payment p) {
        if (p.getReservation() == null || p.getReservation().getUnit() == null) {
            return "—";
        }
        return p.getReservation().getUnit().getCode();
    }

    private String payerNameOf(Payment p) {
        return p.getPayer() != null && p.getPayer().getFullName() != null
                ? p.getPayer().getFullName() : "—";
    }

    private String dateOf(Payment p) {
        return p.getCreatedAt() == null ? "—" : p.getCreatedAt()
                .atZone(ZoneId.of("UTC")).withZoneSameInstant(ICT_ZONE).format(VN_DATE);
    }

    private String methodName(Payment p) {
        return switch (p.getMethod()) {
            case PAYOS -> "PayOS (QR)";
            case CARD -> "Thẻ";
            case MOMO -> "Ví MoMo";
            case VNPAY -> "VNPay";
            case CASH -> "Tiền mặt tại quầy";
            case BANK -> "Chuyển khoản tại quầy";
            case POS -> "Quẹt thẻ POS";
        };
    }

    private List<Map<String, Object>> getRevenueRows() {
        return paymentRepository.findByStatus(Payment.Status.SUCCEEDED).stream()
                .filter(p -> p.getPurpose() != Payment.Purpose.DEPOSIT)
                .sorted(Comparator.comparing(Payment::getPaymentId).reversed())
                .map(p -> {
                    long amt = p.getAmount() != null ? p.getAmount().longValue() : 0L;
                    boolean isSurcharge = p.getPurpose() == Payment.Purpose.DAMAGE_FEE
                            || p.getPurpose() == Payment.Purpose.EXTRA_FEE;
                    String category = switch (p.getPurpose()) {
                        case RENT -> "Tiền thuê kho";
                        case EXTENSION_FEE -> "Phí gia hạn";
                        case DAMAGE_FEE -> "Phí hư hại";
                        case EXTRA_FEE -> "Phí phát sinh";
                        case DEPOSIT -> "Cọc";
                    };
                    return createMap(
                            "id", p.getReceiptCode() != null ? p.getReceiptCode() : "TX-" + p.getPaymentId(),
                            "contractRef", contractRefOf(p.getReservation()),
                            "tenant", payerNameOf(p),
                            "unitCode", unitCodeOf(p),
                            "category", category,
                            "baseRent", isSurcharge ? 0L : amt,
                            "surcharge", isSurcharge ? amt : 0L,
                            "total", amt,
                            "method", methodName(p),
                            "date", dateOf(p),
                            "status", "COMPLETED"
                    );
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getDepositRows() {
        return paymentRepository.findByStatus(Payment.Status.SUCCEEDED).stream()
                .filter(p -> p.getPurpose() == Payment.Purpose.DEPOSIT)
                .sorted(Comparator.comparing(Payment::getPaymentId).reversed())
                .map(p -> createMap(
                        "depositId", p.getReceiptCode() != null ? p.getReceiptCode() : "DEP-" + p.getPaymentId(),
                        "contractRef", contractRefOf(p.getReservation()),
                        "tenant", payerNameOf(p),
                        "unitCode", unitCodeOf(p),
                        "amount", p.getAmount() != null ? p.getAmount().longValue() : 0L,
                        "heldDate", dateOf(p),
                        "status", "HELD_SECURE"
                ))
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getSurchargeRows() {
        return paymentRepository.findByStatus(Payment.Status.SUCCEEDED).stream()
                .filter(p -> p.getPurpose() == Payment.Purpose.DAMAGE_FEE
                        || p.getPurpose() == Payment.Purpose.EXTRA_FEE)
                .sorted(Comparator.comparing(Payment::getPaymentId).reversed())
                .map(p -> createMap(
                        "id", p.getReceiptCode() != null ? p.getReceiptCode() : "SC-" + p.getPaymentId(),
                        "contractRef", contractRefOf(p.getReservation()),
                        "tenant", payerNameOf(p),
                        "unitCode", unitCodeOf(p),
                        "type", p.getPurpose() == Payment.Purpose.DAMAGE_FEE ? "Phí hư hại" : "Phí phát sinh",
                        "amount", p.getAmount() != null ? p.getAmount().longValue() : 0L,
                        "date", dateOf(p)
                ))
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getOccupancyRows() {
        List<Unit> units = unitRepository.findAll();
        List<Reservation.Status> blocking = List.of(
                Reservation.Status.RESERVED,
                Reservation.Status.CHECKED_IN,
                Reservation.Status.CHECKOUT_REQUESTED);

        List<Long> unitIds = units.stream().map(Unit::getUnitId).toList();
        Map<Long, List<Reservation>> activeByUnit = unitIds.isEmpty() ? Map.of()
                : reservationRepository.findActiveReservationsForUnits(unitIds, blocking).stream()
                        .collect(Collectors.groupingBy(r -> r.getUnit().getUnitId()));

        return units.stream()
                .sorted(Comparator.comparing(Unit::getCode))
                .map(unit -> {
                    Reservation active = activeByUnit
                            .getOrDefault(unit.getUnitId(), List.of()).stream()
                            .max(Comparator.comparing(Reservation::getReservationId))
                            .orElse(null);
                    String tenant = active != null && active.getCustomer() != null
                            ? active.getCustomer().getFullName() : "—";
                    String status;
                    if (unit.getStatus() == Unit.Status.MAINTENANCE) {
                        status = "MAINTENANCE";
                    } else if (unit.getStatus() == Unit.Status.PREPARING) {
                        status = "PREPARING";
                    } else if (active != null) {
                        status = active.getStatus() == Reservation.Status.CHECKED_IN ? "RENTED" : active.getStatus().name();
                    } else {
                        status = unit.getStatus().name();
                    }
                    return createMap(
                            "unitCode", unit.getCode(),
                            "spec", unit.getType() != null
                                    ? unit.getType().getName() + " · " + unit.getSizeM2() + " m²" : "—",
                            "zone", unit.getZone() != null ? unit.getZone().getCode() : "—",
                            "tenant", tenant,
                            "contractRef", contractRefOf(active),
                            "expiryDate", active != null ? active.getEndDate().format(VN_DATE) : "—",
                            "status", status
                    );
                })
                .collect(Collectors.toList());
    }

    private Map<String, Object> createMap(Object... keyValues) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put(String.valueOf(keyValues[i]), keyValues[i + 1]);
        }
        return map;
    }
}
