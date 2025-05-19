package com.carburant.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.carburant.backend.model.RegressionResult;

@Repository
public interface RegressionRepository extends MongoRepository<RegressionResult, String> {
    Optional<RegressionResult> findByType(String type);
    List<RegressionResult> findAllByType(String type);
}