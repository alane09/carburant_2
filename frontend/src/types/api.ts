export interface VehicleRecord {
  id: string;
  type: string;
  matricule: string;
  mois: string;
  year: string;
  region?: string;
  consommationL: number;
  consommationTEP: number;
  coutDT: number;
  kilometrage: number;
  produitsTonnes: number;
  ipeL100km: number;
  ipeL100TonneKm: number;
  rawValues: Record<string, string | number | boolean>;
}

export interface RegressionResult {
  id: string;
  type: string;
  regressionEquation: string;
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  mse: number;
  monthlyData: Array<{
    month: string;
    value: number;
  }>;
}

export interface Report {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  format: 'pdf' | 'excel';
  createdAt: string;
  downloadUrl?: string;
}

export interface MonthlyAggregation {
  [month: string]: {
    totalConsommationL: number;
    totalConsommationTEP: number;
    totalCoutDT: number;
    totalKilometrage: number;
    totalProduitsTonnes: number;
    averageIpeL100km: number;
    averageIpeL100TonneKm: number;
  };
}

export interface PerformanceData {
  matricule: string;
  type: string;
  totalConsommationL: number;
  totalKilometrage: number;
  totalProduitsTonnes: number;
  averageIpeL100km: number;
  averageIpeL100TonneKm: number;
} 