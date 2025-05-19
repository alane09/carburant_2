package com.carburant.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Arrays;
import java.util.List;

@Component
public class MongoDBInitializer {

    @Autowired
    private MongoTemplate mongoTemplate;


    @PostConstruct
    public void init() {
        createCollectionsIfNotExist();
        createIndexes();
    }

    private void createCollectionsIfNotExist() {
        List<String> collections = Arrays.asList("vehicle_data", "regression_results", "files");
        
        collections.forEach(collection -> {
            if (!mongoTemplate.collectionExists(collection)) {
                mongoTemplate.createCollection(collection);
                System.out.println("Created collection: " + collection);
            } else {
                System.out.println("Collection already exists: " + collection);
            }
        });
    }

    private void createIndexes() {
        try {
            // Indexes for vehicle_data
            createIndexIfNotExists("vehicle_data", "type_asc", "type");
            createIndexIfNotExists("vehicle_data", "matricule_asc", "matricule");
            createIndexIfNotExists("vehicle_data", "year_asc", "year");
            createIndexIfNotExists("vehicle_data", "mois_asc", "mois");

            // Indexes for regression_results
            createIndexIfNotExists("regression_results", "type_asc", "type");

            // Indexes for files
            createIndexIfNotExists("files", "vehicleType_asc", "vehicleType");
            createIndexIfNotExists("files", "year_asc", "year");
            
            System.out.println("All indexes verified/created successfully");
        } catch (Exception e) {
            System.err.println("Error creating indexes: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createIndexIfNotExists(String collectionName, String indexName, String... fields) {
        try {
            IndexOperations indexOps = mongoTemplate.indexOps(collectionName);
            List<IndexInfo> indexInfoList = indexOps.getIndexInfo();
            
            // Check if index already exists
            boolean indexExists = indexInfoList.stream()
                .anyMatch(indexInfo -> 
                    indexInfo.getName() != null && 
                    (indexInfo.getName().equals(indexName) || 
                     Arrays.stream(fields).allMatch(field -> 
                         indexInfo.getIndexFields().stream()
                             .anyMatch(indexField -> indexField.getKey().equals(field))
                     ))
                );

            if (!indexExists) {
                Index index = new Index();
                for (String field : fields) {
                    index.on(field, org.springframework.data.domain.Sort.Direction.ASC);
                }
                index.named(indexName);
                indexOps.ensureIndex(index);
                System.out.println("Created index " + indexName + " on collection " + collectionName);
            } else {
                System.out.println("Index " + indexName + " already exists on collection " + collectionName);
            }
        } catch (Exception e) {
            System.err.println("Error creating index " + indexName + " on collection " + collectionName + ": " + e.getMessage());
            throw e;
        }
    }
}
