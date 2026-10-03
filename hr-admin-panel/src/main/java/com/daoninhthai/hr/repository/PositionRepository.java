package com.daoninhthai.hr.repository;

import com.daoninhthai.hr.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {

    List<Position> findByDepartmentId(Long departmentId);

    List<Position> findByLevel(String level);
}
