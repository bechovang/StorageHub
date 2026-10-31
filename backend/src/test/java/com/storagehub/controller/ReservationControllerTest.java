package com.storagehub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.dto.reservation.ReservationDetailResponse;
import com.storagehub.dto.reservation.ReservationUnitSummaryResponse;
import com.storagehub.entity.Reservation;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.ReservationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReservationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private ReservationService reservationService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final org.springframework.security.core.Authentication auth =
            new org.springframework.security.authentication.TestingAuthenticationToken("lan@demo.vn", null);

    @Test
    @DisplayName("GET /api/v1/reservations/{reservationId} trả về 200 OK với chi tiết reservation")
    void testGetReservationDetail_Success() throws Exception {
        ReservationDetailResponse response = new ReservationDetailResponse(
                1042L,
                "BK-1042",
                Reservation.Status.RESERVED,
                new ReservationUnitSummaryResponse("S-3", new BigDecimal("5.00"), "S"),
                LocalDate.of(2026, 10, 3),
                LocalDate.of(2027, 1, 2),
                103500L,
                "HELD",
                3,
                null,
                LocalDate.of(2026, 10, 3),
                null,
                null,
                List.of(),
                List.of(),
                null
        );

        when(reservationService.getReservationDetail("lan@demo.vn", 1042L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/reservations/1042")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1042))
                .andExpect(jsonPath("$.code").value("BK-1042"))
                .andExpect(jsonPath("$.status").value("RESERVED"))
                .andExpect(jsonPath("$.depositStatus").value("HELD"));
    }

    @Test
    @DisplayName("GET /api/v1/reservations/{reservationId} trả về 404 khi không tìm thấy đơn")
    void testGetReservationDetail_NotFound() throws Exception {
        when(reservationService.getReservationDetail("lan@demo.vn", 999L))
                .thenThrow(new ReservationNotFoundException("Reservation not found."));

        mockMvc.perform(get("/api/v1/reservations/999")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESERVATION_NOT_FOUND"));
    }
}
