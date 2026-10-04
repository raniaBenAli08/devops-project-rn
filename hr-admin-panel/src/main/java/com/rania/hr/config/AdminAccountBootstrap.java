package com.rania.hr.config;

import com.rania.hr.entity.User;
import com.rania.hr.enums.UserRole;
import com.rania.hr.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class AdminAccountBootstrap implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminAccountBootstrap.class);
    private static final int MIN_PASSWORD_LENGTH = 12;
    private static final int MAX_BCRYPT_PASSWORD_BYTES = 72;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String email;
    private final String password;

    public AdminAccountBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.admin.username:}") String username,
            @Value("${app.bootstrap.admin.email:}") String email,
            @Value("${app.bootstrap.admin.password:}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean usernameConfigured = !username.isBlank();
        boolean emailConfigured = !email.isBlank();
        boolean passwordConfigured = !password.isBlank();

        if (!usernameConfigured && !emailConfigured && !passwordConfigured) {
            logger.info("No initial admin configured; set APP_BOOTSTRAP_ADMIN_USERNAME, "
                    + "APP_BOOTSTRAP_ADMIN_EMAIL, and APP_BOOTSTRAP_ADMIN_PASSWORD to create one.");
            return;
        }

        if (!usernameConfigured || !emailConfigured || !passwordConfigured) {
            throw new IllegalStateException("All three initial admin settings must be configured: "
                    + "APP_BOOTSTRAP_ADMIN_USERNAME, APP_BOOTSTRAP_ADMIN_EMAIL, "
                    + "and APP_BOOTSTRAP_ADMIN_PASSWORD.");
        }

        int passwordBytes = password.getBytes(StandardCharsets.UTF_8).length;
        if (password.length() < MIN_PASSWORD_LENGTH || passwordBytes > MAX_BCRYPT_PASSWORD_BYTES) {
            throw new IllegalStateException("The initial admin password must be at least "
                    + MIN_PASSWORD_LENGTH + " characters and no more than "
                    + MAX_BCRYPT_PASSWORD_BYTES + " UTF-8 bytes.");
        }

        if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) {
            logger.warn("Initial admin account was not created because the configured username "
                    + "or email already exists. Existing users are never promoted automatically.");
            return;
        }

        User admin = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(UserRole.ADMIN)
                .enabled(true)
                .build();
        userRepository.save(admin);
        logger.info("Initial administrator account created. Remove the bootstrap credentials "
                + "from the environment and restart the application.");
    }
}
