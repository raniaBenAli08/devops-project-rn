package com.rania.hr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AttendanceQrDTO {
    private String token;
    private LocalDate date;
    private LocalDateTime expiresAt;
}
