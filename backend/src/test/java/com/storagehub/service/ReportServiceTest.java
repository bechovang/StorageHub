package com.storagehub.service;

import com.storagehub.dto.report.DrilldownResponse;
import com.storagehub.dto.report.FinancialSummaryResponse;
import com.storagehub.dto.report.MonthlyRevenueItemResponse;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Unit;
import com.storagehub.repository.ContractRepository;
import com.storagehub.repository.PaymentRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.service.impl.ReportServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    private Payment payment(Payment.Purpose purpose, String amount) {
        Payment p = new Payment();
        p.setPurpose(purpose);
        p.setAmount(new BigDecimal(amount));
        p.setMethod(Payment.Method.PAYOS);
        p.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC)); // BE lưu UTC — trong kỳ hiện tại
        return p;
    }

    @Test
    @DisplayName("getFinancialSummary: Tính toán chính xác doanh thu, cọc Escrow và tỷ lệ lấp đầy")
    void testGetFinancialSummary_Calculation() {
        when(paymentRepository.findByStatus(Payment.Status.SUCCEEDED)).thenReturn(List.of(
                payment(Payment.Purpose.RENT, "10000000"),
                payment(Payment.Purpose.EXTENSION_FEE, "2000000"),
                payment(Payment.Purpose.EXTRA_FEE, "500000"),
                payment(Payment.Purpose.DAMAGE_FEE, "200000"),
                payment(Payment.Purpose.DEPOSIT, "1500000")));
        when(unitRepository.countByStatus(Unit.Status.RENTED)).thenReturn(8L);
        when(unitRepository.countByStatusNot(Unit.Status.RETIRED)).thenReturn(10L);

        FinancialSummaryResponse summary = reportService.getFinancialSummary("THIS_MONTH", null, null);

        assertThat(summary).isNotNull();
        assertThat(summary.netRevenue()).isEqualTo(12000000L);
        assertThat(summary.surchargeRevenue()).isEqualTo(700000L);
        assertThat(summary.grossRevenue()).isEqualTo(12700000L);
        // Cọc escrow KHÔNG được tính vào gross revenue
        assertThat(summary.escrowDeposit()).isEqualTo(1500000L);
        assertThat(summary.grossRevenue()).isNotEqualTo(summary.netRevenue() + summary.surchargeRevenue() + summary.escrowDeposit());
        assertThat(summary.occupancyRate()).isEqualTo(80.0);
        assertThat(summary.occupancyBreakdown()).isEqualTo("8 / 10 kho đang cho thuê");
    }

    @Test
    @DisplayName("getFinancialSummary: Không còn số liệu bị 'độn' — DB trống thì mọi số bằng 0")
    void testGetFinancialSummary_NoFakeFallback() {
        when(paymentRepository.findByStatus(Payment.Status.SUCCEEDED)).thenReturn(List.of());
        when(unitRepository.countByStatus(Unit.Status.RENTED)).thenReturn(0L);
        when(unitRepository.countByStatusNot(Unit.Status.RETIRED)).thenReturn(0L);

        FinancialSummaryResponse summary = reportService.getFinancialSummary("THIS_QUARTER", null, null);

        assertThat(summary).isNotNull();
        assertThat(summary.grossRevenue()).isEqualTo(0L);
        assertThat(summary.netRevenue()).isEqualTo(0L);
        assertThat(summary.escrowDeposit()).isEqualTo(0L);
        assertThat(summary.occupancyRate()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("getMonthlyRevenueChart: Chuỗi N tháng tính từ payment thật trong DB")
    void testGetMonthlyRevenueChart() {
        when(paymentRepository.findByStatus(Payment.Status.SUCCEEDED)).thenReturn(List.of(
                payment(Payment.Purpose.RENT, "5000")));

        List<MonthlyRevenueItemResponse> chart = reportService.getMonthlyRevenueChart(6);

        assertThat(chart).hasSize(6);
        // Tháng hiện tại chứa khoản rent vừa nạp
        MonthlyRevenueItemResponse current = chart.get(5);
        assertThat(current.totalRevenue()).isEqualTo(5000L);
        assertThat(current.rentRevenue()).isEqualTo(5000L);
        // Các tháng cũ không có giao dịch
        assertThat(chart.get(0).totalRevenue()).isEqualTo(0L);
    }

    @Test
    @DisplayName("getReportDrilldown: 4 KPI đọc từ payments/units thật, rows rỗng khi DB trống")
    void testGetReportDrilldown_EmptyDatabase() {
        when(paymentRepository.findByStatus(Payment.Status.SUCCEEDED)).thenReturn(List.of());
        when(unitRepository.findAll()).thenReturn(List.of());

        assertThat(reportService.getReportDrilldown("REVENUE", null).rows()).isEmpty();
        assertThat(reportService.getReportDrilldown("DEPOSIT", null).rows()).isEmpty();
        assertThat(reportService.getReportDrilldown("SURCHARGE", null).rows()).isEmpty();
        assertThat(reportService.getReportDrilldown("OCCUPANCY", null).rows()).isEmpty();

        DrilldownResponse rev = reportService.getReportDrilldown("REVENUE", null);
        assertThat(rev.key()).isEqualTo("REVENUE");
        assertThat(rev.columns()).isNotEmpty();
    }

    @Test
    @DisplayName("getReportDrilldown: REVENUE liệt kê payment SUCCEEDED không tính cọc")
    void testGetReportDrilldown_RevenueRows() {
        Payment rent = payment(Payment.Purpose.RENT, "5000");
        rent.setPaymentId(1L);
        rent.setReceiptCode("RT-2026-0001");
        Payment deposit = payment(Payment.Purpose.DEPOSIT, "5000");
        when(paymentRepository.findByStatus(Payment.Status.SUCCEEDED)).thenReturn(List.of(rent, deposit));

        DrilldownResponse rev = reportService.getReportDrilldown("REVENUE", null);
        assertThat(rev.rows()).hasSize(1);
        assertThat(rev.rows().get(0).get("id")).isEqualTo("RT-2026-0001");
    }

    @Test
    @DisplayName("exportReportCSV: BOM UTF-8, headers và summary block từ dữ liệu thật")
    void testExportReportCSV() {
        when(paymentRepository.findByStatus(Payment.Status.SUCCEEDED)).thenReturn(List.of());
        when(unitRepository.countByStatus(Unit.Status.RENTED)).thenReturn(0L);
        when(unitRepository.countByStatusNot(Unit.Status.RETIRED)).thenReturn(0L);

        String csv = reportService.exportReportCSV("Q3_2026");

        assertThat(csv).isNotNull();
        assertThat(csv).startsWith("﻿");
        assertThat(csv).contains("Mã giao dịch");
        assertThat(csv).contains("# TỔNG HỢP KIỂM TOÁN TÀI CHÍNH STORAGEHUB");
        assertThat(csv).contains("TIỀN CỌC ĐANG GIỮ (KHÔNG TÍNH VÀO DOANH THU)");
    }
}
