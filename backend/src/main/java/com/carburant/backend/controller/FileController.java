package com.carburant.backend.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.carburant.backend.model.FileDocument;
import com.carburant.backend.model.dto.FileDTO;
import com.carburant.backend.service.FileService;

import lombok.extern.slf4j.Slf4j;

/**
 * Controller for handling file operations
 */
@RestController
@RequestMapping("/files")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")
@Slf4j
public class FileController {

    @Autowired
    private FileService fileService;

    /**
     * Upload a file
     * 
     * @param file The file to upload
     * @param vehicleType The vehicle type associated with the file
     * @param year The year associated with the file
     * @return ResponseEntity with upload status
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "vehicleType", required = true) String vehicleType,
            @RequestParam(value = "year", required = true) Integer year) {
        
        log.info("Received file upload request: {}, vehicle type: {}, year: {}", 
                file.getOriginalFilename(), vehicleType, year);
        
        // Validate vehicle type
        if (vehicleType == null || vehicleType.trim().isEmpty() || vehicleType.equalsIgnoreCase("all")) {
            log.error("Invalid vehicle type: {}", vehicleType);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Vehicle type is required and cannot be 'all'"
            ));
        }
        
        try {
            FileDocument savedFile = fileService.storeFile(file, vehicleType, year);
            FileDTO fileDTO = FileDTO.fromDocument(savedFile);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "File uploaded successfully");
            response.put("fileId", fileDTO.getId());
            response.put("fileName", fileDTO.getName());
            response.put("availableSheets", fileDTO.getAvailableSheets());
            
            log.info("File uploaded successfully: {}", fileDTO.getId());
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            log.error("Failed to upload file", e);
            return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED).body(Map.of(
                "success", false,
                "message", "Failed to upload file: " + e.getMessage()
            ));
        }
    }

    /**
     * Get file upload history
     * 
     * @return List of file documents
     */
    @GetMapping("/history")
    public ResponseEntity<List<FileDTO>> getFileHistory() {
        log.info("Getting file upload history");
        
        List<FileDocument> files = fileService.getAllFiles();
        List<FileDTO> fileDTOs = files.stream()
            .map(FileDTO::fromDocument)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(fileDTOs);
    }

    /**
     * Get file by ID
     * 
     * @param id The file ID
     * @return The file document
     */
    @GetMapping("/{id}")
    public ResponseEntity<FileDTO> getFileById(@PathVariable String id) {
        log.info("Getting file by ID: {}", id);
        
        Optional<FileDocument> fileOpt = fileService.getFile(id);
        
        if (fileOpt.isPresent()) {
            FileDTO fileDTO = FileDTO.fromDocument(fileOpt.get());
            return ResponseEntity.ok(fileDTO);
        }
        
        return ResponseEntity.notFound().build();
    }

    /**
     * Download file by ID
     * 
     * @param id The file ID
     * @return The file content
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadFile(@PathVariable String id) {
        log.info("Downloading file with ID: {}", id);
        
        Optional<FileDocument> fileOpt = fileService.getFile(id);
        
        if (fileOpt.isPresent()) {
            FileDocument file = fileOpt.get();
            byte[] content = file.getContent();
            
            if (content != null) {
                return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .body(content);
            }
        }
        
        return ResponseEntity.notFound().build();
    }

    /**
     * Delete file by ID
     * 
     * @param id The file ID
     * @return Success status
     */
    @DeleteMapping("/{id}/delete")
    public ResponseEntity<?> deleteFile(@PathVariable String id) {
        log.info("Deleting file with ID: {}", id);
        
        boolean deleted = fileService.deleteFile(id);
        
        if (deleted) {
            return ResponseEntity.ok(Map.of("success", true));
        }
        
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Get files by vehicle type
     * 
     * @param vehicleType The vehicle type
     * @return List of file documents
     */
    @GetMapping("/by-vehicle/{vehicleType}")
    public ResponseEntity<List<FileDTO>> getFilesByVehicleType(@PathVariable String vehicleType) {
        log.info("Getting files by vehicle type: {}", vehicleType);
        
        List<FileDocument> files = fileService.getFilesByVehicleType(vehicleType);
        List<FileDTO> fileDTOs = files.stream()
            .map(FileDTO::fromDocument)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(fileDTOs);
    }
    
    /**
     * Get files by year
     * 
     * @param year The year
     * @return List of file documents
     */
    @GetMapping("/by-year/{year}")
    public ResponseEntity<List<FileDTO>> getFilesByYear(@PathVariable int year) {
        log.info("Getting files by year: {}", year);
        
        List<FileDocument> files = fileService.getFilesByYear(year);
        List<FileDTO> fileDTOs = files.stream()
            .map(FileDTO::fromDocument)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(fileDTOs);
    }
}