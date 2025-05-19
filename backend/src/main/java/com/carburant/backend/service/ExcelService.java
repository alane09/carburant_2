package com.carburant.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Pattern;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.CellValue;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.carburant.backend.model.VehicleRecord;

@Service
public class ExcelService {

    private static final Logger logger = LoggerFactory.getLogger(ExcelService.class);

    // Patterns for column recognition in both French and English
    private static final Pattern MONTH_PATTERN = Pattern.compile("(?i).*(mois|month|date|période|period).*");
    private static final Pattern MATRICULE_PATTERN = Pattern.compile("(?i).*(matricule|immatriculation|numéro|véhicule|vehicle|registration|number).*");
    private static final Pattern CONSOMMATION_L_PATTERN = Pattern.compile("(?i).*(consommation.*l|consumption.*l|carburant|fuel|essence|diesel|gasoil|gazole).*");
    private static final Pattern CONSOMMATION_TEP_PATTERN = Pattern.compile("(?i).*(consommation.*tep|consumption.*tep|tep).*");
    private static final Pattern COUT_DT_PATTERN = Pattern.compile("(?i).*(coût|cout|cost|dt|dinar|prix|price).*");
    private static final Pattern KM_PATTERN = Pattern.compile("(?i).*(kilométrage|kilometrage|km|distance|parcouru|traveled).*");
    private static final Pattern TONNE_PATTERN = Pattern.compile("(?i).*(produit|product|transporté|transported|tonne|ton|charge|weight|poids).*");
    private static final Pattern IPE_PATTERN = Pattern.compile("(?i).*(ipe|indice|index|performance|énergétique|energetique|l/100).*");
    private static final Pattern DESCRIPTION_PATTERN = Pattern.compile("(?i).*(description|type|label|désignation|designation).*");

    // Patterns for vehicle type detection
    private static final Pattern TU_PATTERN = Pattern.compile("(?i).*\\d+\\s*TU\\s*\\d+.*|.*TU\\s*\\d+.*");
    private static final Pattern RS_PATTERN = Pattern.compile("(?i).*\\d+\\s*RS\\s*\\d*.*");
    private static final Pattern CHARIOT_PATTERN = Pattern.compile("(?i).*(chariot|élévateur|elevateur).*");
    private static final Pattern MINIBUS_PATTERN = Pattern.compile("(?i).*(minibus|bus).*");

