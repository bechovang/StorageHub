package com.storagehub.controller;

import com.storagehub.dto.report.DrilldownColumn;
import com.storagehub.dto.report.DrilldownResponse;
import com.storagehub.dto.report.FinancialSummaryResponse;
import com.storagehub.dto.report.MonthlyRevenueItemResponse;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.ReportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReportService reportService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final Authentication opsAuth =
            new TestingAuthenticationToken("ops@storagehub.vn", null, "ROLE_BUSINESS_OPS");

    @Test
    @DisplayName("GET /api/v1/reports/financial-summary: 200 OK trả về 4 chỉ số KPI")
    void testGetFinancialSummary_Success() throws Exception {
        FinancialSummaryResponse summary = new FinancialSummaryResponse(
                "Quý này (Q3 2026)",
                37450000L,
                "+12.4%",
                36210000L,
                4890000L,
                "Tài khoản giữ hộ cọc tại Vietcombank",
                1240000L,
                "Phí quá giờ",
                88.1,
                "37 / 42 kho",
                "+3.2%"
        );

        when(reportService.getFinancialSummary(anyString(), any(), any())).thenReturn(summary);

        mockMvc.perform(get("/api/v1/reports/financial-summary")
                        .principal(opsAuth)
                        .param("period", "THIS_QUARTER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grossRevenue").value(37450000))
                .andExpect(jsonPath("$.netRevenue").value(36210000))
                .andExpect(jsonPath("$.escrowDeposit").value(4890000))
                .andExpect(jsonPath("$.occupancyRate").value(88.1));
    }

    @Test
    @DisplayName("GET /api/v1/reports/monthly-revenue: 200 OK trả về dữ liệu biểu đồ")
    void testGetMonthlyRevenue_Success() throws Exception {
        MonthlyRevenueItemResponse item = new MonthlyRevenueItemResponse(
                "10/2026", 36210000L, 1240000L, 4890000L, 37450000L
        );

        when(reportService.getMonthlyRevenueChart(anyInt())).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/reports/monthly-revenue")
                        .principal(opsAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].month").value("10/2026"))
                .andExpect(jsonPath("$[0].totalRevenue").value(37450000));
    }

    @Test
    @DisplayName("GET /api/v1/reports/drilldown: 200 OK trả về cấu hình cột và dòng dữ liệu")
    void testGetReportDrilldown_Success() throws Exception {
        DrilldownResponse response = new DrilldownResponse(
                "REVENUE",
                "Chi tiết chứng từ Doanh thu kinh doanh",
                List.of(new DrilldownColumn("id", "Mã giao dịch")),
                List.of(Map.of("id", "TX-7801", "tenant", "Nguyễn Thị Lan"))
        );

        when(reportService.getReportDrilldown(eq("REVENUE"), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/reports/drilldown")
                        .principal(opsAuth)
                        .param("key", "REVENUE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("REVENUE"))
                .andExpect(jsonPath("$.columns[0].key").value("id"))
                .andExpect(jsonPath("$.rows[0].id").value("TX-7801"));
    }

    @Test
    @DisplayName("GET /api/v1/reports/export: 200 OK trả về file CSV đính kèm")
    void testExportReportCSV_Success() throws Exception {
        String csv = "\uFEFF\"Mã giao dịch\",\"Hợp đồng\"\r\n\"TX-7801\",\"CT-1042\"\r\n";

        when(reportService.exportReportCSV(anyString())).thenReturn(csv);

        mockMvc.perform(get("/api/v1/reports/export")
                        .principal(opsAuth)
                        .param("period", "THIS_QUARTER"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"StorageHub_Financial_Audit_THIS_QUARTER.csv\""))
                .andExpect(content().contentTypeCompatibleWith(MediaType.parseMediaType("text/csv")))
                .andExpect(content().string(csv));
    }
}
