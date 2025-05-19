"use client"

import { motion } from "framer-motion"
import { Download, Filter, Info, SortAsc, SortDesc } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip"
import { cn } from "../../lib/utils"

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
}

export function MonthlyDataTable({ data, className, regressionCoefficients }: MonthlyDataTableProps) {
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
    if (value === undefined || value === null || isNaN(value)) return "N/A";
    
    // Format with exactly three digits after decimal point as in Excel
    return value.toFixed(3);
  }

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
      "mai": 5, // Added missing month
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
        const aValue = typeof a[sortField] === 'number' ? a[sortField] : 0;
        const bValue = typeof b[sortField] === 'number' ? b[sortField] : 0;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });

    // If no regression coefficients are provided, return sorted data as is
    if (!regressionCoefficients) return sortedData;

    // Target improvement percentage (3% by default)
    const targetImprovementPercentage = 0.03;

    // Process data with optimized calculations
    return sortedData.map(item => {
      // Ensure input values are valid numbers
      const safeKilometrage = typeof item.kilometrage === 'number' ? item.kilometrage : 0;
      const safeTonnage = typeof item.tonnage === 'number' ? item.tonnage : 0;
      const safeConsommation = typeof item.consommation === 'number' ? item.consommation : 0;
      
      // Use pre-calculated values if available, otherwise calculate them
      // This ensures consistency with charts and other components
      
      // Calculate reference consumption using regression formula: Y = a·X₁ + b·X₂ + c
      const referenceConsumption = item.consommationReference ?? (
        (regressionCoefficients.kilometrage * safeKilometrage) + 
        (regressionCoefficients.tonnage * safeTonnage) + 
        regressionCoefficients.intercept
      );
      
      // Ensure reference consumption is never negative (physical impossibility)
      const validReferenceConsumption = Math.max(0, referenceConsumption);
      
      // Calculate improvement percentage with proper handling of edge cases
      const improvementPercentage = item.improvementPercentage ?? (
        safeConsommation > 0 
          ? ((safeConsommation - validReferenceConsumption) / safeConsommation) * 100
          : 0
      );
      
      // Calculate target consumption (3% reduction from actual)
      const targetConsumption = item.consommationTarget ?? (safeConsommation * (1 - targetImprovementPercentage));
      
      // Calculate difference between actual and reference
      const ecart = safeConsommation - validReferenceConsumption;
      
      // Calculate percentage difference relative to reference
      const ecartPercentage = validReferenceConsumption > 0
        ? (ecart / validReferenceConsumption) * 100
        : 0;

      // Format all values to 3 decimal places for consistency
      return {
        ...item,
        consommationReference: Number(validReferenceConsumption.toFixed(3)),
        improvementPercentage: Number(improvementPercentage.toFixed(3)),
        consommationTarget: Number(targetConsumption.toFixed(3)),
        ecart: Number(ecart.toFixed(3)),
        ecartPercentage: Number(ecartPercentage.toFixed(3))
      };
    });
  }, [data, sortField, sortDirection, regressionCoefficients]);

  // Define table columns
  const columns = useMemo(() => {
    const baseColumns = [
      { 
        field: 'month', 
        label: 'Mois',
        tooltip: 'Mois de l\'année'
      },
      { 
        field: 'kilometrage', 
        label: 'Kilométrage (X₁)',
        tooltip: 'Distance parcourue en kilomètres'
      },
      { 
        field: 'tonnage', 
        label: 'Tonnage (X₂)',
        tooltip: 'Poids transporté en tonnes'
      },
      { 
        field: 'consommation', 
        label: 'Consommation actuelle (L)',
        tooltip: 'Consommation réelle de carburant en litres'
      },
    ];
    
    // Add reference consumption, improvement, and target columns if coefficients are provided
    if (regressionCoefficients) {
      return [
        ...baseColumns,
        { 
          field: 'consommationReference', 
          label: 'Consommation de référence (L)',
          tooltip: 'Consommation calculée avec la formule de régression: Y = a·X₁ + b·X₂ + c'
        },
        { 
          field: 'ecart', 
          label: 'Écart (L)',
          tooltip: 'Différence entre consommation actuelle et consommation de référence (L)'
        },
        { 
          field: 'ecartPercentage', 
          label: 'Écart (%)',
          tooltip: 'Pourcentage d\'écart par rapport à la consommation de référence'
        },
        { 
          field: 'improvementPercentage', 
          label: 'Amélioration (%)',
          tooltip: 'Pourcentage d\'amélioration: ((Consommation actuelle - Consommation de référence) / Consommation actuelle) * 100'
        },
        { 
          field: 'consommationTarget', 
          label: 'Consommation cible (L)',
          tooltip: 'Consommation cible: Consommation actuelle * (1 - 3%)'
        }
      ];
    }
    
    return baseColumns;
  }, [regressionCoefficients]);

  // Calculate totals including the new columns
  const totalConsommation = data.reduce((sum, item) => sum + item.consommation, 0);
  const totalKilometrage = data.reduce((sum, item) => sum + item.kilometrage, 0);
  const totalTonnage = data.reduce((sum, item) => sum + item.tonnage, 0);
  const avgIpe = totalKilometrage > 0 ? (totalConsommation / totalKilometrage) * 100 : 0;
  
  // Calculate total reference consumption
  const totalConsommationReference = regressionCoefficients ? 
    (regressionCoefficients.kilometrage * totalKilometrage + 
     regressionCoefficients.tonnage * totalTonnage + 
     regressionCoefficients.intercept * data.length) : 
    undefined;
  
  // Calculate total improvement percentage
  const totalImprovementPercentage = totalConsommationReference ? 
    ((totalConsommation - totalConsommationReference) / totalConsommation) * 100 : 
    undefined;
  
  // Calculate total target consumption
  const totalConsommationTarget = totalConsommation * (1 - 0.03);

  // Get improvement color based on value
  const getImprovementColor = (improvement: number | undefined) => {
    if (improvement === undefined) return "default";
    if (improvement > 5) return "success";
    if (improvement > 0) return "default";
    if (improvement > -5) return "warning";
    return "destructive";
  };

  // Get IPE color based on value
  const getIpeColor = (ipe: number) => {
    if (ipe < 15) return "success";
    if (ipe < 25) return "default";
    if (ipe < 35) return "warning";
    return "destructive";
  };

  return (
    <Card className={cn("border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
            Données mensuelles
          </CardTitle>
          <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
            Analyse détaillée par mois avec calcul de référence et cibles
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#E5E7EB] dark:border-[#4A5568] text-[#4B5563] dark:text-[#E2E8F0] hover:bg-[#F9FAFB] dark:hover:bg-[#2D3748] transition-all duration-300"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Stats
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="w-80 p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Statistiques des données</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Total Consommation:</div>
                    <div className="font-mono">{formatPreciseNumber(totalConsommation)} L</div>
                    <div>Total Kilométrage:</div>
                    <div className="font-mono">{formatPreciseNumber(totalKilometrage)} km</div>
                    <div>Total Tonnage:</div>
                    <div className="font-mono">{formatPreciseNumber(totalTonnage)} T</div>
                    <div>IPE Moyenne:</div>
                    <div className="font-mono">{formatPreciseNumber(avgIpe)} L/100km</div>
                    {totalConsommationReference !== undefined && (
                      <>
                        <div>Total Consommation Référence:</div>
                        <div className="font-mono">{formatPreciseNumber(totalConsommationReference)} L</div>
                        <div>Amélioration globale:</div>
                        <div className="font-mono">{totalImprovementPercentage !== undefined ? `${formatPreciseNumber(totalImprovementPercentage)}%` : 'N/A'}</div>
                      </>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="outline"
            size="sm"
            className="border-[#E5E7EB] dark:border-[#4A5568] text-[#4B5563] dark:text-[#E2E8F0] hover:bg-[#F9FAFB] dark:hover:bg-[#2D3748] transition-all duration-300"
            onClick={() => {
              // Create CSV content
              const headers = ["Mois", "Kilométrage (X1)", "Tonnage (X2)", "Consommation actuelle", 
                            "Consommation de référence", "Amélioration (%)", "Consommation cible"];
              const csvRows = [headers];
              
              processedData.forEach(item => {
                csvRows.push([
                  item.month,
                  String(item.kilometrage),
                  String(item.tonnage),
                  String(item.consommation),
                  String(item.consommationReference || ''),
                  String(item.improvementPercentage ? `${item.improvementPercentage.toFixed(2)}%` : ''),
                  String(item.consommationTarget || '')
                ]);
              });
              
              // Add total row
              csvRows.push([
                'Total',
                String(totalKilometrage),
                String(totalTonnage),
                String(totalConsommation),
                String(totalConsommationReference || ''),
                String(totalImprovementPercentage ? `${totalImprovementPercentage.toFixed(2)}%` : ''),
                String(totalConsommationTarget)
              ]);
              
              const csvContent = csvRows.map(row => row.join(';')).join('\n');
              
              // Create download link
              const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', 'SER_donnees_mensuelles.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-[#E5E7EB] dark:border-[#4A5568] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F3F4F6] dark:bg-[#374151] hover:bg-[#F3F4F6] dark:hover:bg-[#374151]">
                  {columns.map((column, index) => (
                    <TableHead 
                      key={index}
                      className="cursor-pointer text-[#4B5563] dark:text-[#E2E8F0]"
                      onClick={() => handleSort(column.field as keyof MonthlyDataItem)}
                    >
                      <div className="flex items-center">
                        {column.label}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{column.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {sortField === column.field && (
                          sortDirection === "asc" ? (
                            <SortAsc className="ml-1 h-4 w-4" />
                          ) : (
                            <SortDesc className="ml-1 h-4 w-4" />
                          )
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
                      className="border-t border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] hover:bg-[#F9FAFB] dark:hover:bg-[#374151]"
                    >
                      {columns.map((column, index) => (
                        <TableCell key={index} className="font-medium text-[#4B5563] dark:text-[#E2E8F0]">
                          {(() => {
                            // Format improvement percentage with color coding
                            if (column.field === 'improvementPercentage') {
                              // For improvement, positive value means worse performance (actual > reference)
                              const value = Number(item.improvementPercentage || 0);
                              const isPositive = value > 0;
                              return (
                                <div className={cn(
                                  "font-mono",
                                  isPositive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                )}>
                                  {formatPreciseNumber(value)}%
                                  {value !== 0 && (
                                    <span className="ml-1">
                                      {isPositive ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              );
                            } 
                            // Format écart percentage with color coding
                            else if (column.field === 'ecartPercentage') {
                              const value = Number(item.ecartPercentage || 0);
                              const isPositive = value > 0;
                              return (
                                <div className={cn(
                                  "font-mono",
                                  isPositive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                )}>
                                  {formatPreciseNumber(value)}%
                                  {value !== 0 && (
                                    <span className="ml-1">
                                      {isPositive ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            // Format écart with color coding
                            else if (column.field === 'ecart') {
                              const value = Number(item.ecart || 0);
                              const isPositive = value > 0;
                              return (
                                <div className={cn(
                                  "font-mono",
                                  isPositive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                )}>
                                  {formatPreciseNumber(value)}
                                </div>
                              );
                            }
                            // Format target consumption
                            else if (column.field === 'consommationTarget') {
                              return (
                                <span className="text-sm font-medium font-mono">
                                  {formatPreciseNumber(item.consommationTarget)}
                                </span>
                              );
                            }
                            // Format IPE with badge
                            else if (column.field === 'ipe') {
                              return (
                                <Badge variant={getIpeColor(item.ipe)} className="font-mono">
                                  {formatPreciseNumber(item.ipe)}
                                </Badge>
                              );
                            }
                            // Format month
                            else if (column.field === 'month') {
                              return <span className="font-medium">{item.month}</span>;
                            }
                            // Default formatting for other numeric fields
                            else {
                              return (
                                <span className="font-mono">
                                  {formatPreciseNumber(typeof item[column.field as keyof typeof item] === 'number' ? item[column.field as keyof typeof item] as number : 0)}
                                </span>
                              );
                            }
                          })()}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                )}
                {data.length > 0 && (
                  <TableRow className="border-t-2 border-t-primary/20 font-medium bg-slate-50 dark:bg-slate-800">
                    {columns.map((column, index) => (
                      <TableCell key={index} className="py-3">
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
                                  <span className="ml-1">
                                    {isPositive ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            );
                          }
                          // Format écart percentage for total row
                          else if (column.field === 'ecartPercentage') {
                            // Ensure values are defined
                            const safeTotalConsommation = totalConsommation || 0;
                            const safeTotalConsommationReference = totalConsommationReference || 0;
                            
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
                                  <span className="ml-1">
                                    {isPositive ? '↑' : '↓'}
                                  </span>
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
                              <Badge variant={getIpeColor(avgIpe)} className="font-mono font-bold">
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
  )
}
