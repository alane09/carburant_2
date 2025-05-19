"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
  ReferenceLine
} from "recharts";

interface ScatterPlotProps {
  data: any[];
  xAxisDataKey: string;
  yAxisDataKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  name?: string;
  title?: string;
  description?: string;
  isLoading?: boolean;
  xUnit?: string;
  yUnit?: string;
  color?: string;
  className?: string;
  showRegressionLine?: boolean;
  regressionData?: { slope: number; intercept: number };
}

export default function ScatterPlot({
  data,
  xAxisDataKey,
  yAxisDataKey,
  xAxisLabel = "Kilométrage",
  yAxisLabel = "Consommation",
  name = "Véhicules",
  title,
  description,
  isLoading = false,
  xUnit = "km",
  yUnit = "L",
  color = "#8884d8",
  className = "",
  showRegressionLine = false,
  regressionData
}: ScatterPlotProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate regression line points if needed
  const regressionLinePoints = showRegressionLine && regressionData && data && data.length > 0 ? (() => {
    const minX = Math.min(...data.map(item => item[xAxisDataKey] || 0));
    const maxX = Math.max(...data.map(item => item[xAxisDataKey] || 0));
    return [
      { x: minX, y: regressionData.slope * minX + regressionData.intercept },
      { x: maxX, y: regressionData.slope * maxX + regressionData.intercept }
    ];
  })() : null;

  if (!isMounted || isLoading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="p-0">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="flex h-[300px] w-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  const chartContent = (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart
        margin={{
          top: 20,
          right: 20,
          bottom: 30,
          left: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
        <XAxis 
          type="number" 
          dataKey={xAxisDataKey} 
          name={xAxisLabel} 
          label={{ value: `${xAxisLabel} (${xUnit})`, position: 'bottom', offset: 10 }}
          tickFormatter={(value) => value.toLocaleString('fr-FR')}
        />
        <YAxis 
          type="number" 
          dataKey={yAxisDataKey} 
          name={yAxisLabel}
          label={{ value: `${yAxisLabel} (${yUnit})`, angle: -90, position: 'insideLeft', offset: -5 }}
          tickFormatter={(value) => value.toLocaleString('fr-FR')}
        />
        <ZAxis range={[60, 400]} />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value: number, name, props) => {
            const unit = name === xAxisDataKey ? xUnit : yUnit;
            const label = name === xAxisDataKey ? xAxisLabel : yAxisLabel;
            return [`${value.toLocaleString('fr-FR')} ${unit}`, label];
          }}
          labelFormatter={() => name}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow)",
          }}
        />
        <Legend verticalAlign="bottom" height={36} />
        
        {/* Main scatter plot */}
        <Scatter 
          name={name} 
          data={data} 
          fill={color}
          fillOpacity={0.7}
          line={false}
          shape="circle"
          isAnimationActive={true}
          animationDuration={1000}
        />
        
        {/* Regression line if provided */}
        {showRegressionLine && regressionLinePoints && (
          <Scatter
            name="Ligne de tendance"
            data={regressionLinePoints}
            line={{ stroke: '#ff7300', strokeWidth: 2 }}
            lineType="joint"
            shape={null as any}
            legendType="line"
          />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
