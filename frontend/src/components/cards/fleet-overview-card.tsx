"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from '@/lib/api1'
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface FleetOverviewCardProps {
  type: string;
  year: string;
}

export function FleetOverviewCard({ type, year }: FleetOverviewCardProps) {
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
          description: "Failed to load fleet overview data",
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
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
            </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
            <p className="text-2xl font-bold">{data.totalVehicles}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Consumption (L)</p>
            <p className="text-2xl font-bold">{data.totalConsumption.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Kilometers</p>
            <p className="text-2xl font-bold">{data.totalKilometers.toLocaleString()}</p>
            </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Average IPE (L/100km)</p>
            <p className="text-2xl font-bold">{data.averageIPE.toFixed(2)}</p>
            </div>
            </div>
        </CardContent>
      </Card>
  );
} 