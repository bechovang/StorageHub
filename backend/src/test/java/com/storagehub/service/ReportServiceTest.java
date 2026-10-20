package com.storagehub.service;

import com.storagehub.dto.report.DrilldownResponse;
import com.storagehub.dto.report.FinancialSummaryResponse;
import com.storagehub.dto.report.MonthlyRevenueItemResponse;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Unit;
import com.storagehub.repository.PaymentRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.service.impl.ReportServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UnitRepository unitRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    @Test
    @DisplayName("getFinancialSummary: Tính toán chính xác doanh thu, cọc Escrow và tỷ lệ lấp đầy")
    void testGetFinancialSummary_Calculation() {
        Payment rentPayment = new Payment();
        rentPayment.setPurpose(Payment.Purpose.RENT);
        rentPayment.setAmount(new BigDecimal("10000000"));

        Payment extensionPayment = new Payment();
        extensionPayment.setPurpose(Payment.Purpose.EXTENSION_FEE);
        extensionPayment.setAmount(new BigDecimal("2000000"));

        Payment extraFeePayment = new Payment();
        extraFeePayment.setPurpose(Payment.Purpose.EXTRA_FEE);
        extraFeePayment.setAmount(new BigDecimal("500000"));

        Payment damageFeePayment = new Payment();
        damageFeePayment.setPurpose(Payment.Purpose.DAMAGE_FEE);
        damageFeePayment.setAmount(new BigDecimal("200000"));

        Payment depositPayment = new Payment();
        depositPayment.setPurpose(Payment.Purpose.DEPOSIT);
        depositPayment.setAmount(new BigDecimal("1500000"));

        when(paymentRepository.findByStatus(Payment.Status.SUCCEEDED))
                .thenReturn(List.of(rentPayment, extensionPayment, extraFeePayment, damageFeePayment, depositPayment));

        when(unitRepository.countByStatus(Unit.Status.RENTED)).thenReturn(8L);
        when(unitRepository.countByStatusNot(Unit.Status.RETIRED)).thenReturn(10L);

        FinancialSummaryResponse summary = reportService.getFinancialSummary("THIS_MONTH", null, null);

        assertThat(summary).isNotNull();
        assertThat(summary.netRevenue()).isEqualTo(12000000L);
        assertThat(summary.surchargeRevenue()).isEqualTo(700000L);
        // Gross revenue = netRevenue + surchargeRevenue
        assertThat(summary.grossRevenue()).isEqualTo(12700000L);
        // Escrow deposit = 1500000 (KHÔNG được tính vào gross revenue)
        assertThat(summary.escrowDeposit()).isEqualTo(1500000L);
        assertThat(summary.grossRevenue()).isNotEqualTo(summary.netRevenue() + summary.surchargeRevenue() + summary.escrowDeposit());
        // Occupancy rate = 80.0%
        assertThat(summary.occupancyRate()).isEqualTo(80.0);
        assertThat(summary.occupancyBreakdown()).isEqualTo("8 / 10 kho đang cho thuê");
    }

    @Test
    @DisplayName("getFinancialSummary: Fallback về số liệu kiểm toán chuẩn khi database chưa có giao dịch")
    void testGetFinancialSummary_Fallback() {
        when(paymentRepository.findByStatus(Payment.Status.SUCCEEDED)).thenReturn(List.of());
        when(unitRepository.countByStatus(Unit.Status.RENTED)).thenReturn(0L);
        when(unitRepository.countByStatusNot(Unit.Status.RETIRED)).thenReturn(0L);

        FinancialSummaryResponse summary = reportService.getFinancialSummary("THIS_QUARTER", null, null);

        assertThat(summary).isNotNull();
        assertThat(summary.grossRevenue()).isEqualTo(37450000L);
        assertThat(summary.netRevenue()).isEqualTo(36210000L);
        assertThat(summary.escrowDeposit()).isEqualTo(4890000L);
        assertThat(summary.occupancyRate()).isEqualTo(88.1);
    }

    @Test
    @DisplayName("getMonthlyRevenueChart: Trả về chuỗi dữ liệu doanh thu 6 tháng")
    void testGetMonthlyRevenueChart() {
        List<MonthlyRevenueItemResponse> chart = reportService.getMonthlyRevenueChart(6);

        assertThat(chart).hasSize(6);
        assertThat(chart.get(0).month()).isEqualTo("05/2026");
        assertThat(chart.get(5).month()).isEqualTo("10/2026");
        // Kiểm tra nguyên tắc cọc không gộp vào total revenue
        MonthlyRevenueItemResponse oct = chart.get(5);
        assertThat(oct.totalRevenue()).isEqualTo(oct.rentRevenue() + oct.surcharge());
    }

    @Test
    @DisplayName("getReportDrilldown: Lấy chi tiết cho 4 KPI và lọc theo query")
    void testGetReportDrilldown_AllKeys() {
        DrilldownResponse rev = reportService.getReportDrilldown("REVENUE", null);
        assertThat(rev.key()).isEqualTo("REVENUE");
        assertThat(rev.columns()).isNotEmpty();
        assertThat(rev.rows()).isNotEmpty();

        DrilldownResponse dep = reportService.getReportDrilldown("DEPOSIT", null);
        assertThat(dep.key()).isEqualTo("DEPOSIT");
        assertThat(dep.rows()).isNotEmpty();

        DrilldownResponse sur = reportService.getReportDrilldown("SURCHARGE", null);
        assertThat(sur.key()).isEqualTo("SURCHARGE");
        assertThat(sur.rows()).isNotEmpty();

        DrilldownResponse occ = reportService.getReportDrilldown("OCCUPANCY", null);
        assertThat(occ.key()).isEqualTo("OCCUPANCY");
        assertThat(occ.rows()).isNotEmpty();

        // Test search query
        DrilldownResponse filtered = reportService.getReportDrilldown("REVENUE", "Alpha");
        assertThat(filtered.rows()).hasSize(1);
    }

    @Test
    @DisplayName("exportReportCSV: Xuất file CSV có BOM UTF-8, headers và summary block")
    void testExportReportCSV() {
        String csv = reportService.exportReportCSV("Q3_2026");

        assertThat(csv).isNotNull();
        assertThat(csv).startsWith("\uFEFF");
        assertThat(csv).contains("Mã giao dịch");
        assertThat(csv).contains("# TỔNG HỢP KIỂM TOÁN TÀI CHÍNH STORAGEHUB");
        assertThat(csv).contains("TIỀN CỌC ĐANG GIỮ TRONG ESCROW (KHÔNG TÍNH VÀO DOANH THU)");
    }
}
