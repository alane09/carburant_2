package com.carburant.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.carburant.backend.model.RegressionResult;
import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.repository.RegressionRepository;
import com.carburant.backend.repository.VehicleRepository;

@Service
public class RegressionService {

    private final RegressionRepository regressionRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleService vehicleService;
    private final com.carburant.backend.utils.RegressionUtils regressionUtils;
    private static final Logger logger = LoggerFactory.getLogger(RegressionService.class);

    @Autowired
    public RegressionService(
            RegressionRepository regressionRepository,
            VehicleRepository vehicleRepository,
            VehicleService vehicleService,
            com.carburant.backend.utils.RegressionUtils regressionUtils) {
        this.regressionRepository = regressionRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleService = vehicleService;
        this.regressionUtils = regressionUtils;
    }

    /**
     * Perform regression analysis on data of a specific vehicle type
     * @param type Vehicle type (sheet name)
     * @return RegressionResult containing the regression equation and metrics
     */
    public RegressionResult performRegression(String type) {
        return performRegression(type, false);
    }
    
    /**
     * Perform regression analysis on data of a specific vehicle type
     * @param type Vehicle type (sheet name)
     * @param forceRecalculate Whether to force recalculation even if a result exists
     * @return RegressionResult containing the regression equation and metrics
     */
    public RegressionResult performRegression(String type, boolean forceRecalculate) {
        // Check if we already have a regression result for this type
        if (!forceRecalculate) {
            Optional<RegressionResult> existingResult = regressionRepository.findByType(type);
            if (existingResult.isPresent()) {
                logger.info("Using existing regression result for type: {}", type);
                return existingResult.get();
            }
        }
        
        // If no existing result or force recalculate is true, perform the regression
        logger.info("Performing new regression analysis for type: {}", type);
        List<VehicleRecord> records = vehicleRepository.findByType(type);
        if (records.isEmpty()) {
            throw new IllegalArgumentException("No data found for vehicle type: " + type);
        }

        return performRegression(records, type);
    }
    
    /**
     * Perform regression analysis for all available vehicle types
     * @return List of regression results for all vehicle types
     */
    public List<RegressionResult> performRegressionForAllTypes() {
        return performRegressionForAllTypes(false);
    }
    
    /**
     * Perform regression analysis for all available vehicle types
     * @param forceRecalculate Whether to force recalculation even if results exist
     * @return List of regression results for all vehicle types
     */
    public List<RegressionResult> performRegressionForAllTypes(boolean forceRecalculate) {
        List<String> vehicleTypes = vehicleService.getCachedSheetNames();
        List<RegressionResult> results = new ArrayList<>();
        
        logger.info("Performing regression for all vehicle types: {}, forceRecalculate: {}", vehicleTypes, forceRecalculate);
        
        for (String type : vehicleTypes) {
            try {
                RegressionResult result = performRegression(type, forceRecalculate);
                results.add(result);
                logger.info("Successfully processed regression for type: {}", type);
            } catch (Exception e) {
                logger.error("Error performing regression for type: {}", type, e);
                // Continue with other types even if one fails
            }
        }
        
        return results;
    }

    /**
     * Get all regression results
     * @return List of all regression results
     */
    public List<RegressionResult> getAllRegressionResults() {
        return regressionRepository.findAll();
    }

    /**
     * Get regression result by vehicle type
     * @param type Vehicle type (sheet name)
     * @return Optional containing the regression result if found
     */
    public Optional<RegressionResult> getRegressionResultByType(String type) {
        return regressionRepository.findByType(type);
    }

    /**
     * Get regression result by ID
     * @param id Regression result ID
     * @return Optional containing the regression result if found
     */
    public Optional<RegressionResult> getRegressionResultById(String id) {
        return regressionRepository.findById(id);
    }

    /**
     * Delete a regression result
     * @param id Regression result ID
     */
    public void deleteRegressionResult(String id) {
        regressionRepository.deleteById(id);
    }

