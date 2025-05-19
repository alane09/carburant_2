"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { memo, useMemo, useState } from "react"
import {
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    TooltipProps,
    XAxis,
    YAxis,
    ZAxis
} from "recharts"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

interface RegressionChartProps {
  regressionData: any
  monthlyData: any[]
  coefficient: number
}

// Memoized custom tooltip to improve performance
const CustomTooltip = memo(({ active, payload }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    
    // Determine if this is a regression line point or data point
    const isRegressionPoint = dataPoint.predicted;
    
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
        {isRegressionPoint ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">Ligne de régression</p>
            <div className="grid grid-cols-2 gap-x-2 text-xs">
              {dataPoint.kilometrage !== undefined && (
                <>
                  <span>Kilométrage:</span>
                  <span className="font-mono">{formatPreciseNumber(dataPoint.kilometrage)} km</span>
                </>
              )}
              {dataPoint.tonnage !== undefined && (
                <>
                  <span>Tonnage:</span>
                  <span className="font-mono">{formatPreciseNumber(dataPoint.tonnage)} T</span>
                </>
              )}
              <span>Consommation:</span>
              <span className="font-mono">{formatPreciseNumber(dataPoint.consommation)} L</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">{dataPoint.month || "Données"}</p>
            <div className="grid grid-cols-2 gap-x-2 text-xs">
              <span>Kilométrage:</span>
              <span className="font-mono">{formatPreciseNumber(dataPoint.kilometrage)} km</span>
              <span>Tonnage:</span>
              <span className="font-mono">{formatPreciseNumber(dataPoint.tonnage)} T</span>
              <span>Consommation:</span>
              <span className="font-mono">{formatPreciseNumber(dataPoint.consommation)} L</span>
              {dataPoint.ipe !== undefined && (
                <>
                  <span>IPE:</span>
                  <span className="font-mono">{formatPreciseNumber(dataPoint.ipe)} L/100km</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

// Helper function to format numbers with high precision without trailing zeros
function formatPreciseNumber(value: number) {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  
  // For very small numbers, display with high precision
  if (Math.abs(value) < 0.0001) {
    return value.toExponential(4);
  } else if (Math.abs(value) < 0.001) {
    return value.toFixed(6);
  } else if (Math.abs(value) < 0.01) {
    return value.toFixed(5);
  } else if (Math.abs(value) < 0.1) {
    return value.toFixed(4);
  }
  
  // For regular numbers, ensure appropriate decimal places
  if (Math.abs(value) < 10) {
    return value.toFixed(3);
  } else if (Math.abs(value) < 100) {
    return value.toFixed(2);
  } else if (Math.abs(value) < 1000) {
    return value.toFixed(1);
  }
  
  // For larger numbers, use locale formatting with thousands separators
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

export function RegressionChart({ regressionData, monthlyData, coefficient }: RegressionChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [activeTab, setActiveTab] = useState<string>("kilometrage")

  // Set chart colors based on theme
  const colors = {
    text: isDark ? "#E2E8F0" : "#4B5563",
    grid: isDark ? "#4A5568" : "#E5E7EB",
    dataPoints: isDark ? "#60A5FA" : "#3B82F6",
    regressionLine: isDark ? "#10B981" : "#059669",
    background: isDark ? "#2D3748" : "#FFFFFF",
    tooltip: isDark ? "#374151" : "#FFFFFF",
    tooltipText: isDark ? "#F9FAFB" : "#1F2937",
  }

  // Extract coefficients from regression data
  const coefficients = useMemo(() => {
    if (!regressionData || !regressionData.coefficients) {
      return {
        kilometrage: coefficient || 0,
        tonnage: 0,
        intercept: 0
      };
    }
    
    return {
      kilometrage: regressionData.coefficients.kilometrage || 0,
      tonnage: regressionData.coefficients.tonnage || 0,
      intercept: regressionData.intercept || 0
    };
  }, [regressionData, coefficient]);

  // Generate the regression line data points for kilometrage
  const kilometrageRegressionData = useMemo(() => {
    if (!monthlyData?.length) return [];

    try {
      // Get all values for the kilometrage variable
      const xValues = monthlyData
        .filter(item => item.kilometrage !== undefined && item.kilometrage !== null && !isNaN(item.kilometrage))
        .map(item => Number(item.kilometrage));
      
      if (xValues.length === 0) return [];
      
      // Find min and max for the x axis
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      
      // Calculate padding for the regression line to extend beyond data points
      const rangeX = maxX - minX;
      const paddedMinX = Math.max(0, minX - rangeX * 0.1);
      const paddedMaxX = maxX + rangeX * 0.1;
      
      // Generate points for the regression line
      const numPoints = 100; // Higher number for smoother line
      const step = (paddedMaxX - paddedMinX) / numPoints;
      
      return Array.from({ length: numPoints + 1 }).map((_, i) => {
        const x = paddedMinX + i * step;
        
        // Calculate y using the regression model: consommation = a*kilometrage + b*tonnage + c
        // For this graph, we use the average tonnage as a constant
        const validTonnages = monthlyData
          .filter(item => item.tonnage !== undefined && item.tonnage !== null && !isNaN(item.tonnage))
          .map(item => Number(item.tonnage));
          
        const avgTonnage = validTonnages.length > 0 ? 
          validTonnages.reduce((sum, val) => sum + val, 0) / validTonnages.length : 0;
        
        // Y = a*X1 + b*X2 + c
        const y = coefficients.kilometrage * x + 
                 coefficients.tonnage * avgTonnage + 
                 coefficients.intercept;
        
        return {
          kilometrage: x,
          consommation: y,
          predicted: true
        };
      });
    } catch (error) {
      console.error("Error generating kilometrage regression line:", error);
      return [];
    }
  }, [monthlyData, coefficients]);

  // Generate the regression line data points for tonnage
  const tonnageRegressionData = useMemo(() => {
    if (!monthlyData?.length) return [];

    try {
      // Get all values for the tonnage variable
      const xValues = monthlyData
        .filter(item => item.tonnage !== undefined && item.tonnage !== null && !isNaN(item.tonnage))
        .map(item => Number(item.tonnage));
      
      if (xValues.length === 0) return [];
      
      // Find min and max for the x axis
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      
      // Calculate padding for the regression line to extend beyond data points
      const rangeX = maxX - minX;
      const paddedMinX = Math.max(0, minX - rangeX * 0.1);
      const paddedMaxX = maxX + rangeX * 0.1;
      
      // Generate points for the regression line
      const numPoints = 100; // Higher number for smoother line
      const step = (paddedMaxX - paddedMinX) / numPoints;
      
      return Array.from({ length: numPoints + 1 }).map((_, i) => {
        const x = paddedMinX + i * step;
        
        // Calculate y using the regression model: consommation = a*kilometrage + b*tonnage + c
        // For this graph, we use the average kilometrage as a constant
        const validKilometrages = monthlyData
          .filter(item => item.kilometrage !== undefined && item.kilometrage !== null && !isNaN(item.kilometrage))
          .map(item => Number(item.kilometrage));
          
        const avgKilometrage = validKilometrages.length > 0 ?
          validKilometrages.reduce((sum, val) => sum + val, 0) / validKilometrages.length : 0;
        
        // Y = a*X1 + b*X2 + c
        const y = coefficients.kilometrage * avgKilometrage + 
                 coefficients.tonnage * x + 
                 coefficients.intercept;
        
        return {
          tonnage: x,
          consommation: y,
          predicted: true
        };
      });
    } catch (error) {
      console.error("Error generating tonnage regression line:", error);
      return [];
    }
  }, [monthlyData, coefficients]);

  // Generate domain padding
  const getDomainPadding = (data: any[], key: string) => {
    if (!data || data.length === 0) return [0, 10];
    
    const values = data
      .map(d => d[key])
      .filter(v => v !== undefined && v !== null && !isNaN(v))
      .map(Number);
      
    if (values.length === 0) return [0, 10];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Add 10% padding to each side
    return [Math.max(0, min - range * 0.1), max + range * 0.1];
  };

  // Calculate the regression equation to display
  const getEquationDisplay = () => {
    if (!regressionData) return "Y = a·X₁ + b·X₂ + c";
    
    const a = coefficients.kilometrage;
    const b = coefficients.tonnage;
    const c = coefficients.intercept;
    
    const aDisplay = formatPreciseNumber(a);
    const bDisplay = b === 0 ? "" : (b > 0 ? ` + ${formatPreciseNumber(b)}·X₂` : ` - ${formatPreciseNumber(Math.abs(b))}·X₂`);
    const cDisplay = c === 0 ? "" : (c > 0 ? ` + ${formatPreciseNumber(c)}` : ` - ${formatPreciseNumber(Math.abs(c))}`);
    
    return `Y = ${aDisplay}·X₁${bDisplay}${cDisplay}`;
  };

  // Get R² quality indicator
  const getRSquaredQuality = (rSquared: number | undefined) => {
    if (rSquared === undefined || rSquared === null) return "N/A";
    
    if (rSquared >= 0.9) return "Excellente";
    if (rSquared >= 0.8) return "Très bonne";
    if (rSquared >= 0.7) return "Bonne";
    if (rSquared >= 0.5) return "Moyenne";
    return "Faible";
  };

  // Filter out invalid data points for visualization
  const validMonthlyData = useMemo(() => {
    return monthlyData.filter(item => 
      item.kilometrage !== undefined && 
      item.kilometrage !== null && 
      !isNaN(item.kilometrage) &&
      item.tonnage !== undefined && 
      item.tonnage !== null && 
      !isNaN(item.tonnage) &&
      item.consommation !== undefined && 
      item.consommation !== null && 
      !isNaN(item.consommation)
    );
  }, [monthlyData]);

  return (
    <div className="space-y-4 h-full">
      <div className="rounded-lg border p-4 bg-slate-50 dark:bg-slate-800">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-semibold text-lg">Équation de régression multiple</h3>
            {regressionData?.rSquared !== undefined && (
              <Badge variant={regressionData.rSquared >= 0.7 ? "success" : "default"}>
                Qualité: {getRSquaredQuality(regressionData.rSquared)}
              </Badge>
            )}
          </div>
          
          <div className="text-lg font-mono tracking-tight">
            {getEquationDisplay()}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2 text-sm">
            <div>
              <span className="text-muted-foreground">Coefficient a (X₁):</span>
              <span className="ml-2 font-mono font-medium">{formatPreciseNumber(coefficients.kilometrage)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Coefficient b (X₂):</span>
              <span className="ml-2 font-mono font-medium">{formatPreciseNumber(coefficients.tonnage)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Constante c:</span>
              <span className="ml-2 font-mono font-medium">{formatPreciseNumber(coefficients.intercept)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">R²:</span>
              <span className="ml-2 font-mono font-medium">
                {regressionData?.rSquared !== undefined ? 
                 `${(regressionData.rSquared * 100).toFixed(2)}%` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">R² ajusté:</span>
              <span className="ml-2 font-mono font-medium">
                {regressionData?.adjustedRSquared !== undefined ? 
                 `${(regressionData.adjustedRSquared * 100).toFixed(2)}%` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Erreur (MSE):</span>
              <span className="ml-2 font-mono font-medium">
                {regressionData?.mse !== undefined ? formatPreciseNumber(regressionData.mse) : "N/A"}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-1">
            <p>
              Où Y = consommation (L), X₁ = kilométrage (km), X₂ = tonnage (T)
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground mt-2">
            <p>
              {validMonthlyData.length === 0 ? (
                "Aucune donnée valide pour visualiser la régression"
              ) : validMonthlyData.length < monthlyData.length ? (
                `${validMonthlyData.length} points de données valides sur ${monthlyData.length} utilisés pour la visualisation`
              ) : (
                `${validMonthlyData.length} points de données utilisés pour la visualisation`
              )}
            </p>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="kilometrage">
            Consommation ~ Kilométrage
          </TabsTrigger>
          <TabsTrigger value="tonnage">
            Consommation ~ Tonnage
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="kilometrage" className="h-[450px] mt-0">
          {validMonthlyData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Aucune donnée valide disponible pour créer ce graphique.<br />
                Veuillez vérifier les données mensuelles.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 20,
                  right: 30,
                  bottom: 40,
                  left: 40,
                }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={colors.grid}
                  vertical
                  horizontal
                />
                <XAxis 
                  type="number"
                  dataKey="kilometrage"
                  name="Kilométrage (km)"
                  domain={getDomainPadding(validMonthlyData, "kilometrage")}
                  tickFormatter={(value) => formatPreciseNumber(value)}
                  tick={{ fill: colors.text }}
                  stroke={colors.text}
                  label={{
                    value: "Kilométrage (km)",
                    position: "insideBottom",
                    offset: -15,
                    fill: colors.text
                  }}
                />
                <YAxis 
                  type="number"
                  dataKey="consommation"
                  name="Consommation (L)"
                  domain={getDomainPadding([...validMonthlyData, ...kilometrageRegressionData], "consommation")}
                  tickFormatter={(value) => formatPreciseNumber(value)}
                  tick={{ fill: colors.text }}
                  stroke={colors.text}
                  label={{
                    value: "Consommation (L)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -20,
                    fill: colors.text
                  }}
                />
                <ZAxis 
                  type="number" 
                  dataKey="r" 
                  range={[40, 40]} 
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: colors.text, strokeDasharray: "3 3" }}
                />
                <Legend verticalAlign="bottom" height={36} />
                
                {/* Scatter plot of actual data points */}
                <Scatter 
                  name="Données mensuelles" 
                  data={validMonthlyData.map(item => ({...item, r: 60}))} 
                  fill={colors.dataPoints}
                  line={false}
                  shape="circle"
                />
                
                {/* Regression line */}
                <Scatter
                  name="Droite de régression"
                  data={kilometrageRegressionData}
                  fill="none"
                  line={{ stroke: colors.regressionLine, strokeWidth: 2 }}
                  lineType="fitting"
                  shape={false}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </TabsContent>
        
        <TabsContent value="tonnage" className="h-[450px] mt-0">
          {validMonthlyData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Aucune donnée valide disponible pour créer ce graphique.<br />
                Veuillez vérifier les données mensuelles.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 20,
                  right: 30,
                  bottom: 40,
                  left: 40,
                }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={colors.grid}
                  vertical
                  horizontal
                />
                <XAxis 
                  type="number"
                  dataKey="tonnage"
                  name="Tonnage (T)"
                  domain={getDomainPadding(validMonthlyData, "tonnage")}
                  tickFormatter={(value) => formatPreciseNumber(value)}
                  tick={{ fill: colors.text }}
                  stroke={colors.text}
                  label={{
                    value: "Tonnage (T)",
                    position: "insideBottom",
                    offset: -15,
                    fill: colors.text
                  }}
                />
                <YAxis 
                  type="number"
                  dataKey="consommation"
                  name="Consommation (L)"
                  domain={getDomainPadding([...validMonthlyData, ...tonnageRegressionData], "consommation")}
                  tickFormatter={(value) => formatPreciseNumber(value)}
                  tick={{ fill: colors.text }}
                  stroke={colors.text}
                  label={{
                    value: "Consommation (L)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -20,
                    fill: colors.text
                  }}
                />
                <ZAxis 
                  type="number" 
                  dataKey="r" 
                  range={[40, 40]} 
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: colors.text, strokeDasharray: "3 3" }}
                />
                <Legend verticalAlign="bottom" height={36} />
                
                {/* Scatter plot of actual data points */}
                <Scatter 
                  name="Données mensuelles" 
                  data={validMonthlyData.map(item => ({...item, r: 60}))} 
                  fill={colors.dataPoints}
                  line={false}
                  shape="circle"
                />
                
                {/* Regression line */}
                <Scatter
                  name="Droite de régression"
                  data={tonnageRegressionData}
                  fill="none"
                  line={{ stroke: colors.regressionLine, strokeWidth: 2 }}
                  lineType="fitting"
                  shape={false}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}