    /**
     * Extracts sheet names from an Excel file
     * @param file The uploaded Excel file
     * @return List of sheet names in the Excel file
     */
    public List<String> extractSheetNames(MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {
            
            List<String> sheetNames = new ArrayList<>();
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                sheetNames.add(workbook.getSheetName(i));
            }
            return sheetNames;
        }
    }

    /**
     * Result class containing vehicle records and monthly totals
     */
    public static class ExtractionResult {
        private final List<VehicleRecord> vehicleRecords;
        private final Map<String, Map<String, Double>> monthlyTotals;

        public ExtractionResult(List<VehicleRecord> vehicleRecords, Map<String, Map<String, Double>> monthlyTotals) {
            this.vehicleRecords = vehicleRecords != null ? vehicleRecords : new ArrayList<>();
            this.monthlyTotals = monthlyTotals != null ? monthlyTotals : new TreeMap<>();
        }

        public List<VehicleRecord> getVehicleRecords() {
            return vehicleRecords;
        }

        public Map<String, Map<String, Double>> getMonthlyTotals() {
            return monthlyTotals;
        }
    }

    /**
     * Extracts data from a specific sheet in an Excel file
     * @param file The uploaded Excel file
     * @param sheetName The name of the sheet to extract data from
     * @return ExtractionResult containing vehicle records and monthly totals
     */
    public ExtractionResult extractData(MultipartFile file, String sheetName) throws IOException {
        if (file == null || file.isEmpty()) {
            logger.error("No file provided or empty file");
            throw new IllegalArgumentException("File cannot be empty");
        }
        
        if (sheetName == null || sheetName.trim().isEmpty()) {
            logger.error("No sheet name provided");
            throw new IllegalArgumentException("Sheet name cannot be empty");
        }
        
        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {
            
            Sheet sheet = workbook.getSheet(sheetName);
            if (sheet == null) {
                logger.error("Sheet not found: {}", sheetName);
                throw new IllegalArgumentException("Sheet not found: " + sheetName);
            }

            // Create a formula evaluator to properly evaluate formulas
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            
            // Create a data formatter to properly format cell values considering styles
            DataFormatter formatter = new DataFormatter(true);
            
            // Create a resolved sheet data structure to handle merged cells and formulas
            List<List<CellData>> resolvedSheet = resolveSheetData(sheet, evaluator, formatter);
            if (resolvedSheet.isEmpty()) {
                logger.warn("No data found in sheet: {}", sheetName);
                return new ExtractionResult(new ArrayList<>(), new TreeMap<>());
            }

            // Use the first row as header
            List<CellData> headerRow = resolvedSheet.get(0);
            logger.info("Processing sheet: {} with {} columns", sheetName, headerRow.size());

            // Find column indices for all required fields
            ColumnIndices columnIndices = findColumnIndices(headerRow, sheetName);
            if (!columnIndices.isValid()) {
                logger.warn("Could not identify all required columns in sheet: {}. Found: {}", 
                          sheetName, columnIndices);
                // Continue with best effort - we'll work with what we found
            }
            
            // Process data rows
            List<VehicleRecord> vehicleRecords = new ArrayList<>();
            String currentMonth = null;
            
            // For monthly totals - using TreeMap for sorted months
            Map<String, Map<String, Double>> monthlyTotals = new TreeMap<>();
            
            // Skip header row
            for (int i = 1; i < resolvedSheet.size(); i++) {
                List<CellData> row = resolvedSheet.get(i);
                if (row == null || row.isEmpty() || isEmptyRow(row)) {
                    continue;
                }
                
                try {
                    // Check for month in the month column (which may be merged cells)
                    if (columnIndices.monthIndex >= 0 && columnIndices.monthIndex < row.size()) {
                        CellData monthCell = row.get(columnIndices.monthIndex);
                        if (monthCell != null && monthCell.getValue() != null && !monthCell.getStringValue().isEmpty()) {
                            currentMonth = monthCell.getStringValue().trim();
                            logger.debug("Found month: {}", currentMonth);
                            
                            // Initialize monthly totals for this month if not already done
                            initializeMonthlyTotals(monthlyTotals, currentMonth);
                        }
                    }
                    
                    // Skip rows without matricule (likely headers or empty rows)
                    if (columnIndices.matriculeIndex < 0 || columnIndices.matriculeIndex >= row.size() ||
                        row.get(columnIndices.matriculeIndex) == null || 
                        row.get(columnIndices.matriculeIndex).getValue() == null ||
                        row.get(columnIndices.matriculeIndex).getStringValue().isEmpty()) {
                        continue;
                    }
                    
                    // If we still don't have a month, use a default
                    if (currentMonth == null) {
                        currentMonth = "Mois non spécifié";
                        // Initialize monthly totals for the default month if not already done
                        initializeMonthlyTotals(monthlyTotals, currentMonth);
                    }

                    // Extract matricule and description (if available)
                    String matricule = row.get(columnIndices.matriculeIndex).getStringValue().trim();
                    String description = "";
                    if (columnIndices.descriptionIndex >= 0 && columnIndices.descriptionIndex < row.size() && 
                        row.get(columnIndices.descriptionIndex) != null) {
                        description = row.get(columnIndices.descriptionIndex).getStringValue().trim();
                    }
                    
                    // Check if this is a valid vehicle based on matricule or description
                    if (!isValidVehicle(matricule, description)) {
                        logger.debug("Skipping non-vehicle row with matricule: {}", matricule);
                        continue;
                    }
                    
                    String vehicleType = determineVehicleType(matricule, description);
                    logger.debug("Processing vehicle: {} (type: {}) for month: {}", matricule, vehicleType, currentMonth);
                    
                    // Collect metrics with safe extraction
                    double consommationL = safeGetNumericValue(row, columnIndices.consommationLIndex);
                    double consommationTEP = safeGetNumericValue(row, columnIndices.consommationTEPIndex);
                    double coutDT = extractCurrencyValue(row, columnIndices.coutDTIndex);
                    double kilometrage = safeGetNumericValue(row, columnIndices.kmIndex);
                    double produitsTonnes = safeGetNumericValue(row, columnIndices.tonneIndex);
                    double ipeDirectValue = safeGetNumericValue(row, columnIndices.ipeIndex);
                    
                    // Store all raw values for debugging and future use
                    Map<String, Double> rawValues = new HashMap<>();
                    if (columnIndices.consommationLIndex >= 0) 
                        rawValues.put("consommationL", consommationL);
                    if (columnIndices.consommationTEPIndex >= 0) 
                        rawValues.put("consommationTEP", consommationTEP);
                    if (columnIndices.coutDTIndex >= 0) 
                        rawValues.put("coutDT", coutDT);
                    if (columnIndices.kmIndex >= 0) 
                        rawValues.put("kilometrage", kilometrage);
                    if (columnIndices.tonneIndex >= 0) 
                        rawValues.put("produitsTonnes", produitsTonnes);
                    if (columnIndices.ipeIndex >= 0) 
                        rawValues.put("ipeDirectValue", ipeDirectValue);
                    
                    // Create vehicle record builder with extracted values
                    VehicleRecord.VehicleRecordBuilder recordBuilder = VehicleRecord.builder()
                        .type(vehicleType) // Use detected vehicle type instead of sheet name
                        .mois(currentMonth)
                        .matricule(matricule)
                        .consommationL(consommationL)
                        .consommationTEP(consommationTEP)
                        .coutDT(coutDT)
                        .kilometrage(kilometrage)
                        .produitsTonnes(produitsTonnes)
                        .rawValues(rawValues);
                    
                    // Calculate IPE values
                    calculateIpeValues(recordBuilder, consommationL, kilometrage, produitsTonnes, ipeDirectValue);
                    
                    VehicleRecord record = recordBuilder.build();
                    vehicleRecords.add(record);
                    
                    // Update monthly totals
                    updateMonthlyTotals(monthlyTotals, currentMonth, consommationL, consommationTEP, 
                                      coutDT, kilometrage, produitsTonnes);
                } catch (Exception e) {
                    // Catch any exceptions during row processing to improve robustness
                    logger.error("Error processing row {} in sheet {}: {}", i, sheetName, e.getMessage());
                    // Continue with next row
                }
            }
            
            logger.info("Extracted {} valid vehicle records from sheet {}", vehicleRecords.size(), sheetName);
            logger.info("Calculated monthly totals for {} months", monthlyTotals.size());
            
            return new ExtractionResult(vehicleRecords, monthlyTotals);
        } catch (Exception e) {
            logger.error("Error extracting data from sheet {}: {}", sheetName, e.getMessage(), e);
            throw new IOException("Error processing Excel file: " + e.getMessage(), e);
        }
    }

    /**
     * Extracts data from a sheet in an Excel file using an InputStream
     * This method is used for extracting data from cached file content
     * @param inputStream The input stream for the Excel file
     * @param sheetName The name of the sheet to extract data from
     * @return ExtractionResult containing vehicle records and monthly totals
     */
    public ExtractionResult extractDataFromInputStream(InputStream inputStream, String sheetName) throws IOException {
        if (inputStream == null) {
            logger.error("Input stream is null");
            throw new IllegalArgumentException("File cannot be empty");
        }
        
        if (sheetName == null || sheetName.trim().isEmpty()) {
            logger.error("No sheet name provided");
            throw new IllegalArgumentException("Sheet name cannot be empty");
        }
        
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheet(sheetName);
            if (sheet == null) {
                logger.error("Sheet not found: {}", sheetName);
                throw new IllegalArgumentException("Sheet not found: " + sheetName);
            }

            // Create a formula evaluator to properly evaluate formulas
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            
            // Create a data formatter to properly format cell values considering styles
            DataFormatter formatter = new DataFormatter(true);
            
            // Create a resolved sheet data structure to handle merged cells and formulas
            List<List<CellData>> resolvedSheet = resolveSheetData(sheet, evaluator, formatter);
            if (resolvedSheet.isEmpty()) {
                logger.warn("No data found in sheet: {}", sheetName);
                return new ExtractionResult(new ArrayList<>(), new TreeMap<>());
            }

            // Use the first row as header
            List<CellData> headerRow = resolvedSheet.get(0);
            logger.info("Processing sheet: {} with {} columns", sheetName, headerRow.size());

            // Find column indices for all required fields
            ColumnIndices columnIndices = findColumnIndices(headerRow, sheetName);
            if (!columnIndices.isValid()) {
                logger.warn("Could not identify all required columns in sheet: {}. Found: {}", 
                          sheetName, columnIndices);
                // Continue with best effort - we'll work with what we found
            }
            
            // Process data rows
            List<VehicleRecord> vehicleRecords = new ArrayList<>();
            String currentMonth = null;
            
            // For monthly totals - using TreeMap for sorted months
            Map<String, Map<String, Double>> monthlyTotals = new TreeMap<>();
            
            // Skip header row
            for (int i = 1; i < resolvedSheet.size(); i++) {
                List<CellData> row = resolvedSheet.get(i);
                if (row == null || row.isEmpty() || isEmptyRow(row)) {
                    continue;
                }
                
                try {
                    // Check for month in the month column (which may be merged cells)
                    if (columnIndices.monthIndex >= 0 && columnIndices.monthIndex < row.size()) {
                        CellData monthCell = row.get(columnIndices.monthIndex);
                        if (monthCell != null && monthCell.getValue() != null && !monthCell.getStringValue().isEmpty()) {
                            currentMonth = monthCell.getStringValue().trim();
                            logger.debug("Found month: {}", currentMonth);
                            
                            // Initialize monthly totals for this month if not already done
                            initializeMonthlyTotals(monthlyTotals, currentMonth);
                        }
                    }
                    
                    // Skip rows without matricule (likely headers or empty rows)
                    if (columnIndices.matriculeIndex < 0 || columnIndices.matriculeIndex >= row.size() ||
                        row.get(columnIndices.matriculeIndex) == null || 
                        row.get(columnIndices.matriculeIndex).getValue() == null ||
                        row.get(columnIndices.matriculeIndex).getStringValue().isEmpty()) {
                        continue;
                    }
                    
                    // If we still don't have a month, use a default
                    if (currentMonth == null) {
                        currentMonth = "Mois non spécifié";
                        // Initialize monthly totals for the default month if not already done
                        initializeMonthlyTotals(monthlyTotals, currentMonth);
                    }

                    // Extract matricule and description (if available)
                    String matricule = row.get(columnIndices.matriculeIndex).getStringValue().trim();
                    String description = "";
                    if (columnIndices.descriptionIndex >= 0 && columnIndices.descriptionIndex < row.size() && 
                        row.get(columnIndices.descriptionIndex) != null) {
                        description = row.get(columnIndices.descriptionIndex).getStringValue().trim();
                    }
                    
                    // Check if this is a valid vehicle based on matricule or description
                    if (!isValidVehicle(matricule, description)) {
                        logger.debug("Skipping non-vehicle row with matricule: {}", matricule);
                        continue;
                    }
                    
                    String vehicleType = determineVehicleType(matricule, description);
                    logger.debug("Processing vehicle: {} (type: {}) for month: {}", matricule, vehicleType, currentMonth);
                    
                    // Collect metrics with safe extraction
                    double consommationL = safeGetNumericValue(row, columnIndices.consommationLIndex);
                    double consommationTEP = safeGetNumericValue(row, columnIndices.consommationTEPIndex);
                    double coutDT = extractCurrencyValue(row, columnIndices.coutDTIndex);
                    double kilometrage = safeGetNumericValue(row, columnIndices.kmIndex);
                    double produitsTonnes = safeGetNumericValue(row, columnIndices.tonneIndex);
                    double ipeDirectValue = safeGetNumericValue(row, columnIndices.ipeIndex);
                    
                    // Store all raw values for debugging and future use
                    Map<String, Double> rawValues = new HashMap<>();
                    if (columnIndices.consommationLIndex >= 0) 
                        rawValues.put("consommationL", consommationL);
                    if (columnIndices.consommationTEPIndex >= 0) 
                        rawValues.put("consommationTEP", consommationTEP);
                    if (columnIndices.coutDTIndex >= 0) 
                        rawValues.put("coutDT", coutDT);
                    if (columnIndices.kmIndex >= 0) 
                        rawValues.put("kilometrage", kilometrage);
                    if (columnIndices.tonneIndex >= 0) 
                        rawValues.put("produitsTonnes", produitsTonnes);
                    if (columnIndices.ipeIndex >= 0) 
                        rawValues.put("ipeDirectValue", ipeDirectValue);
                    
                    // Create vehicle record builder with extracted values
                    VehicleRecord.VehicleRecordBuilder recordBuilder = VehicleRecord.builder()
                        .type(vehicleType) // Use detected vehicle type instead of sheet name
                        .mois(currentMonth)
                        .matricule(matricule)
                        .consommationL(consommationL)
                        .consommationTEP(consommationTEP)
                        .coutDT(coutDT)
                        .kilometrage(kilometrage)
                        .produitsTonnes(produitsTonnes)
                        .rawValues(rawValues);
                    
                    // Calculate IPE values
                    calculateIpeValues(recordBuilder, consommationL, kilometrage, produitsTonnes, ipeDirectValue);
                    
                    VehicleRecord record = recordBuilder.build();
                    vehicleRecords.add(record);
                    
                    // Update monthly totals
                    updateMonthlyTotals(monthlyTotals, currentMonth, consommationL, consommationTEP, 
                                      coutDT, kilometrage, produitsTonnes);
                } catch (Exception e) {
                    // Catch any exceptions during row processing to improve robustness
                    logger.error("Error processing row {} in sheet {}: {}", i, sheetName, e.getMessage());
                    // Continue with next row
                }
            }
            
            logger.info("Extracted {} valid vehicle records from sheet {}", vehicleRecords.size(), sheetName);
            logger.info("Calculated monthly totals for {} months", monthlyTotals.size());
            
            return new ExtractionResult(vehicleRecords, monthlyTotals);
        } catch (Exception e) {
            logger.error("Error extracting data from sheet {}: {}", sheetName, e.getMessage(), e);
            throw new IOException("Error processing Excel file: " + e.getMessage(), e);
        }
    }

    /**
     * Initialize monthly totals for a new month
     */
    private void initializeMonthlyTotals(Map<String, Map<String, Double>> monthlyTotals, String month) {
        if (!monthlyTotals.containsKey(month)) {
            Map<String, Double> totals = new HashMap<>();
            totals.put("consommationL", 0.0);
            totals.put("consommationTEP", 0.0);
            totals.put("coutDT", 0.0);
            totals.put("kilometrage", 0.0);
            totals.put("produitsTonnes", 0.0);
            totals.put("vehicleCount", 0.0);
            monthlyTotals.put(month, totals);
        }
    }

    /**
     * Update monthly totals with values from a vehicle record
     */
    private void updateMonthlyTotals(Map<String, Map<String, Double>> monthlyTotals, 
                                  String month, double consommationL, double consommationTEP,
                                  double coutDT, double kilometrage, double produitsTonnes) {
        Map<String, Double> totals = monthlyTotals.get(month);
        totals.put("consommationL", totals.get("consommationL") + consommationL);
        totals.put("consommationTEP", totals.get("consommationTEP") + consommationTEP);
        totals.put("coutDT", totals.get("coutDT") + coutDT);
        totals.put("kilometrage", totals.get("kilometrage") + kilometrage);
        totals.put("produitsTonnes", totals.get("produitsTonnes") + produitsTonnes);
        totals.put("vehicleCount", totals.get("vehicleCount") + 1);
    }

    /**
     * Calculate IPE values for a vehicle record
     */
    private void calculateIpeValues(VehicleRecord.VehicleRecordBuilder recordBuilder, 
                                 double consommationL, double kilometrage, 
                                 double produitsTonnes, double ipeDirectValue) {
        // IPE L/100km calculation (for all vehicles)
        if (consommationL > 0 && kilometrage > 0) {
            double ipeL100km = (consommationL / (kilometrage / 100));
            recordBuilder.ipeL100km(ipeL100km);
        }
        
        // IPE L/Tonne.100Km calculation (only for trucks)
        if (consommationL > 0 && kilometrage > 0 && produitsTonnes > 0) {
            double ipeL100TonneKm = (consommationL / (kilometrage / 100)) * (1 / (produitsTonnes / 1000));
            recordBuilder.ipeL100TonneKm(ipeL100TonneKm);
        } else if (ipeDirectValue > 0) {
            // If IPE is directly provided in the sheet (utility vehicles)
            recordBuilder.ipeL100km(ipeDirectValue);
        }
    }

    /**
     * Determines if a row represents a valid vehicle based on matricule format or description
     */
    private boolean isValidVehicle(String matricule, String description) {
        if (matricule == null || matricule.trim().isEmpty()) {
            return false;
        }
        
        // Performance improvement: Use matches() instead of pattern.matcher().matches()
        matricule = matricule.trim();
        
        // Check if matricule matches TU pattern (e.g., "1682 TU 147", "003 TU 187")
        if (TU_PATTERN.matcher(matricule).matches()) {
            return true;
        }
        
        // Check if matricule matches RS pattern for minibuses (e.g., "105774 RS")
        if (RS_PATTERN.matcher(matricule).matches()) {
            return true;
        }
        
        // Check if description contains keywords for chariots or minibuses
        if (description != null && !description.isEmpty()) {
            description = description.trim();
            if (CHARIOT_PATTERN.matcher(description).matches() || 
                MINIBUS_PATTERN.matcher(description).matches()) {
                return true;
            }
        }
        
        // If none of the patterns match, it's not a valid vehicle
        return false;
    }

    /**
     * Determines the vehicle type based on matricule format or description
     */
    private String determineVehicleType(String matricule, String description) {
        // Trim inputs for more robust matching
        if (matricule != null) {
            matricule = matricule.trim();
        }
        
        if (description != null) {
            description = description.trim();
        }
        
        if (matricule != null && TU_PATTERN.matcher(matricule).matches()) {
            return "Camion"; // TU vehicle (truck)
        }
        
        if (matricule != null && RS_PATTERN.matcher(matricule).matches()) {
            return "Minibus"; // RS vehicle (minibus)
        }
        
        if (description != null && !description.isEmpty()) {
            if (CHARIOT_PATTERN.matcher(description).matches()) {
                return "Chariot";
            }
            
            if (MINIBUS_PATTERN.matcher(description).matches()) {
                return "Minibus";
            }
        }
        
        // Default to "Voiture" (car) if no specific type could be determined
        return "Voiture";
    }

    /**
     * Helper method to specifically extract currency values from cells,
     * handling formatting like "100 TND" or "100.5 DT"
     */
    private double extractCurrencyValue(List<CellData> row, int index) {
        if (index < 0 || index >= row.size() || row.get(index) == null) {
            return 0.0;
        }
        
        CellData cell = row.get(index);
        
        // If it's a numeric cell with currency formatting, get the raw number
        if (cell.cellType == CellType.NUMERIC && !cell.isDate) {
            return cell.getNumericValue();
        }
        
        // For string cells that might contain currency notation like "100 TND"
        if (cell.getValue() != null) {
            String value = cell.getStringValue().trim();
            
            // Log the original value for debugging
            logger.debug("Extracting currency from: '{}'", value);
            
            // Enhanced handling for various currency formats
            // First, handle numbers with thousand separators and decimal points correctly
            // Tunisian Dinar often appears as "6,368.16 TND" or similar format
            
            // Remove currency symbols and text like "TND", "DT", etc.
            value = value.replaceAll("(?i)(TND|DT|DINAR|د.ت|دينار)", "").trim();
            
            // In this specific case, we need to properly handle numbers like "6,368.16"
            // where comma is a thousands separator and point is decimal separator
            
            // If the value contains both comma and dot, and comma comes before dot,
            // it's likely using comma as thousands separator (e.g., "6,368.16")
            if (value.contains(",") && value.contains(".") && value.indexOf(",") < value.indexOf(".")) {
                // Remove commas used as thousands separators
                value = value.replace(",", "");
            }
            // If it only contains commas, or comma comes after dot, treat comma as decimal separator
            else if (value.contains(",")) {
                // Replace comma with dot for decimal point
                value = value.replace(",", ".");
            }
            
            // Remove any remaining non-numeric characters except decimal point
            value = value.replaceAll("[^\\d.\\-]", "").trim();
            
            try {
                double numericValue = Double.parseDouble(value);
                logger.debug("Extracted currency value: {}", numericValue);
                return numericValue;
            } catch (NumberFormatException e) {
                logger.debug("Could not parse currency value from: {}", cell.getStringValue());
                return 0.0;
            }
        }
        
        return 0.0;
    }

    /**
     * Helper method to safely extract numeric values from cells
     */
    private double safeGetNumericValue(List<CellData> row, int index) {
        if (index < 0 || index >= row.size() || row.get(index) == null) {
            return 0.0;
        }
        
        CellData cell = row.get(index);
        
        // Quick return for null values
        if (cell == null || cell.getValue() == null) {
            return 0.0;
        }
        
        // If it's already a numeric cell, return its value directly
        if (cell.cellType == CellType.NUMERIC && !cell.isDate) {
            return cell.getNumericValue();
        }
        
        // For string cells, try to extract numeric part
        if (cell.cellType == CellType.STRING) {
            String value = cell.getStringValue();
            if (value == null || value.isEmpty()) {
                return 0.0;
            }
            
            value = value.trim();
            
            // Fast path for simple numeric strings
            if (value.matches("^\\d+(\\.\\d+)?$")) {
                try {
                    return Double.parseDouble(value);
                } catch (NumberFormatException e) {
                    // Should not happen with the regex check above
                    return 0.0;
                }
            }
            
            // More complex parsing for strings with currency symbols, etc.
            value = value.replaceAll("[^\\d.,\\-]", "").trim();
            
            // Replace comma with dot for decimal point (common in some locales)
            value = value.replace(',', '.');
            
            if (value.isEmpty()) {
                return 0.0;
            }
            
            try {
                return Double.parseDouble(value);
            } catch (NumberFormatException e) {
                logger.debug("Could not parse numeric value from: {}", cell.getStringValue());
                return 0.0;
            }
        }
        
        return cell.getNumericValue();
    }

    /**
     * Helper class to store column indices
     */
    private static class ColumnIndices {
        int monthIndex = -1;
        int matriculeIndex = -1;
        int consommationLIndex = -1;
        int consommationTEPIndex = -1;
        int coutDTIndex = -1;
        int kmIndex = -1;
        int tonneIndex = -1;
        int ipeIndex = -1;
        int descriptionIndex = -1;
        
        public boolean isValid() {
            // At minimum, we need month, matricule, and some consumption data
            return monthIndex >= 0 && matriculeIndex >= 0 && 
                  (consommationLIndex >= 0 || consommationTEPIndex >= 0);
        }
        
        @Override
        public String toString() {
            return String.format(
                "ColumnIndices[month=%d, matricule=%d, consommationL=%d, consommationTEP=%d, " +
                "coutDT=%d, km=%d, tonne=%d, ipe=%d, description=%d]",
                monthIndex, matriculeIndex, consommationLIndex, consommationTEPIndex,
                coutDTIndex, kmIndex, tonneIndex, ipeIndex, descriptionIndex
            );
        }
    }

    /**
     * Finds indices of all required columns
     */
    private ColumnIndices findColumnIndices(List<CellData> headerRow, String sheetName) {
        ColumnIndices indices = new ColumnIndices();
        
        // Log headers for debugging
        StringBuilder headers = new StringBuilder("Headers in sheet " + sheetName + ": ");
        for (int i = 0; i < headerRow.size(); i++) {
            CellData cell = headerRow.get(i);
            if (cell != null && cell.getValue() != null) {
                headers.append(i).append(":\"").append(cell.getStringValue()).append("\", ");
            }
        }
        logger.debug(headers.toString());
        
        // First pass: match by header patterns
        for (int i = 0; i < headerRow.size(); i++) {
            CellData cell = headerRow.get(i);
            if (cell == null || cell.getValue() == null) continue;
            
            String header = cell.getStringValue().trim().toLowerCase();
            
            if (indices.monthIndex < 0 && MONTH_PATTERN.matcher(header).matches()) {
                indices.monthIndex = i;
                logger.debug("Found month column at index {}: '{}'", i, header);
            } 
            else if (indices.matriculeIndex < 0 && MATRICULE_PATTERN.matcher(header).matches()) {
                indices.matriculeIndex = i;
                logger.debug("Found matricule column at index {}: '{}'", i, header);
            }
            else if (indices.consommationLIndex < 0 && CONSOMMATION_L_PATTERN.matcher(header).matches()) {
                indices.consommationLIndex = i;
                logger.debug("Found consommation L column at index {}: '{}'", i, header);
            }
            else if (indices.consommationTEPIndex < 0 && CONSOMMATION_TEP_PATTERN.matcher(header).matches()) {
                indices.consommationTEPIndex = i;
                logger.debug("Found consommation TEP column at index {}: '{}'", i, header);
            }
            else if (indices.coutDTIndex < 0 && COUT_DT_PATTERN.matcher(header).matches()) {
                indices.coutDTIndex = i;
                logger.debug("Found cout DT column at index {}: '{}'", i, header);
            }
            else if (indices.kmIndex < 0 && KM_PATTERN.matcher(header).matches()) {
                indices.kmIndex = i;
                logger.debug("Found km column at index {}: '{}'", i, header);
            }
            else if (indices.tonneIndex < 0 && TONNE_PATTERN.matcher(header).matches()) {
                indices.tonneIndex = i;
                logger.debug("Found tonne column at index {}: '{}'", i, header);
            }
            else if (indices.ipeIndex < 0 && IPE_PATTERN.matcher(header).matches()) {
                indices.ipeIndex = i;
                logger.debug("Found IPE column at index {}: '{}'", i, header);
            }
            else if (indices.descriptionIndex < 0 && DESCRIPTION_PATTERN.matcher(header).matches()) {
                indices.descriptionIndex = i;
                logger.debug("Found description column at index {}: '{}'", i, header);
            }
        }
        
        // Second pass: check for specific terms if patterns didn't match
        if (indices.monthIndex < 0 || indices.matriculeIndex < 0 || indices.coutDTIndex < 0) {
            for (int i = 0; i < headerRow.size(); i++) {
                CellData cell = headerRow.get(i);
                if (cell == null || cell.getValue() == null) continue;
                
                String header = cell.getStringValue().trim().toLowerCase();
                
                // Exact matching for common terms
                if (indices.monthIndex < 0 && (header.equals("mois") || header.equals("month"))) {
                    indices.monthIndex = i;
                    logger.debug("Found month column (exact match) at index {}: '{}'", i, header);
                }
                else if (indices.matriculeIndex < 0 && header.equals("matricule")) {
                    indices.matriculeIndex = i;
                    logger.debug("Found matricule column (exact match) at index {}: '{}'", i, header);
                }
                else if (indices.coutDTIndex < 0 && (header.equals("cout") || header.equals("coût") || 
                                                   header.contains("dt") || header.contains("tnd"))) {
                    indices.coutDTIndex = i;
                    logger.debug("Found cout DT column (exact match) at index {}: '{}'", i, header);
                }
                else if (indices.descriptionIndex < 0 && 
                        (header.equals("description") || header.equals("type") || 
                         header.equals("désignation") || header.equals("designation"))) {
                    indices.descriptionIndex = i;
                    logger.debug("Found description column (exact match) at index {}: '{}'", i, header);
                }
            }
        }
        
        // Fallback: If still can't find essential columns, make educated guesses
        if (indices.monthIndex < 0) {
            // Month is typically the first column or a merged column
            indices.monthIndex = findMergedHeaderColumn(headerRow);
            if (indices.monthIndex >= 0) {
                logger.debug("Inferred month column at index {} (merged column)", indices.monthIndex);
            } else {
                indices.monthIndex = 0;  // Default to first column
                logger.debug("Defaulting month column to index 0");
            }
        }
        
        if (indices.matriculeIndex < 0) {
            // Matricule is typically in first or second column
            indices.matriculeIndex = (indices.monthIndex == 0) ? 1 : 0;
            logger.debug("Defaulting matricule column to index {}", indices.matriculeIndex);
        }
        
        // Try to infer consumption column if not found
        if (indices.consommationLIndex < 0) {
            for (int i = 0; i < headerRow.size(); i++) {
                CellData cell = headerRow.get(i);
                if (cell != null && cell.getValue() != null) {
                    String header = cell.getStringValue().trim().toLowerCase();
                    if (header.contains("l") || header.contains("litre")) {
                        indices.consommationLIndex = i;
                        logger.debug("Inferred consommation L column at index {}: '{}'", i, header);
                        break;
                    }
                }
            }
        }
        
        return indices;
    }

    /**
     * Find a column that is likely to be a merged header (often used for month)
     */
    private int findMergedHeaderColumn(List<CellData> headerRow) {
        // Check for months specifically
        List<String> monthNames = Arrays.asList(
            "janvier", "février", "mars", "avril", "mai", "juin", 
            "juillet", "août", "septembre", "octobre", "novembre", "décembre",
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        );
        
        for (int i = 0; i < headerRow.size(); i++) {
            CellData cell = headerRow.get(i);
            if (cell != null && cell.getValue() != null) {
                String value = cell.getStringValue().trim().toLowerCase();
                for (String month : monthNames) {
                    if (value.contains(month)) {
                        return i;
                    }
                }
            }
        }
        
        return -1;
    }

    /**
     * Resolves sheet data including merged cells and formulas
     * Returns a rectangular matrix of cell data with all merges resolved
     */
    private List<List<CellData>> resolveSheetData(Sheet sheet, FormulaEvaluator evaluator, DataFormatter formatter) {
        List<List<CellData>> resolvedSheet = new ArrayList<>();
        int maxColumnCount = 0;
        
        // First pass: Create basic cell data matrix and find max column count
        for (int i = 0; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            List<CellData> rowData = new ArrayList<>();
            
            if (row != null) {
                int lastCellNum = row.getLastCellNum();
                maxColumnCount = Math.max(maxColumnCount, lastCellNum);
                
                for (int j = 0; j < lastCellNum; j++) {
                    Cell cell = row.getCell(j);
                    rowData.add(cell != null ? new CellData(cell, evaluator, formatter) : null);
                }
            }
            
            resolvedSheet.add(rowData);
        }
        
        // Ensure all rows have the same number of columns
        for (List<CellData> row : resolvedSheet) {
            while (row.size() < maxColumnCount) {
                row.add(null);
            }
        }
        
        // Second pass: Resolve merged regions
        for (int i = 0; i < sheet.getNumMergedRegions(); i++) {
            CellRangeAddress region = sheet.getMergedRegion(i);
            int firstRow = region.getFirstRow();
            int lastRow = region.getLastRow();
            int firstCol = region.getFirstColumn();
            int lastCol = region.getLastColumn(); // Fixed: previously incorrectly using firstColumn
            
            logger.debug("Processing merged region: rows {}-{}, cols {}-{}", 
                       firstRow, lastRow, firstCol, lastCol);
            
            // Get the value from the top-left cell of the merged region
            CellData topLeftValue = null;
            if (firstRow < resolvedSheet.size() && 
                firstCol < resolvedSheet.get(firstRow).size()) {
                topLeftValue = resolvedSheet.get(firstRow).get(firstCol);
                if (topLeftValue != null) {
                    logger.debug("Merged cell value: {}", topLeftValue.getStringValue());
                }
            }
            
            // Copy the value to all cells in the merged region
            for (int r = firstRow; r <= lastRow; r++) {
                if (r >= resolvedSheet.size()) continue;
                
                List<CellData> row = resolvedSheet.get(r);
                for (int c = firstCol; c <= lastCol; c++) {
                    if (c >= row.size()) continue;
                    row.set(c, topLeftValue);
                }
            }
        }
        
        return resolvedSheet;
    }

    /**
     * Checks if a row is empty (contains no data)
     */
    private boolean isEmptyRow(List<CellData> row) {
        for (CellData cell : row) {
            if (cell != null && cell.getValue() != null) {
                String strValue = cell.getStringValue().trim();
                if (!strValue.isEmpty() && !strValue.equals("0") && !strValue.equals("0.0")) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Helper class to store cell data with type information
     */
    private static class CellData {
        private final Object value;
        private final CellType cellType;
        private final boolean isDate;
        private final String formattedValue;
        
        public CellData(Cell cell, FormulaEvaluator evaluator, DataFormatter formatter) {
            this.cellType = cell.getCellType();
            this.isDate = cellType == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell);
            
            // Get formatted value considering cell style and data format
            this.formattedValue = formatter.formatCellValue(cell, evaluator);
            
            // Initialize the value field
            Object tempValue = null;
            
            // Get raw value based on cell type
            if (isDate) {
                tempValue = cell.getDateCellValue();
            } else if (cellType == CellType.FORMULA) {
                // Evaluate formula
                try {
                    CellValue cellValue = evaluator.evaluate(cell);
                    switch (cellValue.getCellType()) {
                        case NUMERIC:
                            tempValue = cellValue.getNumberValue();
                            break;
                        case STRING:
                            tempValue = cellValue.getStringValue();
                            break;
                        case BOOLEAN:
                            tempValue = cellValue.getBooleanValue();
                            break;
                        default:
                            tempValue = null;
                    }
                } catch (Exception e) {
                    // If formula evaluation fails, use the formatted value
                    logger.warn("Error evaluating formula in cell {}: {}", 
                              CellReference.convertNumToColString(cell.getColumnIndex()) + (cell.getRowIndex() + 1), 
                              e.getMessage());
                    tempValue = this.formattedValue;
                }
            } else {
                switch (cellType) {
                    case STRING:
                        tempValue = cell.getStringCellValue();
                        break;
                    case NUMERIC:
                        tempValue = cell.getNumericCellValue();
                        break;
                    case BOOLEAN:
                        tempValue = cell.getBooleanCellValue();
                        break;
                    case BLANK:
                    case ERROR:
                    default:
                        tempValue = null;
                        break;
                }
            }
            
            this.value = tempValue; // Assign the initialized value to the final field
        }
        
        public Object getValue() {
            return value;
        }
        
        public String getStringValue() {
            // If we have a formatted value, use it for consistent rendering
            if (formattedValue != null && !formattedValue.isEmpty()) {
                return formattedValue;
            }
            
            if (value == null) return "";
            
            if (isDate) {
                Date date = (Date) value;
                return String.format("%tB %tY", date, date);
            }
            
            return value.toString();
        }
        
        public double getNumericValue() {
            if (value == null) return 0.0;
            
            if (value instanceof Number) {
                return ((Number) value).doubleValue();
            } else if (value instanceof Boolean) {
                return ((Boolean) value) ? 1.0 : 0.0;
            } else if (value instanceof String) {
                try {
                    // Clean string before parsing
                    String cleanValue = ((String) value).replaceAll("[^\\d.,\\-]", "").trim().replace(',', '.');
                    if (!cleanValue.isEmpty()) {
                        return Double.parseDouble(cleanValue);
                    }
                } catch (NumberFormatException e) {
                    // If parsing fails, try with the formatted value
                    try {
                        String cleanFormatted = formattedValue.replaceAll("[^\\d.,\\-]", "").trim().replace(',', '.');
                        if (!cleanFormatted.isEmpty()) {
                            return Double.parseDouble(cleanFormatted);
                        }
                    } catch (NumberFormatException ex) {
                        // Ignore this exception too
                    }
                }
            }
            
            return 0.0;
        }
    }
}