/**
 * Hook for file management functionality
 * Provides methods to handle file uploads, history, and operations
 */

import { UploadedFileRecord } from '@/components/shared';
import { FileService } from '@/services';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useFileManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<UploadedFileRecord[]>([]);
  const [currentFile, setCurrentFile] = useState<UploadedFileRecord | null>(null);

  /**
   * Fetches the file upload history
   */
  const fetchFileHistory = useCallback(async (filters?: {
    vehicleType?: string;
    year?: string | number;
    dateRange?: { from: Date; to: Date };
  }) => {
    setIsLoading(true);
    try {
      const data = await FileService.getUploadHistory(filters);
      setFiles(data);
      return data;
    } catch (error) {
      console.error('Error fetching file history:', error);
      toast.error('Erreur lors de la récupération de l\'historique des fichiers');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Deletes a file by ID
   */
  const deleteFile = useCallback(async (fileId: string) => {
    setIsLoading(true);
    try {
      const success = await FileService.deleteFile(fileId);
      if (success) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
        toast.success('Fichier supprimé avec succès');
        return true;
      } else {
        toast.error('Erreur lors de la suppression du fichier');
        return false;
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erreur lors de la suppression du fichier');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Downloads a file by ID
   */
  const downloadFile = useCallback(async (fileId: string) => {
    setIsLoading(true);
    try {
      const result = await FileService.downloadFile(fileId);
      if (result) {
        toast.success('Fichier téléchargé avec succès');
        return true;
      } else {
        toast.error('Erreur lors du téléchargement du fichier');
        return false;
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erreur lors du téléchargement du fichier');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Views file details by ID
   */
  const viewFileDetails = useCallback(async (fileId: string) => {
    setIsLoading(true);
    try {
      const fileDetails = await FileService.getFileDetails(fileId);
      if (fileDetails) {
        setCurrentFile(fileDetails);
        return fileDetails;
      } else {
        toast.error('Erreur lors de la récupération des détails du fichier');
        return null;
      }
    } catch (error) {
      console.error('Error viewing file details:', error);
      toast.error('Erreur lors de la récupération des détails du fichier');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    files,
    currentFile,
    fetchFileHistory,
    deleteFile,
    downloadFile,
    viewFileDetails,
  };
}
