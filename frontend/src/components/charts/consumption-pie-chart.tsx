/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleRecord } from "@/lib/api";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Import the PieChart component with dynamic import and no SSR
const DynamicPieChart = dynamic(
  () => import("@/components/charts/dynamic-pie-chart"),
  { ssr: false, loading: () => <Loader2 className="h-8 w-8 animate-spin" /> }
);

interface ConsumptionPieChartProps {
  data:any[];
  title: string;
  description?: string;
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  unit?: string;
}

export default function ConsumptionPieChart({
  data,
  title,
  description,
  dataKey = "value",
  nameKey = "name",
  colors = [
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#06B6D4", // cyan-500
    "#F97316", // orange-500
  ],
  isLoading = false,
  emptyMessage = "Aucune donnée disponible",
  className = "",
  unit = "",
}: ConsumptionPieChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Process data when it changes
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([]);
      setIsEmpty(true);
      return;
    }

    // Filter out zero values and transform data if needed
    const filteredData = data
      .filter((item) => item[dataKey] !== 0)
      .map((item) => ({
        ...item,
        [dataKey]: typeof item[dataKey] === "string" ? parseFloat(item[dataKey]) : item[dataKey],
      }));

    setChartData(filteredData);
    setIsEmpty(filteredData.length === 0);
  }, [data, dataKey]);

  // Handle loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-full">
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle empty state
  if (isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-full">
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render the chart using the dynamically imported component
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-full pt-2 pb-6">
        {isMounted && (
          <DynamicPieChart 
            data={chartData} 
            dataKey={dataKey} 
            nameKey={nameKey} 
            colors={colors} 
            unit={unit} 
          />
        )}
      </CardContent>
    </Card>
  );
}
