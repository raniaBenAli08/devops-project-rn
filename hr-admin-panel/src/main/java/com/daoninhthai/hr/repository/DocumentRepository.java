package com.daoninhthai.hr.repository;

import com.daoninhthai.hr.entity.Document;
import com.daoninhthai.hr.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByEmployeeId(Long employeeId);

    List<Document> findByEmployeeIdAndType(Long employeeId, DocumentType type);
}
