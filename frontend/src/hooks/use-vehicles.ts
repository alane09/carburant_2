import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { VehicleRecord } from '@/types/api';
import { useApi } from './use-api'
import api from '@/lib/api1'

export function useVehicles(params: { type?: string; mois?: string; matricule?: string } = {}) {
  return useApi(() => api.vehicle.getAll(params))
}

export function useVehicleById(id: string) {
  return useApi(() => api.vehicle.getById(id))
}

export function useMonthlyAggregation(type: string) {
  return useApi(() => api.vehicle.getMonthlyAggregation(type))
}

export function usePerformanceData(type: string) {
  return useApi(() => api.vehicle.getPerformance(type))
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<VehicleRecord, 'id'>) => api.vehicle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleRecord> }) =>
      api.vehicle.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', id] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.vehicle.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.removeQueries({ queryKey: ['vehicles', id] });
    },
  });
}

export function useVehicleTypes() {
  return useApi(() => api.upload.getVehicleTypes())
} 