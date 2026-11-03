package com.storagehub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "unit_assets")
public class UnitAsset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long unitAssetId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asset_type_id")
    private AssetType assetType;

    private String serialNo;
    private String status;
    private LocalDate installedAt;
    private LocalDate lastServiceAt;
    private String note;
}
