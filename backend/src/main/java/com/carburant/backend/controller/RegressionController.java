package com.carburant.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

import com.carburant.backend.model.RegressionResult;
import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.service.RegressionService;
import com.carburant.backend.service.VehicleService;

/**
 * Controller for handling regression operations
 * This endpoint handles SER (Situation Énergétique de Référence) related operations
 */
@RestController
@RequestMapping("/regression")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")
public class RegressionController {

    private static final Logger logger = LoggerFactory.getLogger(RegressionController.class);
    private final VehicleService vehicleService;
    private final RegressionService regressionService;
    
    @Autowired
    private com.carburant.backend.repository.RegressionRepository regressionRepository;
    
    @Autowired
    private com.carburant.backend.utils.RegressionUtils regressionUtils;

    @Autowired
    public RegressionController(VehicleService vehicleService, RegressionService regressionService) {
        this.vehicleService = vehicleService;
        this.regressionService = regressionService;
    }

    /**
     * Perform regression analysis on data of a specific vehicle type
     * @param type Vehicle type (sheet name)
     * @param forceRecalculate Whether to force recalculation even if results exist
     * @return RegressionResult containing the regression equation and metrics
     */
    @GetMapping("/monthly-totals/{type}")
    public ResponseEntity<?> getMonthlyTotals(@PathVariable String type, @RequestParam(required = false) boolean force) {
        logger.info("Getting monthly totals for type: {}, force: {}", type, force);
        
        try {
            // Get all records for this type - handle the case where type="all" specially
            List<VehicleRecord> records;
            if ("all".equalsIgnoreCase(type)) {
                records = vehicleService.getAllRecords();
                logger.info("Retrieved all records for monthly totals, count: {}", records.size());
            } else {
                records = vehicleService.getRecordsByType(type);
                logger.info("Retrieved records for type {}, count: {}", type, records.size());
            }
            
            if (records.isEmpty()) {
                logger.warn("No records found for type: {}", type);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No records found for type: " + type));
            }
            
            // Validate data before regression
            records = validateAndCleanData(records);
            
            if (records.isEmpty()) {
                logger.warn("No valid records found for regression after data cleaning for type: {}", type);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "No valid records found for regression after data cleaning"));
            }
            
            // Perform regression
            RegressionResult result = regressionUtils.performRegression(records, type);
            
