package com.daoninhthai.hr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgNodeDTO {
    private Long id;
    private String employeeCode;
    private String fullName;
    private String positionTitle;
    private String departmentName;
    private String email;

    @Builder.Default
    private List<OrgNodeDTO> directReports = new ArrayList<>();
}
