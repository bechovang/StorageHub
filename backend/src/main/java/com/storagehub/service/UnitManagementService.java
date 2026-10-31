package com.storagehub.service;

import com.storagehub.dto.unit.UnitAdminRequest;
import com.storagehub.dto.unit.UnitAdminResponse;
import com.storagehub.dto.unit.UnitStatusRequest;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.exception.BusinessRuleException;
import com.storagehub.exception.UnitNotFoundException;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.repository.UnitTypeRepository;
import com.storagehub.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Unit management API (US quản trị kho): tạo kho, đổi trạng thái
 * (retire/maintenance/available), sửa thông số (KHÔNG có giá — giá thuộc
 * Policy AD-11), soft-delete = RETIRED. Guard: không đụng kho đang RENTED
 * hoặc có reservation active (RESERVED/CHECKED_IN/CHECKOUT_REQUESTED).
 */
@Service
@RequiredArgsConstructor
public class UnitManagementService {

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UnitRepository unitRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final ZoneRepository zoneRepository;
    private final ReservationRepository reservationRepository;
    private final LogService logService;

    @Transactional(readOnly = true)
    public List<UnitAdminResponse> listUnits() {
        return unitRepository.findAllWithDetails().stream()
                .map(UnitAdminResponse::from)
                .toList();
    }

    @Transactional
    public UnitAdminResponse createUnit(User actor, UnitAdminRequest request) {
        String code = request.code() != null
                ? request.code().trim().toUpperCase(Locale.ROOT)
                : generateCode();
        if (unitRepository.findByCode(code).isPresent()) {
            throw new BusinessRuleException("Mã kho " + code + " đã tồn tại.");
        }
        if (request.typeId() == null) {
            throw new BusinessRuleException("typeId là bắt buộc.");
        }
        if (request.zoneId() == null) {
            throw new BusinessRuleException("zoneId là bắt buộc.");
        }
        var type = unitTypeRepository.findById(request.typeId().intValue())
                .orElseThrow(() -> new BusinessRuleException("Loại kho không tồn tại."));
        var zone = zoneRepository.findById(request.zoneId().intValue())
                .orElseThrow(() -> new BusinessRuleException("Phân khu không tồn tại."));

        Unit unit = new Unit();
        unit.setCode(code);
        unit.setType(type);
        unit.setZone(zone);
        unit.setSizeM2(request.sizeM2() != null ? request.sizeM2() : BigDecimal.valueOf(5));
        unit.setFloor(request.floor() != null ? request.floor() : 1);
        unit.setAccessType(request.accessType() != null ? request.accessType() : "PIN");
        unit.setNotes(request.notes());
        unit.setStatus(Unit.Status.AVAILABLE);
        Unit saved = unitRepository.save(unit);

        logService.log(actor, "UNIT", saved.getUnitId(), "CREATED",
                null, "AVAILABLE", "Tạo kho " + saved.getCode());
        return UnitAdminResponse.from(saved);
    }

    @Transactional
    public UnitAdminResponse changeStatus(User actor, Long unitId, UnitStatusRequest request) {
        Unit unit = unitRepository.findWithDetailsById(unitId)
                .orElseThrow(() -> new UnitNotFoundException("Unit này không tồn tại."));

        Unit.Status newStatus;
        try {
            newStatus = Unit.Status.valueOf(request.status().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Trạng thái kho không hợp lệ: " + request.status());
        }

        String from = unit.getStatus().name();
        boolean occupied = isOccupied(unit);

        // Guard: RETIRED / MAINTENANCE không cho áp lên kho đang có người / lịch giữ
        if ((newStatus == Unit.Status.RETIRED || newStatus == Unit.Status.MAINTENANCE) && occupied) {
            throw new BusinessRuleException(
                    "Kho " + unit.getCode() + " đang RENTED hoặc có đặt chỗ hiệu lực — "
                            + "phải forced checkout trước khi " + newStatus + ".");
        }
        if (newStatus == Unit.Status.RETIRED && from.equals(Unit.Status.MAINTENANCE.name())) {
            // cho phép retire từ maintenance
        } else if (newStatus == Unit.Status.RETIRED
                && (from.equals(Unit.Status.RENTED.name()) || from.equals(Unit.Status.RESERVED.name()))) {
            throw new BusinessRuleException("Kho đang " + from + " — không thể RETIRED.");
        }

        unit.setStatus(newStatus);
        if (request.notes() != null) {
            unit.setNotes(request.notes());
        }
        Unit saved = unitRepository.save(unit);

        logService.log(actor, "UNIT", saved.getUnitId(), "STATUS_CHANGED",
                from, newStatus.name(),
                request.reason() != null && !request.reason().isBlank()
                        ? request.reason() : "Đổi trạng thái kho " + saved.getCode());
        return UnitAdminResponse.from(saved);
    }

    @Transactional
    public UnitAdminResponse updateSpecs(User actor, Long unitId, UnitAdminRequest request) {
        Unit unit = unitRepository.findWithDetailsById(unitId)
                .orElseThrow(() -> new UnitNotFoundException("Unit này không tồn tại."));

        if (request.sizeM2() != null) {
            unit.setSizeM2(request.sizeM2());
        }
        if (request.floor() != null) {
            unit.setFloor(request.floor());
        }
        if (request.notes() != null) {
            unit.setNotes(request.notes());
        }
        Unit saved = unitRepository.save(unit);

        logService.log(actor, "UNIT", saved.getUnitId(), "UPDATE_SPECS",
                null, saved.getStatus().name(),
                "Cập nhật thông số kho " + saved.getCode()
                        + " (" + saved.getSizeM2() + " m², tầng " + saved.getFloor() + ")");
        return UnitAdminResponse.from(saved);
    }

    /** Soft-delete: flip RETIRED — không xóa row (contract/payment tham chiếu). */
    @Transactional
    public UnitAdminResponse retireUnit(User actor, Long unitId, String reason) {
        return changeStatus(actor, unitId,
                new UnitStatusRequest("RETIRED", reason, null));
    }

    private boolean isOccupied(Unit unit) {
        if (unit.getStatus() == Unit.Status.RENTED) {
            return true;
        }
        return !reservationRepository.findActiveReservationsForUnit(
                unit.getUnitId(),
                List.of(Reservation.Status.RESERVED, Reservation.Status.CHECKED_IN,
                        Reservation.Status.CHECKOUT_REQUESTED)).isEmpty();
    }

    private String generateCode() {
        String code;
        do {
            code = String.format("U-%04d", ThreadLocalRandom.current().nextInt(10_000));
        } while (unitRepository.findByCode(code).isPresent());
        return code;
    }
}
