import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { regressionApi } from '@/lib/api-client';
import { useApi } from './use-api'
import api from '@/lib/api1'
import type { RegressionResult } from '@/lib/api1'

export function useRegressionResults() {
  return useQuery({
    queryKey: ['regression'],
    queryFn: () => regressionApi.getAll(),
  });
}

export function useRegressionByType(type: string) {
  return useQuery({
    queryKey: ['regression', type],
    queryFn: () => regressionApi.getByType(type),
    enabled: !!type,
  });
}

export function useMonthlyTotals(type: string) {
  return useQuery({
    queryKey: ['regression', 'monthly-totals', type],
    queryFn: () => regressionApi.getMonthlyTotals(type),
    enabled: !!type,
  });
}

export function usePerformRegression() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ type, file }: { type: string; file: File }) =>
      regressionApi.performRegression(type, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['regression'] });
      queryClient.invalidateQueries({ queryKey: ['regression', data.type] });
    },
  });
}

export function useRegression(type: string) {
  return useApi<RegressionResult>(() => api.regression.getByType(type))
} 