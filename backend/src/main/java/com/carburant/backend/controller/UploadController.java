package com.carburant.backend.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.carburant.backend.model.FileDocument;
import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.service.FileService;
import com.carburant.backend.service.VehicleService;

@RestController
@RequestMapping("/") // Changed from "/api" to "/" because server.servlet.context-path already adds "/api"
// Remove specific CORS configuration to use the global one defined in BackendApplication
public class UploadController {

    private static final Logger logger = LoggerFactory.getLogger(UploadController.class);
    private final VehicleService vehicleService;
    private final FileService fileService;

    @Autowired
    public UploadController(VehicleService vehicleService, FileService fileService) {
        this.vehicleService = vehicleService;
        this.fileService = fileService;
    }

    /**
     * Upload an Excel file and extract sheet names
     * @param file The Excel file to upload
     * @return List of sheet names in the uploaded file
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null) {
                logger.error("File is null");
                return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
            }
            
            if (file.isEmpty()) {
                logger.error("File is empty");
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            
            String filename = file.getOriginalFilename();
            if (filename == null) {
                logger.error("Filename is null");
                return ResponseEntity.badRequest().body(Map.of("error", "Filename is null"));
            }
            
            if (!filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
                logger.error("Invalid file format: {}", filename);
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid file format. Only .xlsx and .xls are supported"));
            }
            
            logger.info("Processing file: {}", filename);
            // Save file for later extraction and get sheet names
            List<String> sheetNames = vehicleService.processAndCacheFile(file);
            
            // Return the sheet names with the expected key 'sheets'
            return ResponseEntity.ok(Map.of("sheets", sheetNames));
        } catch (IOException e) {
            logger.error("Error processing file", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Extract data from a specific sheet in the uploaded Excel file
     * @param file The Excel file to extract data from
     * @param sheetName The name of the sheet to extract from
     * @return List of extracted records
     */
    @PostMapping("/extract")
    public ResponseEntity<?> extractData(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sheetName") String sheetName) {
        try {
            if (file == null || file.isEmpty()) {
                logger.error("File is empty");
                return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
            }
            
            if (sheetName == null || sheetName.isEmpty()) {
                logger.error("Sheet name is empty");
                return ResponseEntity.badRequest().body(Map.of("error", "Sheet name is required"));
            }
            
            logger.info("Extracting data from sheet: {} in file: {}", sheetName, file.getOriginalFilename());
            
            // First process and cache the file
            vehicleService.processAndCacheFile(file);
            
            // Then extract data from the cached file WITHOUT saving to database
            List<VehicleRecord> records = vehicleService.extractDataFromCacheWithoutSaving(sheetName);
            
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            logger.error("Error extracting data", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get the list of available vehicle types (sheet names)
     * @return Map containing the list of vehicle types
     */
    @GetMapping("/vehicles")
    public ResponseEntity<?> getVehicleTypes() {
        try {
            // Get sheet names from the cached file
            List<String> types = vehicleService.getCachedSheetNames();
            return ResponseEntity.ok(Map.of("types", types));
        } catch (Exception e) {
            logger.error("Error getting vehicle types", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Save extracted data to the database and store the file in MongoDB
     * @param file The Excel file containing the data
     * @param sheetName The name of the sheet to extract data from
     * @param vehicleType The type of vehicle to categorize the data (can be different from sheet name)
     * @param year The year for the data
     * @param month The month for the data (optional, defaultValue is all months)
     * @param replaceExisting Whether to replace existing data for this vehicle type/period
     * @param region The region for the data (optional, defaultValue is "All Regions")
     * @return Status of the save operation
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveData(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sheetName") String sheetName,
            @RequestParam("year") String year,
            @RequestParam(value = "month", required = false, defaultValue = "all") String month,
            @RequestParam(value = "replaceExisting", defaultValue = "false") boolean replaceExisting,
            @RequestParam("region") String region,
            @RequestParam("vehicleType") String vehicleType) {
        try {
            if (file == null || file.isEmpty()) {
                logger.error("File is empty");
                return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
            }
            
            if (sheetName == null || sheetName.isEmpty()) {
                logger.error("Sheet name is empty");
                return ResponseEntity.badRequest().body(Map.of("error", "Sheet name is required"));
            }
            
            if (year == null || year.isEmpty()) {
                logger.error("Year is empty");
                return ResponseEntity.badRequest().body(Map.of("error", "Year is required"));
            }
            
            if (region == null || region.isEmpty()) {
                logger.error("Region is empty");
                return ResponseEntity.badRequest().body(Map.of("error", "Region is required"));
            }
            
            if (vehicleType == null || vehicleType.isEmpty()) {
                logger.error("Vehicle type is empty");
                return ResponseEntity.badRequest().body(Map.of("error", "Vehicle type is required"));
            }
            
            // Validate vehicle type
            String typeToUse = (vehicleType != null && !vehicleType.isEmpty()) ? vehicleType : sheetName;
            if (typeToUse.equalsIgnoreCase("all")) {
                logger.error("Invalid vehicle type: all is not a valid selection for saving data");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "'all' is not a valid vehicle type for saving data"
                ));
            }
            
            logger.info("Saving data for sheet: {}, vehicle type: {}, year: {}, month: {}, region: {}, replaceExisting: {}", 
                    sheetName, typeToUse, year, month, region, replaceExisting);
            
            // First process and cache the file if not already done
            vehicleService.processAndCacheFile(file);
            
            // Extract data from the cached file
            List<VehicleRecord> records = vehicleService.extractDataFromCache(sheetName);
            
            FileDocument savedFile = null;
            int yearInt = 0;
            
            try {
                // Store file in MongoDB with the user-selected year
                yearInt = Integer.parseInt(year);
                savedFile = fileService.storeFile(file, typeToUse, yearInt, region);
                logger.info("File stored in MongoDB with ID: {} for year: {}", savedFile.getId(), year);
            } catch (NumberFormatException e) {
                logger.error("Invalid year format: {}", year, e);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid year format: " + year
                ));
            } catch (Exception e) {
                logger.error("Failed to save file to MongoDB", e);
                // Continue with saving records even if MongoDB storage failed
            }
            
            // Save the records to the database with the user-selected year
            // Make sure we're using the same year value that was provided by the user
            int savedCount = vehicleService.saveRecords(records, typeToUse, year, month, replaceExisting, region);
            
            logger.info("Saved {} records for {}/{} in region {}", savedCount, year, month, region);
            
            // Update MongoDB file metadata with the record count if file was stored
            if (savedFile != null) {
                try {
                    fileService.updateFileMetadata(savedFile.getId(), true, savedCount);
                    logger.info("Updated file metadata in MongoDB for ID: {}", savedFile.getId());
                } catch (Exception e) {
                    logger.error("Failed to update file metadata in MongoDB", e);
                    // Continue with response even if metadata update failed
                }
            }
            
            // Prepare response with file ID if available
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("Successfully saved %d records for %s (%s) in region %s", 
                savedCount, typeToUse, year, region));
            response.put("recordCount", savedCount);
            
            if (savedFile != null) {
                response.put("fileId", savedFile.getId());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error saving data", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}