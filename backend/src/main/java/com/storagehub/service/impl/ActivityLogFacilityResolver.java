package com.storagehub.service.impl;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Suy ra cơ sở của đối tượng bị tác động để gán {@code activity_logs.facility_id}.
 *
 * <p>Một truy vấn nhẹ cho mỗi lần ghi audit (không phải hot path). Không suy
 * được (entity type lạ, bản ghi đã bị xoá) → NULL = sự kiện cấp hệ thống.
 */
@Component
public class ActivityLogFacilityResolver {

    private final JdbcTemplate jdbcTemplate;

    public ActivityLogFacilityResolver(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long resolve(String entityType, Long entityId) {
        if (entityType == null || entityId == null) {
            return null;
        }

        String sql = switch (entityType) {
            case "UNIT" -> """
                    SELECT z.facility_id
                    FROM units u
                    JOIN zones z ON z.zone_id = u.zone_id
                    WHERE u.unit_id = ?
                    """;
            case "RESERVATION" -> """
                    SELECT z.facility_id
                    FROM reservations r
                    JOIN units u ON u.unit_id = r.unit_id
                    JOIN zones z ON z.zone_id = u.zone_id
                    WHERE r.reservation_id = ?
                    """;
            case "CONTRACT" -> """
                    SELECT z.facility_id
                    FROM contracts c
                    JOIN reservations r ON r.reservation_id = c.reservation_id
                    JOIN units u ON u.unit_id = r.unit_id
                    JOIN zones z ON z.zone_id = u.zone_id
                    WHERE c.contract_id = ?
                    """;
            case "ADDENDUM", "CONTRACT_ADDENDUM" -> """
                    SELECT z.facility_id
                    FROM contract_addendums a
                    JOIN contracts c ON c.contract_id = a.contract_id
                    JOIN reservations r ON r.reservation_id = c.reservation_id
                    JOIN units u ON u.unit_id = r.unit_id
                    JOIN zones z ON z.zone_id = u.zone_id
                    WHERE a.addendum_id = ?
                    """;
            case "PAYMENT" -> """
                    SELECT COALESCE(zu.facility_id, zr.facility_id)
                    FROM payments p
                    LEFT JOIN units u1 ON u1.unit_id = p.unit_id
                    LEFT JOIN zones zu ON zu.zone_id = u1.zone_id
                    LEFT JOIN reservations r ON r.reservation_id = p.reservation_id
                    LEFT JOIN units u2 ON u2.unit_id = r.unit_id
                    LEFT JOIN zones zr ON zr.zone_id = u2.zone_id
                    WHERE p.payment_id = ?
                    """;
            case "EXTENSION" -> """
                    SELECT z.facility_id
                    FROM extensions e
                    JOIN reservations r ON r.reservation_id = e.reservation_id
                    JOIN units u ON u.unit_id = r.unit_id
                    JOIN zones z ON z.zone_id = u.zone_id
                    WHERE e.extension_id = ?
                    """;
            case "LATE_CHECKOUT_CASE" -> """
                    SELECT z.facility_id
                    FROM late_checkout_cases c
                    JOIN reservations r ON r.reservation_id = c.reservation_id
                    JOIN units u ON u.unit_id = r.unit_id
                    JOIN zones z ON z.zone_id = u.zone_id
                    WHERE c.case_id = ?
                    """;
            case "TICKET" -> """
                    SELECT z.facility_id
                    FROM support_tickets t
                    JOIN units u ON u.unit_id = t.unit_id
                    JOIN zones z ON z.zone_id = u.zone_id
                    WHERE t.ticket_id = ?
                    """;
            case "TASK" -> """
                    SELECT facility_id
                    FROM tasks
                    WHERE task_id = ?
                    """;
            case "STAFF_ASSIGNMENT" -> """
                    SELECT u.facility_id
                    FROM staff_assignments s
                    JOIN users u ON u.user_id = s.staff_id
                    WHERE s.assignment_id = ?
                    """;
            case "USER", "AUTH" -> """
                    SELECT facility_id
                    FROM users
                    WHERE user_id = ?
                    """;
            default -> null;
        };

        if (sql == null) {
            return null;
        }

        try {
            return jdbcTemplate.queryForObject(sql, Long.class, entityId);
        } catch (DataAccessException ex) {
            return null;
        }
    }
}
