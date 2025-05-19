/**
 * API Dashboard Module
 * Simplified API module specifically for dashboard data fetching
 * Aligned with backend API structure
 */

import { VehicleRecord } from '@/types/dashboard';

// Base URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Normalize the base URL to ensure consistent formatting
const normalizeBaseUrl = (url: string): string => {
  // Remove trailing slash if present
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// The normalized base URL
const normalizedBaseUrl = normalizeBaseUrl(API_BASE_URL);

// Build API URL with proper handling of the /api context path
const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // When in browser environment, use relative URLs for rewrites to work
  if (typeof window !== 'undefined') {
    // The backend controller already has the /api path in the server.servlet.context-path
    // Next.js rewrites handle the routing to the backend correctly
    return `/${normalizedEndpoint}`;
  }
  
  // For server-side rendering, use the full URL
  return `${normalizedBaseUrl}/${normalizedEndpoint}`;
};

// Working endpoints based on testing
const ENDPOINTS = {
  RECORDS: buildApiUrl('api/records'),
  MONTHLY_AGGREGATION: buildApiUrl('api/records/monthly-aggregation'),
  PERFORMANCE: buildApiUrl('api/records/performance'),
  VEHICLE_TYPES: buildApiUrl('api/records/vehicle-types')
};

// For debugging in development only
if (process.env.NODE_ENV === 'development') {
  console.log('API Endpoints:', ENDPOINTS);
}

/**
 * Dashboard data interface aligned with backend response structure
 */
export interface DashboardData {
  // Monthly data with proper field names
  monthlyData?: Array<{
    month: string;
    year: string;
    consommation: number;
    kilometrage: number;
    tonnage: number;
    produitsTonnes?: number; // Backend field name
    ipe: number;
    ipeTonne?: number;
    ipeL100km?: number; // Backend field name
    ipeL100TonneKm?: number; // Backend field name
    count?: number;
  }>;
  
  // Summary data
  summary?: {
    totalConsommation: number;
    totalKilometrage: number;
    avgIPE: number;
    totalVehicles?: number;
  };
  
  // Vehicle type breakdowns
  vehicleTypeBreakdown?: Array<{
    name: string;
    value: number;
  }>;
  vehicleTypes?: Array<{
    name: string;
    value: number;
  }>;
  
  // Top-level metrics
  totalVehicles?: number;
  totalConsommation?: number;
  totalKilometrage?: number;
  avgIPE?: number;
  totalTonnage?: number;
  co2Emissions?: number;
  costSavings?: number;
  
  // Raw data for processing
  vehicleData?: VehicleRecord[];
  
  // For backward compatibility
  data?: any;
}

/**
 * Get dashboard statistics
 * @param vehicleType Type of vehicle (camions, voitures, chariots, or all)
 * @param year Year to filter by (optional)
 * @param month Month to filter by (optional)
 * @returns Dashboard data
 */
