"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { useMemo } from "react"
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
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

interface RegressionAnalysisChartsProps {
  regressionData: any
  monthlyData: any[]
  coefficient: number
  targetImprovementPercentage?: number
}

// Helper function to format numbers with Excel-equivalent precision
function formatPreciseNumber(value: number) {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  
  // Format coefficients with exactly four digits after decimal point (Excel standard)
  return value.toFixed(4);
}

export function RegressionAnalysisCharts({ 
  regressionData, 
  monthlyData, 
  coefficient,
  targetImprovementPercentage = 0.03 // Default to 3% if not provided
}: RegressionAnalysisChartsProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Set chart colors based on theme
  const colors = {
    text: isDark ? "#E2E8F0" : "#4B5563",
    grid: isDark ? "#4A5568" : "#E5E7EB",
    primary: isDark ? "#60A5FA" : "#3B82F6",
    secondary: isDark ? "#10B981" : "#059669",
    tertiary: isDark ? "#F59E0B" : "#D97706",
    quaternary: isDark ? "#EC4899" : "#DB2777",
    background: isDark ? "#2D3748" : "#FFFFFF",
    actual: isDark ? "#60A5FA" : "#3B82F6", // Blue for actual consumption
    reference: isDark ? "#10B981" : "#047857", // Green for reference consumption
    target: isDark ? "#F97316" : "#EA580C" // Brighter orange for target consumption
  }

  // Calculate predicted values based on regression equation
  const predictedData = useMemo(() => {
    if (!regressionData || !monthlyData || monthlyData.length === 0) return [];
    
    return monthlyData.map(item => {
      const predictedConsumption = 
        regressionData.intercept + 
        regressionData.coefficients.kilometrage * item.kilometrage + 
        regressionData.coefficients.tonnage * item.tonnage;
      
      const residual = item.consommation - predictedConsumption;
      
      return {
        ...item,
        predictedConsumption: parseFloat(predictedConsumption.toFixed(3)),
        residual: parseFloat(residual.toFixed(3)),
        residualSquared: parseFloat((residual * residual).toFixed(3)),
        // Add percentage error for better interpretation
        percentageError: parseFloat(((residual / item.consommation) * 100).toFixed(1))
      };
    });
  }, [regressionData, monthlyData]);
  
  // Calculate additional regression statistics for display
  const regressionStats = useMemo(() => {
    if (!regressionData || !predictedData || predictedData.length === 0) {
      return {
        meanAbsoluteError: 0,
        meanAbsolutePercentageError: 0,
        maxResidual: 0,
        minResidual: 0
      };
    }
    
    const residuals = predictedData.map(item => item.residual);
    const absResiduals = residuals.map(r => Math.abs(r));
    const percentageErrors = predictedData.map(item => Math.abs(item.percentageError));
    
    return {
      meanAbsoluteError: parseFloat((absResiduals.reduce((sum, val) => sum + val, 0) / absResiduals.length).toFixed(3)),
      meanAbsolutePercentageError: parseFloat((percentageErrors.reduce((sum, val) => sum + val, 0) / percentageErrors.length).toFixed(1)),
      maxResidual: parseFloat(Math.max(...residuals).toFixed(3)),
      minResidual: parseFloat(Math.min(...residuals).toFixed(3))
    };
  }, [regressionData, predictedData]);

  // Process monthly data for time-series analysis
  const timeSeriesData = useMemo(() => {
    if (!monthlyData?.length) return [];

    // Extract coefficients from regression data for calculations
    const coefficients = {
      kilometrage: regressionData?.coefficients?.kilometrage || 0,
      tonnage: regressionData?.coefficients?.tonnage || 0,
      intercept: regressionData?.intercept || 0
    };

    // Ensure data is sorted by date for proper time series visualization
    return [...monthlyData]
      .filter(item => item.month && typeof item.consommation === 'number' && typeof item.kilometrage === 'number')
      .sort((a, b) => {
        const monthOrder = [
          "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", 
          "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
          "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
          "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ];
        
        const getMonthIndex = (month: string) => {
          if (!month) return -1;
          const shortMonth = month.substring(0, 3);
          return monthOrder.findIndex(m => m.startsWith(shortMonth));
        };
        
        return getMonthIndex(a.month) - getMonthIndex(b.month);
      })
      .map(item => {
        // Use pre-calculated values if available, otherwise calculate them
        // This ensures consistency with the data table and other components
        
        // Safe access to values with fallbacks
        const safeKilometrage = typeof item.kilometrage === 'number' ? item.kilometrage : 0;
        const safeTonnage = typeof item.tonnage === 'number' ? item.tonnage : 0;
        const safeConsommation = typeof item.consommation === 'number' ? item.consommation : 0;
        
        // Calculate reference consumption if not already provided
        const consommationReference = item.consommationReference ?? (
          coefficients.kilometrage * safeKilometrage + 
          coefficients.tonnage * safeTonnage + 
          coefficients.intercept
        );
        
        // Ensure reference consumption is never negative
        const validReferenceConsumption = Math.max(0, consommationReference);
        
        // Calculate target consumption: actual consumption * (1 - targetImprovementPercentage)
        const consommationTarget = item.consommationTarget ?? (safeConsommation * (1 - targetImprovementPercentage));
        
        // Calculate improvement percentage with proper handling of edge cases
        const improvementPercentage = item.improvementPercentage ?? (
          safeConsommation > 0 
            ? ((safeConsommation - validReferenceConsumption) / safeConsommation) * 100
            : 0
        );
        
        // Calculate difference between actual and reference
        const ecart = item.ecart ?? (safeConsommation - validReferenceConsumption);
        
        // Calculate percentage difference relative to reference
        const ecartPercentage = item.ecartPercentage ?? (
          validReferenceConsumption > 0
            ? (ecart / validReferenceConsumption) * 100
            : 0
        );
        
        // Format all values to 3 decimal places for consumption values and 4 for percentages (Excel standard)
        return {
          ...item,
          // Use existing values or calculated ones, formatted consistently
          consommationReference: Number(validReferenceConsumption.toFixed(3)),
          consommationTarget: Number(consommationTarget.toFixed(3)),
          improvementPercentage: Number(improvementPercentage.toFixed(4)),
          ecart: Number(ecart.toFixed(3)),
          ecartPercentage: Number(ecartPercentage.toFixed(4)),
          // Add target consumption related metrics
          ecartTarget: Number((safeConsommation - consommationTarget).toFixed(3)),
          targetEcartPercentage: Number(((safeConsommation - consommationTarget) / safeConsommation * 100).toFixed(4)),
          // For backward compatibility with existing code
          predictedConsommation: Number(validReferenceConsumption.toFixed(3)),
          residual: Number(ecart.toFixed(3))
        };
      });
  }, [monthlyData, regressionData]);

  // Calculate residuals statistics
  const residualsStats = useMemo(() => {
    if (!timeSeriesData?.length || !regressionData) return { mean: 0, stdDev: 0, min: 0, max: 0 };

    const residuals = timeSeriesData
      .filter(item => item.residual !== undefined)
      .map(item => item.residual);

    if (residuals.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0 };

    const sum = residuals.reduce((a, b) => a + b, 0);
    const mean = sum / residuals.length;
    const squaredDiffs = residuals.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / residuals.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...residuals);
    const max = Math.max(...residuals);

    return { mean, stdDev, min, max };
  }, [timeSeriesData, regressionData]);

  // Group data into 10 bins for histogram of residuals
  const residualHistogramData = useMemo(() => {
    if (!timeSeriesData?.length || !regressionData) return [];

    const residuals = timeSeriesData
      .filter(item => item.residual !== undefined)
      .map(item => item.residual);

    if (residuals.length === 0) return [];

    // Calculate bin width for 10 bins
    const min = Math.min(...residuals);
    const max = Math.max(...residuals);
    const binWidth = (max - min) / 10;
    
    // Create bins
    const bins = Array(10).fill(0).map((_, i) => ({
      binStart: min + i * binWidth,
      binEnd: min + (i + 1) * binWidth,
      count: 0
    }));
    
    // Count residuals in each bin
    residuals.forEach(r => {
      const binIndex = Math.min(Math.floor((r - min) / binWidth), 9);
      bins[binIndex].count += 1;
    });
    
    return bins.map(bin => ({
      name: `${formatPreciseNumber(bin.binStart)} à ${formatPreciseNumber(bin.binEnd)}`,
      count: bin.count,
      binMiddle: (bin.binStart + bin.binEnd) / 2
    }));
  }, [timeSeriesData, regressionData]);
  
  return (
    <div className="space-y-8">
      {/* Monthly Consumption Evolution Chart */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Évolution mensuelle de la consommation</h3>
        <Card className="p-4 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeriesData}
              margin={{ top: 20, right: 30, bottom: 50, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="month" 
                label={{ value: "Mois", position: "bottom", offset: 20, fill: colors.text, fontSize: 12, fontWeight: 500 }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                label={{ value: "Consommation (L)", angle: -90, position: "left", offset: -20, fill: colors.text, fontSize: 12, fontWeight: 500 }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
                domain={['auto', 'auto']}
                padding={{ top: 10, bottom: 10 }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  const formattedValue = formatPreciseNumber(value as number);
                  let displayName = name;
                  
                  // Customize tooltip labels
                  if (name === 'consommation') displayName = 'Consommation actuelle';
                  else if (name === 'consommationReference') displayName = 'Consommation de référence';
                  else if (name === 'consommationTarget') displayName = 'Consommation cible';
                  
                  return [formattedValue + ' L', displayName];
                }}
                cursor={{ stroke: colors.text, strokeDasharray: '3 3' }}
                labelFormatter={(value) => `Mois: ${value}`}
                contentStyle={{ 
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: colors.text,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                formatter={(value) => {
                  return <span style={{ color: colors.text, fontSize: '12px', fontWeight: 500 }}>{value}</span>;
                }}
              />
              
              <Line
                type="monotone"
                dataKey="consommation"
                name="Consommation actuelle"
                stroke={colors.actual}
                strokeWidth={2}
                dot={{ r: 4, fill: colors.actual }}
                activeDot={{ r: 6 }}
              />
              
              <Line
                type="monotone"
                dataKey="consommationReference"
                name="Consommation de référence"
                stroke={colors.reference}
                strokeWidth={2}
                dot={{ r: 4, fill: colors.reference }}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
              />
              
              <Line
                type="monotone"
                dataKey="consommationTarget"
                name={`Consommation cible (-${(targetImprovementPercentage * 100).toFixed(1)}%)`}
                stroke={colors.target}
                strokeWidth={2.5}
                dot={{ r: 4, fill: colors.target, strokeWidth: 1, stroke: colors.background }}
                activeDot={{ r: 6 }}
                strokeDasharray="3 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <p className="flex-1">
              Ce graphique présente l'évolution de la consommation mensuelle avec trois séries : 
              la consommation actuelle, la consommation de référence (calculée par le modèle de régression) 
              et la consommation cible (3% de réduction par rapport à l'actuelle).
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.target }}></div>
              <span className="text-xs font-medium">Objectif de réduction: {(targetImprovementPercentage * 100).toFixed(1)}%</span>
            </div>
          </div>
      </div>

      {/* Regression Statistics Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Statistiques de régression</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">R² (Coefficient de détermination)</span>
              <span className="text-xl font-semibold">{formatPreciseNumber(regressionData?.rSquared || 0)}</span>
              <span className="text-xs text-muted-foreground">Plus la valeur est proche de 1, meilleur est le modèle</span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Erreur moyenne absolue</span>
              <span className="text-xl font-semibold">{formatPreciseNumber(regressionStats.meanAbsoluteError)}</span>
              <span className="text-xs text-muted-foreground">Écart moyen entre valeurs réelles et prédites</span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Erreur en pourcentage</span>
              <span className="text-xl font-semibold">{regressionStats.meanAbsolutePercentageError}%</span>
              <span className="text-xs text-muted-foreground">Erreur moyenne en pourcentage</span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">F-statistique</span>
              <span className="text-xl font-semibold">{formatPreciseNumber(regressionData?.fStatistic || 0)}</span>
              <span className="text-xs text-muted-foreground">Significativité globale du modèle</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Observed vs Predicted Values */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Valeurs observées vs prédites</h3>
        <Card className="p-4 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 50, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="consommation" 
                type="number"
                name="Consommation actuelle"
                label={{ value: "Consommation actuelle (L)", position: "bottom", offset: 20, fill: colors.text, fontSize: 12, fontWeight: 500 }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
                domain={['auto', 'auto']}
              />
              <YAxis 
                dataKey="predictedConsumption" 
                type="number"
                name="Consommation prédite"
                label={{ value: "Consommation prédite (L)", angle: -90, position: "left", offset: -20, fill: colors.text, fontSize: 12, fontWeight: 500 }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                formatter={(value, name) => {
                  const formattedValue = formatPreciseNumber(value as number);
                  let displayName = name;
                  
                  if (name === 'consommation') displayName = 'Consommation actuelle';
                  else if (name === 'predictedConsumption') displayName = 'Consommation prédite';
                  else if (name === 'consommationReference') displayName = 'Consommation de référence';
                  else if (name === 'consommationTarget') displayName = `Consommation cible (-${(targetImprovementPercentage * 100).toFixed(1)}%)`;
                  
                  return [formattedValue + ' L', displayName];
                }}
                labelFormatter={(index) => {
                  const item = predictedData[index as number];
                  if (item) {
                    return `${item.month} - Erreur: ${item.percentageError || 0}%`;
                  }
                  return "";
                }}
                contentStyle={{ backgroundColor: colors.background, borderColor: colors.grid }}
              />
              <Scatter 
                name="Valeurs" 
                data={predictedData} 
                fill={colors.primary}
              />
              {/* Add a perfect fit line for reference */}
              <Line 
                type="monotone" 
                dataKey="predictedConsumption" 
                data={predictedData} 
                stroke={colors.secondary}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                legendType="none"
              />
              <Legend formatter={(value) => value === 'Valeurs' ? 'Points de données' : value} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
        <p className="text-sm text-muted-foreground">
          Ce graphique compare les valeurs de consommation observées avec les valeurs prédites par le modèle de régression.
          La ligne verte représente la tendance prédite par le modèle. Plus les points sont proches de cette ligne, plus le modèle est précis.
        </p>
      </div>
      
      {/* Time Series Analysis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Analyse temporelle</h3>
        <Card className="p-4 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeriesData}
              margin={{ top: 20, right: 30, bottom: 50, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="month" 
                label={{ value: "Mois", position: "bottom", offset: 20, fill: colors.text }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
              />
              <YAxis 
                yAxisId="left"
                label={{ value: "Consommation (L)", angle: -90, position: "left", offset: -20, fill: colors.text }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: "Erreur résiduelle (L)", angle: 90, position: "right", offset: 20, fill: colors.text }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
              />
              <Tooltip formatter={(value) => formatPreciseNumber(value as number)} cursor={{ stroke: colors.text, strokeDasharray: '3 3' }} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                formatter={(value) => {
                  return <span style={{ color: colors.text, fontSize: '12px', fontWeight: 500 }}>{value}</span>;
                }}
              />
              
              <Line
                type="monotone"
                dataKey="consommation"
                name="Consommation observée"
                stroke={colors.primary}
                yAxisId="left"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              <Line
                type="monotone"
                dataKey="predictedConsommation"
                name="Consommation prédite"
                stroke={colors.secondary}
                yAxisId="left"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              <Line
                type="monotone"
                dataKey="residual"
                name="Erreur résiduelle"
                stroke={colors.quaternary}
                yAxisId="right"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      {/* Residuals Analysis */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">Distribution des résidus</h3>
          
          {residualsStats && (
            <div className="space-x-2">
              <Badge variant="outline">
                Moyenne: {formatPreciseNumber(residualsStats.mean)}
              </Badge>
              <Badge variant="outline">
                Écart-type: {formatPreciseNumber(residualsStats.stdDev)}
              </Badge>
            </div>
          )}
        </div>
        
        <Card className="p-4 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={residualHistogramData}
              margin={{ top: 20, right: 30, bottom: 50, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="binMiddle" 
                label={{ value: "Erreur résiduelle (L)", position: "bottom", offset: 20, fill: colors.text }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
                tickFormatter={(value) => formatPreciseNumber(value)}
              />
              <YAxis 
                label={{ value: "Fréquence", angle: -90, position: "left", offset: -20, fill: colors.text }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
              />
              <Tooltip 
                formatter={(value, name) => [value, name === "count" ? "Fréquence" : name]} 
                labelFormatter={(value) => `Résidu: ${formatPreciseNumber(value)}`} 
                cursor={{ fill: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} 
              />
              <Legend />
              <Bar dataKey="count" name="Fréquence" fill={colors.primary} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      {/* Fuel Efficiency Over Time */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Évolution de l'IPE (Indice de Performance Énergétique)</h3>
        <Card className="p-4 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timeSeriesData}
              margin={{ top: 20, right: 30, bottom: 50, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="month" 
                label={{ value: "Mois", position: "bottom", offset: 20, fill: colors.text }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
              />
              <YAxis 
                label={{ value: "IPE (L/100km)", angle: -90, position: "left", offset: -20, fill: colors.text }} 
                tick={{ fill: colors.text }} 
                stroke={colors.text}
              />
              <Tooltip formatter={(value) => formatPreciseNumber(value as number)} cursor={{ stroke: colors.text, strokeDasharray: '3 3' }} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                formatter={(value) => {
                  return <span style={{ color: colors.text, fontSize: '12px', fontWeight: 500 }}>{value}</span>;
                }}
              />
              
              <Area
                type="monotone"
                dataKey="ipe"
                name="IPE (L/100km)"
                stroke={colors.tertiary}
                fill={colors.tertiary}
                fillOpacity={0.3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}