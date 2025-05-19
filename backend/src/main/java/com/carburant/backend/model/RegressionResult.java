package com.carburant.backend.model;

import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "regression_results")
public class RegressionResult {
    @Id
    private String id;
    private String type; // Vehicle type (sheet name)
    private String regressionEquation; // Formatted equation (e.g., "Y = 0.1468*X1 + 0.2412*X2 + 305.0161")
    private Map<String, Double> coefficients; // Map of variable names to coefficients
    private double intercept; // Y-intercept
    private double rSquared; // R-squared value
    private double adjustedRSquared; // Adjusted R-squared
    private double mse; // Mean Squared Error
}