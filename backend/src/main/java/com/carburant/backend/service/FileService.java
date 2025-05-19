package com.carburant.backend.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.carburant.backend.model.FileDocument;
import com.carburant.backend.repository.FileRepository;
import com.carburant.backend.repository.VehicleRepository;
import com.carburant.backend.utils.ExcelHelper;

import lombok.extern.slf4j.Slf4j;

/**
 * Service for handling file operations
 */
@Service
@Slf4j
public class FileService {

    @Autowired
    private FileRepository fileRepository;
    
    @Autowired
    private ExcelHelper excelHelper;
    
    @Autowired
    private VehicleRepository vehicleRepository;
    
    /**
     * Store a file in MongoDB
     * 
     * @param file The file to store
     * @param vehicleType The vehicle type associated with the file
     * @param year The year associated with the file
     * @param region The region associated with the file
     * @return The stored file document
     */
    public FileDocument storeFile(MultipartFile file, String vehicleType, int year, String region) throws IOException {
        String filename = file.getOriginalFilename();
        log.info("Storing file: {} with size: {} bytes, for region: {}", filename, file.getSize(), region);
        
        // Extract available sheets from Excel file
        List<String> availableSheets = excelHelper.getSheetNames(file.getInputStream());
        
        FileDocument fileDocument = FileDocument.builder()
            .name(filename)
            .filename(filename)
            .contentType(file.getContentType())
            .size(file.getSize())
            .content(file.getBytes())
            .uploadDate(LocalDateTime.now())
            .vehicleType(vehicleType)
            .year(year)
            .region(region)
            .availableSheets(availableSheets)
            .processed(false)
            .active(true)
            .build();
        
        return fileRepository.save(fileDocument);
    }
    
    /**
     * Store a file in MongoDB (overloaded method for backward compatibility)
     * 
     * @param file The file to store
     * @param vehicleType The vehicle type associated with the file
     * @param year The year associated with the file
     * @return The stored file document
     */
    public FileDocument storeFile(MultipartFile file, String vehicleType, int year) throws IOException {
        return storeFile(file, vehicleType, year, "All Regions");
    }
    
    /**
     * Get all files
     * 
     * @return List of file documents (without content to reduce payload size)
     */
    public List<FileDocument> getAllFiles() {
        List<FileDocument> files = fileRepository.findByActiveTrue();
        // Remove content to reduce payload size
        files.forEach(file -> file.setContent(null));
        return files;
    }
    
    /**
     * Get file by ID
     * 
     * @param id The file ID
     * @return The file document
     */
    public Optional<FileDocument> getFile(String id) {
        return fileRepository.findByIdAndActiveTrue(id);
    }
    
    /**
     * Get file content by ID
     * 
     * @param id The file ID
     * @return The file content as bytes
     */
    public byte[] getFileContent(String id) {
        Optional<FileDocument> fileOpt = fileRepository.findByIdAndActiveTrue(id);
        return fileOpt.map(FileDocument::getContent).orElse(null);
    }
    
    /**
     * Update file metadata
     * 
     * @param id The file ID
     * @param processed Whether the file has been processed
     * @param recordCount The number of records in the file
     * @return The updated file document
     */
    public FileDocument updateFileMetadata(String id, boolean processed, int recordCount) {
        Optional<FileDocument> fileOpt = fileRepository.findByIdAndActiveTrue(id);
        if (fileOpt.isPresent()) {
            FileDocument file = fileOpt.get();
            file.setProcessed(processed);
            file.setRecordCount(recordCount);
            return fileRepository.save(file);
        }
        return null;
    }
    
