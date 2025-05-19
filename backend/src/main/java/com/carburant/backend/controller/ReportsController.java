package com.carburant.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for handling report generation and management
 */
@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ReportsController {

    private final List<Map<String, Object>> reports = new ArrayList<>();

    /**
     * Generate a report
     * @param params Report parameters including type, startDate, endDate, and format
     * @return Report ID
     */
    @PostMapping("/generate")
    public ResponseEntity<String> generateReport(@RequestBody Map<String, Object> params) {
        try {
            // Extract parameters
            String type = (String) params.get("type");
            String startDate = (String) params.get("startDate");
            String endDate = (String) params.get("endDate");
            String format = params.containsKey("format") ? (String) params.get("format") : "pdf";
            
            // Generate a unique ID for the report
            String reportId = UUID.randomUUID().toString();
            
            // Create a report object
            Map<String, Object> report = new HashMap<>();
            report.put("id", reportId);
            report.put("type", type);
            report.put("startDate", startDate);
            report.put("endDate", endDate);
            report.put("format", format);
            report.put("createdAt", System.currentTimeMillis());
            report.put("name", "Report_" + type + "_" + startDate + "_" + endDate + "." + format);
            
            // Add the report to the list
            reports.add(report);
            
            return ResponseEntity.ok(reportId);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to generate report: " + e.getMessage());
        }
    }

    /**
     * Get all reports
     * @return List of reports
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getReports() {
        return ResponseEntity.ok(reports);
    }

    /**
     * Delete a report
     * @param id Report ID
     * @return Success status
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable String id) {
        boolean removed = reports.removeIf(report -> report.get("id").equals(id));
        if (removed) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Download a report
     * @param id Report ID
     * @return Report download URL or content
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<String> downloadReport(@PathVariable String id) {
        // Find the report
        Map<String, Object> report = reports.stream()
                .filter(r -> r.get("id").equals(id))
                .findFirst()
                .orElse(null);
        
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        
        // In a real implementation, this would generate a download URL or return the file content
        // For this example, we'll just return a mock URL
        return ResponseEntity.ok("/api/downloads/" + report.get("name"));
    }
}
