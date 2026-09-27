package com.storagehub.controller;

import com.storagehub.dto.unit.UnitAvailabilityResponse;
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
}
