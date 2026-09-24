package com.storagehub.entity;

import jakarta.persistence.Column;
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
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Hợp đồng snapshot giá tại lúc draft (policy_id + content TEXT) — giá không đổi khi
 * policy mới có hiệu lực (FR-29/30). Bản in lại tạo dòng mới trỏ supersedes_contract_id;
 * is_latest + latest_key (generated column) đánh dấu bản hiện hành.
 * Ghi qua ContractService duy nhất (AD-6).
 */
@Getter
@Setter
@Entity
@Table(name = "contracts")
public class Contract {

    public enum Status {
        DRAFT,
        PRINTED,
        SIGNED,
        ACTIVE,
        CLOSED,
        SUPERSEDED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long contractId;

    /** Mã hiển thị CT-... — duy nhất. */
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    /** Snapshot policy đang hiệu lực lúc draft (AD-11). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "policy_id")
    private RentalPolicy policy;

    /** Nội dung hợp đồng sinh từ template — TEXT. */
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    private String contentSnapshot;

    /** Ảnh chữ ký — đường dẫn tương đối do FileStorage trả về (AD-10). */
    private String signedPhotoUrl;

    @Enumerated(EnumType.STRING)
    private Status status;

    /** Bản in lại thay thế hợp đồng nào (nullable, self-FK). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supersedes_contract_id")
    private Contract supersedes;

    /** Bản hiện hành của reservation (chỉ 1 dòng true). */
    private Boolean isLatest;

    /** Generated column (MySQL sinh từ reservation_id) — read-only, cấm insert/update. */
    @Column(name = "latest_key", insertable = false, updatable = false)
    private Long latestKey;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