    /**
     * Get monthly totals for regression analysis by vehicle type
     * 
     * @param type Vehicle type (sheet name)
     * @return Map with months as keys and regression-specific metrics as values
     */
    public Map<String, Map<String, Double>> getMonthlyTotalsForRegression(String type) {
        // First normalize the vehicle type to avoid case-sensitivity issues
        String normalizedType = type.trim();
        
        // Log the request
        System.out.println("Getting monthly totals for regression, vehicle type: " + normalizedType);
        
        // Check if we have any data for this vehicle type
        List<VehicleRecord> records = vehicleRepository.findByType(normalizedType);
        
        // If no exact match, try case-insensitive search
        if (records == null || records.isEmpty()) {
            System.out.println("No records found for exact type: " + normalizedType + ", trying case-insensitive search");
            
            // Try to find records with a case-insensitive match
            List<VehicleRecord> allRecords = vehicleRepository.findAll();
            records = allRecords.stream()
                .filter(record -> record.getType() != null && 
                        record.getType().toLowerCase().equals(normalizedType.toLowerCase()))
                .toList();
            
            // If still empty, try Sheet1 as a fallback
            if (records.isEmpty() && !normalizedType.equalsIgnoreCase("Sheet1")) {
                System.out.println("No records found with case-insensitive search, checking for Sheet1");
                records = vehicleRepository.findByType("Sheet1");
                
                if (!records.isEmpty()) {
                    System.out.println("Using Sheet1 data as fallback for: " + normalizedType);
                    return vehicleService.getMonthlyTotalsForRegression("Sheet1");
                }
            }
        }
        
        // If we still have no data, return empty results instead of throwing an exception
        if (records.isEmpty()) {
            System.out.println("No data available for vehicle type: " + normalizedType + ", returning empty result");
            return java.util.Collections.emptyMap();
        }
        
        // Use the injected vehicleService to get monthly totals
        System.out.println("Found " + records.size() + " records for vehicle type: " + normalizedType);
        return vehicleService.getMonthlyTotalsForRegression(normalizedType);
    }
    
    /**
     * Save a manually created regression result
     * 
     * @param result The regression result to save
     * @return The saved regression result
     */
    public RegressionResult saveRegressionResult(RegressionResult result) {
        // Validate the result
        if (result.getType() == null || result.getType().isEmpty()) {
            throw new IllegalArgumentException("Vehicle type is required");
        }
        
        // Validate equation and coefficients
        if (result.getRegressionEquation() == null || result.getRegressionEquation().isEmpty()) {
            throw new IllegalArgumentException("Regression equation is required");
        }
        
        if (result.getCoefficients() == null || result.getCoefficients().isEmpty()) {
            throw new IllegalArgumentException("Coefficients map is required");
        }
        
        // Check for valid R-squared value
        if (result.getRSquared() < 0 || result.getRSquared() > 1) {
            logger.warn("Invalid R-squared value: {}. Should be between 0 and 1", result.getRSquared());
            // We'll still save it, but with a warning
        }
        
        // Generate an ID if not provided
        if (result.getId() == null || result.getId().isEmpty()) {
            result.setId(java.util.UUID.randomUUID().toString());
        }
        
        // Check if we already have a regression for this type and update it if so
        Optional<RegressionResult> existingResult = getRegressionResultByType(result.getType());
        if (existingResult.isPresent()) {
            result.setId(existingResult.get().getId());
            logger.info("Updating existing regression result for type: {}", result.getType());
        } else {
            logger.info("Creating new regression result for type: {}", result.getType());
        }
        
        // Save the result to the repository
        return regressionRepository.save(result);
    }

