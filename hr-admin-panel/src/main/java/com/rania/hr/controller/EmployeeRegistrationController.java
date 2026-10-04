package com.rania.hr.controller;

import com.rania.hr.dto.EmployeeRegistrationRequest;
import com.rania.hr.dto.PendingRegistrationDTO;
import com.rania.hr.enums.RegistrationStatus;
import com.rania.hr.service.EmployeeRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class EmployeeRegistrationController {

    private final EmployeeRegistrationService registrationService;

    @PostMapping
    public ResponseEntity<Map<String, String>> register(
            @Valid @RequestBody EmployeeRegistrationRequest request) {
        registrationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration created. Check your email to verify your address."));
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verify(@RequestParam String token) {
        RegistrationStatus status = registrationService.verifyEmail(token);
        return ResponseEntity.ok(Map.of(
                "status", status.name(),
                "message", "Email verified. Your registration is now waiting for administrator approval."
        ));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PendingRegistrationDTO>> pending() {
        return ResponseEntity.ok(registrationService.getPendingRegistrations());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> approve(@PathVariable Long id) {
        registrationService.approve(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reject(@PathVariable Long id) {
        registrationService.reject(id);
        return ResponseEntity.noContent().build();
    }
}
