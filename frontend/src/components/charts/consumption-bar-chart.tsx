"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface ChartData {
  [key: string]: unknown;
  month: string;
  value: number;
}

interface ConsumptionBarChartProps {
  data: ChartData[];
  title: string;
  description?: string;
  xAxisKey?: string;
  dataKey?: string;
  colors?: string[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  unit?: string;
}

// Define high-contrast color palette at the top of the file
export const VIBRANT_COLORS = [
  '#2563EB', // Bright Blue
  '#16A34A', // Vibrant Green
  '#DC2626', // Strong Red
  '#9333EA', // Rich Purple
  '#EA580C', // Warm Orange
  '#0891B2', // Deep Cyan
  '#C026D3', // Bright Pink
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#B45309', // Amber
  '#7C3AED', // Violet
  '#DB2777', // Rose
];

export default function ConsumptionBarChart({
  data,
  title,
  description = "",
  xAxisKey = "name",
  dataKey = "value",
  colors = VIBRANT_COLORS,
  isLoading = false,
  emptyMessage = "Aucune donnée disponible",
  className = "",
  unit = "L"
}: ConsumptionBarChartProps) {
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Chart, setChart] = useState<any>(null);
  
  // Chronological month order (French)
  const MONTHS_ORDER = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  
  // Handle client-side mounting and dynamic import of chart components
  useEffect(() => {
    setIsMounted(true);
    
    // Dynamically import Recharts only on client-side
    import('recharts').then((RechartsModule) => {
      setChart({
        ResponsiveContainer: RechartsModule.ResponsiveContainer,
        BarChart: RechartsModule.BarChart,
        Bar: RechartsModule.Bar,
        XAxis: RechartsModule.XAxis,
        YAxis: RechartsModule.YAxis,
        CartesianGrid: RechartsModule.CartesianGrid,
        Tooltip: RechartsModule.Tooltip,
        Legend: RechartsModule.Legend,
        Cell: RechartsModule.Cell
      });
      // Cell = RechartsModule.Cell;
    });
  }, []);
  
  // Process data when it changes
  useEffect(() => {
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
        
        // Always sort by month order
        const sortedData = [...validData].sort((a, b) => {
          const monthA = String(a[xAxisKey]);
          const monthB = String(b[xAxisKey]);
          return MONTHS_ORDER.indexOf(monthA) - MONTHS_ORDER.indexOf(monthB);
        });

        setChartData(sortedData);
        setIsEmpty(sortedData.length === 0);
      } else {
        setChartData([]);
        setIsEmpty(true);
      }
    };
    
    processData();
  }, [data, xAxisKey, dataKey, MONTHS_ORDER]);
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
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
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
          <div className="text-muted-foreground">{emptyMessage}</div>
        </CardContent>
      </Card>
    );
  }
  
  // Only render chart when component is mounted and Chart is loaded
  if (!isMounted || !Chart) {
    return <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>;
  }

  // Destructure chart components
  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Chart;

  // Custom tooltip component with fixed positioning
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value?: unknown }[]; label?: string }) => {
    if (active && payload && payload.length) {
      const rawValue = payload[0]?.value;
      let value = 0;
      if (typeof rawValue === 'number') value = rawValue;
      else if (typeof rawValue === 'string' && !isNaN(Number(rawValue))) value = Number(rawValue);
      
      return (
        <div 
          className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg" 
          style={{ 
            position: 'fixed',
            transform: 'translate(-50%, -100%)',
            marginTop: '-10px',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <p className="font-medium text-sm text-gray-700 dark:text-gray-200">{label}</p>
          <p className="text-primary font-bold text-base">
            {`${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${unit}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Render the chart
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 30,
                right: 30,
                left: 30,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
              <XAxis 
                dataKey={xAxisKey} 
                angle={-45} 
                textAnchor="end"
                height={80} 
                tick={{ fontSize: 12, fontWeight: 500 }}
                tickLine={true}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1.5 }}
                label={{ value: "Mois", position: 'insideBottom', offset: -5, fontSize: 12, dy: 10 }}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={true}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1.5 }}
                width={70}
                label={{ value: unit ? `Valeur (${unit})` : "Valeur", angle: -90, position: 'insideLeft', offset: -15, fontSize: 12, dx: -10 }}
                tickFormatter={(value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                position={{ y: -10 }}
                wrapperStyle={{ outline: 'none' }}
                isAnimationActive={false}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                formatter={(value: string) => <span className="text-sm font-medium">{value}</span>}
              />
              <Bar 
                dataKey={dataKey} 
                name={unit ? `Valeur (${unit})` : "Valeur"}
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Chart.Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    className="hover:opacity-80 transition-opacity"
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
