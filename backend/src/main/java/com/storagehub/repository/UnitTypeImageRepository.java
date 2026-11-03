package com.storagehub.repository;

import com.storagehub.entity.UnitTypeImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UnitTypeImageRepository extends JpaRepository<UnitTypeImage, Long> {
    List<UnitTypeImage> findByType_TypeIdOrderBySortOrderAsc(Integer typeId);
}
