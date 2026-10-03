package com.daoninhthai.hr.service;

import com.daoninhthai.hr.dto.DocumentDTO;
import com.daoninhthai.hr.entity.Document;
import com.daoninhthai.hr.enums.DocumentType;
import com.daoninhthai.hr.exception.ResourceNotFoundException;
import com.daoninhthai.hr.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Transactional
    public DocumentDTO uploadDocument(Long employeeId, DocumentType type, MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir, "employees", String.valueOf(employeeId));
        Files.createDirectories(uploadPath);

        String uniqueFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Document document = Document.builder()
                .employeeId(employeeId)
                .type(type)
                .fileName(file.getOriginalFilename())
                .fileUrl(filePath.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .build();

        Document saved = documentRepository.save(document);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<DocumentDTO> getEmployeeDocuments(Long employeeId) {
        return documentRepository.findByEmployeeId(employeeId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentDTO getDocumentById(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        return toDTO(document);
    }

    @Transactional
    public void deleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        try {
            Path filePath = Paths.get(document.getFileUrl());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log but don't fail on file deletion
        }

        documentRepository.delete(document);
    }

    private DocumentDTO toDTO(Document document) {
        return DocumentDTO.builder()
                .id(document.getId())
                .employeeId(document.getEmployeeId())
                .type(document.getType())
                .fileName(document.getFileName())
                .fileUrl("/api/documents/" + document.getId() + "/download")
                .fileSize(document.getFileSize())
                .contentType(document.getContentType())
                .uploadedAt(document.getUploadedAt())
                .build();
    }
}
