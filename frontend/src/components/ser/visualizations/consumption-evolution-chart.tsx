"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BarChart3, LineChart as LineChartIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis
} from "recharts"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

interface ConsumptionEvolutionChartProps {
  monthlyData: any[]
  regressionData: any
  targetImprovement?: number
}

export function ConsumptionEvolutionChart({ 
  monthlyData, 
  regressionData,
  targetImprovement = 3 
}: ConsumptionEvolutionChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line")

  // Set chart colors based on theme
  const colors = {
    actual: isDark ? "#60A5FA" : "#3B82F6",     // Blue
    reference: isDark ? "#F97316" : "#EA580C",   // Orange
    target: isDark ? "#10B981" : "#059669",      // Green
    grid: isDark ? "#4A5568" : "#E5E7EB", 
    text: isDark ? "#E2E8F0" : "#4B5563",
  }

  // Format number for tooltip
  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) return "N/A";
    
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  };
  
  // Calculate reference consumption using the regression model
  const calculateReferenceConsumption = (item: any) => {
    if (!regressionData || !regressionData.coefficients) return null;
    
    const { kilometrage, tonnage } = item;
    
    const a = regressionData.coefficients.kilometrage || 0;
    const b = regressionData.coefficients.tonnage || 0;
    const c = regressionData.intercept || 0;
    
    // Y = a·X₁ + b·X₂ + c
    return a * kilometrage + b * tonnage + c;
  };

  // Process the monthly data to include reference and target consumption
  const processedData = useMemo(() => {
    if (!monthlyData?.length) return [];
    
    // French month ordering
    const monthOrder = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", 
      "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
    ];

    // Process the data
    const data = monthlyData.map(item => {
      const referenceConsumption = calculateReferenceConsumption(item);
      const targetConsumption = item.consommation * (1 - targetImprovement / 100);
      
      return {
        month: item.month,
        actualConsumption: item.consommation,
        referenceConsumption,
        targetConsumption,
        // Store original data for calculations
        originalData: item,
      };
    });

    // Sort by month
    return [...data].sort((a, b) => {
      const aMonth = a.month.length > 3 ? a.month : a.month;
      const bMonth = b.month.length > 3 ? b.month : b.month;
      
      const aIndex = monthOrder.findIndex(m => m.startsWith(aMonth.substring(0, 3)));
      const bIndex = monthOrder.findIndex(m => m.startsWith(bMonth.substring(0, 3)));
      
      return aIndex - bIndex;
    });
  }, [monthlyData, regressionData, targetImprovement]);

  // Calculate total consumption values
  const totalValues = useMemo(() => {
    if (!processedData.length) return { actual: 0, reference: 0, target: 0 };
    
    return processedData.reduce((acc, item) => ({
      actual: acc.actual + (item.actualConsumption || 0),
      reference: acc.reference + (item.referenceConsumption || 0),
      target: acc.target + (item.targetConsumption || 0)
    }), { actual: 0, reference: 0, target: 0 });
  }, [processedData]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      const actualValue = data.actualConsumption;
      const referenceValue = data.referenceConsumption;
      const targetValue = data.targetConsumption;
      
      // Calculate improvement percentage
      const improvement = actualValue && referenceValue ? 
        ((actualValue - referenceValue) / actualValue) * 100 : null;
      
      // Format percentage with sign
      const formatPercentage = (value: number | null) => {
        if (value === null) return "N/A";
        const sign = value >= 0 ? "+" : "";
        return `${sign}${value.toFixed(2)}%`;
      };
      
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="font-semibold mb-2">{label}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 inline-block rounded-full" style={{ backgroundColor: colors.actual }}></span>
              Consommation:
            </span>
            <span className="font-mono">{formatNumber(actualValue)} L</span>
            
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 inline-block rounded-full" style={{ backgroundColor: colors.reference }}></span>
              Référence:
            </span>
            <span className="font-mono">{formatNumber(referenceValue)} L</span>
            
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 inline-block rounded-full" style={{ backgroundColor: colors.target }}></span>
              Cible:
            </span>
            <span className="font-mono">{formatNumber(targetValue)} L</span>
            
            {improvement !== null && (
              <>
                <span>Amélioration:</span>
                <span className={`font-mono ${improvement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercentage(improvement)}
                </span>
              </>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: colors.text }}
                stroke={colors.text}
              />
              <YAxis 
                tick={{ fill: colors.text }}
                stroke={colors.text}
                tickFormatter={(value) => `${value} L`}
                label={{ 
                  value: 'Consommation (L)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: colors.text
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar name="Consommation actuelle" dataKey="actualConsumption" fill={colors.actual} />
              <Bar name="Consommation de référence" dataKey="referenceConsumption" fill={colors.reference} />
              <Bar name="Consommation cible" dataKey="targetConsumption" fill={colors.target} />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={processedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: colors.text }}
                stroke={colors.text}
              />
              <YAxis 
                tick={{ fill: colors.text }}
                stroke={colors.text}
                tickFormatter={(value) => `${value} L`}
                label={{ 
                  value: 'Consommation (L)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: colors.text
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                name="Consommation actuelle" 
                dataKey="actualConsumption" 
                stroke={colors.actual} 
                fill={`${colors.actual}40`} 
                activeDot={{ r: 6 }}
              />
              <Area 
                type="monotone" 
                name="Consommation de référence" 
                dataKey="referenceConsumption" 
                stroke={colors.reference} 
                fill={`${colors.reference}40`}
              />
              <Area 
                type="monotone" 
                name="Consommation cible" 
                dataKey="targetConsumption" 
                stroke={colors.target} 
                fill={`${colors.target}40`}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case "line":
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: colors.text }}
                stroke={colors.text}
              />
              <YAxis 
                tick={{ fill: colors.text }}
                stroke={colors.text}
                tickFormatter={(value) => `${value} L`}
                label={{ 
                  value: 'Consommation (L)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: colors.text
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                name="Consommation actuelle" 
                dataKey="actualConsumption" 
                stroke={colors.actual} 
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                name="Consommation de référence" 
                dataKey="referenceConsumption" 
                stroke={colors.reference} 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                name="Consommation cible" 
                dataKey="targetConsumption" 
                stroke={colors.target} 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  // Calculate improvements for summary badges
  const improvements = useMemo(() => {
    const actual = totalValues.actual;
    const reference = totalValues.reference;
    
    if (!actual || !reference) return { total: 0 };
    
    return {
      total: ((actual - reference) / actual) * 100
    };
  }, [totalValues]);
  
  // Get style based on improvement value
  const getImprovementStyle = (value: number) => {
    if (value > 5) return "success";
    if (value > 0) return "default"; 
    if (value > -5) return "warning";
    return "destructive";
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Évolution de la consommation</CardTitle>
          <CardDescription>
            Comparaison mensuelle entre consommation actuelle, de référence, et cible
          </CardDescription>
        </div>
        <ToggleGroup type="single" value={chartType} onValueChange={(value: string) => value && setChartType(value as "line" | "bar" | "area")}>
          <ToggleGroupItem value="line" aria-label="Graphique en ligne">
            <LineChartIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="bar" aria-label="Graphique en barres">
            <BarChart3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="area" aria-label="Graphique en aires">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M3 15h4l3-3 4 4 3-3 3 3v4H3z" />
            </svg>
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="pb-4">
        {processedData.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col items-center border rounded-lg p-3 bg-slate-50 dark:bg-slate-800">
              <span className="text-sm text-muted-foreground">Consommation totale</span>
              <span className="text-xl font-bold font-mono mt-1">{formatNumber(totalValues.actual)} L</span>
            </div>
            <div className="flex flex-col items-center border rounded-lg p-3 bg-slate-50 dark:bg-slate-800">
              <span className="text-sm text-muted-foreground">Référence totale</span>
              <span className="text-xl font-bold font-mono mt-1">{formatNumber(totalValues.reference)} L</span>
            </div>
            <div className="flex flex-col items-center border rounded-lg p-3 bg-slate-50 dark:bg-slate-800">
              <span className="text-sm text-muted-foreground">Amélioration</span>
              <Badge 
                variant={getImprovementStyle(improvements.total) as any} 
                className="mt-1 text-lg font-mono px-3 py-1"
              >
                {improvements.total > 0 ? '+' : ''}
                {improvements.total.toFixed(2)}%
              </Badge>
            </div>
          </div>
        )}
        
        <div className="h-[400px] w-full">
          {processedData.length > 0 ? (
            renderChart()
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}