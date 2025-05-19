package com.carburant.backend.utils;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Helper class for Excel file operations
 */
@Component
public class ExcelHelper {

    /**
     * Check if a file is an Excel file
     * 
     * @param file The file to check
     * @return true if the file is an Excel file, false otherwise
     */
    public boolean isExcelFile(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && (
            contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
            contentType.equals("application/vnd.ms-excel")
        );
    }
    
    /**
     * Get the names of all sheets in an Excel file
     * 
     * @param inputStream The input stream of the Excel file
     * @return A list of sheet names
     * @throws IOException If the file cannot be read
     */
    public List<String> getSheetNames(InputStream inputStream) throws IOException {
        List<String> sheetNames = new ArrayList<>();
        
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            int numberOfSheets = workbook.getNumberOfSheets();
            
            for (int i = 0; i < numberOfSheets; i++) {
                Sheet sheet = workbook.getSheetAt(i);
                sheetNames.add(sheet.getSheetName());
            }
        }
        
        return sheetNames;
    }
    
    /**
     * Read data from a specific sheet in an Excel file
     * 
     * @param inputStream The input stream of the Excel file
     * @param sheetName The name of the sheet to read
     * @return A list of rows, each containing a list of cell values
     * @throws IOException If the file cannot be read
     */
    public List<List<String>> readSheet(InputStream inputStream, String sheetName) throws IOException {
        List<List<String>> data = new ArrayList<>();
        
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheet(sheetName);
            
            if (sheet == null) {
                throw new IOException("Sheet not found: " + sheetName);
            }
            
            // Iterate through each row in the sheet
            for (Row row : sheet) {
                List<String> rowData = new ArrayList<>();
                
                // Iterate through each cell in the row
                for (Cell cell : row) {
                    rowData.add(getCellValueAsString(cell));
                }
                
                data.add(rowData);
            }
        }
        
        return data;
    }
    
    /**
     * Get a cell value as a string
     * 
     * @param cell The cell to read
     * @return The cell value as a string
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    try {
                        return cell.getStringCellValue();
                    } catch (Exception e2) {
                        return cell.getCellFormula();
                    }
                }
            case BLANK:
                return "";
            default:
                return "";
        }
    }
}