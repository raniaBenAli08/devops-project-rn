package com.rania.hr.service;

import com.rania.hr.dto.CreateEmployeeRequest;
import com.rania.hr.dto.EmployeeRegistrationRequest;
import com.rania.hr.dto.PendingRegistrationDTO;
import com.rania.hr.entity.EmailVerificationToken;
import com.rania.hr.entity.Employee;
import com.rania.hr.entity.User;
import com.rania.hr.enums.RegistrationStatus;
import com.rania.hr.enums.UserRole;
import com.rania.hr.exception.BadRequestException;
import com.rania.hr.exception.ResourceNotFoundException;
import com.rania.hr.exception.ServiceUnavailableException;
import com.rania.hr.repository.EmailVerificationTokenRepository;
import com.rania.hr.repository.EmployeeRepository;
import com.rania.hr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeRegistrationService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final EmployeeService employeeService;

    @Value("${app.registration.frontend-url}")
    private String frontendUrl;

    @Value("${app.registration.verification-expiration-hours}")
    private long verificationExpirationHours;

    @Transactional
    public void register(EmployeeRegistrationRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("This username is already in use.");
        }
        if (userRepository.existsByEmail(email) || employeeRepository.existsByEmail(email)) {
            throw new BadRequestException("This email address is already registered.");
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.EMPLOYEE)
                .enabled(false)
                .emailVerified(false)
                .registrationStatus(RegistrationStatus.PENDING_EMAIL)
                .registrationFirstName(request.getFirstName().trim())
                .registrationLastName(request.getLastName().trim())
                .registrationPhone(request.getPhone() == null ? null : request.getPhone().trim())
                .registrationDateOfBirth(request.getDateOfBirth())
                .build();
        User savedUser = userRepository.save(user);

        String rawToken = createRawToken();
        tokenRepository.save(EmailVerificationToken.builder()
                .user(savedUser)
                .tokenHash(hashToken(rawToken))
                .expiresAt(LocalDateTime.now().plusHours(verificationExpirationHours))
                .build());
        sendVerificationEmail(savedUser, rawToken);
    }

    @Transactional
    public RegistrationStatus verifyEmail(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BadRequestException("Email verification link is invalid.");
        }
        EmailVerificationToken token = tokenRepository.findByTokenHash(hashToken(rawToken))
                .orElseThrow(() -> new BadRequestException("Email verification link is invalid or expired."));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Email verification link is invalid or expired.");
        }

        User user = token.getUser();
        if (user.getRegistrationStatus() != RegistrationStatus.PENDING_EMAIL) {
            throw new BadRequestException("This registration has already been verified or processed.");
        }
        token.setUsedAt(LocalDateTime.now());
        user.setEmailVerified(true);
        user.setRegistrationStatus(RegistrationStatus.PENDING_APPROVAL);
        return user.getRegistrationStatus();
    }

    @Transactional(readOnly = true)
    public List<PendingRegistrationDTO> getPendingRegistrations() {
        return userRepository.findByRegistrationStatusOrderByCreatedAtAsc(RegistrationStatus.PENDING_APPROVAL)
                .stream()
                .map(user -> PendingRegistrationDTO.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .firstName(user.getRegistrationFirstName())
                        .lastName(user.getRegistrationLastName())
                        .phone(user.getRegistrationPhone())
                        .dateOfBirth(user.getRegistrationDateOfBirth())
                        .registeredAt(user.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void approve(Long userId) {
        User user = getPendingRegistration(userId);
        CreateEmployeeRequest employeeRequest = CreateEmployeeRequest.builder()
                .firstName(user.getRegistrationFirstName())
                .lastName(user.getRegistrationLastName())
                .email(user.getEmail())
                .phone(user.getRegistrationPhone())
                .dateOfBirth(user.getRegistrationDateOfBirth())
                .hireDate(user.getCreatedAt() == null ? LocalDate.now() : user.getCreatedAt().toLocalDate())
                .build();
        Long employeeId = employeeService.createEmployee(employeeRequest).getId();
        user.setEmployee(employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId)));
        user.setRole(UserRole.EMPLOYEE);
        user.setEnabled(true);
        user.setRegistrationStatus(RegistrationStatus.APPROVED);
        userRepository.save(user);
    }

    @Transactional
    public void reject(Long userId) {
        User user = getPendingRegistration(userId);
        user.setEnabled(false);
        user.setRegistrationStatus(RegistrationStatus.REJECTED);
        userRepository.save(user);
    }

    private User getPendingRegistration(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", userId));
        if (user.getRegistrationStatus() != RegistrationStatus.PENDING_APPROVAL
                || !Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Only email-verified pending registrations can be processed.");
        }
        return user;
    }

    private void sendVerificationEmail(User user, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Verify your HR Flow employee registration");
        message.setText("Hello " + user.getRegistrationFirstName() + ",\n\n"
                + "Please verify your email address to submit your employee registration for administrator approval:\n"
                + frontendUrl.replaceAll("/+$", "") + "/verify-email?token=" + token + "\n\n"
                + "This link expires in " + verificationExpirationHours + " hours. "
                + "If you did not request this account, you can ignore this message.");
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("Failed to send an employee registration verification email to {}", user.getEmail(), ex);
            throw new ServiceUnavailableException(
                    "The verification email could not be sent. Check the Gmail SMTP configuration and try again.");
        }
    }

    private String createRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is required for email verification tokens.", ex);
        }
    }
}
