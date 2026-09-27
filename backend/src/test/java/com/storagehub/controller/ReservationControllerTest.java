package com.storagehub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.dto.reservation.CreateReservationRequest;
import com.storagehub.dto.reservation.ReservationDetailResponse;
import com.storagehub.dto.reservation.ReservationUnitSummaryResponse;
import com.storagehub.entity.Reservation;
import com.storagehub.exception.BookingUnitTakenException;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                    "lan@demo.vn", "secret", java.util.List.of()
            );

    @Test
    @DisplayName("POST /api/v1/reservations trả về 201 Created khi tạo đặt chỗ thành công")
    void testCreateReservation_Success() throws Exception {
        CreateReservationRequest request = new CreateReservationRequest(
                3L,
                LocalDate.of(2026, 10, 3),
                3
        );

        QuoteResponse quote = new QuoteResponse(
                3L,
                LocalDate.of(2026, 10, 3),
                LocalDate.of(2027, 1, 2),
                3,
                List.of(),
                1035000L,
                103500L,
                103500L,
                "v3"
        );

        ReservationDetailResponse response = new ReservationDetailResponse(
                1042L,
                "BK-1042",
                Reservation.Status.PENDING_PAYMENT,
                new ReservationUnitSummaryResponse("S-3", new BigDecimal("5.00"), "S"),
                LocalDate.of(2026, 10, 3),
                LocalDate.of(2027, 1, 2),
                103500L,
                null,
                3,
                quote,
                LocalDate.of(2026, 10, 3),
                null,
                null,
                List.of(),
                List.of()
        );

        when(reservationService.createReservation(eq("lan@demo.vn"), any(CreateReservationRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/reservations")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1042))
                .andExpect(jsonPath("$.code").value("BK-1042"))
                .andExpect(jsonPath("$.status").value("PENDING_PAYMENT"))
                .andExpect(jsonPath("$.depositAmount").value(103500))
                .andExpect(jsonPath("$.quote.totalRent").value(1035000))
                .andExpect(jsonPath("$.quote.dueNow").value(103500));
    }

    @Test
    @DisplayName("POST /api/v1/reservations trả về 409 Conflict khi unit bị chiếm giữa chừng")
    void testCreateReservation_Conflict_UnitTaken() throws Exception {
        CreateReservationRequest request = new CreateReservationRequest(
                3L,
                LocalDate.of(2026, 10, 3),
                3
        );

        when(reservationService.createReservation(eq("lan@demo.vn"), any(CreateReservationRequest.class)))
                .thenThrow(new BookingUnitTakenException("S-3 vừa được đặt. 5 unit tương tự còn trống."));

        mockMvc.perform(post("/api/v1/reservations")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BOOKING_UNIT_TAKEN"))
                .andExpect(jsonPath("$.message").value("S-3 vừa được đặt. 5 unit tương tự còn trống."));
    }

    @Test
    @DisplayName("POST /api/v1/reservations trả về 400 Bad Request khi duration-months không hợp lệ")
    void testCreateReservation_ValidationFailed() throws Exception {
        CreateReservationRequest request = new CreateReservationRequest(
                3L,
                LocalDate.of(2026, 10, 3),
                0 // Invalid duration
        );

        mockMvc.perform(post("/api/v1/reservations")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

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
                List.of()
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
