package com.storagehub.repository;

import com.storagehub.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, Integer> {

    List<Zone> findByFacility_FacilityId(Integer facilityId);

    Optional<Zone> findByFacility_FacilityIdAndCode(Integer facilityId, String code);
}
