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

/**
 * Hạng mục kiểm tra khi trả kho (4 item cố định, trừ khi hạng mục hư hỏng — FR-19).
 * Ghi cùng settlement trong CheckoutService (AD-6). Không có createdAt.
 */
@Getter
@Setter
@Entity
@Table(name = "inspections")
public class Inspection {

    public enum Item {
        ACCESS_CARD,
        PADLOCK,
        CLEANLINESS,
        STRUCTURE
    }

    public enum Result {
        OK,
        MINOR,
        MAJOR
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inspectionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "settlement_id")
    private Settlement settlement;

    @Enumerated(EnumType.STRING)
    private Item item;

    @Enumerated(EnumType.STRING)
    private Result result;

    private String note;
}
