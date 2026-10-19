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

import com.storagehub.dto.contract.ContractAddendumResponse;
import com.storagehub.dto.contract.ContractAddendumSignRequest;
import com.storagehub.dto.contract.ContractChainResponse;
import com.storagehub.exception.ContractAddendumInvalidStateException;
import com.storagehub.exception.ContractAddendumNotFoundException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    @Test
    @DisplayName("GET /api/v1/contracts/{contractId}/chain trả về 200 OK và chuỗi hợp đồng gốc + phụ lục (US-19)")
    void testGetContractChain_Success() throws Exception {
        ContractDetailResponse detail = new ContractDetailResponse(
                101L,
                "CT-1042",
                "ORIGINAL",
                "SIGNED",
                true,
                "https://storagehub.com/contract.jpg",
                null,
                1042L,
                "v3",
                "{}",
                LocalDateTime.of(2026, 10, 3, 10, 0, 0)
        );
        ContractAddendumResponse addendum = new ContractAddendumResponse(
                1L,
                101L,
                5L,
                "CT-1042-A1",
                "{}",
                "https://storagehub.com/addendum-signed.jpg",
                LocalDate.of(2026, 10, 26),
                "SIGNED",
                LocalDateTime.of(2026, 10, 19, 14, 0, 0)
        );

        when(contractService.getContractChain(eq("lan@demo.vn"), eq(101L)))
                .thenReturn(new ContractChainResponse(detail, List.of(addendum)));

        mockMvc.perform(get("/api/v1/contracts/101/chain")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contract.code").value("CT-1042"))
                .andExpect(jsonPath("$.contract.status").value("SIGNED"))
                .andExpect(jsonPath("$.addendums.length()").value(1))
                .andExpect(jsonPath("$.addendums[0].code").value("CT-1042-A1"))
                .andExpect(jsonPath("$.addendums[0].status").value("SIGNED"));
    }

    @Test
    @DisplayName("POST /api/v1/contract-addendums/{addendumId}/sign trả về 200 OK khi ký thành công tại quầy (US-19)")
    void testSignContractAddendum_Success() throws Exception {
        ContractAddendumSignRequest request = new ContractAddendumSignRequest(
                "https://storagehub.com/signed-addendum.jpg",
                "Khách Lan ký tại quầy"
        );
        ContractAddendumResponse response = new ContractAddendumResponse(
                1L,
                101L,
                5L,
                "CT-1042-A1",
                "{}",
                "https://storagehub.com/signed-addendum.jpg",
                LocalDate.of(2026, 10, 26),
                "SIGNED",
                LocalDateTime.of(2026, 10, 19, 14, 0, 0)
        );

        when(contractService.signAddendum(eq("lan@demo.vn"), eq(1L), any(ContractAddendumSignRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/contract-addendums/1/sign")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.addendumId").value(1))
                .andExpect(jsonPath("$.code").value("CT-1042-A1"))
                .andExpect(jsonPath("$.status").value("SIGNED"))
                .andExpect(jsonPath("$.signedPhotoUrl").value("https://storagehub.com/signed-addendum.jpg"));
    }

    @Test
    @DisplayName("POST /api/v1/contract-addendums/{addendumId}/sign trả về 400 Bad Request khi thiếu signedPhotoUrl (Snap-back rule)")
    void testSignContractAddendum_MissingPhoto_BadRequest() throws Exception {
        ContractAddendumSignRequest request = new ContractAddendumSignRequest(
                "", // Trống -> vi phạm @NotBlank
                "Ghi chú"
        );

        mockMvc.perform(post("/api/v1/contract-addendums/1/sign")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("POST /api/v1/contract-addendums/{addendumId}/sign trả về 409 Conflict khi phụ lục đã ký hoặc quá hạn 7 ngày")
    void testSignContractAddendum_InvalidState_Conflict() throws Exception {
        ContractAddendumSignRequest request = new ContractAddendumSignRequest(
                "https://storagehub.com/signed.jpg",
                null
        );

        when(contractService.signAddendum(eq("lan@demo.vn"), eq(1L), any(ContractAddendumSignRequest.class)))
                .thenThrow(new ContractAddendumInvalidStateException("Phụ lục CT-1042-A1 đã được ký trước đó."));

        mockMvc.perform(post("/api/v1/contract-addendums/1/sign")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONTRACT_ADDENDUM_INVALID_STATE"))
                .andExpect(jsonPath("$.message").value("Phụ lục CT-1042-A1 đã được ký trước đó."));
    }
}
