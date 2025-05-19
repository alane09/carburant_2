/**
 * FileService - Consolidated service for file management operations
 * Handles file uploads, downloads, and history management
 */

import { UploadedFileRecord } from '@/components/shared';
import { toast } from 'sonner';

// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export class FileService {
  /**
   * Fetches the history of uploaded files
   * @param filters Optional filters to apply to the results
   * @returns List of uploaded files
   */
  static async getUploadHistory(
    filters?: {
      vehicleType?: string;
      year?: string | number;
      dateRange?: { from: Date; to: Date };
    }
  ): Promise<UploadedFileRecord[]> {
    try {
      let url = `${API_BASE_URL}/files`;
      
      // Add query parameters if filters are provided
      if (filters) {
        const params = new URLSearchParams();
        
        if (filters.vehicleType) {
          params.append('vehicleType', filters.vehicleType);
        }
        
        if (filters.year) {
          params.append('year', filters.year.toString());
        }
        
        if (filters.dateRange) {
          params.append('fromDate', filters.dateRange.from.toISOString());
          params.append('toDate', filters.dateRange.to.toISOString());
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching file history: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching file history:', error);
      toast.error('Erreur lors de la récupération de l\'historique des fichiers');
      return [];
    }
  }
  
  /**
   * Deletes a file and its associated records
   * @param fileId ID of the file to delete
   * @returns Boolean indicating success or failure
   */
  static async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting file: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  
  /**
   * Downloads a file
   * @param fileId ID of the file to download
   * @returns URL to download the file or null if error
   */
  static async downloadFile(fileId: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}/download`);
      
      if (!response.ok) {
        throw new Error(`Error downloading file: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'downloaded-file';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return url;
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erreur lors du téléchargement du fichier');
      return null;
    }
  }
  
  /**
   * Gets details for a specific file
   * @param fileId ID of the file to get details for
   * @returns File details or null if error
   */
  static async getFileDetails(fileId: string): Promise<UploadedFileRecord | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching file details: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching file details:', error);
      toast.error('Erreur lors de la récupération des détails du fichier');
      return null;
    }
  }
}

export default FileService;
