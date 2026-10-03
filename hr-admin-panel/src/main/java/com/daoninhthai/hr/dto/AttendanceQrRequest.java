package com.daoninhthai.hr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AttendanceQrRequest {
    @NotBlank
    private String token;
}
