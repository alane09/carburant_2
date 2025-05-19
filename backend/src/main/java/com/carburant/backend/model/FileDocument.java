package com.carburant.backend.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MongoDB document representing an uploaded file.
 */
@Document(collection = "files")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileDocument {
    
    @Id
    private String id;
    
    @Indexed
    private String name;
    
    private String filename;
    
    private String contentType;
    
    private long size;
    
    private byte[] content;
    
    private LocalDateTime uploadDate;
    
    @Indexed
    private int year;
    
    @Indexed
    private String vehicleType;
    
    @Indexed
    private String region;
    
    private String sheetName;
    
    private boolean processed;
    
    private int recordCount;
    
    private List<String> availableSheets;
    
    @Builder.Default
    private boolean active = true;
}