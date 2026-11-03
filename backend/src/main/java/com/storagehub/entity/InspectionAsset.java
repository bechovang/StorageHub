package com.storagehub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "inspection_assets")
public class InspectionAsset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inspectionAssetId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "settlement_id")
    private Settlement settlement;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_asset_id")
    private UnitAsset unitAsset;

    private String result;
    private String note;
}
