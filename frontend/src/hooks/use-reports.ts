import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api-client';
import { useApi } from './use-api'
import api from '@/lib/api1'

export function useReports() {
  return useApi(() => api.reports.getAll())
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { type: string; startDate: string; endDate: string; format: 'pdf' | 'excel' }) =>
      reportsApi.generate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.removeQueries({ queryKey: ['reports', id] });
    },
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: (id: string) => reportsApi.download(id),
  });
} 