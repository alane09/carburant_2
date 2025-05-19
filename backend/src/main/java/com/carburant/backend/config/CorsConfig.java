package com.carburant.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Configuration class for CORS (Cross-Origin Resource Sharing)
 * Enables frontend applications from different origins to access the API
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.origines-autorisees:*}")
    private String allowedOrigins;
    
    @Value("${app.cors.origin-patterns:*}")
    private String allowedOriginPatterns;
    
    @Value("${app.cors.methodes-autorisees:GET,POST,PUT,DELETE,OPTIONS,PATCH}")
    private String allowedMethods;
    
    @Value("${app.cors.en-tetes-autorises:*}")
    private String allowedHeaders;
    
    @Value("${app.cors.max-age:3600}")
    private long maxAge;
    
    @Value("${app.cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
          // Process allowed origins from properties
        if (allowedOrigins != null) {
            String[] origins = allowedOrigins.split(",");
            for (String origin : origins) {
                if (!origin.trim().equals("*")) {
                    config.addAllowedOrigin(origin.trim());
                }
            }
        }
        
        // Add allowed origin patterns from properties
        if (allowedOriginPatterns != null) {
            String[] patterns = allowedOriginPatterns.split(",");
            for (String pattern : patterns) {
                config.addAllowedOriginPattern(pattern.trim());
            }
        }
        
        // Process allowed headers from properties
        if (allowedHeaders != null) {
            if (allowedHeaders.equals("*")) {
                config.addAllowedHeader("*");
            } else {
                String[] headers = allowedHeaders.split(",");
                for (String header : headers) {
                    config.addAllowedHeader(header.trim());
                }
            }
        }
        
        // Process allowed methods from properties
        if (allowedMethods != null) {
            String[] methods = allowedMethods.split(",");
            for (String method : methods) {
                config.addAllowedMethod(method.trim());
            }
        }
        
        // Allow cookies and credentials
        config.setAllowCredentials(allowCredentials);
        
        // Set how long the browser can cache the CORS response
        config.setMaxAge(maxAge);
        
        // Add exposed headers if needed
        config.addExposedHeader("Access-Control-Allow-Origin");
        config.addExposedHeader("Access-Control-Allow-Credentials");
        
        // Apply this configuration to all paths
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}