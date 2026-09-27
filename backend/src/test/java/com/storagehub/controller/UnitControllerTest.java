package com.storagehub.controller;

import com.storagehub.dto.unit.UnitAvailabilityResponse;
import com.storagehub.dto.unit.UnitDetailResponse;
import com.storagehub.dto.unit.UnitFilterOptionsResponse;
import com.storagehub.dto.unit.UnitPageResponse;
import com.storagehub.dto.unit.UnitSummaryResponse;
import com.storagehub.dto.unit.UnitTypeOptionDto;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.UnitService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UnitController.class)
@AutoConfigureMockMvc(addFilters = false) // Bỏ qua security filter trong web slice test
class UnitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UnitService unitService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @DisplayName("GET /api/v1/units/filter-options trả về 200 OK với danh mục filter")
    void testGetFilterOptions() throws Exception {
        UnitFilterOptionsResponse response = new UnitFilterOptionsResponse(
                List.of(new UnitTypeOptionDto(2L, "S")),
                List.of(new BigDecimal("5.00"))
        );

        when(unitService.getFilterOptions()).thenReturn(response);

        mockMvc.perform(get("/api/v1/units/filter-options")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.types[0].id").value(2))
                .andExpect(jsonPath("$.types[0].name").value("S"))
                .andExpect(jsonPath("$.sizesM2[0]").value(5.00));
    }

    @Test
    @DisplayName("GET /api/v1/units trả về 200 OK với danh sách units")
    void testSearchUnits() throws Exception {
        UnitSummaryResponse unitSummary = new UnitSummaryResponse(
                1L,
                "S-1",
                "S",
                new BigDecimal("5.00"),
                1,
                "A",
                "Tân Bình Depot",
                "PIN",
                345000L,
                new UnitAvailabilityResponse("AVAILABLE", null),
                "/units/S-1.jpg"
        );

        UnitPageResponse pageResponse = new UnitPageResponse(
                List.of(unitSummary),
                1,
                25,
                1L
        );

        when(unitService.searchUnits(any(), any(), any(), any(), any(), eq(1), eq(25)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/units")
                        .param("type-id", "2")
                        .param("size-m2", "5.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(25))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].code").value("S-1"))
                .andExpect(jsonPath("$.items[0].baseMonthlyRent").value(345000))
                .andExpect(jsonPath("$.items[0].availability.status").value("AVAILABLE"));
    }

    @Test
    @DisplayName("GET /api/v1/units/{unitId} trả về 200 OK với spec chi tiết của unit")
    void testGetUnitDetail_Success() throws Exception {
        UnitDetailResponse detail = new UnitDetailResponse(
                1L,
                "S-1",
                "S",
                new BigDecimal("5.00"),
                1,
                "A",
                "Tân Bình Depot",
                "PIN",
                345000L,
                new UnitAvailabilityResponse("AVAILABLE", null),
                "/units/S-1.jpg",
                "2.0 × 2.5 × 2.2 m",
                "24/7 PIN + CCTV + Motion sensors",
                List.of("/units/S-1.jpg", "/units/S-1-interior.jpg")
        );

        when(unitService.getUnitDetail(1L)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/units/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.code").value("S-1"))
                .andExpect(jsonPath("$.dimensions").value("2.0 × 2.5 × 2.2 m"))
                .andExpect(jsonPath("$.security").value("24/7 PIN + CCTV + Motion sensors"))
                .andExpect(jsonPath("$.photoUrls").isArray())
                .andExpect(jsonPath("$.baseMonthlyRent").value(345000));
    }

    @Test
    @DisplayName("GET /api/v1/units/{unitId} trả về 404 khi không tìm thấy unit")
    void testGetUnitDetail_NotFound() throws Exception {
        when(unitService.getUnitDetail(999L)).thenThrow(new com.storagehub.exception.UnitNotFoundException("Unit này không tồn tại."));

        mockMvc.perform(get("/api/v1/units/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("UNIT_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Unit này không tồn tại."));
    }

    @Test
    @DisplayName("GET /api/v1/units/{unitId}/quote trả về 200 OK với bảng giá minh bạch")
    void testGetUnitQuote_Success() throws Exception {
        com.storagehub.dto.quote.QuoteResponse quote = new com.storagehub.dto.quote.QuoteResponse(
                3L,
                java.time.LocalDate.of(2026, 10, 3),
                java.time.LocalDate.of(2027, 1, 2),
                3,
                List.of(
                        new com.storagehub.dto.quote.QuoteLineResponse("RENT", "RENT_RATE", "Rent 345.000 ₫ × 3 months", 1035000L, false),
                        new com.storagehub.dto.quote.QuoteLineResponse("DEPOSIT", "DEPOSIT_RATE", "Deposit (10%, refundable)", 103500L, true)
                ),
                1035000L,
                103500L,
                103500L,
                "v3"
        );

        when(unitService.getUnitQuote(eq(3L), any(), eq(3))).thenReturn(quote);

        mockMvc.perform(get("/api/v1/units/3/quote")
                        .param("start-date", "2026-10-03")
                        .param("duration-months", "3")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unitId").value(3))
                .andExpect(jsonPath("$.startDate").value("2026-10-03"))
                .andExpect(jsonPath("$.endDate").value("2027-01-02"))
                .andExpect(jsonPath("$.durationMonths").value(3))
                .andExpect(jsonPath("$.totalRent").value(1035000))
                .andExpect(jsonPath("$.depositAmount").value(103500))
                .andExpect(jsonPath("$.dueNow").value(103500))
                .andExpect(jsonPath("$.policyVersion").value("v3"))
                .andExpect(jsonPath("$.lines[0].kind").value("RENT"))
                .andExpect(jsonPath("$.lines[1].kind").value("DEPOSIT"));
    }

    @Test
    @DisplayName("GET /api/v1/units/{unitId}/quote trả về 400 khi duration-months không hợp lệ")
    void testGetUnitQuote_ValidationFailed() throws Exception {
        mockMvc.perform(get("/api/v1/units/3/quote")
                        .param("start-date", "2026-10-03")
                        .param("duration-months", "0")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
}
