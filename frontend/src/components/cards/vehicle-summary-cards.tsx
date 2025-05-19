"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from '@/lib/api1'
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface VehicleSummaryCardsProps {
  type: string;
  year: string;
}

export function VehicleSummaryCards({ type, year }: VehicleSummaryCardsProps) {
  const [data, setData] = useState<{
    totalVehicles: number;
    totalConsumption: number;
    totalKilometers: number;
    averageIPE: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.vehicle.getPerformance(type);
        const filteredData = response.filter(record => record.year === year);
        
        const totalVehicles = new Set(filteredData.map(record => record.matricule)).size;
        const totalConsumption = filteredData.reduce((sum, record) => sum + record.consommationL, 0);
        const totalKilometers = filteredData.reduce((sum, record) => sum + record.kilometrage, 0);
        const averageIPE = filteredData.reduce((sum, record) => sum + record.ipeL100km, 0) / filteredData.length;

        setData({
          totalVehicles,
          totalConsumption,
          totalKilometers,
          averageIPE
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to load vehicle summary data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, year]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-[100px]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Total Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {data.totalVehicles}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
            Total Consumption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {data.totalConsumption.toLocaleString()} L
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Total Kilometers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {data.totalKilometers.toLocaleString()} km
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
            Average IPE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {data.averageIPE.toFixed(2)} L/100km
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 