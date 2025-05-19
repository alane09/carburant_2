package com.carburant.backend.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.service.VehicleService;

@RestController
@RequestMapping("/records") // Changed from "/api/records" because server.servlet.context-path already adds "/api"
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class VehicleController {

    private final VehicleService vehicleService;
    private static final Logger logger = LoggerFactory.getLogger(VehicleController.class);

    @Autowired
    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    /**
     * Get all vehicle records or filter by multiple parameters
     * @param type Optional vehicle type to filter by
     * @param mois Optional month to filter by
     * @param matricule Optional vehicle registration number to filter by
     * @param year Optional year to filter by
     * @return List of vehicle records
     */
    @GetMapping
    public ResponseEntity<List<VehicleRecord>> getRecords(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "mois", required = false) String mois,
            @RequestParam(value = "matricule", required = false) String matricule,
            @RequestParam(value = "year", required = false) String year) {
        
        // Log filtering parameters for debugging
        logger.info("Filtering records - type: {}, mois: {}, matricule: {}, year: {}", 
                    type, mois, matricule, year);
        
        // Check for combinations of parameters and call the appropriate service method
        
        // Filter by all parameters (type, year, mois, matricule)
        if (type != null && !type.isEmpty() && 
            year != null && !year.isEmpty() && 
            mois != null && !mois.isEmpty() && 
            matricule != null && !matricule.isEmpty()) {
            // Using the new repository method
            return ResponseEntity.ok(vehicleService.getRecordsByTypeAndMatriculeAndYearAndMois(type, matricule, year, mois));
        }
        
        // Filter by type, year, and matricule
        if (type != null && !type.isEmpty() && 
            year != null && !year.isEmpty() && 
            matricule != null && !matricule.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByTypeMatriculeAndYear(type, matricule, year));
        }
        
        // Filter by type, year, and month
        if (type != null && !type.isEmpty() && 
            year != null && !year.isEmpty() && 
            mois != null && !mois.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByTypeYearAndMonth(type, year, mois));
        }
        
        // Filter by matricule, year, and month
        if (matricule != null && !matricule.isEmpty() && 
            year != null && !year.isEmpty() && 
            mois != null && !mois.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByMatriculeAndYearAndMois(matricule, year, mois));
        }
        
        // Filter by type and matricule
        if (type != null && !type.isEmpty() && 
            matricule != null && !matricule.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByTypeAndMatricule(type, matricule));
        }
        
        // Filter by type and year
        if (type != null && !type.isEmpty() && 
            year != null && !year.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByTypeAndYear(type, year));
        }
        
        // Filter by matricule and year
        if (matricule != null && !matricule.isEmpty() && 
            year != null && !year.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByMatriculeAndYear(matricule, year));
        }
        
        // Filter by year and month
        if (year != null && !year.isEmpty() && 
            mois != null && !mois.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByYearAndMois(year, mois));
        }
        
        // Filter by year only
        if (year != null && !year.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByYear(year));
        }
        
        // Filter by matricule only
        if (matricule != null && !matricule.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByMatricule(matricule));
        }
        
        // Filter by type and month (original logic)
        if (type != null && !type.isEmpty() && mois != null && !mois.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByTypeAndMonth(type, mois));
        }
        
        // Filter by type only
        if (type != null && !type.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByType(type));
        }
        
        // Filter by month only
        if (mois != null && !mois.isEmpty()) {
            return ResponseEntity.ok(vehicleService.getRecordsByMonth(mois));
        }
        
        // No filters, return all records
        return ResponseEntity.ok(vehicleService.getAllRecords());
    }

    /**
     * Get monthly aggregated data for a specific vehicle type
     * @param vehicleType Vehicle type
     * @param year Year
     * @param dateFrom Start date
     * @param dateTo End date
     * @return List of monthly aggregated data
     */
    @GetMapping("/monthly-aggregation")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyAggregatedData(
            @RequestParam(value = "vehicleType", required = false) String vehicleType,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "dateFrom", required = false) String dateFrom,
            @RequestParam(value = "dateTo", required = false) String dateTo) {
        
        logger.info("Getting monthly aggregation - vehicleType: {}, year: {}, dateFrom: {}, dateTo: {}", 
                    vehicleType, year, dateFrom, dateTo);
        
        try {
            List<Map<String, Object>> aggregatedData = vehicleService.getMonthlyAggregatedData(
                vehicleType != null && !vehicleType.equals("all") ? vehicleType : null,
                year,
                dateFrom,
                dateTo
            );
            
            if (aggregatedData == null || aggregatedData.isEmpty()) {
                logger.warn("No data found for the specified filters");
                return ResponseEntity.ok(List.of());
            }
            
            return ResponseEntity.ok(aggregatedData);
        } catch (Exception e) {
            logger.error("Error getting monthly aggregation data", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get vehicle performance data for comparison
     * @param type Vehicle type
     * @param includeSheetData Whether to include data from 'Sheet1' when type is 'all'
     * @return List of vehicles with their performance metrics
     */
    @GetMapping("/performance")
    public ResponseEntity<List<Map<String, Object>>> getVehiclePerformanceData(
            @RequestParam("type") String type,
            @RequestParam(value = "includeSheetData", required = false, defaultValue = "false") boolean includeSheetData) {
        
        // If type is 'all' and we want to include sheet data, try both types
        if ("all".equalsIgnoreCase(type) && includeSheetData) {
            List<Map<String, Object>> allData = vehicleService.getVehiclePerformanceData("all");
            
            // If no data from 'all', try with 'Sheet1'
            if (allData == null || allData.isEmpty()) {
                List<Map<String, Object>> sheetData = vehicleService.getVehiclePerformanceData("Sheet1");
                if (sheetData != null && !sheetData.isEmpty()) {
                    return ResponseEntity.ok(sheetData);
                }
            }
            
            return ResponseEntity.ok(allData);
        }
        
        return ResponseEntity.ok(vehicleService.getVehiclePerformanceData(type));
    }

    /**
     * Get a vehicle record by ID
     * @param id Record ID
     * @return The vehicle record
     */
    @GetMapping("/{id}")
    public ResponseEntity<VehicleRecord> getRecordById(@PathVariable String id) {
        return vehicleService.getRecordById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new vehicle record
     * @param record The record data
     * @return The created vehicle record
     */
    @PostMapping
    public ResponseEntity<VehicleRecord> createRecord(@RequestBody VehicleRecord record) {
        return ResponseEntity.ok(vehicleService.saveRecord(record));
    }

    /**
     * Update all fields of a vehicle record
     * @param id Record ID
     * @param record The updated record data
     * @return The updated vehicle record
     */
    @PutMapping("/{id}")
    public ResponseEntity<VehicleRecord> updateRecord(
            @PathVariable String id,
            @RequestBody VehicleRecord record) {
        try {
            return ResponseEntity.ok(vehicleService.updateRecord(id, record));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Partially update a vehicle record
     * @param id Record ID
     * @param record The partial record data to update
     * @return The updated vehicle record
     */
    @PatchMapping("/{id}")
    public ResponseEntity<VehicleRecord> partialUpdateRecord(
            @PathVariable String id,
            @RequestBody VehicleRecord record) {
        try {
            return vehicleService.getRecordById(id)
                    .map(existingRecord -> {
                        // Update only non-null fields
                        if (record.getType() != null) {
                            existingRecord.setType(record.getType());
                        }
                        if (record.getMois() != null) {
                            existingRecord.setMois(record.getMois());
                        }
                        if (record.getMatricule() != null) {
                            existingRecord.setMatricule(record.getMatricule());
                        }
                        if (record.getRawValues() != null) {
                            existingRecord.setRawValues(record.getRawValues());
                        }
                        
                        // Update numeric fields
                        existingRecord.setConsommationL(record.getConsommationL());
                        existingRecord.setConsommationTEP(record.getConsommationTEP());
                        existingRecord.setCoutDT(record.getCoutDT());
                        existingRecord.setKilometrage(record.getKilometrage());
                        existingRecord.setProduitsTonnes(record.getProduitsTonnes());
                        existingRecord.setIpeL100km(record.getIpeL100km());
                        existingRecord.setIpeL100TonneKm(record.getIpeL100TonneKm());
                        
                        return ResponseEntity.ok(vehicleService.saveRecord(existingRecord));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete a vehicle record
     * @param id Record ID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable String id) {
        if (vehicleService.getRecordById(id).isPresent()) {
            vehicleService.deleteRecord(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}