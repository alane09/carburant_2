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
@Document(collection = "vehicle_data")
public class VehicleRecord {
    @Id
    private String id;
    private String type;             // Vehicle type (sheet name: Camions, Voitures, etc.)
    private String matricule;        // Vehicle registration number
    private String mois;             // Month (from merged cells)
    private String year;             // Year of the record
    private String region;           // Region (geographical area)
    private double consommationL;    // Consumption in L
    private double consommationTEP;  // Consumption in TEP
    private double coutDT;           // Cost in DT
    private double kilometrage;      // Distance in Km
    private double produitsTonnes;   // Transported products in Tons (for trucks)
    private double ipeL100km;        // Energy Performance Index in L/100km (for utility vehicles)
    private double ipeL100TonneKm;   // Energy Performance Index in L/Tonne.100Km (for trucks)
    private Map<String, Double> rawValues;  // Raw values for any additional metrics
}