/* eslint-disable @typescript-eslint/no-unused-vars */
// Types for API responses and requests
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

interface VehicleRecord {
  id?: string;
  type: string;
  matricule: string;
  mois: string;
  year: string;
  consommationL: number;
  consommationTEP: number;
  coutDT: number;
  kilometrage: number;
  produitsTonnes: number;
  ipeL100km: number;
  ipeL100TonneKm: number;
  rawValues?: Record<string, number>;
}

interface RegressionResult {
  id?: string;
  type: string;
  regressionEquation: string;
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  mse: number;
  monthlyData?: Array<{
    month: string;
    year: string;
    consommation: number;
    kilometrage: number;
    tonnage: number;
    ipe: number;
  }>;
}

interface UploadedFile {
  id: string;
  name: string;
  uploadDate: string;
  size: number;
}

interface DashboardStats {
  totalVehicles: number;
  totalConsommation: number;
  avgIPE: number;
  totalKilometrage: number;
}

interface MonthlyData {
  month: string;
  year: string;
  consommation: number;
  kilometrage: number;
  tonnage: number;
  ipe: number;
}

interface PerformanceData {
  vehicleType: string;
  metrics: {
    efficiency: number;
    consumption: number;
    distance: number;
  };
  monthlyData?: MonthlyData[];
}

interface VehicleTypeBreakdown {
  type: string;
  count: number;
  percentage: number;
}

interface ReportResponse {
  success: boolean;
  message?: string;
}

// Toast notification system
const toast = {
  success: (message: string) => {
    import('sonner').then(({ toast: toastFn }) => {
      toastFn.success(message);
    }).catch((error: Error) => {
      console.error('Failed to load toast:', error);
    });
  },
  error: (message: string) => {
    import('sonner').then(({ toast: toastFn }) => {
      toastFn.error(message);
    }).catch((error: Error) => {
      console.error('Failed to load toast:', error);
    });
  }
};

// Debug logging
const DEBUG = process.env.NODE_ENV === 'development';

function logDebug(message: string, ...args: unknown[]): void {
  if (DEBUG) {
    console.log(`[API Debug] ${message}`, ...args);
  }
}

function logError(message: string, error: Error | unknown): void {
  console.error(`[API Error] ${message}:`, error);
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack);
  }
}

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const NORMALIZED_BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// API endpoints
const WORKING_ENDPOINTS = {
  RECORDS: `${NORMALIZED_BASE_URL}/records`,
  MONTHLY_AGGREGATION: `${NORMALIZED_BASE_URL}/records/monthly-aggregation`
};

// Export configuration
export { API_BASE_URL, WORKING_ENDPOINTS };

/**
 * Normalize the base URL to ensure consistent formatting
 */
export function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Build a complete API URL with the endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let cleanEndpoint = normalizedEndpoint;
  
  while (cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4);
  }
  
  const url = `${NORMALIZED_BASE_URL}${cleanEndpoint}`;
  logDebug(`Built API URL: ${url}`);
  return url;
};

