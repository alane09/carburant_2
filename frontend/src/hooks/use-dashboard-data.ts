"use client";

import { getDashboardStats } from "@/lib/api-dashboard";
import { DashboardStats } from "@/types/dashboard";
import { useEffect, useState } from "react";

interface UseDashboardDataProps {
  selectedVehicleType: string;
  year?: string;
}

export function useDashboardData({ selectedVehicleType, year }: UseDashboardDataProps) {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
    useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // For now, only 'camions' has real data
        const hasRealData = selectedVehicleType === 'all' || selectedVehicleType === 'camions';
          // Use correct lowercase vehicle type for API calls
        const normalizedVehicleType = 
          selectedVehicleType === 'CAMION' ? 'camions' : 
          selectedVehicleType === 'VOITURE' ? 'voitures' :
          selectedVehicleType === 'CHARIOT' ? 'chariots' :
          selectedVehicleType;
        
        // Use the dedicated dashboard API function instead of VehicleAPI
        const data = await getDashboardStats(
          normalizedVehicleType,
          year ? year : undefined
        );
          if (data) {
          // Process the data into our DashboardStats format
          const processedData: DashboardStats = {
            // Core metrics
            totalVehicles: data.totalVehicles || data.summary?.totalVehicles || 0,
            vehicleCount: data.totalVehicles || data.summary?.totalVehicles || 0, // Map from available properties in DashboardData
            
            // Consumption metrics
            totalConsommation: data.totalConsommation || data.summary?.totalConsommation || 0,
            totalConsumption: data.totalConsommation || data.summary?.totalConsommation || 0, // Map from available properties in DashboardData
            
            // Additional metrics
            avgIPE: data.avgIPE || data.summary?.avgIPE || 0,
            totalKilometrage: data.totalKilometrage || data.summary?.totalKilometrage || 0,
            totalTonnage: data.totalTonnage || 0,
            co2Emissions: data.co2Emissions || 0,
            costSavings: data.costSavings || 0,
            
            // Data breakdowns
            vehicleTypes: data.vehicleTypes || [],
            vehicleTypeBreakdown: data.vehicleTypeBreakdown || [],
            
            // Time series data
            monthlyData: data.monthlyData || []
          };
          
          // If there's no monthly data but it's not 'camions', show info message
          if (!hasRealData && (!processedData.monthlyData || processedData.monthlyData.length === 0)) {
            if (selectedVehicleType === 'voitures' || selectedVehicleType === 'chariots') {
              setError(`Les données pour les ${selectedVehicleType === 'voitures' ? 'voitures' : 'chariots'} ne sont pas encore disponibles`);
            }
          }
          
          setDashboardData(processedData);
        } else {
          setError("Aucune donnée disponible");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Une erreur s'est produite lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [selectedVehicleType, year]);
  
  return {
    dashboardData,
    isLoading,
    error
  };
}
