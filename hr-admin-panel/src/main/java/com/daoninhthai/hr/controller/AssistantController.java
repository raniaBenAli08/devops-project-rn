package com.daoninhthai.hr.controller;

import com.daoninhthai.hr.dto.AssistantRequest;
import com.daoninhthai.hr.dto.AssistantResponse;
import com.daoninhthai.hr.security.UserPrincipal;
import com.daoninhthai.hr.service.AssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class AssistantController {
    private final AssistantService assistantService;

    @PostMapping("/chat")
    public ResponseEntity<AssistantResponse> chat(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AssistantRequest request) {
        try {
            if (assistantService.isDemoMode()) {
                return ResponseEntity.ok(new AssistantResponse(assistantService.demoChat(request.message())));
            }
            if (principal == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required for real HR data");
            }
            return ResponseEntity.ok(new AssistantResponse(
                    assistantService.chat(request.message(), principal.getId(), principal.getRole())));
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage(), exception);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        } catch (SecurityException exception) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, exception.getMessage(), exception);
        }
    }
}
