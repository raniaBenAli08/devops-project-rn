package com.rania.hr.controller;

import com.rania.hr.dto.OrgNodeDTO;
import com.rania.hr.service.OrgChartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org-chart")
@RequiredArgsConstructor
public class OrgChartController {

    private final OrgChartService orgChartService;

    @GetMapping("/tree")
    public ResponseEntity<List<OrgNodeDTO>> getOrgTree() {
        return ResponseEntity.ok(orgChartService.getOrgTree());
    }

    @GetMapping("/direct-reports/{managerId}")
    public ResponseEntity<List<OrgNodeDTO>> getDirectReports(@PathVariable Long managerId) {
        return ResponseEntity.ok(orgChartService.getDirectReports(managerId));
    }

    @GetMapping("/team/{managerId}")
    public ResponseEntity<List<OrgNodeDTO>> getTeamMembers(@PathVariable Long managerId) {
        return ResponseEntity.ok(orgChartService.getTeamMembers(managerId));
    }

    @GetMapping("/reporting-chain/{employeeId}")
    public ResponseEntity<List<OrgNodeDTO>> getReportingChain(@PathVariable Long employeeId) {
        return ResponseEntity.ok(orgChartService.getReportingChain(employeeId));
    }
}
