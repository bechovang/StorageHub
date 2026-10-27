package com.storagehub.controller;

import com.storagehub.dto.facility.FacilityDrilldownItem;
import com.storagehub.dto.facility.FacilityDrilldownResponse;
import com.storagehub.dto.facility.FacilityOverviewResponse;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.FacilityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FacilityController.class)
@AutoConfigureMockMvc(addFilters = false)
class FacilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FacilityService facilityService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final Authentication facilityManagerAuth =
            new TestingAuthenticationToken("manager@storagehub.vn", null, "ROLE_FACILITY_MANAGER");

    @Test
    @DisplayName("GET /api/v1/facility/overview: 200 OK trả về đầy đủ 4 KPI, 2 biểu đồ và 1 bảng hàng chờ")
    void testGetFacilityOverview_Success() throws Exception {
        FacilityOverviewResponse.OccupancyKpi occupancy = new FacilityOverviewResponse.OccupancyKpi(
                new BigDecimal("88.1"), 37, 42, "+2.4% so với tuần trước"
        );
        FacilityOverviewResponse.UnitsInServiceKpi unitsInService = new FacilityOverviewResponse.UnitsInServiceKpi(
                38, 42, new BigDecimal("90.5"), 2
        );
        FacilityOverviewResponse.TasksTodayKpi tasksToday = new FacilityOverviewResponse.TasksTodayKpi(
                12, 7, 3, 2
        );
        FacilityOverviewResponse.EscalationsKpi escalations = new FacilityOverviewResponse.EscalationsKpi(
                1, 1, "SR-0032 · Kho S-4 (LOST_ACCESS)"
        );
        List<FacilityOverviewResponse.StatusDistributionItem> statusDistribution = List.of(
                new FacilityOverviewResponse.StatusDistributionItem("RENTED", 37, new BigDecimal("88.1")),
                new FacilityOverviewResponse.StatusDistributionItem("AVAILABLE", 3, new BigDecimal("7.1")),
                new FacilityOverviewResponse.StatusDistributionItem("MAINTENANCE", 2, new BigDecimal("4.8"))
        );
        List<FacilityOverviewResponse.RevenueMixItem> revenueMix = List.of(
                new FacilityOverviewResponse.RevenueMixItem("Small", 15, new BigDecimal("5175000"), new BigDecimal("35.5")),
                new FacilityOverviewResponse.RevenueMixItem("Medium", 12, new BigDecimal("6000000"), new BigDecimal("41.2"))
        );
        List<FacilityOverviewResponse.TurnoverQueueItem> turnoverQueue = List.of(
                new FacilityOverviewResponse.TurnoverQueueItem(
                        101L, "S-1", "Small", "Zone A", "CLEANING", "IN_PROGRESS", "Trần Văn Bình", LocalDate.now()
                )
        );

        FacilityOverviewResponse overviewResponse = new FacilityOverviewResponse(
                occupancy,
                unitsInService,
                tasksToday,
                escalations,
                statusDistribution,
                revenueMix,
                turnoverQueue
        );

        when(facilityService.getFacilityOverview()).thenReturn(overviewResponse);

        mockMvc.perform(get("/api/v1/facility/overview")
                        .principal(facilityManagerAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.occupancy.rentedUnits").value(37))
                .andExpect(jsonPath("$.occupancy.rate").value(88.1))
                .andExpect(jsonPath("$.unitsInService.operationalUnits").value(38))
                .andExpect(jsonPath("$.tasksToday.totalTasks").value(12))
                .andExpect(jsonPath("$.escalations.openCount").value(1))
                .andExpect(jsonPath("$.statusDistribution[0].status").value("RENTED"))
                .andExpect(jsonPath("$.revenueMix[0].category").value("Small"))
                .andExpect(jsonPath("$.turnoverQueue[0].unitCode").value("S-1"));
    }

    @Test
    @DisplayName("GET /api/v1/facility/drilldown: 200 OK trả về danh sách kho chi tiết theo bộ lọc")
    void testGetFacilityDrilldown_Success() throws Exception {
        FacilityDrilldownItem item = new FacilityDrilldownItem(
                1L, "S-3", "Small", new BigDecimal("5.0"), "Zone A", 1, "RENTED",
                new BigDecimal("345000"), "Nguyễn Thị Lan", "BK-1042"
        );
        FacilityDrilldownResponse drilldownResponse = new FacilityDrilldownResponse(
                List.of(item), 1, 25, 1L, 1, "RENTED"
        );

        when(facilityService.getFacilityDrilldown(eq("RENTED"), any(), eq(1), eq(25)))
                .thenReturn(drilldownResponse);

        mockMvc.perform(get("/api/v1/facility/drilldown")
                        .principal(facilityManagerAuth)
                        .param("status", "RENTED")
                        .param("page", "1")
                        .param("pageSize", "25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.statusFilter").value("RENTED"))
                .andExpect(jsonPath("$.items[0].code").value("S-3"))
                .andExpect(jsonPath("$.items[0].tenantName").value("Nguyễn Thị Lan"))
                .andExpect(jsonPath("$.items[0].rentalCode").value("BK-1042"));
    }

    @Test
    @DisplayName("GET /api/v1/facility/drilldown: 400 Bad Request khi truyền status không hợp lệ")
    void testGetFacilityDrilldown_InvalidStatus_Returns400() throws Exception {
        when(facilityService.getFacilityDrilldown(eq("INVALID"), any(), anyInt(), anyInt()))
                .thenThrow(new IllegalArgumentException("Trạng thái phòng không hợp lệ: INVALID"));

        mockMvc.perform(get("/api/v1/facility/drilldown")
                        .principal(facilityManagerAuth)
                        .param("status", "INVALID"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("Trạng thái phòng không hợp lệ: INVALID"));
    }
}
