/**
 * Types for the historical data module
 * Consolidated from both historical and history modules
 */

/**
 * Interface for uploaded file history
 */
export interface UploadedFile {
  id: string;
  name: string;
  filename?: string;
  uploadDate: string;
  size: number;
  recordCount?: number;
  vehicleType?: string;
  year?: number;
  processed?: boolean;
}
