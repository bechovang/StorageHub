package com.storagehub.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Loại đơn vị kho (Locker, S, M, L...) — bảng tham chiếu, unique theo name. */
@Getter
@Setter
@Entity
@Table(name = "unit_types")
public class UnitType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer typeId;

    /** Tên loại: Locker, S, M, L... */
    private String name;

    private String description;
}
