package com.storagehub.dto.unit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.storagehub.dto.facility.FacilitySummaryResponse;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UnitFilterOptionsResponse {
    private List<UnitTypeOptionDto> types;
    private List<BigDecimal> sizesM2;
    private List<FacilitySummaryResponse> facilities;

    public UnitFilterOptionsResponse(List<UnitTypeOptionDto> types, List<BigDecimal> sizesM2) {
        this(types, sizesM2, List.of());
    }
}
