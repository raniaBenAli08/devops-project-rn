package com.daoninhthai.hr.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_qr_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceQrToken {

    @Id
    @Column(name = "token_date")
    private LocalDate date;

    @Column(nullable = false, length = 64)
    private String token;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
