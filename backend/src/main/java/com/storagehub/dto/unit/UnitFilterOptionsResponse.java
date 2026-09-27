package com.storagehub.dto.unit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UnitFilterOptionsResponse {
    private List<UnitTypeOptionDto> types;
    private List<BigDecimal> sizesM2;
}
