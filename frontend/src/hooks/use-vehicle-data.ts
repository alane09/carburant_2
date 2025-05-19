import { useQuery } from '@tanstack/react-query';
import { VehicleService, VehicleRecord } from '../..//components/vehicle-tracking/Vehicle';
import { VehicleAPI } from '@/lib/api';

interface VehicleAggregateData {
  matricule: string;
  totalConsumption: number;
  totalKilometrage: number;
  totalProduitsTonnes: number;
  records: VehicleRecord[];
  avgIPE?: number;
  avgIPETonne?: number;
}

export function useVehicleData(year: string, vehicleType: string) {
  return useQuery({
    queryKey: ['vehicleData', year, vehicleType],
    queryFn: async () => {
      try {
        const params = vehicleType !== 'tous' ? { type: vehicleType, year } : { year };
        const records = await VehicleAPI.getRecords(params);
        if (!records || !Array.isArray(records)) return null;

        // Filter by vehicle type if specified
        const filteredData = vehicleType === 'tous' 
          ? records 
          : records.filter((record: VehicleRecord) => record.type?.toLowerCase() === vehicleType.toLowerCase());

        // Process data for charts
        const monthlyData = VehicleService.aggregateMonthlyData(filteredData);
        const vehicleBreakdown = VehicleService.aggregateByVehicle(filteredData);

        // Calculate totals and averages
        const totalConsumption = filteredData.reduce((sum: number, record: VehicleRecord) => sum + (record.consommationL || 0), 0);
        const totalKilometrage = filteredData.reduce((sum: number, record: VehicleRecord) => sum + (record.kilometrage || 0), 0);
        const totalProduitsTonnes = filteredData.reduce((sum: number, record: VehicleRecord) => sum + (record.produitsTonnes || 0), 0);
        const totalCount = filteredData.length;

        // Calculate IPE metrics
        const totalIPE = filteredData.reduce((sum: number, record: VehicleRecord) => sum + (record.ipeL100km || 0), 0);
        const totalIPETonne = filteredData.reduce((sum: number, record: VehicleRecord) => sum + (record.ipeL100TonneKm || 0), 0);

        // Prepare data for each chart type
        const consumptionByVehicle = vehicleBreakdown.map((v: VehicleAggregateData) => ({
          name: v.matricule,
          value: v.totalConsumption
        }));

        const costByVehicle = vehicleBreakdown.map((v: VehicleAggregateData) => ({
          name: v.matricule,
          value: v.totalConsumption * 2.5
        }));

        const kilometrageByVehicle = vehicleBreakdown.map((v: VehicleAggregateData) => ({
          name: v.matricule,
          value: v.totalKilometrage
        }));

        const transportByVehicle = vehicleBreakdown.map((v: VehicleAggregateData) => ({
          name: v.matricule,
          value: v.totalProduitsTonnes
        }));

        const monthlyIpe = monthlyData.map(m => ({
          month: m.month,
          ipe: m.ipe,
          ipeTonne: m.ipeTonne
        }));

        const ipeByVehicle = vehicleBreakdown.map((v: VehicleAggregateData) => ({
          name: v.matricule,
          ipe: v.avgIPE,
          ipeTonne: v.avgIPETonne
        }));

        const monthlyCost = monthlyData.map(m => ({
          month: m.month,
          value: m.consommation * 2.5
        }));

        const monthlyKilometrage = monthlyData.map(m => ({
          month: m.month,
          value: m.kilometrage
        }));

        // Prepare SER diagram data
        const serData = filteredData.map((record: VehicleRecord) => ({
          kilometrage: record.kilometrage || 0,
          tonnage: record.produitsTonnes || 0,
          matricule: record.matricule || ''
        }));

        // Calculate regression data
        const regressionData = VehicleService.calculateRegression(serData);

        const processedData = filteredData.map(v => ({
          matricule: v.matricule,
          type: v.type,
          totalConsumption: v.consommationL,
          totalKilometrage: v.kilometrage,
          avgIPE: v.ipeL100km,
          avgIPETonne: v.ipeL100TonneKm,
          totalProduitsTonnes: v.produitsTonnes || 0,
          records: [v]
        }));

        const aggregatedData = {
          totalConsumption,
          totalKilometrage,
          totalProduitsTonnes,
          avgIPE: totalCount > 0 ? totalIPE / totalCount : 0,
          avgIPETonne: totalCount > 0 ? totalIPETonne / totalCount : 0,
          consumptionByVehicle,
          costByVehicle,
          kilometrageByVehicle,
          transportByVehicle,
          monthlyIpe,
          ipeByVehicle,
          monthlyCost,
          monthlyKilometrage,
          serData,
          regressionData,
          records: processedData
        };

        return aggregatedData;
      } catch (error) {
        console.error('Error fetching vehicle data:', error);
        return null;
      }
    }
  });
}
