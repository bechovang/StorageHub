package com.storagehub.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Cơ sở kho (demo 1 facility; users.FacilityID nullable để mở scoping đa facility — AD-6 delta 4). */
@Getter
@Setter
@Entity
@Table(name = "facilities")
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer facilityId;

    private String name;

    private String address;

    private String phone;

    /** 0 = đóng cửa, 1 = hoạt động. */
    @JdbcTypeCode(SqlTypes.TINYINT)
    private Integer status;
}
