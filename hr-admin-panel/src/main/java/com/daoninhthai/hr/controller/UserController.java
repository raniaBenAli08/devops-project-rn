package com.daoninhthai.hr.controller;

import com.daoninhthai.hr.dto.UserOptionDTO;
import com.daoninhthai.hr.entity.User;
import com.daoninhthai.hr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/attendance-accounts")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<UserOptionDTO>> getAttendanceAccounts() {
        List<UserOptionDTO> accounts = userRepository.findAllByOrderByUsernameAsc().stream()
                .map(this::toOption)
                .toList();
        return ResponseEntity.ok(accounts);
    }

    private UserOptionDTO toOption(User user) {
        return UserOptionDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .employeeId(user.getEmployee() == null ? null : user.getEmployee().getId())
                .build();
    }
}
