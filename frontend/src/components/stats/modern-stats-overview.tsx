"use client"

import { KPICard } from "@/components/dashboard/kpi-card"
import { Fuel, Truck, TrendingUp, BarChart } from "lucide-react"

interface StatsOverviewProps {
  stats: {
    totalVehicles: number;
    totalConsumption: number;
    averageConsumption: number;
    consumptionChange: number;
    vehicleTypes?: Array<{ name: string; value: number }>;
    monthlyConsumption?: Array<{ month: string; value: number }>;
  }
}

export function ModernStatsOverview({ stats }: StatsOverviewProps) {
  // Generate sparkline data from monthly consumption if available
  const sparklineData = stats.monthlyConsumption 
    ? stats.monthlyConsumption.map(item => item.value)
    : [10, 15, 7, 20, 14, 12, 10, 14, 18, 12, 8, 10]; // Fallback data
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Véhicules"
        value={stats.totalVehicles.toLocaleString()}
        description="Nombre total de véhicules"
        variant="blue"
        icon={<Truck className="h-4 w-4" />}
        sparklineData={[stats.totalVehicles * 0.8, stats.totalVehicles * 0.85, stats.totalVehicles * 0.9, stats.totalVehicles * 0.95, stats.totalVehicles]}
      />
      
      <KPICard
        title="Consommation Totale"
        value={stats.totalConsumption.toLocaleString()}
        unit="L"
        description="Consommation totale de carburant"
        variant="amber"
        icon={<Fuel className="h-4 w-4" />}
        trend={{
          value: stats.consumptionChange,
          label: "par rapport à la période précédente"
        }}
        sparklineData={sparklineData}
      />
      
      <KPICard
        title="Consommation Moyenne"
        value={stats.averageConsumption.toLocaleString()}
        unit="L/100km"
        description="Consommation moyenne par véhicule"
        variant={stats.consumptionChange < 0 ? "green" : "red"}
        icon={<TrendingUp className="h-4 w-4" />}
        trend={{
          value: -stats.consumptionChange, // Invert the trend for average consumption
          label: "par rapport à la période précédente"
        }}
      />
      
      <KPICard
        title="Efficacité Énergétique"
        value={(100 - Math.abs(stats.consumptionChange)).toFixed(1)}
        unit="%"
        description="Score d'efficacité énergétique"
        variant="purple"
        icon={<BarChart className="h-4 w-4" />}
        trend={{
          value: stats.consumptionChange < 0 ? Math.abs(stats.consumptionChange) : -Math.abs(stats.consumptionChange),
          label: "tendance globale"
        }}
      />
    </div>
  )
}
