package com.carburant.backend.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.TreeMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.carburant.backend.model.VehicleRecord;
import com.carburant.backend.repository.VehicleRepository;

@Service
public class VehicleService {

    private static final Logger logger = LoggerFactory.getLogger(VehicleService.class);
    private final VehicleRepository vehicleRepository;
    private final ExcelService excelService;
    private final MongoTemplate mongoTemplate;
    
    // Cache for the uploaded file and its sheet names
    private byte[] cachedFileContent; // Store file content as bytes instead of MultipartFile
    private String cachedFileName;
    private List<String> cachedSheetNames;

    @Autowired
    public VehicleService(VehicleRepository vehicleRepository, ExcelService excelService, MongoTemplate mongoTemplate) {
        this.vehicleRepository = vehicleRepository;
        this.excelService = excelService;
        this.mongoTemplate = mongoTemplate;
        this.cachedSheetNames = new ArrayList<>();
    }

    /**
     * Process and cache the uploaded file for later extraction
     * @param file The uploaded Excel file
     * @return List of sheet names
     */
    public List<String> processAndCacheFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            logger.error("Empty file received for caching");
            throw new IllegalArgumentException("File cannot be empty");
        }
        
        logger.info("Processing and caching file: {}", file.getOriginalFilename());
        
        // Store the file content and name
        this.cachedFileContent = file.getBytes();
        this.cachedFileName = file.getOriginalFilename();
        
        // Extract sheet names from the file
        this.cachedSheetNames = excelService.extractSheetNames(file);
        
        logger.info("Successfully cached file: {} with {} sheets", this.cachedFileName, this.cachedSheetNames.size());
        return this.cachedSheetNames;
    }
    
    /**
     * Extract data from a specific sheet in the cached file WITHOUT saving to database
     * @param sheetName The name of the sheet to extract from
     * @return List of extracted VehicleRecord objects (not saved to database)
     */
    public List<VehicleRecord> extractDataFromCacheWithoutSaving(String sheetName) throws IOException {
        if (cachedFileContent == null || cachedFileContent.length == 0) {
            logger.error("No file content is cached for extraction");
            throw new IllegalStateException("No file has been uploaded. Please upload a file first.");
        }
        
        logger.info("Extracting data from cached file sheet: {} (WITHOUT SAVING TO DATABASE)", sheetName);
        
        // Create a new input stream from the cached file content
        ByteArrayInputStream inputStream = new ByteArrayInputStream(cachedFileContent);
        
        // Extract data using the cached file content
        ExcelService.ExtractionResult extractionResult = excelService.extractDataFromInputStream(inputStream, sheetName);
        List<VehicleRecord> records = extractionResult.getVehicleRecords();
        logger.info("Extracted {} records from sheet {} (NOT SAVED TO DATABASE)", records.size(), sheetName);
        
        return records;
    }

    /**
     * Extract data from a specific sheet in the cached file
     * @param sheetName The name of the sheet to extract from
     * @param replaceExisting Whether to replace existing records
     * @return List of extracted and saved VehicleRecord objects
     */
    public List<VehicleRecord> extractDataFromCache(String sheetName, boolean replaceExisting) throws IOException {
        if (cachedFileContent == null || cachedFileContent.length == 0) {
            logger.error("No file content is cached for extraction");
            throw new IllegalStateException("No file has been uploaded. Please upload a file first.");
        }
        
        logger.info("Extracting data from cached file sheet: {}, replaceExisting: {}", sheetName, replaceExisting);
        
        // Create a new input stream from the cached file content
        ByteArrayInputStream inputStream = new ByteArrayInputStream(cachedFileContent);
        
        // Extract data using the cached file content
        ExcelService.ExtractionResult extractionResult = excelService.extractDataFromInputStream(inputStream, sheetName);
        List<VehicleRecord> records = extractionResult.getVehicleRecords();
        logger.info("Extracted {} records from sheet {}", records.size(), sheetName);
        
        // Save records with duplicate prevention
        return saveRecordsWithDuplicatePrevention(records, sheetName, replaceExisting);
    }
    
    /**
     * Extract data from a specific sheet in the cached file
     * Default behavior is to replace existing records for backward compatibility
     * @param sheetName The name of the sheet to extract from
     * @return List of extracted and saved VehicleRecord objects
     */
    public List<VehicleRecord> extractDataFromCache(String sheetName) throws IOException {
        return extractDataFromCache(sheetName, true);
    }

    /**
     * Extract data from a specific sheet and save to database
     * @param file The uploaded Excel file
     * @param sheetName The name of the sheet to extract from
     * @param replaceExisting Whether to replace existing records
     * @return List of saved VehicleRecord objects
     */
    public List<VehicleRecord> extractAndSaveData(MultipartFile file, String sheetName, boolean replaceExisting) throws IOException {
        logger.info("Extracting data from sheet: {}, replaceExisting: {}", sheetName, replaceExisting);
        ExcelService.ExtractionResult extractionResult = excelService.extractData(file, sheetName);
        List<VehicleRecord> records = extractionResult.getVehicleRecords();
        logger.info("Extracted {} records from sheet {}", records.size(), sheetName);
        
        // Save records with duplicate prevention
        return saveRecordsWithDuplicatePrevention(records, sheetName, replaceExisting);
    }
    
    /**
     * Extract data from a specific sheet and save to database
     * Default behavior is to replace existing records for backward compatibility
     * @param file The uploaded Excel file
     * @param sheetName The name of the sheet to extract from
     * @return List of saved VehicleRecord objects
     */
    public List<VehicleRecord> extractAndSaveData(MultipartFile file, String sheetName) throws IOException {
        return extractAndSaveData(file, sheetName, true);
    }
    
    /**
     * Save records with duplicate prevention
     * @param records List of vehicle records to save
     * @param sheetName The name of the sheet the records were extracted from
     * @param replaceExisting Whether to replace existing records
     * @return List of saved VehicleRecord objects
     */
    private List<VehicleRecord> saveRecordsWithDuplicatePrevention(List<VehicleRecord> records, String sheetName, boolean replaceExisting) {
        if (records == null || records.isEmpty()) {
            logger.info("No records to save for sheet: {}", sheetName);
            return List.of();
        }
        
        if (replaceExisting) {
            // Traditional approach: delete all existing records of this type first
            logger.info("Deleting existing records for type: {}", sheetName);
            vehicleRepository.deleteByType(sheetName);
            
            // Save all extracted records
            List<VehicleRecord> savedRecords = vehicleRepository.saveAll(records);
            logger.info("Saved {} records to database", savedRecords.size());
            return savedRecords;
        } else {
            // Selective update approach: check for duplicates based on natural keys
            logger.info("Using selective update approach to prevent duplicates for sheet: {}", sheetName);
            List<VehicleRecord> existingRecords = vehicleRepository.findByType(sheetName);
            logger.info("Found {} existing records for type: {}", existingRecords.size(), sheetName);
            
            // Create a map of existing records based on natural keys for quick lookup
            Map<String, VehicleRecord> existingRecordsMap = new HashMap<>();
            for (VehicleRecord record : existingRecords) {
                // Create a composite key using matricule + mois + year
                String key = generateNaturalKey(record);
                existingRecordsMap.put(key, record);
            }
            
            // Process new records
            List<VehicleRecord> recordsToSave = new ArrayList<>();
            int updatedCount = 0;
            int newCount = 0;
            
            for (VehicleRecord record : records) {
                // Make sure type is set correctly
                record.setType(sheetName);
                
                // Create composite key for lookup
                String key = generateNaturalKey(record);
                
                if (existingRecordsMap.containsKey(key)) {
                    // Update existing record
                    VehicleRecord existingRecord = existingRecordsMap.get(key);
                    record.setId(existingRecord.getId()); // Keep the same ID
                    updatedCount++;
                } else {
                    // New record
                    newCount++;
                }
                recordsToSave.add(record);
            }
            
            // Save all records (updates + new)
            List<VehicleRecord> savedRecords = vehicleRepository.saveAll(recordsToSave);
            logger.info("Saved {} records to database ({} updated, {} new)", savedRecords.size(), updatedCount, newCount);
            return savedRecords;
        }
    }
    
    /**
     * Generate a natural key for a vehicle record
     * @param record The vehicle record
     * @return A string representing the natural key
     */
    private String generateNaturalKey(VehicleRecord record) {
        return String.format("%s:%s:%s:%s", 
            record.getType() == null ? "" : record.getType(), 
            record.getMatricule() == null ? "" : record.getMatricule(), 
            record.getMois() == null ? "" : record.getMois(), 
            record.getYear() == null ? "" : record.getYear());
    }

    /**
     * Get sheet names from the cached file
     * @return List of sheet names
     */
    public List<String> getCachedSheetNames() {
        if (cachedSheetNames == null || cachedSheetNames.isEmpty()) {
            logger.info("No sheet names are cached. Returning default vehicle types.");
            // Return a list of default vehicle types if no file has been uploaded
            List<String> defaultTypes = new ArrayList<>();
            defaultTypes.add("all");
            
            try {
                // Get unique vehicle types from the database if available
                List<String> dbTypes = vehicleRepository.findDistinctTypes();
                
                if (dbTypes != null && !dbTypes.isEmpty()) {
                    defaultTypes.addAll(dbTypes);
                    logger.info("Added {} vehicle types from database", dbTypes.size());
                }
            } catch (Exception e) {
                logger.warn("Could not retrieve vehicle types from database: {}", e.getMessage());
                // Add some default types that are commonly used
                defaultTypes.add("camions");
                defaultTypes.add("voitures");
            }
            
            return defaultTypes;
        }
        return cachedSheetNames;
    }

    /**
     * Get all sheet names from uploaded Excel file
     * @param file The uploaded Excel file
     * @return List of sheet names
     */
    public List<String> getSheetNames(MultipartFile file) throws IOException {
        return excelService.extractSheetNames(file);
    }

    /**
     * Get all vehicle records
     * @return List of all vehicle records
     */
    public List<VehicleRecord> getAllRecords() {
        return vehicleRepository.findAll();
    }

    /**
     * Get vehicle records by type
     * @param type Vehicle type (sheet name)
     * @return List of vehicle records of the specified type
     */
    public List<VehicleRecord> getRecordsByType(String type) {
        return vehicleRepository.findByType(type);
    }

    /**
     * Get vehicle records by vehicle type and month
     * @param type Vehicle type (sheet name)
     * @param mois Month
     * @return List of vehicle records for the specified type and month
     */
    public List<VehicleRecord> getRecordsByTypeAndMonth(String type, String mois) {
        return vehicleRepository.findByTypeAndMois(type, mois);
    }
    
    /**
     * Get vehicle records by month
     * @param mois Month
     * @return List of vehicle records for the specified month
     */
    public List<VehicleRecord> getRecordsByMonth(String mois) {
        return vehicleRepository.findByMois(mois);
    }

    /**
     * Get vehicle records by matricule
     * @param matricule Vehicle registration number
     * @return List of vehicle records for the specified matricule
     */
    public List<VehicleRecord> getRecordsByMatricule(String matricule) {
        return vehicleRepository.findByMatricule(matricule);
    }

    /**
     * Get vehicle records by year
     * @param year Year of the records
     * @return List of vehicle records for the specified year
     */
    public List<VehicleRecord> getRecordsByYear(String year) {
        logger.info("Finding records for year: {}", year);
        return vehicleRepository.findByYear(year);
    }

    /**
     * Get vehicle records by year and month
     * @param year Year of the records
     * @param mois Month of the records
     * @return List of vehicle records for the specified year and month
     */
    public List<VehicleRecord> getRecordsByYearAndMois(String year, String mois) {
        logger.info("Finding records for year: {} and month: {}", year, mois);
        return vehicleRepository.findByYearAndMois(year, mois);
    }

    /**
     * Get vehicle records by type and year
     * @param type Vehicle type (sheet name)
     * @param year Year of the records
     * @return List of vehicle records for the specified type and year
     */
    public List<VehicleRecord> getRecordsByTypeAndYear(String type, String year) {
        logger.info("Finding records for type: {} and year: {}", type, year);
        return vehicleRepository.findByTypeAndYear(type, year);
    }

    /**
     * Get vehicle records by matricule and year
     * @param matricule Vehicle registration number
     * @param year Year of the records
     * @return List of vehicle records for the specified matricule and year
     */
    public List<VehicleRecord> getRecordsByMatriculeAndYear(String matricule, String year) {
        logger.info("Finding records for matricule: {} and year: {}", matricule, year);
        return vehicleRepository.findByMatriculeAndYear(matricule, year);
    }

    /**
     * Get vehicle records by type, matricule and year
     * @param type Vehicle type (sheet name)
     * @param matricule Vehicle registration number
     * @param year Year of the records
     * @return List of vehicle records for the specified type, matricule and year
     */
    public List<VehicleRecord> getRecordsByTypeMatriculeAndYear(String type, String matricule, String year) {
        logger.info("Finding records for type: {}, matricule: {}, and year: {}", type, matricule, year);
        return vehicleRepository.findByTypeAndMatriculeAndYear(type, matricule, year);
    }

    /**
     * Get vehicle records by type, year, and month
     * @param type Vehicle type (sheet name)
     * @param year Year of the records
     * @param mois Month of the records
     * @return List of vehicle records for the specified type, year, and month
     */
    public List<VehicleRecord> getRecordsByTypeYearAndMonth(String type, String year, String mois) {
        logger.info("Finding records for type: {}, year: {}, and month: {}", type, year, mois);
        return vehicleRepository.findByTypeAndYearAndMois(type, year, mois);
    }

    /**
     * Get vehicle records by matricule, year, and month
     * @param matricule Vehicle registration number
     * @param year Year of the records
     * @param mois Month of the records
     * @return List of vehicle records for the specified matricule, year, and month
     */
    public List<VehicleRecord> getRecordsByMatriculeAndYearAndMois(String matricule, String year, String mois) {
        logger.info("Finding records for matricule: {}, year: {}, and month: {}", matricule, year, mois);
        return vehicleRepository.findByMatriculeAndYearAndMois(matricule, year, mois);
    }

    /**
     * Get vehicle records by type, matricule, year, and month
     * @param type Vehicle type (sheet name)
     * @param matricule Vehicle registration number
     * @param year Year of the records
     * @param mois Month of the records
     * @return List of vehicle records for the specified type, matricule, year, and month
     */
    public List<VehicleRecord> getRecordsByTypeAndMatriculeAndYearAndMois(String type, String matricule, String year, String mois) {
        logger.info("Finding records for type: {}, matricule: {}, year: {}, and month: {}", type, matricule, year, mois);
        return vehicleRepository.findByTypeAndMatriculeAndYearAndMois(type, matricule, year, mois);
    }

    /**
     * Get vehicle records by type and matricule
     * @param type Vehicle type (sheet name)
     * @param matricule Vehicle registration number
     * @return List of vehicle records for the specified type and matricule
     */
    public List<VehicleRecord> getRecordsByTypeAndMatricule(String type, String matricule) {
        logger.info("Finding records for type: {} and matricule: {}", type, matricule);
        return vehicleRepository.findByTypeAndMatricule(type, matricule);
    }

    /**
     * Get monthly aggregated data for a specific vehicle type
     * @param vehicleType Vehicle type (sheet name)
     * @param year Year of the records
     * @param dateFrom Start date for the period
     * @param dateTo End date for the period
     * @return List of maps representing monthly aggregated data
     */
    public List<Map<String, Object>> getMonthlyAggregatedData(
            String vehicleType,
            String year,
            String dateFrom,
            String dateTo) {
        
        // Build the query
        Query query = new Query();
        
        if (vehicleType != null && !vehicleType.isEmpty()) {
            query.addCriteria(Criteria.where("type").is(vehicleType));
        }
        
        if (year != null && !year.isEmpty()) {
            query.addCriteria(Criteria.where("year").is(year));
        }
        
        if (dateFrom != null && !dateFrom.isEmpty()) {
            query.addCriteria(Criteria.where("mois").gte(dateFrom));
        }
        
        if (dateTo != null && !dateTo.isEmpty()) {
            query.addCriteria(Criteria.where("mois").lte(dateTo));
        }
        
        // Get all matching records
        List<VehicleRecord> records = mongoTemplate.find(query, VehicleRecord.class);
        
        if (records.isEmpty()) {
            return List.of();
        }
        
        // Group by month and calculate aggregates
        Map<String, Map<String, Object>> monthlyData = new TreeMap<>();
        
        for (VehicleRecord record : records) {
            String month = record.getMois();
            if (month == null || month.isEmpty()) continue;
            
            monthlyData.computeIfAbsent(month, k -> {
                Map<String, Object> monthData = new HashMap<>();
                monthData.put("month", k);
                monthData.put("kilometrage", 0.0);
                monthData.put("consommation", 0.0);
                monthData.put("produitsTonnes", 0.0);
                monthData.put("ipeL100km", 0.0);
                monthData.put("count", 0);
                return monthData;
            });
            
            Map<String, Object> monthData = monthlyData.get(month);
            Double kilometrage = record.getKilometrage();
            Double consommation = record.getConsommationL();
            Double produitsTonnes = record.getProduitsTonnes();
            Double ipeL100km = record.getIpeL100km();
            
            monthData.put("kilometrage", (Double) monthData.get("kilometrage") + (kilometrage != null ? kilometrage : 0.0));
            monthData.put("consommation", (Double) monthData.get("consommation") + (consommation != null ? consommation : 0.0));
            monthData.put("produitsTonnes", (Double) monthData.get("produitsTonnes") + (produitsTonnes != null ? produitsTonnes : 0.0));
            monthData.put("ipeL100km", (Double) monthData.get("ipeL100km") + (ipeL100km != null ? ipeL100km : 0.0));
            monthData.put("count", (Integer) monthData.get("count") + 1);
        }
        
        // Calculate averages and format the data
        return monthlyData.values().stream()
            .map(monthData -> {
                int count = (Integer) monthData.get("count");
                if (count > 0) {
                    monthData.put("ipeL100km", (Double) monthData.get("ipeL100km") / count);
                }
                return monthData;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Get vehicle performance data for comparison
     * @param type Vehicle type (sheet name)
     * @return List of vehicles with their performance metrics
     */
    public List<Map<String, Object>> getVehiclePerformanceData(String type) {
        List<VehicleRecord> records = getRecordsByType(type);
        Map<String, List<VehicleRecord>> recordsByMatricule = records.stream()
            .collect(Collectors.groupingBy(VehicleRecord::getMatricule));
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Map.Entry<String, List<VehicleRecord>> entry : recordsByMatricule.entrySet()) {
            String matricule = entry.getKey();
            List<VehicleRecord> vehicleRecords = entry.getValue();
            
            // Aggregate data for this vehicle
            double totalConsommationL = 0;
            double totalKilometrage = 0;
            double totalProduitsTonnes = 0;
            
            for (VehicleRecord record : vehicleRecords) {
                totalConsommationL += record.getConsommationL();
                totalKilometrage += record.getKilometrage();
                totalProduitsTonnes += record.getProduitsTonnes();
            }
            
            // Calculate performance metrics
            Map<String, Object> vehicleData = new HashMap<>();
            vehicleData.put("matricule", matricule);
            vehicleData.put("consommationTotaleL", totalConsommationL);
            vehicleData.put("kilometrageTotalKm", totalKilometrage);
            vehicleData.put("produitsTotalTonnes", totalProduitsTonnes);
            
            if (totalKilometrage > 0) {
                double ipeL100km = totalConsommationL / (totalKilometrage / 100);
                vehicleData.put("ipeL100km", ipeL100km);
                
                if (totalProduitsTonnes > 0) {
                    double ipeL100TonneKm = ipeL100km * (1 / (totalProduitsTonnes / 1000));
                    vehicleData.put("ipeL100TonneKm", ipeL100TonneKm);
                }
            }
            
            // Add monthly data
            Map<String, Map<String, Double>> monthlyData = new HashMap<>();
            for (VehicleRecord record : vehicleRecords) {
                String month = record.getMois();
                Map<String, Double> metrics = new HashMap<>();
                
                metrics.put("consommationL", record.getConsommationL());
                metrics.put("consommationTEP", record.getConsommationTEP());
                metrics.put("coutDT", record.getCoutDT());
                metrics.put("kilometrage", record.getKilometrage());
                metrics.put("produitsTonnes", record.getProduitsTonnes());
                metrics.put("ipeL100km", record.getIpeL100km());
                metrics.put("ipeL100TonneKm", record.getIpeL100TonneKm());
                
                monthlyData.put(month, metrics);
            }
            
            vehicleData.put("monthlyData", monthlyData);
            result.add(vehicleData);
        }
        
        return result;
    }

    /**
     * Get monthly totals for regression analysis
     * @param type Vehicle type (sheet name)
     * @return Map with months as keys and monthly totals for regression as values
     */
    public Map<String, Map<String, Double>> getMonthlyTotalsForRegression(String type) {
        Map<String, Map<String, Double>> monthlyData = getMonthlyAggregatedData(type);
        Map<String, Map<String, Double>> regressionData = new HashMap<>();
        
        // For each month, prepare the data specifically for regression analysis
        for (Map.Entry<String, Map<String, Double>> entry : monthlyData.entrySet()) {
            String month = entry.getKey();
            Map<String, Double> metrics = entry.getValue();
            Map<String, Double> regressionMetrics = new HashMap<>();
            
            // Add basic metrics needed for regression
            regressionMetrics.put("totalConsommationL", metrics.get("consommationL"));
            regressionMetrics.put("totalKilometrage", metrics.get("kilometrage"));
            regressionMetrics.put("totalCoutDT", metrics.get("coutDT"));
            
            if (metrics.containsKey("produitsTonnes") && metrics.get("produitsTonnes") > 0) {
                regressionMetrics.put("totalProduitsTonnes", metrics.get("produitsTonnes"));
            }
            
            // Add derived metrics
            if (metrics.containsKey("ipeL100km")) {
                regressionMetrics.put("ipeL100km", metrics.get("ipeL100km"));
            }
            
            if (metrics.containsKey("ipeL100TonneKm")) {
                regressionMetrics.put("ipeL100TonneKm", metrics.get("ipeL100TonneKm"));
            }
            
            // Calculate fuel efficiency
            if (metrics.get("kilometrage") > 0 && metrics.get("consommationL") > 0) {
                double kmPerLiter = metrics.get("kilometrage") / metrics.get("consommationL");
                regressionMetrics.put("kmPerLiter", kmPerLiter);
            }
            
            // Calculate cost efficiency
            if (metrics.get("kilometrage") > 0 && metrics.get("coutDT") > 0) {
                double costPerKm = metrics.get("coutDT") / metrics.get("kilometrage");
                regressionMetrics.put("costPerKm", costPerKm);
            }
            
            regressionData.put(month, regressionMetrics);
        }
        
        logger.info("Prepared regression data for {} months of type {}", regressionData.size(), type);
        return regressionData;
    }
    
    /**
     * Get vehicles with currency information properly formatted
     * @param type Vehicle type (sheet name)
     * @return List of vehicle records with formatted currency information
     */
    public List<Map<String, Object>> getVehiclesWithFormattedCurrency(String type) {
        List<VehicleRecord> records = getRecordsByType(type);
        List<Map<String, Object>> formattedRecords = new ArrayList<>();
        
        for (VehicleRecord record : records) {
            Map<String, Object> formattedRecord = new HashMap<>();
            formattedRecord.put("id", record.getId());
            formattedRecord.put("type", record.getType());
            formattedRecord.put("mois", record.getMois());
            formattedRecord.put("matricule", record.getMatricule());
            formattedRecord.put("consommationL", record.getConsommationL());
            formattedRecord.put("consommationTEP", record.getConsommationTEP());
            
            // Format currency with TND
            formattedRecord.put("coutDT", record.getCoutDT());
            formattedRecord.put("coutFormatted", String.format("%.3f TND", record.getCoutDT()));
            
            formattedRecord.put("kilometrage", record.getKilometrage());
            formattedRecord.put("produitsTonnes", record.getProduitsTonnes());
            formattedRecord.put("ipeL100km", record.getIpeL100km());
            formattedRecord.put("ipeL100TonneKm", record.getIpeL100TonneKm());
            
            formattedRecords.add(formattedRecord);
        }
        
        return formattedRecords;
    }

    /**
     * Get a vehicle record by ID
     * @param id Record ID
     * @return Optional containing the record if found
     */
    public Optional<VehicleRecord> getRecordById(String id) {
        return vehicleRepository.findById(id);
    }

    /**
     * Save a vehicle record
     * @param record The vehicle record to save
     * @return The saved record
     */
    public VehicleRecord saveRecord(VehicleRecord record) {
        return vehicleRepository.save(record);
    }

    /**
     * Update a vehicle record
     * @param id Record ID
     * @param updatedRecord Updated record data
     * @return The updated record
     */
    public VehicleRecord updateRecord(String id, VehicleRecord updatedRecord) {
        return vehicleRepository.findById(id)
            .map(existingRecord -> {
                updatedRecord.setId(id);
                return vehicleRepository.save(updatedRecord);
            })
            .orElseThrow(() -> new IllegalArgumentException("Record not found with id: " + id));
    }

    /**
     * Delete a vehicle record
     * @param id Record ID
     */
    public void deleteRecord(String id) {
        vehicleRepository.deleteById(id);
    }

    /**
     * Save multiple vehicle records for a specific year, month, and region
     * @param records List of vehicle records to save
     * @param sheetName The sheet name (vehicle type) 
     * @param year The year for the data
     * @param month The month for the data (optional, use "all" for all months)
     * @param replaceExisting Whether to replace existing data
     * @param region The region for the data (optional, use "All Regions" for all regions)
     * @return Number of records saved
     */
    public int saveRecords(List<VehicleRecord> records, String sheetName, String year, String month, boolean replaceExisting, String region) {
        if (records == null || records.isEmpty()) {
            logger.warn("No records to save for sheet: {}, year: {}, month: {}, region: {}", sheetName, year, month, region);
            return 0;
        }
        
        logger.info("Saving {} records for sheet: {}, year: {}, month: {}, region: {}, replaceExisting: {}", 
                 records.size(), sheetName, year, month, region, replaceExisting);
        
        // Filter records by month if a specific month is requested
        List<VehicleRecord> filteredRecords = records;
        if (!"all".equals(month)) {
            filteredRecords = records.stream()
                .filter(record -> month.equals(record.getMois()))
                .collect(Collectors.toList());
            
            logger.info("Filtered down to {} records for month: {}", filteredRecords.size(), month);
        }
        
        // Set the year, type, and region information on each record
        filteredRecords.forEach(record -> {
            record.setYear(year);
            record.setType(sheetName);
            record.setRegion(region);
        });
        
        logger.info("Set year to {}, type to {}, and region to {} for all {} records", year, sheetName, region, filteredRecords.size());
        
        // If replace existing is true, delete existing records first
        if (replaceExisting) {
            if ("all".equals(month)) {
                logger.info("Deleting existing records for type: {}, year: {}, and region: {}", sheetName, year, region);
                vehicleRepository.deleteByTypeAndYearAndRegion(sheetName, year, region);
            } else {
                logger.info("Deleting existing records for type: {}, year: {}, month: {}, and region: {}", sheetName, year, month, region);
                vehicleRepository.deleteByTypeAndYearAndMoisAndRegion(sheetName, year, month, region);
            }
        }
        
        // Save the filtered records
        List<VehicleRecord> savedRecords = vehicleRepository.saveAll(filteredRecords);
        logger.info("Successfully saved {} records", savedRecords.size());
        
        return savedRecords.size();
    }
    
    /**
     * Save multiple vehicle records for a specific year and month (overloaded for backward compatibility)
     * @param records List of vehicle records to save
     * @param sheetName The sheet name (vehicle type) 
     * @param year The year for the data
     * @param month The month for the data (optional, use "all" for all months)
     * @param replaceExisting Whether to replace existing data
     * @return Number of records saved
     */
    public int saveRecords(List<VehicleRecord> records, String sheetName, String year, String month, boolean replaceExisting) {
        return saveRecords(records, sheetName, year, month, replaceExisting, "All Regions");
    }

    /**
     * Get monthly aggregated data for a specific vehicle type (overloaded for backward compatibility)
     * @param type Vehicle type (sheet name)
     * @return Map with months as keys and monthly totals as values
     */
    public Map<String, Map<String, Double>> getMonthlyAggregatedData(String type) {
        List<Map<String, Object>> aggregatedData = getMonthlyAggregatedData(type, null, null, null);
        Map<String, Map<String, Double>> result = new HashMap<>();
        
        for (Map<String, Object> data : aggregatedData) {
            String month = (String) data.get("month");
            Map<String, Double> metrics = new HashMap<>();
            metrics.put("kilometrage", (Double) data.get("kilometrage"));
            metrics.put("consommationL", (Double) data.get("consommation"));
            metrics.put("produitsTonnes", (Double) data.get("produitsTonnes"));
            metrics.put("ipeL100km", (Double) data.get("ipeL100km"));
            result.put(month, metrics);
        }
        
        return result;
    }
}
