"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell
} from "recharts";

interface IPEHistogramChartProps {
  data: any[];
  dataKey: string;
  yAxisLabel?: string;
  title?: string;
  description?: string;
  isLoading?: boolean;
  unit?: string;
  barColor?: string;
  className?: string;
  showAverage?: boolean;
  // New props for small value handling
  smallValueMode?: boolean;
  // Chart margins for better axis visibility
  margin?: { top: number; right: number; left: number; bottom: number };
  customYAxisDomain?: [number, number];
  decimalPlaces?: number;
  vehicleInfo?: {
    matricule: string;
    type: string;
  };
  // Multi-vehicle support
  multiVehicleData?: {
    matricule: string;
    color: string;
    data: any[];
  }[];
  height?: number;
}

export default function IPEHistogramChart({ 
  data, 
  dataKey, 
  yAxisLabel = "IPE (L/100km.tonne)", 
  title,
  description,
  isLoading = false,
  unit = "L/100km",
  barColor = "#10B981", // Emerald color
  className = "",
  showAverage = false,
  // New props with defaults
  smallValueMode = false,
  margin,
  customYAxisDomain,
  decimalPlaces = 2,
  vehicleInfo,
  multiVehicleData = [],
  height = 500
}: IPEHistogramChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate average value for reference line if needed
  const averageValue = showAverage && data && data.length > 0 
    ? data.reduce((sum, item) => sum + (item[dataKey] || 0), 0) / data.length 
    : null;
    
  // For multi-vehicle mode, calculate the overall average if needed
  const multiVehicleAverageValue = showAverage && multiVehicleData.length > 0
    ? multiVehicleData.reduce((sum, vehicle) => {
        const vehicleAvg = vehicle.data.reduce((vSum, item) => vSum + (item[dataKey] || 0), 0) / vehicle.data.length;
        return sum + vehicleAvg;
      }, 0) / multiVehicleData.length
    : null;
    
  // Find the maximum value for Y-axis scaling
  let maxValue = data && data.length > 0
    ? Math.max(...data.map(item => item[dataKey] || 0)) * 1.15 // Add 15% padding for bar charts
    : 10; // Default if no data
    
  // For multi-vehicle mode, find the maximum value across all vehicles
  if (multiVehicleData.length > 0) {
    const multiVehicleMax = Math.max(
      ...multiVehicleData.flatMap(vehicle => 
        vehicle.data.map(item => item[dataKey] || 0)
      )
    ) * 1.15; // Add 15% padding
    
    // Use the higher of the two max values
    maxValue = Math.max(maxValue, multiVehicleMax);
  }
    
  // Calculate appropriate Y-axis domain based on data
  const calculatedDomain = customYAxisDomain || [
    0, 
    smallValueMode 
      ? (maxValue < 0.1 ? Math.max(maxValue, 0.1) : maxValue) // For small values, ensure minimum scale
      : Math.ceil(maxValue) // Round up to nearest integer for normal values
  ];
  
  // Calculate appropriate tick count based on data range
  const tickCount = smallValueMode 
    ? (maxValue < 0.01 ? 5 : maxValue < 0.1 ? 8 : 10) // More ticks for smaller values
    : (maxValue < 10 ? 5 : maxValue < 50 ? 10 : 8); // Fewer ticks for larger values

  // Generate a title if none provided
  let generatedTitle = title;
  if (!generatedTitle) {
    if (multiVehicleData.length > 0) {
      generatedTitle = `Distribution mensuelle du ${unit}`;
    } else if (vehicleInfo) {
      generatedTitle = `Distribution mensuelle du ${unit} ${vehicleInfo.matricule}`;
    } else {
      generatedTitle = `Distribution mensuelle du ${unit}`;
    }
  }

  if (!isMounted || isLoading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{generatedTitle}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="p-0">
          <Skeleton className={`h-[${height}px] w-full`} />
        </CardContent>
      </Card>
    );
  }

  if ((!data || data.length === 0) && multiVehicleData.length === 0) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{generatedTitle}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className={`flex h-[${height}px] w-full items-center justify-center`}>
          <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  // Define colors for bars - alternating shades
  const getBarColor = (index: number) => {
    // Base color with alternating opacity
    return index % 2 === 0 ? barColor : `${barColor}CC`;
  };

  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={margin || {
          top: 30,
          right: 40,
          left: 40,
          bottom: 60,
        }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--muted))" 
          opacity={0.4} 
          className="dark:opacity-50 dark:stroke-gray-600"
        />
        <XAxis
          dataKey="month"
          fontSize={12}
          fontWeight={500}
          tickLine={true}
          axisLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 2, opacity: 0.9 }}
          className="dark:text-white"
          label={{ 
            value: "Mois", 
            position: 'insideBottom', 
            offset: -5, 
            fontSize: 14, 
            dy: 20,
            fill: "hsl(var(--foreground))",
            fontWeight: 700,
            opacity: 1,
            className: "dark:fill-white"
          }}
          height={80}
          angle={-45}
          textAnchor="end"
          interval={0}
          tick={{ 
            fill: "hsl(var(--foreground))", 
            opacity: 1,
            fontSize: 12,
            fontWeight: 600,
            className: "dark:fill-white"
          }}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis
          fontSize={12}
          tickLine={true}
          axisLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 2, opacity: 0.9 }}
          className="dark:text-white"
          tickFormatter={(value: number) => {
            // Format small values with more decimal places based on smallValueMode or value size
            const shouldUseMoreDecimals = smallValueMode || value < 0.1;
            const maxDecimals = shouldUseMoreDecimals ? (decimalPlaces || 4) : 2;
            const minDecimals = shouldUseMoreDecimals ? (decimalPlaces || 4) : 0;
            
            return value.toLocaleString('fr-FR', { 
              maximumFractionDigits: maxDecimals, 
              minimumFractionDigits: minDecimals 
            });
          }}
          label={{ 
            value: yAxisLabel, 
            angle: -90, 
            position: 'insideLeft', 
            offset: -15, 
            fontSize: 13, 
            dx: -20,
            fill: "hsl(var(--foreground))",
            fontWeight: 600,
            opacity: 0.9,
            className: "dark:text-white dark:fill-white"
          }}
          width={80}
          // Use calculated domain based on data
          domain={calculatedDomain}
          // Add more ticks for better visualization of small values
          allowDecimals={true}
          scale="linear"
          tickCount={tickCount}
          tick={{ 
            fill: "hsl(var(--foreground))", 
            opacity: 1,
            fontSize: 12,
            fontWeight: 600,
            className: "dark:fill-white"
          }}
          padding={{ top: 10, bottom: 10 }}
          minTickGap={5}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
            padding: "12px 16px",
            fontSize: "13px",
            fontWeight: 500,
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))"
          }}
          formatter={(value: number, name) => {
            // Format small values with more decimal places based on smallValueMode or value size
            const shouldUseMoreDecimals = smallValueMode || value < 0.1;
            const decimals = shouldUseMoreDecimals ? (decimalPlaces || 4) : 2;
            const formattedValue = value.toFixed(decimals);
            return [
              <span style={{ 
                color: "hsl(var(--foreground))", 
                fontWeight: 600,
                textShadow: "0 0 1px rgba(255,255,255,0.1)"
              }}>
                {formattedValue} {unit}
              </span>, 
              <span style={{ 
                color: "hsl(var(--foreground))", 
                opacity: 0.9,
                fontWeight: 500 
              }}>
                {name}
              </span>
            ];
          }}
          labelFormatter={(label) => (
            <span style={{ 
              color: "hsl(var(--foreground))", 
              fontWeight: 600,
              borderBottom: "1px solid hsl(var(--border))",
              paddingBottom: "4px",
              marginBottom: "4px",
              display: "block",
              textShadow: "0 0 1px rgba(255,255,255,0.1)"
            }}>
              Mois: {label}
            </span>
          )}
          cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeOpacity: 0.5 }}
        />
        <Legend 
          verticalAlign="top" 
          height={40}
          wrapperStyle={{ paddingTop: "10px" }}
          formatter={(value: string) => (
            <span style={{ 
              fontSize: "13px", 
              fontWeight: 600,
              color: "hsl(var(--foreground))",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: "hsla(var(--muted)/0.4)",
              border: "1px solid hsla(var(--border)/0.5)",
              textShadow: "0 0 1px rgba(255,255,255,0.1)"
            }}>
              {value}
            </span>
          )}
        />
        
        {/* Render bars for multi-vehicle data if available */}
        {multiVehicleData.length > 0 ? (
          multiVehicleData.map((vehicle, vehicleIndex) => (
            <Bar 
              key={`vehicle-${vehicle.matricule}`}
              dataKey={dataKey} 
              name={vehicle.matricule}
              data={vehicle.data}
              radius={[4, 4, 0, 0]}
              fill={vehicle.color}
              className="dark:opacity-90"
              barSize={multiVehicleData.length > 3 ? 12 : 20}
            >
              {vehicle.data.map((entry, index) => (
                <Cell 
                  key={`cell-${vehicleIndex}-${index}`} 
                  fill={vehicle.color}
                  stroke="hsl(var(--background))"
                  strokeWidth={1}
                />
              ))}
            </Bar>
          ))
        ) : (
          /* Main bar chart when not in multi-vehicle mode */
          <Bar 
            dataKey={dataKey} 
            name={vehicleInfo?.matricule || yAxisLabel}
            radius={[4, 4, 0, 0]}
            className="dark:fill-indigo-400"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(index)}
                className="dark:fill-indigo-400 dark:opacity-90"
                stroke="hsl(var(--background))"
                strokeWidth={1}
              />
            ))}
          </Bar>
        )}
        
        {/* Reference line for average */}
        {showAverage && (multiVehicleAverageValue !== null || averageValue !== null) && (
          <ReferenceLine 
            y={multiVehicleAverageValue !== null ? multiVehicleAverageValue : (averageValue || 0)} 
            stroke="#FF3333" 
            strokeDasharray="5 5" 
            strokeWidth={2.5}
            ifOverflow="extendDomain"
            className="dark:stroke-red-500"
            label={{
              value: `Moyenne: ${(smallValueMode || ((multiVehicleAverageValue !== null ? multiVehicleAverageValue : (averageValue || 0)) < 0.1)) ? 
                (multiVehicleAverageValue !== null ? multiVehicleAverageValue : (averageValue || 0)).toFixed(decimalPlaces || 4) : 
                (multiVehicleAverageValue !== null ? multiVehicleAverageValue : (averageValue || 0)).toFixed(2)}`,
              position: 'right',
              fill: "#FF3333",
              fontSize: 14,
              fontWeight: 700,
              offset: 15,
              className: "dark:text-red-400"
            }} 
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );

  // If title is provided, wrap in a Card, otherwise just return the chart
  return title || vehicleInfo || multiVehicleData.length > 0 ? (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{generatedTitle}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4">
        {chartContent}
      </CardContent>
    </Card>
  ) : chartContent;
}
