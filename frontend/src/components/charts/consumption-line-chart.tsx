/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
// Import the color constants from consumption-bar-chart.tsx
import { VIBRANT_COLORS } from './consumption-bar-chart';

interface ConsumptionLineChartProps {
  data: any[];
  title: string;
  description?: string;
  xAxisKey?: string;
  dataKey?: string;
  lineColor?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  unit?: string;
  additionalDataKeys?: Array<{
    key: string;
    color: string;
    name: string;
  }>;
}

export default function ConsumptionLineChart({
  data,
  title,
  description = "",
  xAxisKey = "name",
  dataKey = "value",
  lineColor = VIBRANT_COLORS[0],
  isLoading = false,
  emptyMessage = "Aucune donnée disponible",
  className = "",
  unit = "L",
  additionalDataKeys = []
}: ConsumptionLineChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [Chart, setChart] = useState<any>(null);
  
  // Handle client-side mounting and dynamic import of chart components
  useEffect(() => {
    setIsMounted(true);
    
    // Dynamically import Recharts only on client-side
    import('recharts').then((RechartsModule) => {
      setChart({
        ResponsiveContainer: RechartsModule.ResponsiveContainer,
        LineChart: RechartsModule.LineChart,
        Line: RechartsModule.Line,
        XAxis: RechartsModule.XAxis,
        YAxis: RechartsModule.YAxis,
        CartesianGrid: RechartsModule.CartesianGrid,
        Tooltip: RechartsModule.Tooltip,
        Legend: RechartsModule.Legend
      });
    });
  }, []);
  
  // Process data when it changes
  useEffect(() => {
    // Create a stable representation of the data to prevent infinite loops
    const processData = () => {
      if (data && Array.isArray(data) && data.length > 0) {
        // Filter out undefined or invalid data points
        const validData = data.filter(item => 
          item && typeof item === 'object' && 
          xAxisKey in item && 
          dataKey in item && 
          item[dataKey] !== null && 
          item[dataKey] !== undefined
        );
        
        setChartData(validData);
        setIsEmpty(validData.length === 0);
      } else {
        setChartData([]);
        setIsEmpty(true);
      }
    };
    
    processData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, xAxisKey, 
    // Use a stable data representation that won't change on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    data ? JSON.stringify(data.map(item => item ? {
      [xAxisKey]: item[xAxisKey],
      [dataKey]: item[dataKey]
    } : null)) : '[]'
  ]);
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[380px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state
  if (isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[380px] text-center">
          <div className="text-muted-foreground">{emptyMessage}</div>
        </CardContent>
      </Card>
    );
  }
  
  // Render chart only if mounted and chart components are loaded
  if (!isMounted || !Chart) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-[380px]">
          {/* Placeholder for chart that will be loaded client-side */}
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Destructure chart components
  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Chart;
  
  // Custom tooltip component - positioned outside the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          style={{
            position: 'relative',
            zIndex: 1000
          }}
        >
          <p className="font-medium mb-2 text-gray-700 dark:text-gray-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <span className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{entry.name}</span>
              </span>
              <span className="text-sm font-bold text-primary">
                {`${entry.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${unit}`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Render the chart
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 30,
              right: 40,
              left: 30,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey={xAxisKey} 
              angle={-45} 
              textAnchor="end"
              height={80} 
              tick={{ fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              label={{ value: "Mois", position: 'insideBottom', offset: -5, fontSize: 12, dy: 10 }}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              width={70}
              label={{ value: unit ? `Valeur (${unit})` : "Valeur", angle: -90, position: 'insideLeft', offset: -15, fontSize: 12, dx: -10 }}
              tickFormatter={(value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Main data line */}
            <Line 
              type="monotoneX"
              dataKey={dataKey} 
              name={unit ? `Valeur (${unit})` : "Valeur"}
              stroke={lineColor} 
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: lineColor }}
              activeDot={{ r: 6, strokeWidth: 2, fill: lineColor }}
              className="transition-opacity hover:opacity-90"
            />
            
            {/* Additional data lines */}
            {additionalDataKeys.map((item, index) => (
              <Line
                key={`line-${item.key}-${index}`}
                type="monotoneX"
                dataKey={item.key}
                name={item.name}
                stroke={item.color || VIBRANT_COLORS[(index + 1) % VIBRANT_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 2, fill: item.color || VIBRANT_COLORS[(index + 1) % VIBRANT_COLORS.length] }}
                activeDot={{ r: 5, strokeWidth: 2, fill: item.color || VIBRANT_COLORS[(index + 1) % VIBRANT_COLORS.length] }}
                className="transition-opacity hover:opacity-90"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
