package com.carburant.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class MongoDBConnectionTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Test
    void testMongoDBConnection() {
        assertDoesNotThrow(() -> {
            // This will throw an exception if not connected
            mongoTemplate.getDb().runCommand(org.bson.Document.parse("{ ping: 1 }"));
        }, "MongoDB connection should be successful");
    }

    @Test
    void testCollectionsExist() {
        // Test will create collections if they don't exist
        String[] collections = {"vehicle_data", "regression_results", "files"};
        
        for (String collection : collections) {
            assertTrue(mongoTemplate.collectionExists(collection),
                    "Collection " + collection + " should exist");
        }
    }
}
