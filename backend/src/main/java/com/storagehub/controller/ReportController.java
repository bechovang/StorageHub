package com.storagehub.controller;

import com.storagehub.dto.report.DrilldownResponse;
import com.storagehub.dto.report.FinancialSummaryResponse;
import com.storagehub.dto.report.MonthlyRevenueItemResponse;
import com.storagehub.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller báo cáo kinh doanh & phân tích chỉ số tài chính — US-31 (FR-31).
 * Quyền truy cập: BUSINESS_OPS & SYSTEM_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Báo cáo tổng hợp tài chính và 4 chỉ số KPI cốt lõi (FR-31).
     */
    @GetMapping("/financial-summary")
    public ResponseEntity<FinancialSummaryResponse> getFinancialSummary(
            @RequestParam(name = "period", defaultValue = "THIS_QUARTER") String period,
            @RequestParam(name = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        FinancialSummaryResponse response = reportService.getFinancialSummary(period, startDate, endDate);
        return ResponseEntity.ok(response);
    }

    /**
     * Dữ liệu chuỗi thời gian doanh thu hàng tháng cho biểu đồ (FR-31).
     */
    @GetMapping("/monthly-revenue")
    public ResponseEntity<List<MonthlyRevenueItemResponse>> getMonthlyRevenueChart(
            @RequestParam(name = "months", defaultValue = "6") int months
    ) {
        List<MonthlyRevenueItemResponse> items = reportService.getMonthlyRevenueChart(months);
        return ResponseEntity.ok(items);
    }

    /**
     * Tra cứu chi tiết chứng từ theo từng KPI (KPI Drill-down) (FR-31).
     */
    @GetMapping("/drilldown")
    public ResponseEntity<DrilldownResponse> getReportDrilldown(
            @RequestParam(name = "key") String key,
            @RequestParam(name = "query", required = false) String query
    ) {
        DrilldownResponse response = reportService.getReportDrilldown(key, query);
        return ResponseEntity.ok(response);
    }

    /**
     * Xuất báo cáo tài chính kiểm toán ra file CSV (FR-31).
     */
    @GetMapping("/export")
    public ResponseEntity<String> exportReportCSV(
            @RequestParam(name = "period", defaultValue = "THIS_QUARTER") String period
    ) {
        String csvContent = reportService.exportReportCSV(period);
        String filename = "StorageHub_Financial_Audit_" + period.replaceAll("[^a-zA-Z0-9_]", "_") + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvContent);
    }
}
