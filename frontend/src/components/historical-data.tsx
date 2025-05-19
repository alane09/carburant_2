'use client';

import { useState } from 'react';
import { useVehicles } from '@/hooks/use-vehicles';
import { HistoricalFilters } from './historical-filters';
import { formatNumber } from '@/lib/utils';

export function HistoricalData() {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const { data: vehicles = [], isLoading, error } = useVehicles();
  const filteredVehicles = vehicles.filter(v => {
    const matchYear = selectedYear === 'all' || v.year === selectedYear;
    const matchRegion = selectedRegion === 'all' || v.region === selectedRegion;
    return matchYear && matchRegion;
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <HistoricalFilters
        onRegionChange={setSelectedRegion}
        onYearChange={setSelectedYear}
      />

      <div className="rounded-md border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Matricule</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Mois</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Année</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Région</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Fichier</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Consommation (L)</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Coût (DT)</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Kilométrage</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Produits (T)</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">IPE (L/100km)</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">IPE (L/100TonneKm)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVehicles.map((vehicle, idx) => (
              <tr key={vehicle.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="px-4 py-2 whitespace-nowrap">{vehicle.type}</td>
                <td className="px-4 py-2 whitespace-nowrap">{vehicle.matricule}</td>
                <td className="px-4 py-2 whitespace-nowrap">{vehicle.mois}</td>
                <td className="px-4 py-2 whitespace-nowrap">{vehicle.year}</td>
                <td className="px-4 py-2 whitespace-nowrap">{vehicle.region || '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{/* TODO: file name */}-</td>
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
 