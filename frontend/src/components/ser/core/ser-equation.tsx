"use client";

import { motion } from "framer-motion";
import { Calculator } from "lucide-react";

interface SEREquationProps {
  kilometrageCoeff: number;
  tonnageCoeff: number;
  intercept: number;
  animate?: boolean;
}

export function SEREquation({ 
  kilometrageCoeff, 
  tonnageCoeff, 
  intercept,
  animate = true
}: SEREquationProps) {  // Format coefficient for display with Excel-equivalent precision (4 decimal places)
  const formatCoefficient = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return "N/A";
    // Ensure we display exactly 4 decimal places for consistency with Excel
    // Use toFixed(4) to get consistent display across all values
    const formatted = Math.abs(value).toFixed(4);
    // Remove trailing zeros after decimal point if they exist, but keep at least 4 digits total
    return formatted;
  };

  // Render coefficient with appropriate sign
  const renderCoefficient = (value: number, isFirst = false) => {
    if (isNaN(value)) return <span className="text-slate-400">N/A</span>;
    
    const absValue = Math.abs(value);
    const formattedValue = formatCoefficient(absValue);
    
    if (isFirst) {
      return <span>{formattedValue}</span>;
    }
    
    return (
      <span>
        <span className="mx-1">{value >= 0 ? '+' : '−'}</span>
        <span>{formattedValue}</span>
      </span>
    );
  };
  const equationContent = (
    <div className="font-mono text-lg p-4 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-center overflow-x-auto shadow-sm">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Modèle SER - Équation MLR</div>
      <span className="whitespace-nowrap flex items-center justify-center flex-wrap gap-x-2">
        <span className="font-semibold mr-1">C =</span>
        {renderCoefficient(kilometrageCoeff, true)}
        <span className="mx-1">×</span>
        <span className="text-blue-600 dark:text-blue-400">X₁</span>
        {renderCoefficient(tonnageCoeff)}
        <span className="mx-1">×</span>
        <span className="text-green-600 dark:text-green-400">X₂</span>
        {renderCoefficient(intercept)}
      </span>
    </div>
  );

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-lg border border-blue-200 dark:border-blue-800 mb-4 shadow-sm">
      <h3 className="text-md font-semibold mb-2 text-blue-800 dark:text-blue-300 flex items-center">
        <Calculator className="h-5 w-5 mr-2" />
        Équation de régression
      </h3>
      
      {animate ? (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        >
          {equationContent}
        </motion.div>
      ) : equationContent}
      
      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          C: Consommation (L) | X₁: Kilométrage | X₂: Tonnage
        </p>
        <div className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-md">
          Précision Excel (4 décimales)
        </div>
      </div>
    </div>
  );
}
