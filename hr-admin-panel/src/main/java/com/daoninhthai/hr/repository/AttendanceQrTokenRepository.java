package com.daoninhthai.hr.repository;

import com.daoninhthai.hr.entity.AttendanceQrToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface AttendanceQrTokenRepository extends JpaRepository<AttendanceQrToken, LocalDate> {
}
