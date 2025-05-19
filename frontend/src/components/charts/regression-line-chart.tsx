"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from "recharts";

interface RegressionLineChartProps {
  data: any[];
  xAxisDataKey: string;
  yAxisDataKey: string;
  regressionData?: {
    slope: number;
    intercept: number;
    r2?: number;
    adjustedR2?: number;
    standardError?: number;
    fStatistic?: number;
  };
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  description?: string;
  isLoading?: boolean;
  xUnit?: string;
  yUnit?: string;
  dataColor?: string;
  regressionColor?: string;
  className?: string;
  showEquation?: boolean;
  showStatistics?: boolean;
  // Custom Y-axis domain for specific value ranges
  customYAxisDomain?: [number, number];
}

export default function RegressionLineChart({
  data,
  xAxisDataKey,
  yAxisDataKey,
  regressionData,
  xAxisLabel = "Kilométrage",
  yAxisLabel = "Consommation",
  title,
  description,
  isLoading = false,
  xUnit = "km",
  yUnit = "L",
  dataColor = "#8884d8",
  regressionColor = "#ff7300",
  className = "",
  showEquation = true,
  showStatistics = true,
  customYAxisDomain
}: RegressionLineChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          <Skeleton className="h-[380px] w-full" />
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
        <CardContent className="flex h-[380px] w-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  // Generate regression line points
  const regressionLinePoints = regressionData ? (() => {
    const minX = Math.min(...data.map(item => item[xAxisDataKey] || 0));
    const maxX = Math.max(...data.map(item => item[xAxisDataKey] || 0));
    return [
      { [xAxisDataKey]: minX, [yAxisDataKey]: regressionData.slope * minX + regressionData.intercept },
      { [xAxisDataKey]: maxX, [yAxisDataKey]: regressionData.slope * maxX + regressionData.intercept }
    ];
  })() : null;

  // Format regression equation
  const regressionEquation = regressionData ? 
    `y = ${regressionData.slope.toFixed(4)} × x + ${regressionData.intercept.toFixed(2)}` : 
    "";

  const chartContent = (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart
        data={data}
        margin={{
          top: 30,
          right: 40,
          left: 40,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
        <XAxis 
          dataKey={xAxisDataKey} 
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 12, fontWeight: 500 }}
          tickLine={true}
          axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1.5 }}
          label={{ value: xAxisLabel, position: 'insideBottom', offset: -5, fontSize: 12, dy: 10 }}
          interval={0}
        />
        <YAxis 
          width={80}
          tick={{ fontSize: 12 }}
          tickLine={true}
          axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1.5 }}
          label={{ value: `${yAxisLabel}`, angle: -90, position: 'insideLeft', offset: -15, fontSize: 12, dx: -10 }}
          tickFormatter={(value) => {
            // Format small values with more decimal places
            return value < 0.1 
              ? value.toLocaleString('fr-FR', { maximumFractionDigits: 4, minimumFractionDigits: 4 })
              : value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
          }}
          // Use custom domain if provided, otherwise use smart defaults based on data type
          domain={customYAxisDomain || (yUnit.includes('Tonne') || yAxisLabel.includes('Tonne') ? [0, 0.12] : [0, 'auto'])}
          // Add more ticks for better visualization of small values
          allowDecimals={true}
          scale="linear"
        />
        <Tooltip 
          formatter={(value: number, name) => {
            const isRegression = name === "Ligne de régression";
            const isYAxis = name === yAxisDataKey;
            const unit = isRegression ? yUnit : (isYAxis ? yUnit : xUnit);
            
            // Format small values with more decimal places
            let formattedValue;
            if (value < 0.1 && (isRegression || isYAxis)) {
              formattedValue = value.toLocaleString('fr-FR', { maximumFractionDigits: 4, minimumFractionDigits: 4 });
            } else {
              formattedValue = value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
            }
            
            return [`${formattedValue} ${unit}`, isRegression ? name : (isYAxis ? yAxisLabel : xAxisLabel)];
          }}
          labelFormatter={(value) => `${xAxisLabel}: ${value}`}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow)",
            padding: "8px 12px",
            fontSize: "12px"
          }}
          cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
        />
        <Legend 
          verticalAlign="top" 
          height={36}
          formatter={(value: string) => <span className="text-sm font-medium">{value}</span>}
        />
        
        {/* Main data line */}
        <Line 
          type="monotone" 
          dataKey={yAxisDataKey} 
          stroke={dataColor}
          strokeWidth={2}
          dot={{ stroke: dataColor, strokeWidth: 2, r: 4, fill: "hsl(var(--background))" }}
          activeDot={{ r: 6, stroke: "hsl(var(--background))", strokeWidth: 2 }}
          name="Données réelles"
          isAnimationActive={true}
          animationDuration={1000}
        />
        
        {/* Regression line */}
        {regressionLinePoints && (
          <Line
            type="monotone"
            data={regressionLinePoints}
            dataKey={yAxisDataKey}
            stroke={regressionColor}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            name="Ligne de régression"
            isAnimationActive={true}
            animationDuration={1000}
            animationBegin={300}
          />
        )}
        
        {/* Show regression equation */}
        {showEquation && regressionData && (
          <ReferenceLine
            y={0}
            stroke="transparent"
            label={{
              value: regressionEquation,
              position: 'insideTopRight',
              fill: regressionColor,
              fontSize: 12
            }}
          />
        )}
        
        {/* Show R-squared value */}
        {showStatistics && regressionData?.r2 && (
          <ReferenceLine
            y={0}
            stroke="transparent"
            label={{
              value: `R² = ${regressionData.r2.toFixed(3)}`,
              position: 'insideBottomRight',
              fill: regressionColor,
              fontSize: 12
            }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  // If title is provided, wrap in a Card, otherwise just return the chart
  return title ? (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4">
        {chartContent}
        {showStatistics && regressionData && (
          <div className="mt-4 text-xs text-muted-foreground grid grid-cols-2 gap-2">
            <p><strong>Équation:</strong> {regressionEquation}</p>
            {regressionData.r2 && <p><strong>R²:</strong> {regressionData.r2.toFixed(4)}</p>}
            {regressionData.adjustedR2 && <p><strong>R² ajusté:</strong> {regressionData.adjustedR2.toFixed(4)}</p>}
            {regressionData.standardError && <p><strong>Erreur standard:</strong> {regressionData.standardError.toFixed(4)}</p>}
            {regressionData.fStatistic && <p><strong>F-statistique:</strong> {regressionData.fStatistic.toFixed(4)}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  ) : chartContent;
}
