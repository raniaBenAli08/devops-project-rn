package com.rania.hr.service;

import com.rania.hr.dto.CreatePositionRequest;
import com.rania.hr.dto.PositionDTO;
import com.rania.hr.entity.Department;
import com.rania.hr.entity.Position;
import com.rania.hr.exception.ResourceNotFoundException;
import com.rania.hr.repository.DepartmentRepository;
import com.rania.hr.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PositionService {

    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<PositionDTO> getAllPositions() {
        return positionRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PositionDTO getPositionById(Long id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Position", "id", id));
        return toDTO(position);
    }

    @Transactional(readOnly = true)
    public List<PositionDTO> getPositionsByDepartment(Long departmentId) {
        return positionRepository.findByDepartmentId(departmentId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public PositionDTO createPosition(CreatePositionRequest request) {
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));

        Position position = Position.builder()
                .title(request.getTitle())
                .level(request.getLevel())
                .minSalary(request.getMinSalary())
                .maxSalary(request.getMaxSalary())
                .department(department)
                .build();

        Position saved = positionRepository.save(position);
        return toDTO(saved);
    }

    @Transactional
    public PositionDTO updatePosition(Long id, CreatePositionRequest request) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Position", "id", id));

        if (request.getTitle() != null) position.setTitle(request.getTitle());
        if (request.getLevel() != null) position.setLevel(request.getLevel());
        if (request.getMinSalary() != null) position.setMinSalary(request.getMinSalary());
        if (request.getMaxSalary() != null) position.setMaxSalary(request.getMaxSalary());

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
            position.setDepartment(department);
        }

        Position saved = positionRepository.save(position);
        return toDTO(saved);
    }

    @Transactional
    public void deletePosition(Long id) {
        if (!positionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Position", "id", id);
        }
        positionRepository.deleteById(id);
    }

    private PositionDTO toDTO(Position position) {
        return PositionDTO.builder()
                .id(position.getId())
                .title(position.getTitle())
                .level(position.getLevel())
                .minSalary(position.getMinSalary())
                .maxSalary(position.getMaxSalary())
                .departmentId(position.getDepartment() != null ? position.getDepartment().getId() : null)
                .departmentName(position.getDepartment() != null ? position.getDepartment().getName() : null)
                .build();
    }
}
