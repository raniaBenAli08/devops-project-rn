package com.daoninhthai.hr.controller;

import com.daoninhthai.hr.dto.ContractDTO;
import com.daoninhthai.hr.dto.ContractRequest;
import com.daoninhthai.hr.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @GetMapping
    public ResponseEntity<List<ContractDTO>> getContracts() {
        return ResponseEntity.ok(contractService.getContracts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractDTO> getContract(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContract(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ContractDTO> createContract(@Valid @RequestBody ContractRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contractService.createContract(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ContractDTO> updateContract(
            @PathVariable Long id,
            @Valid @RequestBody ContractRequest request) {
        return ResponseEntity.ok(contractService.updateContract(id, request));
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ContractDTO> archiveContract(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.archiveContract(id));
    }

    @PostMapping("/{id}/attachment")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ContractDTO> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(contractService.uploadAttachment(id, file));
    }

    @GetMapping("/{id}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) throws IOException {
        ContractDTO contract = contractService.getContract(id);
        Path attachmentPath = contractService.getAttachmentPath(id);
        Resource resource = new FileSystemResource(attachmentPath);
        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
        if (contract.getAttachmentContentType() != null) {
            contentType = MediaType.parseMediaType(contract.getAttachmentContentType());
        }
        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(contract.getAttachmentName(), StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .body(resource);
    }

    @DeleteMapping("/{id}/attachment")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id) throws IOException {
        contractService.deleteAttachment(id);
        return ResponseEntity.noContent().build();
    }
}
