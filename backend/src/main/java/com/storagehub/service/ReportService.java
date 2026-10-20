package com.storagehub.service;

import com.storagehub.dto.report.DrilldownResponse;
import com.storagehub.dto.report.FinancialSummaryResponse;
import com.storagehub.dto.report.MonthlyRevenueItemResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * Service báo cáo tài chính và tổng quan kinh doanh — US-31 (FR-31).
 * Tiêu chuẩn kỹ thuật:
 * 1. Tiền cọc (DEPOSIT) được quản lý riêng trong Escrow, TUYỆT ĐỐI KHÔNG tính vào Gross Revenue.
 * 2. Cung cấp 4 chỉ số cốt lõi và drill-down dữ liệu chi tiết.
 * 3. Hỗ trợ trích xuất báo cáo tài chính định dạng CSV chuẩn kiểm toán.
 */
public interface ReportService {

    FinancialSummaryResponse getFinancialSummary(String period, LocalDate startDate, LocalDate endDate);

    List<MonthlyRevenueItemResponse> getMonthlyRevenueChart(int months);

    DrilldownResponse getReportDrilldown(String key, String query);

    String exportReportCSV(String period);
}
