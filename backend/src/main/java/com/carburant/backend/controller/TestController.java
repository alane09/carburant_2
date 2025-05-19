package com.carburant.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/collections")
    public ResponseEntity<Map<String, Object>> listCollections() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get all collection names
            Set<String> collections = mongoTemplate.getCollectionNames();
            response.put("collections", collections);
            
            // Get collection counts
            Map<String, Long> counts = new HashMap<>();
            for (String collection : collections) {
                counts.put(collection, mongoTemplate.getCollection(collection).countDocuments());
            }
            response.put("counts", counts);
            
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/test-insert")
    public ResponseEntity<Map<String, Object>> testInsert() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Test insert into vehicle_data
            Map<String, Object> vehicleData = new HashMap<>();
            vehicleData.put("test", "test_vehicle_data");
            vehicleData.put("type", "test");
            mongoTemplate.insert(vehicleData, "vehicle_data");
            
            // Test insert into regression_results
            Map<String, Object> regressionData = new HashMap<>();
            regressionData.put("test", "test_regression_results");
            regressionData.put("type", "test");
            mongoTemplate.insert(regressionData, "regression_results");
            
            response.put("status", "success");
            response.put("message", "Test data inserted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