// Generic API request function with retry logic
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<ApiResponse<T>> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    logDebug(`Making API request to: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || response.statusText;
      
      // Retry on server errors (5xx) or connection issues
      if ((response.status >= 500 || response.status === 0) && retryCount < maxRetries) {
        logDebug(`Retrying request (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount)));
        return apiRequest<T>(endpoint, options, retryCount + 1);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    logError(`API request failed: ${endpoint}`, error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

// Export the API request function
export { apiRequest };

/**
 * Vehicle API for handling vehicle records and statistics
 * VehicleController is mapped to /records in the backend
 * So the full path is /api/records
 */
export const VehicleAPI = {
  /**
   * Get available vehicle types
   * Endpoint: /records?type=all
   */
  async getVehicleTypes(): Promise<string[]> {
    try {
      const { data, error } = await apiRequest<VehicleRecord[]>('/records?type=all');
      
      if (error) {
        logError("Error fetching vehicle types:", error);
        return ['VOITURE', 'CAMION', 'CHARIOT'];
      }
      
      if (Array.isArray(data)) {
        const types = Array.from(new Set(data.map(record => record.type)));
        return types.filter(type => Boolean(type) && type !== 'Sheet1' && type !== 'sheet1');
      }
      
      return ['VOITURE', 'CAMION', 'CHARIOT'];
    } catch (error) {
      logError("Error in getVehicleTypes:", error);
      return ['VOITURE', 'CAMION', 'CHARIOT'];
    }
  },
  
  /**
   * Get all vehicle records with optional filtering and pagination
   * Endpoint: /api/records
   */
  async getRecords(params?: { 
    type?: string; 
    mois?: string; 
    matricule?: string;
    year?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<VehicleRecord[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const queryString = queryParams.toString();
      const endpoint = `records${queryString ? `?${queryString}` : ''}`;
      
      const { data, error } = await apiRequest<VehicleRecord[]>(endpoint);
      
      if (error) {
        logError(`Error fetching records for params ${JSON.stringify(params)}:`, error);
        toast.error(`Erreur lors de la récupération des données: ${error}`);
        return [];
      }
      
      if (!data || data.length === 0) {
        logDebug(`No records found for params:`, params);
      }
      
      return data || [];
    } catch (error) {
      logError("Error in getRecords:", error);
      return [];
    }
  },
  
  /**
   * Get a vehicle record by ID
   * Endpoint: /api/records/{id}
   */
  async getRecordById(id: string): Promise<VehicleRecord | null> {
    try {
      const { data, error } = await apiRequest<VehicleRecord>(`/records/${id}`);
      
      if (error) {
        logError(`Error fetching record ${id}:`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      logError("Error in getRecordById:", error);
      return null;
    }
  },
  
  /**
   * Get dashboard statistics and aggregated data
   * This is used for the main dashboard page
   * NOTE: This method is deprecated. Use getDashboardStats from api-dashboard.ts instead.
   * Endpoint: /records/monthly-aggregation
   */
  async getDashboardStats(params?: {
    year?: string;
    month?: string;
    vehicleType?: string;
  }): Promise<DashboardStats> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.year) queryParams.append('year', params.year);
      if (params?.month) queryParams.append('month', params.month);
      
      const type = params?.vehicleType || 'all';
      queryParams.append('type', type);
      
      const endpoint = `/records/monthly-aggregation${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      logDebug(`Fetching dashboard stats from: ${endpoint}`);
      
      const { data, error } = await apiRequest<DashboardStats>(endpoint);
      
      if (error) {
        logError("Error fetching dashboard stats", error);
        toast.error(`Failed to load dashboard stats: ${error}`);
        throw new Error(`Failed to load dashboard stats: ${error}`);
      }
      
      return data || { totalVehicles: 0, totalConsommation: 0, avgIPE: 0, totalKilometrage: 0 };
    } catch (error) {
      logError("Error in getDashboardStats", error);
      toast.error(`Failed to load dashboard stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },
  
  /**
   * Get performance data for vehicles
   * Endpoint: /records/performance
   */
  async getPerformanceData(params?: {
    year?: string;
    month?: string;
    vehicleType?: string;
  }): Promise<PerformanceData[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.year) queryParams.append('year', params.year);
      if (params?.month) queryParams.append('month', params.month);
      
      const type = params?.vehicleType || 'all';
      queryParams.append('type', type);
      
      const endpoint = `/records/performance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      logDebug(`Fetching performance data from: ${endpoint}`);
      
      const { data, error } = await apiRequest<PerformanceData[]>(endpoint);
      
      if (error) {
        logError("Error fetching performance data", error);
        toast.error(`Failed to load performance data: ${error}`);
        throw new Error(`Failed to load performance data: ${error}`);
      }
      
      return data || [];
    } catch (error) {
      logError("Error in getPerformanceData", error);
      toast.error(`Failed to load performance data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },
  
  /**
   * Get monthly aggregation data for charts
   * Endpoint: /records/monthly-aggregation
   */
  async getMonthlyAggregation(params?: {
    vehicleType?: string;
    year?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<MonthlyData[]> {
    try {
      const queryParams = new URLSearchParams();
      
      const type = params?.vehicleType || 'all';
      queryParams.append('type', type);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (key !== 'vehicleType' && value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      if (type === 'all') {
        queryParams.append('includeSheetData', 'true');
      }
      
      const endpoint = `records/monthly-aggregation?${queryParams.toString()}`;
      logDebug(`Making monthly aggregation API request to: ${endpoint}`);
      
      const { data, error } = await apiRequest<{ monthlyData: MonthlyData[] }>(endpoint);
      
      if (error) {
        logError("Error fetching monthly aggregation data", error);
        return [];
      }
      
      if (DEBUG && data) {
        if (data.monthlyData && Array.isArray(data.monthlyData)) {
          logDebug(`Received monthly data with ${data.monthlyData.length} entries`);
        }
      }
      
      if (data?.monthlyData && Array.isArray(data.monthlyData)) {
        return data.monthlyData;
      }
      
      return [];
    } catch (error) {
      logError("Error in getMonthlyAggregation", error);
      return [];
    }
  },

  /**
   * Export vehicle records to a file
   * Endpoint: /records/export
   */
  async exportRecords(params?: {
    type?: string;
    mois?: string;
    matricule?: string;
    year?: string;
    format?: 'csv' | 'excel' | 'pdf';
  }): Promise<string | null> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      // Default format to excel if not specified
      if (!queryParams.has('format')) {
        queryParams.append('format', 'excel');
      }
      
      // Remove leading slash to prevent duplicate '/api/' in URL
      const endpoint = `records/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      logDebug(`Exporting records with endpoint: ${endpoint}`);
      
      const { data, error } = await apiRequest<string>(endpoint);
      
      if (error) {
        logError("Error exporting records:", error);
        toast.error(`Erreur lors de l'exportation des données: ${error}`);
        return null;
      }
      
      toast.success("Exportation des données réussie");
      return data;
    } catch (error) {
      logError("Error in exportRecords:", error);
      toast.error(`Erreur lors de l'exportation des données: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  },
  
  /**
   * Get vehicle type breakdown for statistics
   * Endpoint: /records/vehicle-type-breakdown
   */
  async getVehicleTypeBreakdown(params?: {
    year?: string;
    month?: string;
  }): Promise<VehicleTypeBreakdown[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.year) queryParams.append('year', params.year);
      if (params?.month) queryParams.append('month', params.month);
      
      const endpoint = `records/vehicle-type-breakdown${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      logDebug(`Getting vehicle type breakdown with endpoint: ${endpoint}`);
      
      const { data, error } = await apiRequest<VehicleTypeBreakdown[]>(endpoint);
      
      if (error) {
        logError("Error fetching vehicle type breakdown:", error);
        return [];
      }
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      logError("Error in getVehicleTypeBreakdown:", error);
      return [];
    }
  },

  async getReports(): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await apiRequest<Record<string, unknown>[]>(`/reports`, {
        method: 'GET',
        fallbackData: []
      });
      
      if (error) {
        logError(`Error getting reports`, error);
        toast.error(`Erreur lors de la récupération des rapports`);
        return [];
      }
      
      // Use sanitized logging for report data
      if (DEBUG && Array.isArray(data)) {
        logDebug(`Retrieved ${data.length} reports`);
      }
      
      return data || [];
    } catch (error) {
      logError("Error in getReports:", error);
      toast.error(`Erreur lors de la récupération des rapports`);
      return [];
    }
  }
};

/**
 * Regression API for handling regression analysis
 * RegressionController is mapped to /regression in the backend
 * With the context path /api, the full path becomes /api/regression
 */
export const RegressionAPI = {
  /**
   * Get regression data for a specific vehicle type
   * Endpoint: /regression/monthly-totals/{type}
   */
  async getRegressionData(type: string): Promise<Record<string, any>> {
    try {
      const endpoint = `/regression/monthly-totals/${encodeURIComponent(type)}`;
      
      const { data, error } = await apiRequest<Record<string, any>>(endpoint);
      
      if (error) {
        logError(`Error fetching regression data for type ${type}`, error);
        return {};
      }
      
      return data || {};
    } catch (error) {
      logError(`Error fetching regression data for type ${type}`, error);
      return {};
    }
  },
  
  /**
   * Get regression result for a specific vehicle type
   * Endpoint: /regression/type/{type}
   */
  async getRegressionResultByType(type: string): Promise<RegressionResult | null> {
    try {
      // Remove leading slash to prevent duplicate '/api/' in URL
      const endpoint = `regression/type/${encodeURIComponent(type)}`;
      
      const { data, error } = await apiRequest<RegressionResult>(endpoint);
      
      if (error) {
        logError(`Error fetching regression result for type ${type}`, error);
        return null;
      }
      
      return data || null;
    } catch (error) {
      logError(`Error fetching regression result for type ${type}`, error);
      return null;
    }
  }
};