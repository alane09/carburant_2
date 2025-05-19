"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { VehicleAPI, VehicleRecord } from "@/lib/api";

interface AnnualAverageCardGroupProps {
  vehicles: string[];
}

interface VehicleMetrics {
  matricule: string;
  type: string;
  annualMileage: number;
  annualFuel: number;
  annualEmissions: number;
  ipeScore: number;
}

export function AnnualAverageCardGroup({ vehicles }: AnnualAverageCardGroupProps) {
  const [metrics, setMetrics] = useState<VehicleMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all records for selected vehicles
        const all: VehicleRecord[] = [];
        for (const matricule of vehicles) {
          const records = await VehicleAPI.getRecords({ matricule });
          all.push(...records);
        }
        // Group by matricule and compute annual averages
        const grouped: Record<string, VehicleRecord[]> = {};
        all.forEach((rec) => {
          if (!grouped[rec.matricule]) grouped[rec.matricule] = [];
          grouped[rec.matricule].push(rec);
        });
        const result: VehicleMetrics[] = Object.entries(grouped).map(([matricule, recs]) => {
          const type = recs[0]?.type || "";
          const annualMileage = recs.reduce((sum, r) => sum + (r.kilometrage || 0), 0);
          const annualFuel = recs.reduce((sum, r) => sum + (r.consommationL || 0), 0);
          const annualEmissions = annualFuel * 2.6;
          const ipeScore = recs.length ? recs.reduce((sum, r) => sum + (r.ipeL100km || 0), 0) / recs.length : 0;
          return { matricule, type, annualMileage, annualFuel, annualEmissions, ipeScore };
        });
        setMetrics(result);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur lors du chargement des métriques annuelles");
      } finally {
        setIsLoading(false);
      }
    }
    if (vehicles.length > 0) fetchMetrics();
  }, [vehicles]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex flex-row items-center justify-between space-y-0">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((vehicle) => (
        <Card key={vehicle.matricule} className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold">
                {vehicle.matricule}
              </CardTitle>
              <Badge variant="outline" className="font-medium">
                {vehicle.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-600 mb-2">Kilométrage Annuel</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicle.annualMileage.toLocaleString('fr-FR')} km
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-600 mb-2">Consommation Annuelle</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicle.annualFuel.toLocaleString('fr-FR')} L
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-600 mb-2">Émissions Annuelles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicle.annualEmissions.toLocaleString('fr-FR')} kg CO₂
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-600 mb-2">Score IPE</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicle.ipeScore.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 