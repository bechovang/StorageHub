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
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Phụ lục hợp đồng: bắt buộc khi settlement phát hiện damage (điều chỉnh trách nhiệm),
 * hoặc khi khách yêu cầu dịch endDate không qua extension. Ghi qua ContractService (AD-6).
 */
@Getter
@Setter
@Entity
@Table(name = "contract_addendums")
public class ContractAddendum {

    public enum Status {
        AWAITING_SIGNATURE,
        SIGNED,
        EXPIRED,
        VOIDED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long addendumId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    /** Nullable — chỉ set khi phụ lục đi kèm một extension cụ thể. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "extension_id")
    private Extension extension;

    /** Mã hiển thị CT-...-A1 — duy nhất. */
    private String code;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    private String contentSnapshot;

    private String signedPhotoUrl;

    /** Hạn ký; quá hạn → EXPIRED (suy diễn on-read theo AD-4). */
    private LocalDate signatureDueDate;

    @Enumerated(EnumType.STRING)
    private Status status;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
