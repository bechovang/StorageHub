package com.storagehub.controller;

import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.dto.unit.UnitDetailResponse;
import com.storagehub.dto.unit.UnitFilterOptionsResponse;
import com.storagehub.dto.unit.UnitPageResponse;
import com.storagehub.service.UnitService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/units")
@Validated
public class UnitController {

    private final UnitService unitService;

    public UnitController(UnitService unitService) {
        this.unitService = unitService;
    }

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
            @RequestParam(name = "duration-days", required = false)
            @Min(value = 1, message = "Thời hạn thuê tối thiểu 1 ngày")
            @Max(value = 1095, message = "Thời hạn thuê tối đa 1095 ngày") Integer durationDays,
            @RequestParam(name = "duration-months", required = false)
            @Min(value = 1, message = "Thời hạn thuê tối thiểu 1 tháng")
            @Max(value = 36, message = "Thời hạn thuê tối đa 36 tháng") Integer durationMonths,
            @RequestParam(name = "sort", defaultValue = "price-asc") String sort,
            @RequestParam(name = "page", defaultValue = "1") Integer page,
            @RequestParam(name = "page-size", defaultValue = "25") Integer pageSize
    ) {
        return ResponseEntity.ok(unitService.searchUnits(
                typeId,
                sizeM2,
                startDate,
                durationMonths,
                sort,
                page,
                pageSize
        ));
    }

    @GetMapping("/{unitId}")
    public ResponseEntity<UnitDetailResponse> getUnitDetail(
            @PathVariable("unitId") Long unitId
    ) {
        return ResponseEntity.ok(unitService.getUnitDetail(unitId));
    }

    @GetMapping("/{unitId}/quote")
    public ResponseEntity<QuoteResponse> getUnitQuote(
            @PathVariable("unitId") Long unitId,
            @RequestParam("start-date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "duration-days", required = false)
            @Min(value = 1, message = "Thời hạn thuê tối thiểu 1 ngày")
            @Max(value = 1095, message = "Thời hạn thuê tối đa 1095 ngày") Integer durationDays,
            @RequestParam(name = "duration-months", required = false)
            @Min(value = 1, message = "Thời hạn thuê tối thiểu 1 tháng")
            @Max(value = 36, message = "Thời hạn thuê tối đa 36 tháng") Integer durationMonths
    ) {
        return ResponseEntity.ok(unitService.getUnitQuote(unitId, startDate, durationDays, durationMonths));
    }
}
