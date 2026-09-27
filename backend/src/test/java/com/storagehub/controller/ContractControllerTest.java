package com.storagehub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storagehub.dto.contract.ContractChainItemResponse;
import com.storagehub.dto.contract.ContractDetailResponse;
import com.storagehub.exception.ContractNotFoundException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.ContractService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ContractController.class)
@AutoConfigureMockMvc(addFilters = false)
class ContractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private ContractService contractService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final Authentication auth =
            new TestingAuthenticationToken("lan@demo.vn", null);

    @Test
    @DisplayName("GET /api/v1/reservations/{reservationId}/contracts trả về 200 OK và chuỗi hợp đồng")
    void testListContractsByReservation_Success() throws Exception {
        ContractChainItemResponse item1 = new ContractChainItemResponse(
                101L,
                "CT-2026-0001",
                "ORIGINAL",
                "SUPERSEDED",
                false,
                null,
                null
        );
        ContractChainItemResponse item2 = new ContractChainItemResponse(
                102L,
                "CT-2026-0002",
                "ORIGINAL",
                "DRAFT",
                true,
                null,
                null
        );

        when(contractService.listContractsByReservation(eq("lan@demo.vn"), eq(1042L)))
                .thenReturn(List.of(item1, item2));

        mockMvc.perform(get("/api/v1/reservations/1042/contracts")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(101))
                .andExpect(jsonPath("$[0].code").value("CT-2026-0001"))
                .andExpect(jsonPath("$[0].kind").value("ORIGINAL"))
                .andExpect(jsonPath("$[0].status").value("SUPERSEDED"))
                .andExpect(jsonPath("$[0].isLatest").value(false))
                .andExpect(jsonPath("$[1].id").value(102))
                .andExpect(jsonPath("$[1].code").value("CT-2026-0002"))
                .andExpect(jsonPath("$[1].status").value("DRAFT"))
                .andExpect(jsonPath("$[1].isLatest").value(true));
    }

    @Test
    @DisplayName("GET /api/v1/reservations/{reservationId}/contracts trả về 404 khi không tìm thấy reservation")
    void testListContractsByReservation_NotFound() throws Exception {
        when(contractService.listContractsByReservation(eq("lan@demo.vn"), eq(9999L)))
                .thenThrow(new ReservationNotFoundException("Reservation not found."));

        mockMvc.perform(get("/api/v1/reservations/9999/contracts")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESERVATION_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /api/v1/contracts/{contractId} trả về 200 OK và chi tiết hợp đồng gồm contentSnapshot")
    void testGetContract_Success() throws Exception {
        ContractDetailResponse detail = new ContractDetailResponse(
                101L,
                "CT-2026-0001",
                "ORIGINAL",
                "DRAFT",
                true,
                null,
                null,
                1042L,
                "v3",
                "NỘI DUNG HỢP ĐỒNG STORAGEHUB...",
                LocalDateTime.of(2026, 9, 27, 10, 0, 0)
        );

        when(contractService.getContract(eq("lan@demo.vn"), eq(101L)))
                .thenReturn(detail);

        mockMvc.perform(get("/api/v1/contracts/101")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.code").value("CT-2026-0001"))
                .andExpect(jsonPath("$.kind").value("ORIGINAL"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.isLatest").value(true))
                .andExpect(jsonPath("$.reservationId").value(1042))
                .andExpect(jsonPath("$.policyVersion").value("v3"))
                .andExpect(jsonPath("$.contentSnapshot").value("NỘI DUNG HỢP ĐỒNG STORAGEHUB..."));
    }

    @Test
    @DisplayName("GET /api/v1/contracts/{contractId} trả về 404 CONTRACT_NOT_FOUND khi không tìm thấy")
    void testGetContract_NotFound() throws Exception {
        when(contractService.getContract(eq("lan@demo.vn"), eq(999L)))
                .thenThrow(new ContractNotFoundException("Không tìm thấy hợp đồng này."));

        mockMvc.perform(get("/api/v1/contracts/999")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CONTRACT_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Không tìm thấy hợp đồng này."));
    }
}
