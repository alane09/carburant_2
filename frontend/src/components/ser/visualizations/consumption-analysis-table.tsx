"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, Download, ArrowUp, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"
import { motion } from "framer-motion"

interface ConsumptionAnalysisProps {
  monthlyData: any[]
  regressionData: any
  targetImprovement?: number // Pourcentage d'amélioration cible (par défaut 3%)
}

export function ConsumptionAnalysisTable({ 
  monthlyData, 
  regressionData,
  targetImprovement = 3 // 3% par défaut
}: ConsumptionAnalysisProps) {
  const [sortField, setSortField] = useState<string>("month")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Format number function
  const formatNumber = (value: number | undefined, decimals = 2) => {
    if (value === undefined || value === null || isNaN(value)) return "N/A";
    return value.toLocaleString('fr-FR', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Format percentage with the correct sign
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) return "N/A";
    
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toLocaleString('fr-FR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}%`;
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Calcule la consommation de référence à partir du modèle de régression
  const calculateReferenceConsumption = (item: any) => {
    if (!regressionData || !regressionData.coefficients) return null;
    
    const { kilometrage, tonnage } = item;
    
    const a = regressionData.coefficients.kilometrage || 0;
    const b = regressionData.coefficients.tonnage || 0;
    const c = regressionData.intercept || 0;
    
    // Y = a·X₁ + b·X₂ + c
    return a * kilometrage + b * tonnage + c;
  };

  // Préparation des données avec calculs de consommation de référence et d'amélioration
  const processedData = monthlyData.map(item => {
    const referenceConsumption = calculateReferenceConsumption(item);
    
    // Calcul du pourcentage d'amélioration
    // Si la consommation de référence est inférieure à la consommation actuelle,
    // l'amélioration est négative (la consommation réelle est pire que la référence)
    const improvement = referenceConsumption !== null && item.consommation !== 0 
      ? ((item.consommation - referenceConsumption) / item.consommation) * 100
      : null;
    
    // Calcul de la consommation cible (réduction de X% par rapport à la consommation actuelle)
    const targetConsumption = item.consommation * (1 - targetImprovement / 100);
    
    return {
      ...item,
      referenceConsumption,
      improvement,
      targetConsumption
    };
  });

  // Tri des données
  const sortedData = [...processedData].sort((a, b) => {
    if (sortField === "month") {
      const monthOrder = [
        "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", 
        "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
      ];
      
      const aMonthShort = a[sortField].substring(0, 3);
      const bMonthShort = b[sortField].substring(0, 3);
      const aIndex = monthOrder.findIndex(m => m.startsWith(aMonthShort));
      const bIndex = monthOrder.findIndex(m => m.startsWith(bMonthShort));
      
      return sortDirection === "asc" ? aIndex - bIndex : bIndex - aIndex;
    }
    
    // Sorting for other fields
    if (a[sortField] === null || a[sortField] === undefined) return sortDirection === "asc" ? -1 : 1;
    if (b[sortField] === null || b[sortField] === undefined) return sortDirection === "asc" ? 1 : -1;
    
    return sortDirection === "asc" 
      ? a[sortField] - b[sortField] 
      : b[sortField] - a[sortField];
  });

  // Calcul des totaux
  const totals = processedData.reduce((acc, item) => {
    return {
      kilometrage: acc.kilometrage + (item.kilometrage || 0),
      tonnage: acc.tonnage + (item.tonnage || 0),
      consommation: acc.consommation + (item.consommation || 0),
      referenceConsumption: acc.referenceConsumption + (item.referenceConsumption || 0),
      targetConsumption: acc.targetConsumption + (item.targetConsumption || 0)
    };
  }, { 
    kilometrage: 0, 
    tonnage: 0, 
    consommation: 0,
    referenceConsumption: 0,
    targetConsumption: 0
  });

  // Calcul de l'amélioration globale
  const globalImprovement = totals.consommation !== 0 
    ? ((totals.consommation - totals.referenceConsumption) / totals.consommation) * 100
    : 0;

  // Fonction pour déterminer le style en fonction de l'amélioration
  const getImprovementStyle = (improvement: number | null) => {
    if (improvement === null) return {};
    
    if (improvement > 5) return { 
      badge: "success",
      icon: <ArrowDown className="h-3.5 w-3.5" />
    };
    if (improvement > 0) return { 
      badge: "default", 
      icon: <ArrowDown className="h-3.5 w-3.5" />
    };
    if (improvement > -5) return { 
      badge: "warning",
      icon: <ArrowUp className="h-3.5 w-3.5" />
    };
    return { 
      badge: "destructive",
      icon: <ArrowUp className="h-3.5 w-3.5" />
    };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Analyse de la consommation</CardTitle>
          <CardDescription>
            Comparaison entre consommation actuelle, de référence et cible ({targetImprovement}% d'amélioration)
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => handleSort("month")}
                  >
                    <div className="flex items-center gap-1">
                      Mois
                      {sortField === "month" && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-right"
                    onClick={() => handleSort("kilometrage")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Kilométrage (X₁)
                      {sortField === "kilometrage" && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-right"
                    onClick={() => handleSort("tonnage")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Tonnage (X₂)
                      {sortField === "tonnage" && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-right"
                    onClick={() => handleSort("consommation")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Consommation actuelle
                      {sortField === "consommation" && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Consommation réelle mesurée (L)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-right"
                    onClick={() => handleSort("referenceConsumption")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Consommation référence
                      {sortField === "referenceConsumption" && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Consommation calculée par le modèle de régression (L)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-right"
                    onClick={() => handleSort("improvement")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amélioration
                      {sortField === "improvement" && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">((Consommation actuelle - Consommation référence) / Consommation actuelle) × 100</p>
                            <p className="text-xs">Valeur positive = meilleur que la référence</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-right"
                    onClick={() => handleSort("targetConsumption")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Consommation cible
                      {sortField === "targetConsumption" && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Consommation actuelle × (1 - {targetImprovement}%)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Aucune donnée disponible
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((item, index) => {
                    const improvementStyle = getImprovementStyle(item.improvement);
                    
                    return (
                      <motion.tr
                        key={`${item.month}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="border-t hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          {item.month}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(item.kilometrage)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(item.tonnage)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(item.consommation)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(item.referenceConsumption)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.improvement !== null ? (
                            <Badge variant={improvementStyle.badge as any} className="font-mono ml-auto flex items-center gap-1 w-fit">
                              {improvementStyle.icon}
                              {formatPercentage(item.improvement)}
                            </Badge>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(item.targetConsumption)}
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
                
                {/* Row for totals */}
                {sortedData.length > 0 && (
                  <TableRow className="border-t-2 border-primary/20 font-medium">
                    <TableCell>Totaux</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(totals.kilometrage)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(totals.tonnage)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(totals.consommation)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(totals.referenceConsumption)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={getImprovementStyle(globalImprovement).badge as any}
                        className="font-mono ml-auto flex items-center gap-1 w-fit"
                      >
                        {getImprovementStyle(globalImprovement).icon}
                        {formatPercentage(globalImprovement)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(totals.targetConsumption)}
                    </TableCell>
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