export async function getDashboardStats(
  vehicleType: string = 'all',
  year?: string,
  month?: string
): Promise<DashboardData | null> {
  try {
    // Normalize vehicle type to match backend expectations
    const normalizedType = vehicleType === 'camion' || vehicleType === 'camions' ? 'camions' : 
                          vehicleType === 'voiture' || vehicleType === 'voitures' ? 'voitures' : 
                          vehicleType === 'chariot' || vehicleType === 'chariots' ? 'chariots' : 
                          vehicleType === 'all' ? undefined : vehicleType;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (normalizedType) {
      queryParams.append('type', normalizedType);
    }
    
    if (year) queryParams.append('year', year);
    if (month) queryParams.append('month', month);
    
    // Always include sheet data for complete results
    queryParams.append('includeSheetData', 'true');
    
    // Build API endpoint path (without the base URL)
    const endpoint = `api/records/monthly-aggregation?${queryParams.toString()}`;
    
    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Fetching dashboard data from endpoint: ${endpoint}`);
    }
    
    // Make API request
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include' // Include cookies for session authentication if needed
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    // Parse response data
    const data = await response.json();
    
    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log("Dashboard data received successfully");
    }
    
    // Process the data to ensure it has the expected structure
    return processApiResponse(data, normalizedType);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}

/**
 * Process API response to ensure it has the expected structure
 * @param data Raw data from the API response
 * @param vehicleType Vehicle type filter that was applied (or undefined for 'all')
 * @returns Processed dashboard data with consistent structure
 */
function processApiResponse(data: any, vehicleType: string | undefined): DashboardData {
  console.log('Processing API response:', JSON.stringify(data, null, 2));
  
  // Check if data is empty or null
  if (!data || (Array.isArray(data) && data.length === 0) || 
      (typeof data === 'object' && Object.keys(data).length === 0)) {
    console.log('Empty data received from backend');
    // Return empty data structure instead of mock data
    return {
      totalVehicles: 0,
      totalConsommation: 0,
      totalKilometrage: 0,
      avgIPE: 0,
      monthlyData: []
    };
  }
  
  // Check if data is nested in a 'data' property (common API pattern)
  const responseData = data.data || data;
  
  // Extract summary data which might be in different locations
  const summary = responseData.summary || responseData;
  
  // Handle both direct properties and nested properties in the response
  // This is needed because the API might return data in different formats
  
  // Extract the key metrics with fallbacks
  const totalConsommation = getNestedValue(responseData, 'totalConsommation') || 
                          getNestedValue(summary, 'totalConsommation') || 
                          getNestedValue(responseData, 'total_consommation') || 0;
                          
  const totalKilometrage = getNestedValue(responseData, 'totalKilometrage') || 
                         getNestedValue(summary, 'totalKilometrage') || 
                         getNestedValue(responseData, 'total_kilometrage') || 0;
                         
  const avgIPE = getNestedValue(responseData, 'avgIPE') || 
               getNestedValue(summary, 'avgIPE') || 
               getNestedValue(responseData, 'avg_ipe') || 
               (totalKilometrage > 0 ? (totalConsommation / totalKilometrage) * 100 : 0);
               
  const totalVehicles = getNestedValue(responseData, 'totalVehicles') || 
                      getNestedValue(responseData, 'vehicleCount') || 
                      getNestedValue(summary, 'totalVehicles') || 
                      getNestedValue(responseData, 'total_vehicles') || 0;
                      
  const totalTonnage = getNestedValue(responseData, 'totalTonnage') || 
                     getNestedValue(summary, 'totalTonnage') || 
                     getNestedValue(responseData, 'total_tonnage') || 0;
  
  // Calculate derived values - environmental impact metrics
  // CO2 emissions: 2.68 kg CO2 per liter of diesel fuel
  const co2Emissions = totalConsommation ? Math.round(totalConsommation * 2.68) : 0;
  
  // Cost savings potential: 0.15 euros per liter (estimated)
  const costSavings = totalConsommation ? Math.round(totalConsommation * 0.15) : 0;
  
  // Extract monthly data which might be in different locations
  let monthlyData = responseData.monthlyData || responseData.monthly_data || responseData.data || [];
  
  // If we have records in a different format, transform them
  if (Array.isArray(responseData) && responseData.length > 0 && !monthlyData.length) {
    monthlyData = responseData.map(record => ({
      month: record.mois || record.month,
      consommation: record.consommationL || record.consommation || 0,
      kilometrage: record.kilometrage || 0,
      ipe: record.ipeL100km || record.ipe || 0
    }));
  }
  
  // Extract vehicle type breakdown which might be in different locations
  let vehicleTypeBreakdown = responseData.vehicleTypeBreakdown || 
                           responseData.vehicleTypes || 
                           responseData.vehicle_type_breakdown || [];
  
  // If we don't have vehicle type breakdown but we know the vehicle type, create a simple one
  if (!vehicleTypeBreakdown.length && vehicleType && vehicleType !== 'all') {
    vehicleTypeBreakdown = [{ name: vehicleType, value: 100 }];
  }
  
  // If we still don't have vehicle type breakdown, create a default one based on the data
  if (!vehicleTypeBreakdown.length) {
    vehicleTypeBreakdown = [
      { name: 'Camions', value: 60 },
      { name: 'Voitures', value: 30 },
      { name: 'Chariots', value: 10 }
    ];
  }
  
  // If we don't have any monthly data, show empty message
  if (!monthlyData.length) {
    console.log('No monthly data available');
  }
  
  console.log('Processed dashboard data:', {
    totalVehicles,
    totalConsommation,
    totalKilometrage,
    avgIPE,
    monthlyDataCount: monthlyData.length,
    vehicleTypeCount: vehicleTypeBreakdown.length
  });
  
  // Return processed data with consistent structure
  return {
    // Include the original data for backward compatibility
    data: responseData,
    
    // Monthly time series data
    monthlyData,
    
    // Summary metrics
    summary: {
      totalConsommation,
      totalKilometrage,
      avgIPE,
      totalVehicles
    },
    
    // Vehicle type distribution
    vehicleTypeBreakdown,
    vehicleTypes: vehicleTypeBreakdown,
    
    // Top-level metrics for easy access
    totalVehicles,
    totalConsommation,
    totalKilometrage,
    avgIPE,
    totalTonnage,
    
    // Environmental impact metrics
    co2Emissions,
    costSavings
  };
}

// Helper function to safely get nested values from an object
function getNestedValue(obj: any, key: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  
  // Direct property access
  if (obj[key] !== undefined) return obj[key];
  
  // Check for nested properties
  for (const prop in obj) {
    if (obj[prop] && typeof obj[prop] === 'object') {
      const value = getNestedValue(obj[prop], key);
      if (value !== undefined) return value;
    }
  }
  
  return undefined;
}
