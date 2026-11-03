package com.storagehub.dto.facility;

import java.util.List;

/** Layout 2 tầng x 2 khu x 5x5 cho màn hình 3D. */
public record FacilityLayoutResponse(
        Integer facilityId,
        String facilityName,
        String address,
        List<Floor> floors
) {
    public record Floor(
            Integer floor,
            List<Zone> zones
    ) {
    }

    public record Zone(
            String code,
            String typeName,
            List<UnitCell> units
    ) {
    }

    public record UnitCell(
            Long id,
            String code,
            Integer row,
            Integer col,
            String status,
            String typeName,
            Integer sizeM2
    ) {
    }
}
