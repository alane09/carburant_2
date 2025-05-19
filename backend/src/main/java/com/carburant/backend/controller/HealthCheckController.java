package com.carburant.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthCheckController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping
    public ResponseEntity<String> healthCheck() {
        try {
            // Simple ping to check MongoDB connection
            mongoTemplate.getDb().runCommand(org.bson.Document.parse("{ ping: 1 }"));
            return ResponseEntity.ok("MongoDB connection is healthy");
        } catch (Exception e) {
            return ResponseEntity.status(503).body("MongoDB connection failed: " + e.getMessage());
        }
    }
}
