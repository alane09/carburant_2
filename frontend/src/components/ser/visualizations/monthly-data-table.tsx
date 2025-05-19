"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { SortAsc, SortDesc } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

// Helper function to format numbers with precise decimal places
const formatPreciseNumber = (value: number): string => {
  if (isNaN(value) || value === undefined) return '0.00';
  return value.toFixed(2).replace(/\.?0+$/, '');
};

interface ColumnDefinition {
  field: string
  label: string
  tooltip: string
}

interface MonthlyDataItem {
  month: string
  consommation: number
  kilometrage: number
  tonnage: number
  ipe: number
  consommationReference?: number
  improvementPercentage?: number
  consommationTarget?: number
  [key: string]: any // Allow indexing with dynamic keys
}

// Define extended type for monthly data with month index
interface ExtendedMonthlyDataItem extends MonthlyDataItem {
  _monthIndex: number;
}

interface MonthlyDataTableProps {
  data: MonthlyDataItem[]
  className?: string
  regressionCoefficients?: {
    kilometrage: number
    tonnage: number
    intercept: number
  }
  targetImprovementPercentage?: number
}

export function MonthlyDataTable({ 
  data, 
  className, 
  regressionCoefficients,
  targetImprovementPercentage = 0.03 // Default to 3% if not provided
}: MonthlyDataTableProps) {
  const [sortField, setSortField] = useState<keyof MonthlyDataItem>("month")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (field: keyof MonthlyDataItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }
  // Helper function to format numbers with Excel-equivalent precision
  function formatPreciseNumber(value: number | undefined) {
    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return "N/A";
    
    // Handle very small values that are effectively zero
    if (Math.abs(value) < 0.0005) {
      return "0.000";
    }
    
    // Handle extremely large values to prevent display issues
    if (Math.abs(value) > 9999999) {
      return value > 0 ? "9999999.000" : "-9999999.000";
    }
    
    // Format with exactly three digits after decimal point as in Excel
    return value.toFixed(3);
  }  // Helper function to render cell values with appropriate styling
  const renderCellValue = (value: any, field: string) => {
    // Handle null, undefined, NaN, or infinite values
    if (value === null || value === undefined || (typeof value === 'number' && (isNaN(value) || !isFinite(value)))) {
      return <span className="text-slate-400">N/A</span>;
    }
    
    // For numeric fields that represent improvements or differences
    if (['improvementPercentage', 'ecartPercentage', 'targetEcartPercentage'].includes(field)) {
      // Check for invalid values
      if (isNaN(value) || !isFinite(value)) {
        return <span className="text-slate-400 font-mono">N/A</span>;
      }
      
      // Handle extreme values
      if (Math.abs(value) > 999) {
        const extremeValue = value > 0 ? 999 : -999;
        const isExtreme = true;
        return (
          <span className="font-mono text-amber-600 dark:text-amber-500" title="Valeur hors plage">
            {Math.sign(value) > 0 ? '>' : '<'}{Math.abs(extremeValue).toFixed(1)}%
            <span className="ml-1">⚠️</span>
          </span>
        );
      }
      
      // Determine if the value represents an improvement
      // For improvement percentage, positive means actual > reference (bad)
      // For ecart percentage, negative means actual < reference (good)
      const isImprovement = field === 'improvementPercentage' ? value < 0 : value < 0;
      
      return (
        <span className={`font-mono ${isImprovement ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
          {Math.abs(value).toFixed(3)}%
          {value !== 0 && (
            <span className="ml-1">{isImprovement ? '↓' : '↑'}</span>
          )}
        </span>
      );
    }
    
    // For ecart (difference) fields
    if (['ecart', 'ecartTarget'].includes(field)) {
      // Check for invalid values
      if (isNaN(value) || !isFinite(value)) {
        return <span className="text-slate-400 font-mono">N/A</span>;
      }
      
      // Handle extreme values
      if (Math.abs(value) > 9999) {
        const clampedValue = value > 0 ? 9999 : -9999;
        return (
          <span className="font-mono font-medium text-amber-600 dark:text-amber-500" title="Valeur très élevée">
            {clampedValue > 0 ? '>' : '<'}{Math.abs(clampedValue).toFixed(1)}
            <span className="ml-1">⚠️</span>
          </span>
        );
      }
      
      // Positive ecart means actual consumption > reference (bad)
      // Negative ecart means actual consumption < reference (good)
      const isPositive = value >= 0;
      
      return (
        <span className={`font-mono font-medium ${isPositive ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-500'}`}>
          {value.toFixed(3)}
        </span>
      );
    }// For consumption values, format to 3 decimal places
    if (['consommation', 'consommationReference', 'consommationTarget'].includes(field)) {
      // Additional validation to prevent NaN/infinite values
      if (isNaN(value) || !isFinite(value)) {
        return <span className="text-slate-400 font-mono">N/A</span>;
      }
      return <span className="font-mono">{value.toFixed(3)}</span>;
    }
      // Default rendering for other types of values
    return <span className={typeof value === 'number' ? 'font-mono' : ''}>
      {typeof value === 'number' ? value.toFixed(2) : value}
    </span>;
  };

  // Helper function to get month index for sorting (1 = January, 12 = December)
  const getMonthIndex = (month: string) => {
    // French month names (full and abbreviated)
    const monthMap: Record<string, number> = {
      // Full names
      "janvier": 1,
      "février": 2,
      "mars": 3,
      "avril": 4,
      "mai": 5,
      "juin": 6,
      "juillet": 7,
      "août": 8,
      "septembre": 9,
      "octobre": 10,
      "novembre": 11,
      "décembre": 12
    };
    
    // Add abbreviated names
    const abbreviatedMonths: Record<string, number> = {
      "jan": 1,
      "fév": 2,
      "mar": 3,
      "avr": 4,
      "mai": 5, 
      "juin": 6,
      "juil": 7,
      "août": 8,
      "sep": 9,
      "oct": 10,
      "nov": 11,
      "déc": 12
    };
    
    // Combine maps
    const combinedMap = {...monthMap, ...abbreviatedMonths};
    
    // Normalize the month string
    const monthLower = month.toLowerCase().trim();
    
    // Try direct match first
    if (combinedMap[monthLower] !== undefined) {
      return combinedMap[monthLower];
    }
    
    // Try prefix match
    for (const [key, value] of Object.entries(combinedMap)) {
      if (monthLower.startsWith(key)) {
        return value;
      }
    }
    
    // If no match found, return 0 as default
    console.warn(`Month not recognized: ${month}`);
    return 0;
  };

  // Initial sort for display purposes only - actual sorting happens in processedData
  const sortedData = [...data]

  // Force initial sort by month for display
  useEffect(() => {
    // Set initial sort to month in ascending order
    setSortField("month");
    setSortDirection("asc");
  }, []);

  // Ensure months are properly sorted in chronological order
  const preprocessMonthlyData = (data: MonthlyDataItem[]): ExtendedMonthlyDataItem[] => {
    // First, standardize month names if needed
    return data.map(item => ({
      ...item,
      // Add a hidden monthIndex property for sorting
      _monthIndex: getMonthIndex(item.month)
    }));
  };

  // Process data to calculate reference consumption, improvement, and target values
  const processedData = useMemo(() => {
    // Preprocess data to ensure month indices are available
    const preprocessed = preprocessMonthlyData(data);
    
    // Apply sorting
    const sorted = [...preprocessed].sort((a, b) => {
      if (sortField === "month") {
        // Use the month index for sorting
        return sortDirection === "asc" 
          ? a._monthIndex - b._monthIndex 
          : b._monthIndex - a._monthIndex;
      } else {
        // Sort by numeric fields with proper null handling
        const aValue = typeof a[sortField as keyof ExtendedMonthlyDataItem] === 'number' ? a[sortField as keyof ExtendedMonthlyDataItem] as number : 0;
        const bValue = typeof b[sortField as keyof ExtendedMonthlyDataItem] === 'number' ? b[sortField as keyof ExtendedMonthlyDataItem] as number : 0;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });

    // If no regression coefficients are provided, return sorted data as is
    if (!regressionCoefficients) return sorted;

    // Process data with optimized calculations
    return sorted.map(item => {
      // Ensure input values are valid numbers
      const safeKilometrage = typeof item.kilometrage === 'number' ? item.kilometrage : 0;
      const safeTonnage = typeof item.tonnage === 'number' ? item.tonnage : 0;
      const safeConsommation = typeof item.consommation === 'number' ? item.consommation : 0;
      
      // Calculate reference consumption using regression formula: Y = a·X₁ + b·X₂ + c
      const referenceConsumption = item.consommationReference ?? (
        (regressionCoefficients.kilometrage * safeKilometrage) + 
        (regressionCoefficients.tonnage * safeTonnage) + 
        regressionCoefficients.intercept
      );
      
      // Ensure reference consumption is never negative (physical impossibility)
      const validReferenceConsumption = Math.max(0, referenceConsumption);
      
      // Calculate improvement percentage with proper handling of edge cases
      // Calculate improvement percentage: 
// In Excel this is calculated as ((actual - reference) / actual) * 100
// A positive value means consumption is higher than reference (bad)
// A negative value means consumption is lower than reference (good)
const improvementPercentage = item.improvementPercentage ?? (
  safeConsommation > 0 
    ? ((safeConsommation - validReferenceConsumption) / safeConsommation) * 100
    : 0
);

// Calculate target consumption (3% reduction from actual)
const targetConsumption = item.consommationTarget ?? (safeConsommation * (1 - (targetImprovementPercentage || 0.03)));

      // Return the processed item with calculated values
      return {
        ...item,
        consommationReference: validReferenceConsumption,
        improvementPercentage,
        consommationTarget: targetConsumption
      };
    });
  }, [data, regressionCoefficients, sortField, sortDirection, targetImprovementPercentage]);

  // Define column definitions
  const columns: ColumnDefinition[] = [
    { field: "month", label: "Mois", tooltip: "Mois de l'année" },
    { field: "kilometrage", label: "Kilométrage (km)", tooltip: "Distance parcourue en kilomètres" },
    { field: "tonnage", label: "Tonnage (T)", tooltip: "Quantité de marchandises transportées en tonnes" },
    { field: "consommation", label: "Consommation (L)", tooltip: "Consommation réelle de carburant en litres" },
    { field: "consommationReference", label: "Référence (L)", tooltip: "Consommation de référence calculée selon l'équation de régression" },
    { field: "improvementPercentage", label: "Amélioration (%)", tooltip: "Pourcentage d'amélioration par rapport à la consommation de référence. Valeur négative = meilleure performance" },
    { field: "consommationTarget", label: "Cible (L)", tooltip: "Consommation cible (3% de réduction par rapport à la consommation réelle)" },
    { field: "ipe", label: "IPE (L/100km)", tooltip: "Indice de Performance Énergétique en litres par 100 kilomètres" }
  ];

  // Function to get IPE color
  const getIpeColor = (ipe: number) => {
    if (ipe < 20) return "success";
    if (ipe < 30) return "warning";
    return "destructive";
  };

  // Calculate totals for the footer
  const totalConsommation = data.reduce((sum: number, item: MonthlyDataItem) => sum + item.consommation, 0);
  const totalKilometrage = data.reduce((sum: number, item: MonthlyDataItem) => sum + item.kilometrage, 0);
  const totalTonnage = data.reduce((sum: number, item: MonthlyDataItem) => sum + item.tonnage, 0);
  const avgIpe = totalKilometrage > 0 ? (totalConsommation / totalKilometrage) * 100 : 0;

  // Calculate reference consumption using regression formula if coefficients are available
  const totalConsommationReference = regressionCoefficients ? (
    (regressionCoefficients.kilometrage * totalKilometrage) +
    (regressionCoefficients.tonnage * totalTonnage) +
    regressionCoefficients.intercept
  ) : undefined;

  // Calculate the difference between actual and reference consumption
  const totalEcart = totalConsommationReference !== undefined ? totalConsommation - totalConsommationReference : undefined;

  // Calculate percentage difference relative to reference
  const totalEcartPercentage = totalConsommationReference !== undefined && totalConsommationReference > 0 ? 
    (totalEcart! / totalConsommationReference) * 100 : undefined;

  // Calculate total improvement percentage (relative to actual consumption)
  const totalImprovementPercentage = totalConsommationReference !== undefined && totalConsommation > 0 ? 
    ((totalConsommation - totalConsommationReference) / totalConsommation) * 100 : undefined;

  // Calculate total target consumption (3% reduction target)
  const totalConsommationTarget = totalConsommation * (1 - 0.03);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Données mensuelles</CardTitle>
        <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
          Analyse détaillée des données mensuelles avec calcul de référence
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative overflow-auto">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#2D3748] text-white h-10 sticky top-0 z-10">
                  {columns.map((column, index) => (
                    <TableHead 
                      key={index}
                      className="cursor-pointer text-[#E2E8F0] whitespace-nowrap text-xs p-1 text-center font-medium hover:bg-[#1e293b] transition-colors"
                      onClick={() => handleSort(column.field as keyof MonthlyDataItem)}
                    >
                      <div className="flex items-center justify-center">
                        {column.label}
                        {sortField === column.field && (
                          <Badge variant="success" className="ml-1">
                            {sortDirection === "asc" ? (
                              <SortAsc className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <SortDesc className="h-3 w-3 text-muted-foreground" />
                            )}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-6 text-muted-foreground">
                      Aucune donnée disponible pour ce type de véhicule
                    </TableCell>
                  </TableRow>
                ) : (
                  processedData.map((item, index) => (
                    <motion.tr
                      key={`${item.month}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`
                        border-t border-[#E5E7EB] dark:border-[#4A5568]
                        ${index % 2 === 0 ? 'bg-white dark:bg-[#2D3748]' : 'bg-gray-50 dark:bg-[#1e293b]'}
                        h-12
                        transition-colors duration-200
                      `}
                    >
                      {columns.map((column, columnIndex) => (
                        <TableCell key={columnIndex} className="font-medium text-[#4B5563] dark:text-[#E2E8F0] p-1.5 text-xs text-center whitespace-nowrap">
                          {renderCellValue(item[column.field as keyof typeof item], column.field)}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                )}
                {data.length > 0 && (
                  <TableRow className="border-t-2 border-slate-300 dark:border-slate-600 font-medium bg-blue-50 dark:bg-blue-950/30 h-12">
                    {columns.map((column, index) => (
                      <TableCell key={index} className="p-1 text-xs text-center font-medium">
                        {(() => {
                          // Format improvement percentage with color coding for total row
                          if (column.field === 'improvementPercentage') {
                            const value = totalImprovementPercentage || 0;
                            const isPositive = value > 0;
                            return (
                              <div className={cn(
                                "font-mono font-bold",
                                isPositive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                              )}>
                                {formatPreciseNumber(value)}%
                                {value !== 0 && (
                                  <Badge variant="success" className="ml-1">
                                    {isPositive ? '↑' : '↓'}
                                  </Badge>
                                )}
                              </div>
                            );
                          }
                          // Format écart percentage for total row
                          else if (column.field === 'ecartPercentage') {
                            // Ensure values are defined
                            const safeTotalConsommation = data.reduce((sum: number, item: MonthlyDataItem) => sum + item.consommation, 0) || 0;
                            const safeTotalConsommationReference = regressionCoefficients ? (
                              (regressionCoefficients.kilometrage * totalKilometrage) +
                              (regressionCoefficients.tonnage * totalTonnage) +
                              regressionCoefficients.intercept
                            ) : 0;
                            
                            // Calculate total écart percentage
                            const totalEcartPercentage = safeTotalConsommation > 0 && safeTotalConsommationReference > 0 ?
                              ((safeTotalConsommation - safeTotalConsommationReference) / safeTotalConsommationReference) * 100 : 0;
                            
                            const isPositive = totalEcartPercentage > 0;
                            return (
                              <div className={cn(
                                "font-mono font-bold",
                                isPositive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                              )}>
                                {formatPreciseNumber(totalEcartPercentage)}%
                                {totalEcartPercentage !== 0 && (
                                  <Badge variant="success" className="ml-1">
                                    {isPositive ? '↑' : '↓'}
                                  </Badge>
                                )}
                              </div>
                            );
                          }
                          // Format écart for total row
                          else if (column.field === 'ecart') {
                            // Ensure values are defined
                            const safeTotalConsommation = totalConsommation || 0;
                            const safeTotalConsommationReference = totalConsommationReference || 0;
                            
                            const totalEcart = safeTotalConsommation - safeTotalConsommationReference;
                            const isPositive = totalEcart > 0;
                            return (
                              <div className={cn(
                                "font-mono font-bold",
                                isPositive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                              )}>
                                {formatPreciseNumber(totalEcart)}
                              </div>
                            );
                          }
                          // Format target consumption for total row
                          else if (column.field === 'consommationTarget') {
                            return (
                              <span className="text-sm  font-mono font-bold">
                                {formatPreciseNumber(totalConsommationTarget)}
                              </span>
                            );
                          }
                          // Format IPE for total row
                          else if (column.field === 'ipe') {
                            return (
                              <Badge variant={totalKilometrage > 0 ? (avgIpe < 20 ? "success" : avgIpe < 30 ? "warning" : "destructive") : "secondary"} className="font-mono font-bold">
                                {formatPreciseNumber(avgIpe)}
                              </Badge>
                            );
                          }
                          // Format month column for total row
                          else if (column.field === 'month') {
                            return <span className="font-bold text-slate-800 dark:text-white">Totaux</span>;
                          }
                          // Default formatting for other numeric fields in total row
                          else {
                            // Calculate total for this column
                            const total = data.reduce((sum, item) => {
                              const value = item[column.field];
                              return sum + (typeof value === 'number' ? value : 0);
                            }, 0);
                            
                            return (
                              <span className="font-mono font-bold">
                                {formatPreciseNumber(total)}
                              </span>
                            );
                          }
                        })()}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
