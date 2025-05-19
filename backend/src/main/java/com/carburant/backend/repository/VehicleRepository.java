package com.carburant.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.carburant.backend.model.VehicleRecord;

@Repository
public interface VehicleRepository extends MongoRepository<VehicleRecord, String> {
    List<VehicleRecord> findByType(String type);
    List<VehicleRecord> findByTypeAndMois(String type, String mois);
    List<VehicleRecord> findByMatricule(String matricule);
    List<VehicleRecord> findByMois(String mois);
    void deleteByType(String type);
    
    // Methods for deleting records by type and year/month
    void deleteByTypeAndYear(String type, String year);
    void deleteByTypeAndYearAndMois(String type, String year, String mois);
    
    // Methods for filtering by year
    List<VehicleRecord> findByYear(String year);
    List<VehicleRecord> findByTypeAndYear(String type, String year);
    List<VehicleRecord> findByMatriculeAndYear(String matricule, String year);
    List<VehicleRecord> findByYearAndMois(String year, String mois);
    
    // Methods for filtering by type and matricule
    List<VehicleRecord> findByTypeAndMatricule(String type, String matricule);
    List<VehicleRecord> findByTypeAndMatriculeAndYear(String type, String matricule, String year);
    
    // Methods for filtering by type, year, and month
    List<VehicleRecord> findByTypeAndYearAndMois(String type, String year, String mois);
    
    // Methods for filtering by matricule, year, and month
    List<VehicleRecord> findByMatriculeAndYearAndMois(String matricule, String year, String mois);
    
    // Method for filtering by type, matricule, and month
    List<VehicleRecord> findByTypeAndMatriculeAndMois(String type, String matricule, String mois);
    
    // Method for filtering by all parameters
    List<VehicleRecord> findByTypeAndMatriculeAndYearAndMois(String type, String matricule, String year, String mois);
    
    // Region-based methods for deleting
    void deleteByTypeAndYearAndRegion(String type, String year, String region);
    void deleteByTypeAndYearAndMoisAndRegion(String type, String year, String mois, String region);
    
    // Region-based methods for filtering
    List<VehicleRecord> findByRegion(String region);
    List<VehicleRecord> findByTypeAndRegion(String type, String region);
    List<VehicleRecord> findByYearAndRegion(String year, String region);
    List<VehicleRecord> findByTypeAndYearAndRegion(String type, String year, String region);
    List<VehicleRecord> findByTypeAndYearAndMoisAndRegion(String type, String year, String mois, String region);
    
    // Method to get distinct vehicle types from the database
    @Query(value = "{}", fields = "{type: 1, _id: 0}")
    List<String> findDistinctTypes();
}