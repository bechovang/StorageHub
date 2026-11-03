package com.storagehub.repository;

import com.storagehub.entity.UnitAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UnitAssetRepository extends JpaRepository<UnitAsset, Long> {
    List<UnitAsset> findByUnit_UnitIdOrderByUnitAssetIdAsc(Long unitId);
}
