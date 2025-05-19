"use client";

import { useState } from 'react';
import { YearProvider } from "@/hooks/use-year";
import { MatriculeProvider } from "@/components/matricule-selector";
import { VehicleTypeSelector } from "@/components/vehicle-type-selector";
import { YearSelector } from "@/components/year-selector";
import { MatriculeSelector } from "@/components/matricule-selector";
import { VehicleAnalysisTabs } from "@/components/charts/vehicle-charts";
import { AnnualAverageCardGroup } from "@/components/cards/vehicle-summary-cards";
import { FleetOverviewCard } from "@/components/cards/fleet-overview-card";
import { useVehicleType } from '@/hooks/use-vehicle-type';
import { useYear } from '@/hooks/use-year';

function VehicleAnalysisContent() {
  const [selectedMatricules, setSelectedMatricules] = useState<string[]>([]);
  const { selectedType } = useVehicleType();
  const { selectedYear } = useYear();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Analyse des Véhicules</h1>
        
        {/* Vehicle Selection Section */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type de Véhicule</label>
            <VehicleTypeSelector />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Année</label>
            <YearSelector />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Véhicules</label>
            <MatriculeSelector
              value={selectedMatricules}
              onChange={setSelectedMatricules}
            />
          </div>
        </div>
      </div>

      {selectedMatricules.length > 0 ? (
        <div className="space-y-8">
          {/* Fleet Overview Card */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Aperçu de la flotte</h2>
            <FleetOverviewCard
              selectedType={selectedType}
              selectedYear={selectedYear}
              selectedMatricules={selectedMatricules}
            />
          </div>

          {/* Annual Averages Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Moyennes Annuelles par Véhicule</h2>
            <AnnualAverageCardGroup
              selectedType={selectedType}
              selectedYear={selectedYear}
              selectedMatricules={selectedMatricules}
            />
          </div>

          {/* Detailed Analysis Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Analyse Détaillée</h2>
            <VehicleAnalysisTabs
              selectedType={selectedType}
              selectedYear={selectedYear}
              selectedMatricules={selectedMatricules}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Veuillez sélectionner au moins un véhicule pour voir les analyses
        </div>
      )}
    </div>
  );
}

export default function VehicleAnalysisPage() {
  return (
    <YearProvider>
      <MatriculeProvider>
        <VehicleAnalysisContent />
      </MatriculeProvider>
    </YearProvider>
  );
} 