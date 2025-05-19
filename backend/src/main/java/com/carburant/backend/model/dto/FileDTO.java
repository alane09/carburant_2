package com.carburant.backend.model.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.carburant.backend.model.FileDocument;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for file information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileDTO {
    
    private String id;
    private String name;
    private String filename;
    private String contentType;
    private long size;
    private LocalDateTime uploadDate;
    private int year;
    private String vehicleType;
    private String sheetName;
    private boolean processed;
    private int recordCount;
    private List<String> availableSheets;
    
    /**
     * Convert FileDocument to FileDTO (excluding binary content)
     */
    public static FileDTO fromDocument(FileDocument document) {
        if (document == null) {
            return null;
        }
        
        return FileDTO.builder()
            .id(document.getId())
            .name(document.getName())
            .filename(document.getFilename())
            .contentType(document.getContentType())
            .size(document.getSize())
            .uploadDate(document.getUploadDate())
            .year(document.getYear())
            .vehicleType(document.getVehicleType())
            .sheetName(document.getSheetName())
            .processed(document.isProcessed())
            .recordCount(document.getRecordCount())
            .availableSheets(document.getAvailableSheets())
            .build();
    }
}