            try {
                // Save the new regression result (don't try to update existing ones to avoid conflicts)
                RegressionResult savedResult = regressionRepository.save(result);
                
                // Log the regression result
                logger.info("Regression result for type {}: {}", type, savedResult);
                
                return ResponseEntity.ok(savedResult);
            } catch (Exception e) {
                logger.warn("Could not save regression result to database: {}", e.getMessage());
                // Return the calculated result even if we couldn't save it
                return ResponseEntity.ok(result);
            }
        } catch (Exception e) {
            logger.error("Error getting monthly totals for type: {}", type, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error getting monthly totals: " + e.getMessage()));
        }
    }
    
    /**
     * Validates and cleans data before regression analysis
     * @param records The records to validate and clean
     * @return Cleaned list of records suitable for regression
     */
    private List<VehicleRecord> validateAndCleanData(List<VehicleRecord> records) {
        if (records == null || records.isEmpty()) {
            return List.of();
        }
        
        // Remove records with missing or invalid data
        return records.stream()
            .filter(record -> record.getConsommationL() > 0)
            .filter(record -> record.getKilometrage() > 0)
            .filter(record -> true) // All records should have tonnage, but we don't filter on it
            .collect(Collectors.toList());
    }

    /**
     * Get all regression results
     * @return List of all regression results
     */
    @GetMapping
    public ResponseEntity<List<RegressionResult>> getAllRegressionResults() {
        return ResponseEntity.ok(regressionService.getAllRegressionResults());
    }

    /**
     * Perform regression analysis on data of a specific vehicle type
     * This endpoint is called by the frontend to generate regression equations
     * 
     * @param type Vehicle type (sheet name)
     * @return RegressionResult containing the regression equation and metrics
     */
    @PostMapping("/perform/{type}")
    public ResponseEntity<?> performRegression(@PathVariable String type) {
        logger.info("Performing regression for type: {}", type);
        
        try {
            // Get all records for this type - handle the case where type="all" specially
            List<VehicleRecord> records;
            if ("all".equalsIgnoreCase(type)) {
                records = vehicleService.getAllRecords();
                logger.info("Retrieved all records for regression, count: {}", records.size());
            } else {
                records = vehicleService.getRecordsByType(type);
                logger.info("Retrieved records for type {}, count: {}", type, records.size());
            }
            
            if (records.isEmpty()) {
                logger.warn("No records found for type: {}", type);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No records found for type: " + type));
            }
            
            // Validate data before regression
            records = validateAndCleanData(records);
            
            if (records.isEmpty()) {
                logger.warn("No valid records found for regression after data cleaning for type: {}", type);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "No valid records found for regression after data cleaning"));
            }
            
            // Perform regression
            RegressionResult result = regressionUtils.performRegression(records, type);
            
            try {
                // Save the new regression result (don't try to update existing ones to avoid conflicts)
                RegressionResult savedResult = regressionRepository.save(result);
                
                // Log the regression result
                logger.info("Regression result for type {}: {}", type, savedResult);
                
                return ResponseEntity.ok(savedResult);
            } catch (Exception e) {
                logger.warn("Could not save regression result to database: {}", e.getMessage());
                // Return the calculated result even if we couldn't save it
                return ResponseEntity.ok(result);
            }
        } catch (Exception e) {
            logger.error("Error performing regression for type: {}", type, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error performing regression: " + e.getMessage()));
        }
    }
    
    /**
     * Get regression result by vehicle type
     * 
     * @param type Vehicle type
     * @return Regression result or 404 if not found
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<RegressionResult> getRegressionByType(@PathVariable String type) {
        logger.info("Getting regression result for type: {}", type);
        
        try {
            // First try to get all results using the findAllByType method
            try {
                List<RegressionResult> results = regressionRepository.findAllByType(type);
                
                if (!results.isEmpty()) {
                    // Return the most recent result (assuming it's the most relevant)
                    logger.info("Found {} regression results for type: {}, returning the most recent one", results.size(), type);
                    return ResponseEntity.ok(results.get(0));
                }
            } catch (Exception e) {
                logger.warn("Error using findAllByType for type: {}, falling back to findAll", type);
                // Fallback: get all results and filter manually
                List<RegressionResult> allResults = regressionRepository.findAll();
                List<RegressionResult> filteredResults = allResults.stream()
                    .filter(result -> type.equals(result.getType()))
                    .collect(Collectors.toList());
                
                if (!filteredResults.isEmpty()) {
                    logger.info("Found {} regression results for type: {} using fallback method", filteredResults.size(), type);
                    return ResponseEntity.ok(filteredResults.get(0));
                }
            }
            
            logger.info("No regression result found for type: {}", type);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting regression result for type: {}", type, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get regression result by ID
     * @param id Regression result ID
     * @return The regression result
     */
    @GetMapping("/{id}")
    public ResponseEntity<RegressionResult> getRegressionResultById(@PathVariable String id) {
        return regressionService.getRegressionResultById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a regression result
     * @param id Regression result ID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRegressionResult(@PathVariable String id) {
        if (regressionService.getRegressionResultById(id).isPresent()) {
            regressionService.deleteRegressionResult(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Get monthly aggregated data for regression analysis
     * Used for SER calculations and visualization
     * 
     * @param type Vehicle type
     * @return Map of months with aggregated metrics
     */
    @GetMapping("/monthly-aggregated/{type}")
    public ResponseEntity<?> getMonthlyAggregatedData(@PathVariable String type) {
        logger.info("Getting monthly totals for regression analysis for type: {}", type);
        
        try {
            // Get records for the specified vehicle type, or all if type=all
            List<VehicleRecord> records;
            if ("all".equalsIgnoreCase(type)) {
                records = vehicleService.getAllRecords();
                logger.info("Retrieved all records for monthly totals, count: {}", records.size());
            } else {
                records = vehicleService.getRecordsByType(type);
                logger.info("Retrieved records for type {}, count: {}", type, records.size());
            }
            
            if (records.isEmpty()) {
                logger.warn("No records found for type: {}", type);
                return ResponseEntity.ok(new HashMap<>());
            }
            
            // Filter out invalid records to prevent calculation errors
            records = records.stream()
                .filter(record -> record.getKilometrage() >= 0 && 
                                 record.getConsommationL() >= 0 &&
                                 record.getMois() != null &&
                                 !record.getMois().trim().isEmpty())
                .collect(Collectors.toList());
            
            logger.info("After filtering invalid data, valid record count: {}", records.size());
            
            // Group records by month and calculate aggregated metrics
            Map<String, Map<String, Double>> monthlyData = records.stream()
                .collect(Collectors.groupingBy(
                    VehicleRecord::getMois,
                    Collectors.collectingAndThen(
                        Collectors.toList(),
                        recordsList -> {
                            Map<String, Double> metrics = new HashMap<>();
                            
                            // Calculate sums for relevant metrics with safety checks
                            double totalConsommation = recordsList.stream()
                                .mapToDouble(VehicleRecord::getConsommationL)
                                .filter(v -> !Double.isNaN(v) && !Double.isInfinite(v))
                                .sum();
                            
                            double totalKilometrage = recordsList.stream()
                                .mapToDouble(VehicleRecord::getKilometrage)
                                .filter(v -> !Double.isNaN(v) && !Double.isInfinite(v))
                                .sum();
                            
                            double totalTonnage = recordsList.stream()
                                .mapToDouble(VehicleRecord::getProduitsTonnes)
                                .filter(v -> !Double.isNaN(v) && !Double.isInfinite(v))
                                .sum();
                            
                            // Calculate average IPE with safety check
                            double avgIpe = totalKilometrage > 0 
                                ? (totalConsommation * 100) / totalKilometrage 
                                : 0;
                            
                            // Format values to 4 decimal places for consistency with Excel output
                            double roundedConsommation = Math.round(totalConsommation * 10000) / 10000.0;
                            double roundedKilometrage = Math.round(totalKilometrage * 10000) / 10000.0;
                            double roundedTonnage = Math.round(totalTonnage * 10000) / 10000.0;
                            double roundedIpe = Math.round(avgIpe * 10000) / 10000.0;
                            
                            // Calculate IPE for tonnage with safety checks
                            double ipeL100TonneKm = 0.0;
                            if (totalTonnage > 0 && totalKilometrage > 0) {
                                double divisor = (totalTonnage * totalKilometrage / 100);
                                if (divisor > 0) {
                                    ipeL100TonneKm = (totalConsommation * 100) / divisor;
                                    // Round for consistency
                                    ipeL100TonneKm = Math.round(ipeL100TonneKm * 10000) / 10000.0;
                                }
                            }
                            
                            // Store metrics in map with Excel-equivalent precision
                            metrics.put("totalConsommationL", roundedConsommation);
                            metrics.put("totalKilometrage", roundedKilometrage);
                            metrics.put("totalProduitsTonnes", roundedTonnage);
                            metrics.put("avgIpeL100km", roundedIpe);
                            metrics.put("avgIpeL100TonneKm", ipeL100TonneKm);
                            
                            // Add month number for proper chronological sorting
                            try {
                                if (!recordsList.isEmpty() && recordsList.get(0).getMois() != null) {
                                    String monthName = recordsList.get(0).getMois().trim();
                                    int monthValue = getMonthValue(monthName);
                                    metrics.put("monthNumeric", (double) monthValue);
                                }
                            } catch (Exception e) {
                                logger.warn("Could not parse month value for sorting: {}", e.getMessage());
                            }
                            
                            return metrics;
                        }
                    )
                ));
            
            logger.info("Generated monthly data for {} months", monthlyData.size());
            return ResponseEntity.ok(monthlyData);
            
        } catch (Exception e) {
            logger.error("Error getting monthly totals for regression", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Save a manually created regression result
     * 
     * @param regressionResult The regression result to save
     * @return The saved regression result
     */
    @PostMapping("/save-manual")
    public ResponseEntity<RegressionResult> saveManualRegressionResult(@RequestBody RegressionResult regressionResult) {
        logger.info("Saving manual regression result for type: {}", regressionResult.getType());
        
        try {
            RegressionResult savedResult = regressionService.saveRegressionResult(regressionResult);
            return ResponseEntity.ok(savedResult);
        } catch (Exception e) {
            logger.error("Error saving manual regression result", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Convert French month name to numeric month value (1-12)
     * This helps with proper sorting of monthly data
     * 
     * @param monthName French month name
     * @return Month number (1-12) or 0 if not recognized
     */
    private int getMonthValue(String monthName) {
        if (monthName == null || monthName.isEmpty()) {
            return 0;
        }
        
        // Normalize month name for comparison
        String normalizedMonth = monthName.trim().toLowerCase();
        
        // Map French month names to numeric values
        switch (normalizedMonth) {
            case "janvier": return 1;
            case "février": 
            case "fevrier": return 2;
            case "mars": return 3;
            case "avril": return 4;
            case "mai": return 5;
            case "juin": return 6;
            case "juillet": return 7;
            case "août": 
            case "aout": return 8;
            case "septembre": return 9;
            case "octobre": return 10;
            case "novembre": return 11;
            case "décembre": 
            case "decembre": return 12;
            default:
                // Handle numeric month formats like "01", "02", etc.
                try {
                    int monthNum = Integer.parseInt(normalizedMonth);
                    if (monthNum >= 1 && monthNum <= 12) {
                        return monthNum;
                    }
                } catch (NumberFormatException e) {
                    // Not a numeric month, continue with pattern matching
                }
                
                // Handle abbreviated month names or partial matches
                if (normalizedMonth.startsWith("jan")) return 1;
                if (normalizedMonth.startsWith("fév") || normalizedMonth.startsWith("fev")) return 2;
                if (normalizedMonth.startsWith("mar")) return 3;
                if (normalizedMonth.startsWith("avr")) return 4;
                if (normalizedMonth.startsWith("mai")) return 5;
                if (normalizedMonth.startsWith("juin")) return 6;
                if (normalizedMonth.startsWith("juil")) return 7;
                if (normalizedMonth.startsWith("aoû") || normalizedMonth.startsWith("aou")) return 8;
                if (normalizedMonth.startsWith("sep")) return 9;
                if (normalizedMonth.startsWith("oct")) return 10;
                if (normalizedMonth.startsWith("nov")) return 11;
                if (normalizedMonth.startsWith("déc") || normalizedMonth.startsWith("dec")) return 12;
                
                logger.warn("Unrecognized month name: {}", monthName);
                return 0;
        }
    }
}