    /**
     * Delete file by ID (soft delete) and remove associated vehicle records
     * 
     * @param id The file ID
     * @return true if successful, false otherwise
     */
    public boolean deleteFile(String id) {
        Optional<FileDocument> fileOpt = fileRepository.findByIdAndActiveTrue(id);
        if (fileOpt.isPresent()) {
            FileDocument file = fileOpt.get();
            
            // Delete associated vehicle records before marking the file as inactive
            deleteAssociatedVehicleRecords(file);
            
            // Soft delete the file by marking it as inactive
            file.setActive(false);
            fileRepository.save(file);
            log.info("File with ID {} has been marked as inactive and its associated records deleted", id);
            return true;
        }
        log.warn("Attempted to delete file with ID {} but it was not found or already inactive", id);
        return false;
    }

    /**
     * Delete all vehicle records associated with a file
     * 
     * @param file The file document whose associated records should be deleted
     */
    private void deleteAssociatedVehicleRecords(FileDocument file) {
        if (file == null) {
            log.warn("Attempted to delete associated records for a null file");
            return;
        }
        
        String vehicleType = file.getVehicleType();
        int year = file.getYear();
        String region = file.getRegion();
        
        log.info("Deleting vehicle records for type: {}, year: {}, region: {}", vehicleType, year, region);
        
        // Delete records matching the file's metadata
        // The deleteByTypeAndYearAndRegion method returns void, so we can't get the count directly
        vehicleRepository.deleteByTypeAndYearAndRegion(vehicleType, String.valueOf(year), region);
        log.info("Deleted vehicle records associated with file ID: {}", file.getId());
    }
    
    /**
     * Get files by vehicle type
     * 
     * @param vehicleType The vehicle type
     * @return List of file documents
     */
    public List<FileDocument> getFilesByVehicleType(String vehicleType) {
        List<FileDocument> files = fileRepository.findByVehicleTypeAndActiveTrue(vehicleType);
        files.forEach(file -> file.setContent(null));
        return files;
    }
    
    /**
     * Get files by year
     * 
     * @param year The year
     * @return List of file documents
     */
    public List<FileDocument> getFilesByYear(int year) {
        List<FileDocument> files = fileRepository.findByYearAndActiveTrue(year);
        files.forEach(file -> file.setContent(null));
        return files;
    }
    
    /**
     * Get files by vehicle type and year
     * 
     * @param vehicleType The vehicle type
     * @param year The year
     * @return List of file documents
     */
    public List<FileDocument> getFilesByVehicleTypeAndYear(String vehicleType, int year) {
        List<FileDocument> files = fileRepository.findByVehicleTypeAndYearAndActiveTrue(vehicleType, year);
        files.forEach(file -> file.setContent(null));
        return files;
    }
    
    /**
     * Get files by region
     * 
     * @param region The region
     * @return List of file documents
     */
    public List<FileDocument> getFilesByRegion(String region) {
        List<FileDocument> files = fileRepository.findByRegionAndActiveTrue(region);
        files.forEach(file -> file.setContent(null));
        return files;
    }
    
    /**
     * Get files by vehicle type and region
     * 
     * @param vehicleType The vehicle type
     * @param region The region
     * @return List of file documents
     */
    public List<FileDocument> getFilesByVehicleTypeAndRegion(String vehicleType, String region) {
        List<FileDocument> files = fileRepository.findByVehicleTypeAndRegionAndActiveTrue(vehicleType, region);
        files.forEach(file -> file.setContent(null));
        return files;
    }
    
    /**
     * Get files by year and region
     * 
     * @param year The year
     * @param region The region
     * @return List of file documents
     */
    public List<FileDocument> getFilesByYearAndRegion(int year, String region) {
        List<FileDocument> files = fileRepository.findByYearAndRegionAndActiveTrue(year, region);
        files.forEach(file -> file.setContent(null));
        return files;
    }
    
    /**
     * Get files by vehicle type, year and region
     * 
     * @param vehicleType The vehicle type
     * @param year The year
     * @param region The region
     * @return List of file documents
     */
    public List<FileDocument> getFilesByVehicleTypeYearAndRegion(String vehicleType, int year, String region) {
        List<FileDocument> files = fileRepository.findByVehicleTypeAndYearAndRegionAndActiveTrue(vehicleType, year, region);
        files.forEach(file -> file.setContent(null));
        return files;
    }
}