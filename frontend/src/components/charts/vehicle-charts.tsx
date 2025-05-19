"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, PieChart } from "@/components/ui/charts"
import { VehicleAPI } from "@/lib/api"
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { ChartOptions } from 'chart.js'

// Predefined color palette with good contrast
const CHART_COLORS = [
  { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.2)' },    // Red
  { border: 'rgb(54, 162, 235)', background: 'rgba(54, 162, 235, 0.2)' },    // Blue
  { border: 'rgb(255, 206, 86)', background: 'rgba(255, 206, 86, 0.2)' },    // Yellow
  { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.2)' },    // Teal
  { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.2)' },  // Purple
  { border: 'rgb(255, 159, 64)', background: 'rgba(255, 159, 64, 0.2)' },    // Orange
  { border: 'rgb(201, 203, 207)', background: 'rgba(201, 203, 207, 0.2)' },  // Gray
  { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.2)' },    // Pink
  { border: 'rgb(54, 162, 235)', background: 'rgba(54, 162, 235, 0.2)' },    // Light Blue
  { border: 'rgb(255, 206, 86)', background: 'rgba(255, 206, 86, 0.2)' },    // Light Yellow
];

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

interface VehicleChartProps {
  type: 'line' | 'bar' | 'pie'
  title: string
  data: ChartData
  isLoading?: boolean
}

interface VehicleAnalysisTabsProps {
  selectedType: string
  selectedYear: string
  selectedMatricules: string[]
}

