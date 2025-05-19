// Vehicle record interface - aligned with backend model
export interface VehicleRecord {
  id?: string;
  type: string;             // Vehicle type (sheet name: Camions, Voitures, etc.)
  matricule: string;        // Vehicle registration number
  mois: string;             // Month (from merged cells)
  year: string;             // Year of the record
  region?: string;          // Region (geographical area)
  consommationL: number;    // Consumption in L
  consommationTEP: number;  // Consumption in TEP
  coutDT: number;           // Cost in DT
  kilometrage: number;      // Distance in Km
  produitsTonnes: number;   // Transported products in Tons (for trucks)
  ipeL100km: number;        // Energy Performance Index in L/100km (for utility vehicles)
  ipeL100TonneKm: number;   // Energy Performance Index in L/Tonne.100Km (for trucks)
  rawValues?: Record<string, number>;  // Raw values for any additional metrics
  
  // Frontend compatibility fields
  vehicleType?: string;     // Alias for type
  consommation?: number;    // Alias for consommationL
  tonnage?: number;         // Alias for produitsTonnes
  date?: string;            // Derived date field
  vehicleId?: string;       // Alternative ID field
  ipe?: number;             // Alias for ipeL100km
  ipeTonne?: number;        // Alias for ipeL100TonneKm
  [key: string]: any;       // Allow additional properties
}

// Dashboard stats interface - consolidated from multiple implementations
export interface DashboardStats {
  // Core metrics
  totalVehicles?: number
  vehicleCount?: number
  
  // Consumption metrics
  totalConsumption?: number
  totalConsommation?: number // French spelling variant for backward compatibility
  totalConsommationTEP?: number
  averageConsumption?: number
  avgConsumption?: number
  consumptionChange?: number
  
  // Additional metrics
  avgIPE?: number
  totalKilometrage?: number
  totalTonnage?: number
  co2Emissions?: number
  costSavings?: number
  
  // Raw data collections
  allVehiclesData?: VehicleRecord[]
  vehicleData?: VehicleRecord[]
  serData?: any
  
  // Data breakdowns
  vehicleTypes?: Array<{ name: string; value: number }>
  vehicleTypeBreakdown?: Array<{ name: string; value: number } | { type: string; count: number }>
  
  // Time series data
  monthlyConsumption?: Array<{ month: string; value: number }>
  monthlyData?: Array<{
    month: string;
    consommation?: number;
    consumption?: number;
    kilometrage?: number;
    distance?: number;
    ipe?: number;
    tonnage?: number;
    [key: string]: any;
  }>
}

// Dashboard filters interface
export interface DashboardFilters {
  vehicleType?: string
  year?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: string | undefined
}

// SER Regression results interface
export interface RegressionResults {
  kilometrageRegression?: {
    coefficient: number
    intercept: number
    rSquared: number
  }
  tonnageRegression?: {
    coefficient: number
    intercept: number
    rSquared: number
  }
  dataPoints?: Array<{
    x: number
    y: number
    z: number
  }>
}

// Chart data point interface
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: any
}

// Monthly data interface for charts
export interface MonthlyData {
  month: string;
  year: string;
  consommation: number;
  kilometrage: number;
  tonnage: number;
  produitsTonnes: number;  // Same as tonnage but using backend naming
  ipe: number;
  ipeTonne: number;
  count: number;           // Count of records for averaging
}

// Vehicle type breakdown interface
export interface VehicleTypeBreakdown {
  name: string;
  value: number;
}

// Vehicle type state interface
export interface VehicleTypeState {
  types: string[];
  isLoading: boolean;
  error: string | null;
}
