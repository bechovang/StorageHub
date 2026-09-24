package com.storagehub.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Thực thể nghiệp vụ trung tâm (kho lưu trữ). Trạng thái "available soon" (turnover buffer)
 * là trạng thái suy diễn on-read (AD-4) — không có cột riêng.
 * Ghi qua UnitService duy nhất (AD-6). lockVersion chống double-booking FR-5.
 */
@Getter
@Setter
@Entity
@Table(name = "units")
public class Unit {

    public enum Status {
        AVAILABLE,
        RESERVED,
        RENTED,
        PREPARING,
        MAINTENANCE,
        RETIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long unitId;

    /** Mã unit: S-1, M-2, LOCK-4... — duy nhất. */
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "type_id")
    private UnitType type;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "zone_id")
    private Zone zone;

    private BigDecimal sizeM2;

    private Integer floor;

    /**
     * Kiểu mở cửa: PIN / QR / smart lock.
     * Map String (không enum) vì dữ liệu seed dùng 'smart lock' thường, có dấu cách —
     * không phải tên hằng Java hợp lệ; service validate giá trị.
     */
    private String accessType;

    @Enumerated(EnumType.STRING)
    private Status status;

    /** Merge 2 unit liền kề: unit cũ RETIRED trỏ sang unit mới (nullable). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merged_into_id")
    private Unit mergedInto;

    /** Optimistic lock — guard double-booking FR-5 (overlap range không unique được trên MySQL). */
    @Version
    private Integer lockVersion;
}
