"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVehicleFilter } from "@/hooks/use-vehicle-filter";
import { VehicleAPI } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface FleetOverviewData {
  totalVehicles: number;
  totalConsumption: number;
  totalMileage: number;
  totalEmissions: number;
  averageIPE: number;
  vehicles: Array<{
    matricule: string;
    consumption: number;
    mileage: number;
    emissions: number;
    ipe: number;
  }>;
}

export function FleetOverviewCard() {
  const { selectedType, selectedYear, selectedMatricules } = useVehicleFilter();
  const [isLoading, setIsLoading] = useState(false);
  const [overview, setOverview] = useState<FleetOverviewData>({
    totalVehicles: 0,
    totalConsumption: 0,
    totalMileage: 0,
    totalEmissions: 0,
    averageIPE: 0,
    vehicles: []
  });

  useEffect(() => {
    async function fetchOverview() {
      if (!selectedMatricules.length) return;
      
      setIsLoading(true);
      try {
        const response = await VehicleAPI.getFleetOverview({
          vehicleType: selectedType,
          year: selectedYear,
          matricules: selectedMatricules
        });

        if (response && typeof response === 'object') {
          setOverview(response as FleetOverviewData);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching fleet overview:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de la flotte",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchOverview();
  }, [selectedType, selectedYear, selectedMatricules]);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl font-bold">Vue d&apos;ensemble de la flotte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-xl font-bold">Vue d&apos;ensemble de la flotte</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Nombre de véhicules</h3>
              <p className="text-3xl font-bold text-gray-900">{overview.totalVehicles}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Consommation totale</h3>
              <p className="text-3xl font-bold text-gray-900">{overview.totalConsumption.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Kilométrage total</h3>
              <p className="text-3xl font-bold text-gray-900">{overview.totalMileage.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} km</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Émissions totales</h3>
              <p className="text-3xl font-bold text-gray-900">{overview.totalEmissions.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kg CO2</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600 mb-2">IPE moyen</h3>
            <p className="text-3xl font-bold text-gray-900">{overview.averageIPE.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L/100km</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 