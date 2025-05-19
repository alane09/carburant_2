import axios, { AxiosInstance, AxiosError } from 'axios';

// Types
export interface VehicleRecord {
  id: string;
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
  rawValues: Record<string, unknown>;
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
    total: number;
  }>;
}

export interface Report {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  format: 'pdf' | 'excel';
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
}

interface ApiErrorResponse {
  message: string;
}

// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      const message = error.response?.data?.message || 'An error occurred';
      console.error('API Error:', message);
      throw new Error(message);
    }
  );

  return client;
};

const apiClient = createApiClient();

// API Classes
export class VehicleApi {
  static async getAll(params?: { type?: string; mois?: string; matricule?: string }): Promise<VehicleRecord[]> {
    const response = await apiClient.get<VehicleRecord[]>('/records', { params });
    return response.data;
  }

  static async getMonthlyAggregation(type: string): Promise<Record<string, number>> {
    const response = await apiClient.get('/records/monthly-aggregation', { params: { type } });
    return response.data;
  }

  static async getPerformance(type: string): Promise<VehicleRecord[]> {
    const response = await apiClient.get('/records/performance', { params: { type } });
    return response.data;
  }

  static async getById(id: string): Promise<VehicleRecord> {
    const response = await apiClient.get<VehicleRecord>(`/records/${id}`);
    return response.data;
  }

  static async create(data: Omit<VehicleRecord, 'id'>): Promise<VehicleRecord> {
    const response = await apiClient.post<VehicleRecord>('/records', data);
    return response.data;
  }

  static async update(id: string, data: Partial<VehicleRecord>): Promise<VehicleRecord> {
    const response = await apiClient.put<VehicleRecord>(`/records/${id}`, data);
    return response.data;
  }

  static async patch(id: string, data: Partial<VehicleRecord>): Promise<VehicleRecord> {
    const response = await apiClient.patch<VehicleRecord>(`/records/${id}`, data);
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await apiClient.delete(`/records/${id}`);
  }
}

export class RegressionApi {
  static async performRegression(type: string, file: File): Promise<RegressionResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<RegressionResult>('/regression/upload', formData, {
      params: { type },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  static async saveManualResult(data: Omit<RegressionResult, 'id'>): Promise<RegressionResult> {
    const response = await apiClient.post<RegressionResult>('/regression', data);
    return response.data;
  }

  static async getAll(): Promise<RegressionResult[]> {
    const response = await apiClient.get<RegressionResult[]>('/regression');
    return response.data;
  }

  static async getByType(type: string): Promise<RegressionResult> {
    const response = await apiClient.get<RegressionResult>(`/regression/type/${type}`);
    return response.data;
  }

  static async getById(id: string): Promise<RegressionResult> {
    const response = await apiClient.get<RegressionResult>(`/regression/${id}`);
    return response.data;
  }

  static async getMonthlyTotals(type: string): Promise<Record<string, number>> {
    const response = await apiClient.get(`/regression/monthly-totals/${type}`);
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await apiClient.delete(`/regression/${id}`);
  }
}

export class UploadApi {
  static async uploadFile(file: File): Promise<string[]> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<string[]>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  static async extractData(file: File, sheetName: string): Promise<VehicleRecord[]> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sheetName', sheetName);
    const response = await apiClient.post<VehicleRecord[]>('/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  static async saveData(
    file: File,
    sheetName: string,
    year: string,
    month?: string,
    replaceExisting?: boolean
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sheetName', sheetName);
    formData.append('year', year);
    if (month) formData.append('month', month);
    if (replaceExisting !== undefined) formData.append('replaceExisting', String(replaceExisting));
    await apiClient.post('/save', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  static async getVehicleTypes(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/vehicles');
    return response.data;
  }
}

export class ReportsApi {
  static async generate(params: {
    type: string;
    startDate: string;
    endDate: string;
    format: 'pdf' | 'excel';
  }): Promise<string> {
    const response = await apiClient.post<string>('/reports/generate', params);
    return response.data;
  }

  static async getAll(): Promise<Report[]> {
    const response = await apiClient.get<Report[]>('/reports');
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await apiClient.delete(`/reports/${id}`);
  }

  static async download(id: string): Promise<Blob> {
    const response = await apiClient.get(`/reports/${id}/download`, { responseType: 'blob' });
    return response.data;
  }
}

// Export a default object with all API classes
export default {
  vehicle: VehicleApi,
  regression: RegressionApi,
  upload: UploadApi,
  reports: ReportsApi,
}; 