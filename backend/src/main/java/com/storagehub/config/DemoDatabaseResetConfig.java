package com.storagehub.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

/**
 * Profile demo: khi bật APP_DEMO_RESET_ON_START=true thì CLEAN + MIGRATE lại
 * database mỗi lần backend start, luôn quay về seed demo (V1..V53).
 * Mặc định tắt để restart thường không xoá dữ liệu.
 * CHỈ active với profile "demo".
 */
@Configuration
@Profile("demo")
public class DemoDatabaseResetConfig {

    private static final Logger log = LoggerFactory.getLogger(DemoDatabaseResetConfig.class);

    private final Environment environment;

    public DemoDatabaseResetConfig(Environment environment) {
        this.environment = environment;
    }

    @Bean
    public FlywayMigrationStrategy demoResetDatabase() {
        return flyway -> {
            boolean reset = environment.getProperty(
                    "app.demo.reset-on-start", Boolean.class, false);
            if (reset) {
                log.warn("DEMO DATABASE RESET: cleaning schema before Flyway migrate");
                flyway.clean();
            }
            flyway.migrate();
        };
    }
}
