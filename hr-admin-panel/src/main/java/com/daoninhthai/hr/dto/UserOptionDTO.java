package com.daoninhthai.hr.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserOptionDTO {
    private Long id;
    private String username;
    private String email;
    private Long employeeId;
}
