package com.storagehub.repository;

import com.storagehub.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Long>, JpaSpecificationExecutor<Unit> {

    /**
     * Lấy danh sách các kích thước m² khác nhau đang có trong hệ thống (loại trừ RETIRED).
     */
    @Query("SELECT DISTINCT u.sizeM2 FROM Unit u WHERE u.status <> com.storagehub.entity.Unit.Status.RETIRED ORDER BY u.sizeM2 ASC")
    List<BigDecimal> findDistinctSizesM2();

    /**
     * Lấy các kho ứng viên (loại trừ RENTED, MAINTENANCE, RETIRED).
     */
    @Query("SELECT u FROM Unit u " +
            "JOIN FETCH u.type t " +
            "JOIN FETCH u.zone z " +
            "JOIN FETCH z.facility f " +
            "WHERE u.status IN :candidateStatuses")
    List<Unit> findCandidateUnits(@Param("candidateStatuses") Collection<Unit.Status> candidateStatuses);

    /**
     * Lấy chi tiết unit kèm type, zone, facility.
     */
    @Query("SELECT u FROM Unit u " +
            "JOIN FETCH u.type t " +
            "JOIN FETCH u.zone z " +
            "JOIN FETCH z.facility f " +
            "WHERE u.unitId = :unitId")
    Optional<Unit> findWithDetailsById(@Param("unitId") Long unitId);
}