export function VehicleChart({ type, title, data, isLoading }: VehicleChartProps) {
  if (isLoading) {
    return <div className="h-[300px] flex items-center justify-center">Loading...</div>
  }

  if (!data || !data.datasets || data.datasets.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-gray-500">Aucune donnée disponible</div>
  }

  // Calculate percentages for pie chart
  const calculatePercentages = (data: ChartData) => {
    const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
    return data.datasets[0].data.map(value => ({
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
    }));
  };

  switch (type) {
    case 'line':
      return <LineChart data={data} title={title} />
    case 'bar':
      return <BarChart data={data} title={title} />
    case 'pie':
      const percentages = calculatePercentages(data);
      const pieOptions: ChartOptions<'pie'> = {
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const percentage = percentages[context.dataIndex].percentage;
                return `${context.label}: ${context.raw} (${percentage}%)`;
              }
            }
          }
        }
      };
      return (
        <div className="relative">
          <PieChart 
            data={data} 
            title={title}
            options={pieOptions}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">Total</div>
              <div className="text-lg font-bold">
                {data.datasets[0].data.reduce((sum, value) => sum + value, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}

export function VehicleAnalysisTabs({ selectedType, selectedYear, selectedMatricules }: VehicleAnalysisTabsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<{
    consommationL: ChartData
    consommationTEP: ChartData
    coutDT: ChartData
    kilometrage: ChartData
    produitsTonnes: ChartData
    ipeL100km: ChartData
    ipeL100TonneKm: ChartData
  }>({
    consommationL: { labels: [], datasets: [] },
    consommationTEP: { labels: [], datasets: [] },
    coutDT: { labels: [], datasets: [] },
    kilometrage: { labels: [], datasets: [] },
    produitsTonnes: { labels: [], datasets: [] },
    ipeL100km: { labels: [], datasets: [] },
    ipeL100TonneKm: { labels: [], datasets: [] }
  })

  useEffect(() => {
    async function fetchData() {
      if (!selectedMatricules.length) {
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const records = await VehicleAPI.getRecords({
          type: selectedType,
          year: selectedYear,
          matricules: selectedMatricules
        });

        if (!records || records.length === 0) {
          setError('No data available for the selected vehicles');
          return;
        }

        const months = Array.from(new Set(records.map(r => r.mois))).sort();
        
        // Helper function to create chart data with consistent colors
        const createChartData = (metric: keyof typeof records[0]): ChartData => ({
            labels: months,
          datasets: selectedMatricules.map((matricule, index) => {
            const colorIndex = index % CHART_COLORS.length;
            return {
              label: matricule,
              data: months.map(month => {
                const record = records.find(r => r.matricule === matricule && r.mois === month);
                return record ? Number(record[metric]) || 0 : 0;
              }),
              borderColor: CHART_COLORS[colorIndex].border,
              backgroundColor: CHART_COLORS[colorIndex].background
            };
          })
        });

        // Create chart data for each metric
        setChartData({
          consommationL: createChartData('consommationL'),
          consommationTEP: createChartData('consommationTEP'),
          coutDT: createChartData('coutDT'),
          kilometrage: createChartData('kilometrage'),
          produitsTonnes: createChartData('produitsTonnes'),
          ipeL100km: createChartData('ipeL100km'),
          ipeL100TonneKm: createChartData('ipeL100TonneKm')
        });

      } catch (error) {
        console.error('Error fetching chart data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        toast({
          title: "Erreur",
          description: `Impossible de charger les données des graphiques: ${errorMessage}`,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [selectedType, selectedYear, selectedMatricules]);

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Chargement des données...</div>
  }

  if (!selectedMatricules.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Veuillez sélectionner au moins un véhicule pour voir les graphiques
      </div>
    )
  }

  return (
    <Tabs defaultValue="consommationL" className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-2 overflow-x-auto">
        <TabsTrigger value="consommationL">Consommation (L)</TabsTrigger>
        <TabsTrigger value="consommationTEP">Consommation (TEP)</TabsTrigger>
        <TabsTrigger value="coutDT">Coût (DT)</TabsTrigger>
        <TabsTrigger value="kilometrage">Kilométrage</TabsTrigger>
        <TabsTrigger value="produitsTonnes">Produits (T)</TabsTrigger>
        <TabsTrigger value="ipeL100km">IPE (L/100km)</TabsTrigger>
        <TabsTrigger value="ipeL100TonneKm">IPE (L/100T.km)</TabsTrigger>
      </TabsList>
      
      <TabsContent value="consommationL">
        <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <VehicleChart
            type="line"
            title="Consommation Mensuelle (L)"
            data={chartData.consommationL}
            isLoading={isLoading}
          />
        </Card>
          <Card className="p-4">
            <VehicleChart
              type="bar"
              title="Comparaison de Consommation (L)"
              data={chartData.consommationL}
              isLoading={isLoading}
            />
          </Card>
          <Card className="p-4">
            <VehicleChart
              type="pie"
              title="Répartition de Consommation (L)"
              data={chartData.consommationL}
              isLoading={isLoading}
            />
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="consommationTEP">
        <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <VehicleChart
            type="line"
            title="Consommation Mensuelle (TEP)"
            data={chartData.consommationTEP}
            isLoading={isLoading}
          />
        </Card>
          <Card className="p-4">
            <VehicleChart
              type="bar"
              title="Comparaison de Consommation (TEP)"
              data={chartData.consommationTEP}
              isLoading={isLoading}
            />
          </Card>
          <Card className="p-4">
            <VehicleChart
              type="pie"
              title="Répartition de Consommation (TEP)"
              data={chartData.consommationTEP}
              isLoading={isLoading}
            />
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="coutDT">
        <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <VehicleChart
              type="line"
            title="Coût Mensuel (DT)"
            data={chartData.coutDT}
            isLoading={isLoading}
          />
        </Card>
          <Card className="p-4">
            <VehicleChart
              type="bar"
              title="Comparaison des Coûts (DT)"
              data={chartData.coutDT}
              isLoading={isLoading}
            />
          </Card>
          <Card className="p-4">
            <VehicleChart
              type="pie"
              title="Répartition des Coûts (DT)"
              data={chartData.coutDT}
              isLoading={isLoading}
            />
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="kilometrage">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <VehicleChart
              type="line"
              title="Kilométrage Mensuel"
              data={chartData.kilometrage}
              isLoading={isLoading}
            />
          </Card>
        <Card className="p-4">
          <VehicleChart
            type="bar"
              title="Comparaison de Kilométrage"
              data={chartData.kilometrage}
              isLoading={isLoading}
            />
          </Card>
          <Card className="p-4">
            <VehicleChart
              type="pie"
              title="Répartition de Kilométrage"
            data={chartData.kilometrage}
            isLoading={isLoading}
          />
        </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="produitsTonnes">
        <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <VehicleChart
              type="line"
            title="Produits Mensuels (Tonnes)"
            data={chartData.produitsTonnes}
            isLoading={isLoading}
          />
        </Card>
          <Card className="p-4">
            <VehicleChart
              type="bar"
              title="Comparaison des Produits (Tonnes)"
              data={chartData.produitsTonnes}
              isLoading={isLoading}
            />
          </Card>
          <Card className="p-4">
            <VehicleChart
              type="pie"
              title="Répartition des Produits (Tonnes)"
              data={chartData.produitsTonnes}
              isLoading={isLoading}
            />
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="ipeL100km">
        <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <VehicleChart
            type="line"
            title="IPE Mensuel (L/100km)"
            data={chartData.ipeL100km}
            isLoading={isLoading}
          />
        </Card>
          <Card className="p-4">
            <VehicleChart
              type="bar"
              title="Comparaison IPE (L/100km)"
              data={chartData.ipeL100km}
              isLoading={isLoading}
            />
          </Card>
          <Card className="p-4">
            <VehicleChart
              type="pie"
              title="Répartition IPE (L/100km)"
              data={chartData.ipeL100km}
              isLoading={isLoading}
            />
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="ipeL100TonneKm">
        <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <VehicleChart
            type="line"
            title="IPE Mensuel (L/100T.km)"
            data={chartData.ipeL100TonneKm}
            isLoading={isLoading}
          />
        </Card>
          <Card className="p-4">
            <VehicleChart
              type="bar"
              title="Comparaison IPE (L/100T.km)"
              data={chartData.ipeL100TonneKm}
              isLoading={isLoading}
            />
          </Card>
          <Card className="p-4">
            <VehicleChart
              type="pie"
              title="Répartition IPE (L/100T.km)"
              data={chartData.ipeL100TonneKm}
              isLoading={isLoading}
            />
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
} 