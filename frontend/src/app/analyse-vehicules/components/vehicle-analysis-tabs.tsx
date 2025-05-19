"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConsumptionLineChart from "@/components/charts/consumption-line-chart";
import ConsumptionBarChart from "@/components/charts/consumption-bar-chart";
import ConsumptionHistogramChart from "@/components/charts/consumption-histogram-chart";
import ConsumptionPieChart from "@/components/charts/consumption-pie-chart";
import { EmissionChart } from "@/components/charts/emission-chart";
import IPELineChart from "@/components/charts/ipe-line-chart";
import IpeHistogramChart from "@/components/charts/ipe-histogram-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleAPI } from "@/lib/api";
import { MonthlyData } from "@/types/dashboard";
import type { ChartData } from '@/components/charts/consumption-bar-chart';

interface VehicleAnalysisTabsProps {
  vehicles: string[];
}

export function VehicleAnalysisTabs({ vehicles }: VehicleAnalysisTabsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<MonthlyData[]>([]);
  const [consumptionData, setConsumptionData] = useState<ChartData[]>([]);
  const [emissionData, setEmissionData] = useState<ChartData[]>([]);
  const [ipeData, setIpeData] = useState<ChartData[]>([]);
  const [mileageData, setMileageData] = useState<ChartData[]>([]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Use VehicleAPI.getMonthlyAggregation for all selected vehicles
        // If multiple vehicles, fetch for each and merge by month
        const allMonthly: MonthlyData[] = [];
        for (const matricule of vehicles) {
          const data = await VehicleAPI.getMonthlyAggregation({
            matricules: [matricule], // Fix: Use matricules array instead of matricule
          });
          if (Array.isArray(data)) {
            allMonthly.push(...data);
          }
        }
        // Group by month and sum/average values for multi-vehicle selection
        const grouped: Record<string, MonthlyData[]> = {};
        allMonthly.forEach((item) => {
          if (!grouped[item.month]) grouped[item.month] = [];
          grouped[item.month].push(item);
        });
        // Helper to average or sum values
        const aggregate = (arr: MonthlyData[], key: keyof MonthlyData, mode: 'sum' | 'avg' = 'sum') => {
          const vals = arr.map((i) => Number(i[key]) || 0);
          if (mode === 'sum') return vals.reduce((a, b) => a + b, 0);
          if (mode === 'avg') return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          return 0;
        };
        // Prepare chart data
        const months = Object.keys(grouped).sort();
        setRawData(allMonthly); // For histogram
        setConsumptionData(months.map((month) => ({
          month,
          value: aggregate(grouped[month], 'consommation', 'sum'),
        })));
        setEmissionData(months.map((month) => ({
          month,
          value: aggregate(grouped[month], 'consommation', 'sum') * 2.6, // Example: convert to CO2
        })));
        setIpeData(months.map((month) => ({
          month,
          value: aggregate(grouped[month], 'ipe', 'avg'),
        })));
        setMileageData(months.map((month) => ({
          month,
          value: aggregate(grouped[month], 'kilometrage', 'sum'),
        })));
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    }
    if (vehicles.length > 0) fetchData();
  }, [vehicles]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="pt-6">
        <Tabs defaultValue="consumption" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px] bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="consumption" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Consommation
            </TabsTrigger>
            <TabsTrigger value="emissions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Émissions
            </TabsTrigger>
            <TabsTrigger value="ipe" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              IPE
            </TabsTrigger>
            <TabsTrigger value="mileage" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Kilométrage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consumption" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <ConsumptionLineChart
                    data={consumptionData}
                    title="Consommation Mensuelle"
                    description="Évolution de la consommation par mois"
                    unit="L"
                    xAxisKey="month"
                    dataKey="value"
                  />
                </CardContent>
              </Card>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <ConsumptionBarChart
                    data={consumptionData}
                    title="Comparaison de Consommation"
                    description="Comparaison entre les véhicules"
                    unit="L"
                    xAxisKey="month"
                    dataKey="value"
                  />
                </CardContent>
              </Card>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <ConsumptionHistogramChart
                    data={rawData}
                    dataKey="consommation"
                  />
                </CardContent>
              </Card>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <ConsumptionPieChart
                    data={consumptionData}
                    title="Répartition de Consommation"
                    description="Répartition par véhicule"
                    unit="L"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="emissions" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <EmissionChart
                    data={emissionData}
                    title="Émissions de CO₂"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ipe" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <IPELineChart
                    data={ipeData}
                    dataKey="value"
                    title="Score IPE"
                    description="Évolution du score IPE par mois"
                    unit="L/100km"
                  />
                </CardContent>
              </Card>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <IpeHistogramChart
                    data={ipeData}
                    dataKey="value"
                    title="Distribution des Scores IPE"
                    description="Distribution des valeurs de score IPE"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mileage" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <ConsumptionLineChart
                    data={mileageData}
                    title="Kilométrage Mensuel"
                    description="Évolution du kilométrage par mois"
                    unit="km"
                    xAxisKey="month"
                    dataKey="value"
                  />
                </CardContent>
              </Card>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <ConsumptionBarChart
                    data={mileageData}
                    title="Comparaison de Kilométrage"
                    description="Comparaison entre les véhicules"
                    unit="km"
                    xAxisKey="month"
                    dataKey="value"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 