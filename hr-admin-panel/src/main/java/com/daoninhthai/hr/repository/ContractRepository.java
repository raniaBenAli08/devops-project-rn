package com.daoninhthai.hr.repository;

import com.daoninhthai.hr.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findAllByOrderByStartDateDescIdDesc();
}
