package com.daoninhthai.hr.repository;

import com.daoninhthai.hr.entity.User;
import com.daoninhthai.hr.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByEmployeeId(Long employeeId);

    List<User> findAllByOrderByUsernameAsc();

    List<User> findByRegistrationStatusOrderByCreatedAtAsc(RegistrationStatus status);
}
