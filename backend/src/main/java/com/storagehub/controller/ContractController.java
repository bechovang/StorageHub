package com.storagehub.controller;

import com.storagehub.dto.contract.ContractAddendumResponse;
import com.storagehub.dto.contract.ContractAddendumSignRequest;
import com.storagehub.dto.contract.ContractChainItemResponse;
import com.storagehub.dto.contract.ContractChainResponse;
import com.storagehub.dto.contract.ContractDetailResponse;
import com.storagehub.service.ContractService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller phục vụ tra cứu hợp đồng theo contracts/openapi.yaml (FR-10, FR-11, FR-12, FR-13).
 * Toàn bộ hợp đồng là read-only; phụ lục có thủ tục ký tại quầy.
 */
@RestController
@RequestMapping("/api/v1")
public class ContractController {

    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    /**
     * Lấy chuỗi hợp đồng trên Rental Detail (FR-13) — gốc + phụ lục + bản superseded.
     */
    @GetMapping("/reservations/{reservationId}/contracts")
    public ResponseEntity<List<ContractChainItemResponse>> listContractsByReservation(
            @PathVariable("reservationId") Long reservationId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(contractService.listContractsByReservation(email, reservationId));
    }

    /**
     * Chi tiết 1 bản hợp đồng — contentSnapshot để FE render print view (FR-11).
     */
    @GetMapping("/contracts/{contractId}")
    public ResponseEntity<ContractDetailResponse> getContract(
            @PathVariable("contractId") Long contractId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(contractService.getContract(email, contractId));
    }

    /**
     * Lấy chuỗi hợp đồng gốc + toàn bộ phụ lục theo thứ tự thời gian (FR-13, US-19).
     */
    @GetMapping("/contracts/{contractId}/chain")
    public ResponseEntity<ContractChainResponse> getContractChain(
            @PathVariable("contractId") Long contractId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(contractService.getContractChain(email, contractId));
    }

    /**
     * Ký phụ lục hợp đồng tại quầy (Snap-back photo ritual, FR-12, US-19).
     */
    @PostMapping("/contract-addendums/{addendumId}/sign")
    public ResponseEntity<ContractAddendumResponse> signContractAddendum(
            @PathVariable("addendumId") Long addendumId,
            @Valid @RequestBody ContractAddendumSignRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(contractService.signAddendum(email, addendumId, request));
    }
}
