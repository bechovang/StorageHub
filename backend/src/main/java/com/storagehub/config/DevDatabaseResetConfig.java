package com.storagehub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;import org.flywaydb.core.Flyway;

/**
 * Profile dev: mỗi lần chạy/redeploy BE thì CLEAN + MIGRATE lại DB —
 * database luôn về đúng trạng thái seed để test PayOS từ đầu.
 * CHỈ chạy với profile dev; profile khác vẫn migrate tăng tiến bình thường.
 */
@Configuration
@Profile("dev")
public class DevDatabaseResetConfig {

    @Bean
    public FlywayMigrationStrategy devResetDatabase() {
        return flyway -> {
            flyway.clean();
            flyway.migrate();
        };
    }
}