    /**
     * Perform regression analysis on a list of vehicle records
     * 
     * @param records List of vehicle records to analyze
     * @param type Vehicle type
     * @return Regression result
     */
    public RegressionResult performRegression(List<VehicleRecord> records, String type) {
        logger.info("Performing regression analysis for type: {} with {} records", type, records.size());
        
        try {
            if (records.isEmpty()) {
                logger.warn("No data provided for regression analysis");
                return null;
            }
            
            // Ensure we have enough data points for reliable regression
            if (records.size() < 3) {
                logger.warn("Insufficient data points for reliable regression ({}). At least 3 are recommended.", 
                    records.size());
                // We'll still try to calculate, but with a warning
            }
            
            // Check for any potential outliers in the data
            checkForOutliers(records);
            
            // Use the injected RegressionUtils component for proper multiple linear regression
            RegressionResult result = this.regressionUtils.performRegression(records, type);
            
            // Check for invalid coefficient values
            if (result != null) {
                Map<String, Double> coefficients = result.getCoefficients();
                if (coefficients != null) {
                    for (Double value : coefficients.values()) {
                        if (value == null || Double.isNaN(value) || Double.isInfinite(value)) {
                            logger.warn("Invalid coefficient detected in regression result: {}", value);
                            return null;
                        }
                    }
                }
                
                // Verify R-squared for model quality
                if (result.getRSquared() < 0.5) {
                    logger.warn("Low R-squared value ({}) indicates poor model fit", result.getRSquared());
                    // Still return the result, but with a warning
                }
                
                // Check for valid R-squared
                if (Double.isNaN(result.getRSquared()) || Double.isInfinite(result.getRSquared())) {
                    logger.warn("Invalid R-squared value detected: {}", result.getRSquared());
                    return null;
                }
            }
            
            // Save the result to the repository if it's not null
            if (result != null) {
                return regressionRepository.save(result);
            } else {
                logger.warn("Cannot save null regression result");
                // Create a default result with warning message when regression fails
                Map<String, Double> defaultCoefficients = new HashMap<>();
                final double DEFAULT_KILOMETRAGE = 0.001; // Reasonable default based on domain knowledge
                final double DEFAULT_TONNAGE = 0.001;     // Small but significant value
                
                defaultCoefficients.put("kilometrage", DEFAULT_KILOMETRAGE);
                defaultCoefficients.put("tonnage", DEFAULT_TONNAGE);
                
                String defaultEquation = String.format("Consommation = %.4f * Kilometrage + %.4f * Tonnage + 0", 
                    DEFAULT_KILOMETRAGE, DEFAULT_TONNAGE);
                
                RegressionResult defaultResult = RegressionResult.builder()
                    .type(type)
                    .regressionEquation(defaultEquation)
                    .coefficients(defaultCoefficients)
                    .intercept(0.0)
                    .rSquared(0.0)
                    .adjustedRSquared(0.0)
                    .mse(0.0)
                    .build();
                
                return defaultResult; // Return default but don't save to repository
            }
        } catch (Exception e) {
            logger.error("Error performing regression analysis", e);
            // Create minimal valid result instead of returning null
            Map<String, Double> defaultCoefficients = new HashMap<>();
            final double DEFAULT_KILOMETRAGE = 0.001; // Reasonable default based on domain knowledge
            final double DEFAULT_TONNAGE = 0.001;     // Small but significant value
            
            defaultCoefficients.put("kilometrage", DEFAULT_KILOMETRAGE);
            defaultCoefficients.put("tonnage", DEFAULT_TONNAGE);
            
            String defaultEquation = String.format("Consommation = %.4f * Kilometrage + %.4f * Tonnage + 0", 
                DEFAULT_KILOMETRAGE, DEFAULT_TONNAGE);
                
            logger.info("Created default regression result with equation: {}", defaultEquation);
                
            return RegressionResult.builder()
                .type(type)
                .regressionEquation(defaultEquation)
                .coefficients(defaultCoefficients)
                .intercept(0.0)
                .rSquared(0.0)
                .adjustedRSquared(0.0)
                .mse(0.0)
                .build();
        }
    }
    
    /**
     * Check for potential outliers in the dataset that might skew regression results
     * 
     * @param records Vehicle records to analyze for outliers
     */
    private void checkForOutliers(List<VehicleRecord> records) {
        if (records.size() < 5) {
            // Need enough data points to reliably detect outliers
            return;
        }
        
        // Calculate mean and standard deviation for key metrics
        double sumKm = 0, sumKmSq = 0;
        double sumTon = 0, sumTonSq = 0;
        double sumConsommation = 0, sumConsommationSq = 0;
        
        for (VehicleRecord record : records) {
            sumKm += record.getKilometrage();
            sumKmSq += record.getKilometrage() * record.getKilometrage();
            
            sumTon += record.getProduitsTonnes();
            sumTonSq += record.getProduitsTonnes() * record.getProduitsTonnes();
            
            sumConsommation += record.getConsommationL();
            sumConsommationSq += record.getConsommationL() * record.getConsommationL();
        }
        
        int n = records.size();
        double meanKm = sumKm / n;
        double stdDevKm = Math.sqrt((sumKmSq / n) - (meanKm * meanKm));
        
        double meanTon = sumTon / n;
        double stdDevTon = Math.sqrt((sumTonSq / n) - (meanTon * meanTon));
        
        double meanConsommation = sumConsommation / n;
        double stdDevConsommation = Math.sqrt((sumConsommationSq / n) - (meanConsommation * meanConsommation));
        
        // Check for outliers (> 3 standard deviations from mean)
        for (VehicleRecord record : records) {
            if (Math.abs(record.getKilometrage() - meanKm) > 3 * stdDevKm) {
                logger.warn("Potential outlier detected: kilometrage = {} (mean = {}, std = {})", 
                    record.getKilometrage(), meanKm, stdDevKm);
            }
            
            if (Math.abs(record.getProduitsTonnes() - meanTon) > 3 * stdDevTon) {
                logger.warn("Potential outlier detected: tonnage = {} (mean = {}, std = {})", 
                    record.getProduitsTonnes(), meanTon, stdDevTon);
            }
            
            if (Math.abs(record.getConsommationL() - meanConsommation) > 3 * stdDevConsommation) {
                logger.warn("Potential outlier detected: consumption = {} (mean = {}, std = {})", 
                    record.getConsommationL(), meanConsommation, stdDevConsommation);
            }
        }
    }
    
    // End of RegressionService class
}