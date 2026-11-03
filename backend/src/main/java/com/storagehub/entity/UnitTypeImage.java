package com.storagehub.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Ảnh minh họa dùng chung cho một loại kho (cấp đông/lạnh/hút ẩm/tiệt trùng). */
@Getter
@Setter
@Entity
@Table(name = "unit_type_images")
public class UnitTypeImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "type_id")
    private UnitType type;

    private String url;

    private Integer sortOrder;

    private String caption;
}
