package com.daoninhthai.hr.config;

import com.daoninhthai.hr.entity.User;
import com.daoninhthai.hr.enums.UserRole;
import com.daoninhthai.hr.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.DefaultApplicationArguments;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminAccountBootstrapTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);

    @Test
    void createsAdminWithEncodedPasswordWhenConfigured() {
        when(passwordEncoder.encode("a-strong-test-password")).thenReturn("bcrypt-hash");

        new AdminAccountBootstrap(
                userRepository,
                passwordEncoder,
                "first-admin",
                "admin@example.test",
                "a-strong-test-password")
                .run(new DefaultApplicationArguments(new String[0]));

        var userCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("first-admin", savedUser.getUsername());
        assertEquals("admin@example.test", savedUser.getEmail());
        assertEquals("bcrypt-hash", savedUser.getPassword());
        assertEquals(UserRole.ADMIN, savedUser.getRole());
        verify(passwordEncoder).encode("a-strong-test-password");
    }

    @Test
    void doesNotCreateOrPromoteUserWhenUsernameAlreadyExists() {
        when(userRepository.existsByUsername("existing-user")).thenReturn(true);

        new AdminAccountBootstrap(
                userRepository,
                passwordEncoder,
                "existing-user",
                "admin@example.test",
                "a-strong-test-password")
                .run(new DefaultApplicationArguments(new String[0]));

        verify(userRepository, never()).save(any(User.class));
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void rejectsIncompleteBootstrapConfiguration() {
        var bootstrap = new AdminAccountBootstrap(
                userRepository,
                passwordEncoder,
                "first-admin",
                "",
                "");

        assertThrows(
                IllegalStateException.class,
                () -> bootstrap.run(new DefaultApplicationArguments(new String[0])));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void rejectsShortPasswords() {
        var bootstrap = new AdminAccountBootstrap(
                userRepository,
                passwordEncoder,
                "first-admin",
                "admin@example.test",
                "too-short");

        assertThrows(
                IllegalStateException.class,
                () -> bootstrap.run(new DefaultApplicationArguments(new String[0])));
        verify(userRepository, never()).save(any(User.class));
    }
}
