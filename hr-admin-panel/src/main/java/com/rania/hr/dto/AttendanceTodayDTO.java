package com.rania.hr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AttendanceTodayDTO {
    private Long employeeId;
    private String employeeName;
    private AttendanceDTO attendance;
}
