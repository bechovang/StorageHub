package com.storagehub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * StorageHub — SWP391.
 *
 * <p>Layered monolith theo ARCHITECTURE-SPINE (AD-1/AD-3):
 * controller/ → service/ → repository/. Controller chỉ nhận HTTP + map DTO;
 * mọi business logic nằm ở service; repository chỉ query. Entity JPA không
 * rời backend — API chỉ trả DTO.</p>
 */
@SpringBootApplication
public class StorageHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(StorageHubApplication.class, args);
    }
}
