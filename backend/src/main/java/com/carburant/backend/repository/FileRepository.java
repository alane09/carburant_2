package com.carburant.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.carburant.backend.model.FileDocument;

/**
 * MongoDB Repository for file operations
 */
@Repository
public interface FileRepository extends MongoRepository<FileDocument, String> {
    
    /**
     * Find files by vehicle type
     */
    List<FileDocument> findByVehicleTypeAndActiveTrue(String vehicleType);
    
    /**
     * Find files by year
     */
    List<FileDocument> findByYearAndActiveTrue(int year);
    
    /**
     * Find files by both vehicle type and year
     */
    List<FileDocument> findByVehicleTypeAndYearAndActiveTrue(String vehicleType, int year);
    
    /**
     * Find active files
     */
    List<FileDocument> findByActiveTrue();
    
    /**
     * Find file by ID and active status
     */
    Optional<FileDocument> findByIdAndActiveTrue(String id);
    
    /**
     * Find files by region
     */
    List<FileDocument> findByRegionAndActiveTrue(String region);
    
    /**
     * Find files by vehicle type and region
     */
    List<FileDocument> findByVehicleTypeAndRegionAndActiveTrue(String vehicleType, String region);
    
    /**
     * Find files by year and region
     */
    List<FileDocument> findByYearAndRegionAndActiveTrue(int year, String region);
    
    /**
     * Find files by vehicle type, year, and region
     */
    List<FileDocument> findByVehicleTypeAndYearAndRegionAndActiveTrue(String vehicleType, int year, String region);
}