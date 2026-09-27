package com.storagehub.controller;

import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.dto.unit.UnitDetailResponse;
import com.storagehub.dto.unit.UnitFilterOptionsResponse;
import com.storagehub.dto.unit.UnitPageResponse;
import com.storagehub.service.UnitService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Controller phục vụ Browse Units (US-6, FR-4) và Unit Detail + Bảng giá (US-7, FR-6).
 * Enforce contract-first theo contracts/openapi.yaml.
 */
@Validated
@RestController
@RequestMapping("/api/v1/units")
@RequiredArgsConstructor
public class UnitController {

    private final UnitService unitService;

    @GetMapping("/filter-options")
    public ResponseEntity<UnitFilterOptionsResponse> getFilterOptions() {
        return ResponseEntity.ok(unitService.getFilterOptions());
    }

    @GetMapping
    public ResponseEntity<UnitPageResponse> searchUnits(
            @RequestParam(name = "type-id", required = false) Long typeId,
            @RequestParam(name = "size-m2", required = false) BigDecimal sizeM2,
            @RequestParam(name = "start-date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "duration-months", required = false)
            @Min(value = 1, message = "Thời hạn thuê tối thiểu 1 tháng")
            @Max(value = 36, message = "Thời hạn thuê tối đa 36 tháng") Integer durationMonths,
            @RequestParam(name = "sort", defaultValue = "price-asc") String sort,
            @RequestParam(name = "page", defaultValue = "1")
            @Min(value = 1, message = "Trang phải từ 1 trở lên") Integer page,
            @RequestParam(name = "page-size", defaultValue = "25")
            @Min(value = 1) @Max(value = 100) Integer pageSize
    ) {
        UnitPageResponse response = unitService.searchUnits(
                typeId,
                sizeM2,
                startDate,
                durationMonths,
                sort,
                page,
                pageSize
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{unitId}")
    public ResponseEntity<UnitDetailResponse> getUnit(@PathVariable("unitId") Long unitId) {
        return ResponseEntity.ok(unitService.getUnitDetail(unitId));
    }

    @GetMapping("/{unitId}/quote")
    public ResponseEntity<QuoteResponse> getUnitQuote(
            @PathVariable("unitId") Long unitId,
            @RequestParam("start-date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("duration-months")
            @Min(value = 1, message = "Thời hạn thuê tối thiểu 1 tháng")
            @Max(value = 36, message = "Thời hạn thuê tối đa 36 tháng") Integer durationMonths
    ) {
        return ResponseEntity.ok(unitService.getUnitQuote(unitId, startDate, durationMonths));
    }
}
