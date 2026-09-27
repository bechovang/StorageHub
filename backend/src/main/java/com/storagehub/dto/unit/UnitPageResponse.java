package com.storagehub.dto.unit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UnitPageResponse {

    private List<UnitSummaryResponse> items;

    private Integer page;

    private Integer pageSize;

    private Long total;
}
