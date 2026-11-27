package com.rishbootdev.mantu.merchant_service.config;

import com.rishbootdev.mantu.common_library.enums.UserRole;
import com.rishbootdev.mantu.merchant_service.entity.AppUser;
import com.rishbootdev.mantu.merchant_service.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class OperationsAdminInitializer {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner createOperationsAdmin(
            @Value("${mantu.operations-admin.email:rishbootdev@gmail.com}") String email,
            @Value("${mantu.operations-admin.password:Admin@123}") String password) {
        return args -> {
            var existing = appUserRepository.findByEmail(email);
            if (existing.isPresent()) {
                AppUser user = existing.get();
                if (user.getRole() != UserRole.MANTU_OPS_ADMIN) {
                    user.setRole(UserRole.MANTU_OPS_ADMIN);
                    user.setPasswordHash(passwordEncoder.encode(password));
                    appUserRepository.save(user);
                    log.info("Promoted the configured account to Mantu operations administrator for {}", email);
                }
                return;
            }

            appUserRepository.save(AppUser.builder().email(email).passwordHash(passwordEncoder.encode(password))
                    .role(UserRole.MANTU_OPS_ADMIN).build());
            log.info("Created the configured Mantu operations administrator account for {}", email);
        };
    }
}
