package com.storagehub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storagehub.dto.checkout.CancelCheckoutResponse;
import com.storagehub.dto.checkout.CheckoutRequestResponse;
import com.storagehub.dto.checkout.CreateCheckoutRequest;
import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.CheckoutService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CheckoutController.class)
@AutoConfigureMockMvc(addFilters = false)
class CheckoutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private CheckoutService checkoutService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @DisplayName("POST /api/v1/reservations/{reservationId}/checkout-request thành công trả về 200 OK")
    void testCreateCheckoutRequest_Success() throws Exception {
        CreateCheckoutRequest request = new CreateCheckoutRequest(
                LocalDate.of(2026, 10, 25),
                "MORNING",
                "EXPIRED_NEED"
        );

        NotificationEventResponse notif = new NotificationEventResponse(
                "CHECKOUT_REQUESTED",
                "Yêu cầu trả kho — BK-1042",
                "Đã gửi yêu cầu",
                "/rentals/10"
        );

        CheckoutRequestResponse response = new CheckoutRequestResponse(
                1L,
                10L,
                LocalDate.of(2026, 10, 25),
                "MORNING",
                "EXPIRED_NEED",
                "PENDING",
                LocalDateTime.now(),
                "CHECKOUT_REQUESTED",
                101L,
                notif
        );

        when(checkoutService.createCheckoutRequest(any(), eq(10L), any(CreateCheckoutRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/reservations/10/checkout-request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").value(1))
                .andExpect(jsonPath("$.reservationId").value(10))
                .andExpect(jsonPath("$.requestedDate").value("2026-10-25"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.reservationStatus").value("CHECKOUT_REQUESTED"))
                .andExpect(jsonPath("$.notification.type").value("CHECKOUT_REQUESTED"));
    }

    @Test
    @DisplayName("POST /api/v1/reservations/{reservationId}/checkout-request thiếu requestedDate trả về 400 Bad Request")
    void testCreateCheckoutRequest_MissingDate_BadRequest() throws Exception {
        String invalidJson = """
                {
                    "timeSlot": "MORNING",
                    "reason": "EXPIRED_NEED"
                }
                """;

        mockMvc.perform(post("/api/v1/reservations/10/checkout-request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/v1/reservations/{reservationId}/checkout-request thành công trả về 200 OK")
    void testCancelCheckoutRequest_Success() throws Exception {
        NotificationEventResponse notif = new NotificationEventResponse(
                "CHECKOUT_REQUEST_CANCELLED",
                "Hủy yêu cầu trả kho — BK-1042",
                "Đã hủy yêu cầu",
                "/rentals/10"
        );

        CancelCheckoutResponse response = new CancelCheckoutResponse(
                10L,
                "CHECKED_IN",
                notif
        );

        when(checkoutService.cancelCheckoutRequest(any(), eq(10L))).thenReturn(response);

        mockMvc.perform(delete("/api/v1/reservations/10/checkout-request"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").value(10))
                .andExpect(jsonPath("$.reservationStatus").value("CHECKED_IN"))
                .andExpect(jsonPath("$.notification.type").value("CHECKOUT_REQUEST_CANCELLED"));
    }

    @Test
    @DisplayName("GET /api/v1/reservations/{reservationId}/checkout-request trả về 200 OK khi có request PENDING")
    void testGetLatestCheckoutRequest_Found() throws Exception {
        CheckoutRequestResponse response = new CheckoutRequestResponse(
                1L,
                10L,
                LocalDate.of(2026, 10, 25),
                null,
                null,
                "PENDING",
                LocalDateTime.now(),
                "CHECKOUT_REQUESTED",
                null,
                null
        );

        when(checkoutService.getLatestCheckoutRequest(any(), eq(10L))).thenReturn(response);

        mockMvc.perform(get("/api/v1/reservations/10/checkout-request"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").value(1))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /api/v1/reservations/{reservationId}/checkout-request trả về 204 No Content khi không có request PENDING")
    void testGetLatestCheckoutRequest_NotFound() throws Exception {
        when(checkoutService.getLatestCheckoutRequest(any(), eq(10L))).thenReturn(null);

        mockMvc.perform(get("/api/v1/reservations/10/checkout-request"))
                .andExpect(status().isNoContent());
    }
}
