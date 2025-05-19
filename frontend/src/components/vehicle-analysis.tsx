'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVehicles } from '@/hooks/use-vehicles';
import { formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useVehicleType } from '@/hooks/use-vehicle-type';
import { useYear } from '@/hooks/use-year';

interface VehicleAnalysisProps {
  matricules: string[];
}

export function VehicleAnalysis({ matricules }: VehicleAnalysisProps) {
  const { selectedType } = useVehicleType();
  const { selectedYear } = useYear();
  
  const { data: allVehicles = [], isLoading } = useVehicles({
    type: selectedType,
    year: selectedYear,
  });
  
  const vehicles = allVehicles.filter(vehicle => matricules.includes(vehicle.matricule));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée disponible pour les véhicules sélectionnés
      </div>
    );
  }

  // Calculate totals
  const totals = vehicles.reduce(
    (acc, vehicle) => ({
      consommationL: acc.consommationL + vehicle.consommationL,
      consommationTEP: acc.consommationTEP + vehicle.consommationTEP,
      coutDT: acc.coutDT + vehicle.coutDT,
      kilometrage: acc.kilometrage + vehicle.kilometrage,
      produitsTonnes: acc.produitsTonnes + vehicle.produitsTonnes,
    }),
    {
      consommationL: 0,
      consommationTEP: 0,
      coutDT: 0,
      kilometrage: 0,
      produitsTonnes: 0,
    }
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Analyse Détaillée</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white shadow-sm">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="text-lg">Consommation Totale</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="text-lg font-medium">L: {formatNumber(totals.consommationL)} L</p>
              <p className="text-lg font-medium">TEP: {formatNumber(totals.consommationTEP)} TEP</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="text-lg">Coût Total</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-lg font-medium">{formatNumber(totals.coutDT)} DT</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="text-lg">Distance Totale</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-lg font-medium">{formatNumber(totals.kilometrage)} km</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="text-lg">Produits Totaux</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-lg font-medium">{formatNumber(totals.produitsTonnes)} T</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Véhicule</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Consommation (L)</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Coût (DT)</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Distance (km)</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Produits (T)</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">IPE (L/100km)</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">IPE (L/100TonneKm)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.map((vehicle, idx) => (
              <tr key={vehicle.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="px-4 py-2 whitespace-nowrap">{vehicle.matricule}</td>
                <td className="px-4 py-2 whitespace-nowrap text-right">{formatNumber(vehicle.consommationL)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-right">{formatNumber(vehicle.coutDT)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-right">{formatNumber(vehicle.kilometrage)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-right">{formatNumber(vehicle.produitsTonnes)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-right">{formatNumber(vehicle.ipeL100km)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-right">{formatNumber(vehicle.ipeL100TonneKm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 