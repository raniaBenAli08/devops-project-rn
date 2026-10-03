package com.daoninhthai.hr.service;

import com.daoninhthai.hr.dto.ContractDTO;
import com.daoninhthai.hr.dto.ContractRequest;
import com.daoninhthai.hr.entity.Contract;
import com.daoninhthai.hr.entity.Employee;
import com.daoninhthai.hr.enums.ContractStatus;
import com.daoninhthai.hr.exception.BadRequestException;
import com.daoninhthai.hr.exception.ResourceNotFoundException;
import com.daoninhthai.hr.repository.ContractRepository;
import com.daoninhthai.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractService {

    private static final long MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
    private static final List<String> ALLOWED_EXTENSIONS = List.of(".pdf", ".doc", ".docx");

    private final ContractRepository contractRepository;
    private final EmployeeRepository employeeRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<ContractDTO> getContracts() {
        return contractRepository.findAllByOrderByStartDateDescIdDesc().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContractDTO getContract(Long id) {
        return toDTO(findContract(id));
    }

    @Transactional
    public ContractDTO createContract(ContractRequest request) {
        validateDates(request);
        rejectArchivedStatus(request.getStatus());
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        Contract contract = Contract.builder()
                .contractNumber("TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26))
                .employee(employee)
                .type(request.getType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .salary(request.getSalary())
                .status(request.getStatus() == null ? ContractStatus.DRAFT : request.getStatus())
                .notes(request.getNotes())
                .build();

        contract = contractRepository.saveAndFlush(contract);
        contract.setContractNumber(String.format(Locale.ROOT, "CTR-%06d", contract.getId()));
        return toDTO(contractRepository.save(contract));
    }

    @Transactional
    public ContractDTO updateContract(Long id, ContractRequest request) {
        Contract contract = findContract(id);
        ensureEditable(contract);
        validateDates(request);
        rejectArchivedStatus(request.getStatus());

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        contract.setEmployee(employee);
        contract.setType(request.getType());
        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setSalary(request.getSalary());
        contract.setNotes(request.getNotes());
        if (request.getStatus() != null) {
            contract.setStatus(request.getStatus());
        }
        return toDTO(contractRepository.save(contract));
    }

    @Transactional
    public ContractDTO archiveContract(Long id) {
        Contract contract = findContract(id);
        contract.setStatus(ContractStatus.ARCHIVED);
        return toDTO(contractRepository.save(contract));
    }

    @Transactional
    public ContractDTO uploadAttachment(Long id, MultipartFile file) throws IOException {
        Contract contract = findContract(id);
        ensureEditable(contract);
        String originalName = sanitizeFileName(file.getOriginalFilename());
        String extension = getAllowedExtension(originalName);
        if (file.isEmpty()) {
            throw new BadRequestException("The selected contract file is empty.");
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new BadRequestException("Contract files must be 10 MB or smaller.");
        }

        Path contractDirectory = Paths.get(uploadDir, "contracts", String.valueOf(id))
                .toAbsolutePath()
                .normalize();
        Files.createDirectories(contractDirectory);
        Path newPath = contractDirectory.resolve(UUID.randomUUID() + extension);
        String previousPath = contract.getAttachmentPath();

        Files.copy(file.getInputStream(), newPath, StandardCopyOption.REPLACE_EXISTING);
        try {
            contract.setAttachmentName(originalName);
            contract.setAttachmentPath(newPath.toString());
            contract.setAttachmentContentType(contentTypeFor(extension));
            contract.setAttachmentSize(file.getSize());
            Contract saved = contractRepository.saveAndFlush(contract);
            deletePreviousAttachment(previousPath, newPath);
            return toDTO(saved);
        } catch (RuntimeException exception) {
            try {
                Files.deleteIfExists(newPath);
            } catch (IOException cleanupException) {
                exception.addSuppressed(cleanupException);
            }
            throw exception;
        }
    }

    @Transactional
    public ContractDTO deleteAttachment(Long id) throws IOException {
        Contract contract = findContract(id);
        ensureEditable(contract);
        String attachmentPath = contract.getAttachmentPath();
        contract.setAttachmentName(null);
        contract.setAttachmentPath(null);
        contract.setAttachmentContentType(null);
        contract.setAttachmentSize(null);
        Contract saved = contractRepository.saveAndFlush(contract);
        if (attachmentPath != null) {
            Files.deleteIfExists(resolveAttachmentPath(attachmentPath));
        }
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public Path getAttachmentPath(Long id) throws IOException {
        Contract contract = findContract(id);
        if (contract.getAttachmentPath() == null) {
            throw new ResourceNotFoundException("Contract attachment", "contractId", id);
        }

        Path filePath = resolveAttachmentPath(contract.getAttachmentPath());
        if (!Files.isRegularFile(filePath)) {
            throw new ResourceNotFoundException("Contract attachment", "contractId", id);
        }
        return filePath;
    }

    private Contract findContract(Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", id));
    }

    private void ensureEditable(Contract contract) {
        if (contract.getStatus() == ContractStatus.ARCHIVED) {
            throw new BadRequestException("Archived contracts cannot be changed.");
        }
    }

    private void validateDates(ContractRequest request) {
        if (request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("The contract end date cannot be before its start date.");
        }
    }

    private void rejectArchivedStatus(ContractStatus status) {
        if (status == ContractStatus.ARCHIVED) {
            throw new BadRequestException("Use the archive action to archive a contract.");
        }
    }

    private Path resolveAttachmentPath(String storedPath) {
        Path uploadRoot = Paths.get(uploadDir, "contracts").toAbsolutePath().normalize();
        Path filePath = Paths.get(storedPath).toAbsolutePath().normalize();
        if (!filePath.startsWith(uploadRoot)) {
            throw new BadRequestException("The contract attachment path is invalid.");
        }
        return filePath;
    }

    private String sanitizeFileName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            throw new BadRequestException("A contract file name is required.");
        }
        String fileName = originalName.replace('\\', '/');
        fileName = fileName.substring(fileName.lastIndexOf('/') + 1)
                .replaceAll("[\\r\\n\"]", "_")
                .trim();
        if (fileName.isBlank() || fileName.length() > 255) {
            throw new BadRequestException("The contract file name is invalid.");
        }
        return fileName;
    }

    private String getAllowedExtension(String fileName) {
        String lowerName = fileName.toLowerCase(Locale.ROOT);
        return ALLOWED_EXTENSIONS.stream()
                .filter(lowerName::endsWith)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Only PDF, DOC, or DOCX contract files are allowed."));
    }

    private String contentTypeFor(String extension) {
        return switch (extension) {
            case ".pdf" -> "application/pdf";
            case ".doc" -> "application/msword";
            case ".docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            default -> "application/octet-stream";
        };
    }

    private void deletePreviousAttachment(String previousPath, Path newPath) {
        if (previousPath == null) {
            return;
        }
        Path oldPath = Paths.get(previousPath).toAbsolutePath().normalize();
        Path uploadRoot = Paths.get(uploadDir, "contracts").toAbsolutePath().normalize();
        if (!oldPath.equals(newPath) && oldPath.startsWith(uploadRoot)) {
            try {
                Files.deleteIfExists(oldPath);
            } catch (IOException exception) {
                log.warn("Could not remove replaced contract attachment at {}", oldPath, exception);
            }
        }
    }

    private ContractDTO toDTO(Contract contract) {
        Employee employee = contract.getEmployee();
        return ContractDTO.builder()
                .id(contract.getId())
                .contractNumber(contract.getContractNumber())
                .employeeId(employee.getId())
                .employeeName(employee.getFullName())
                .employeeCode(employee.getEmployeeCode())
                .type(contract.getType())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .salary(contract.getSalary())
                .status(contract.getStatus())
                .notes(contract.getNotes())
                .attachmentName(contract.getAttachmentName())
                .attachmentSize(contract.getAttachmentSize())
                .attachmentContentType(contract.getAttachmentContentType())
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .build();
    }
}
