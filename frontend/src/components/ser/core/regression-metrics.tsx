"use client";

import { motion } from "framer-motion";
import {
    AlertTriangle,
    BarChart3,
    CheckCircle,
    LineChart,
    Target,
    TrendingUp
} from "lucide-react";
import { memo } from "react";

// Format coefficient for display with Excel-equivalent precision (3 decimal places)
export const formatCoefficient = (value: number) => {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  // Format with exactly three digits after decimal point as in Excel
  return value.toFixed(3);
};

// Memoized regression metrics display component with animations
const RegressionMetrics = memo(({ regressionData, coefficient, monthlyData }: { 
  regressionData: any; 
  coefficient: number;
  monthlyData: any[];
}) => {
  // Handle case when regressionData is null or undefined
  if (!regressionData) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center"
      >
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Aucune donnée de régression disponible</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Veuillez générer l'équation de régression en utilisant l'API.</p>
      </motion.div>
    );
  }
  // Extract coefficients for display and ensure they're valid numbers
  let kilometrageCoeff = regressionData.coefficients?.kilometrage || 0;
  let tonnageCoeff = regressionData.coefficients?.tonnage || 0;
  const intercept = regressionData.intercept || 0;
    // Apply corrections for extremely small coefficients to prevent numerical issues
  const MIN_COEFFICIENT_VALUE = 0.0001;
  const hasSmallKilometrageCoeff = Math.abs(kilometrageCoeff) < MIN_COEFFICIENT_VALUE;
  const hasSmallTonnageCoeff = Math.abs(tonnageCoeff) < MIN_COEFFICIENT_VALUE;
  
  if (hasSmallKilometrageCoeff) {
    console.warn(`Very small kilometrage coefficient detected: ${kilometrageCoeff}. Adjusting for display.`);
    kilometrageCoeff = kilometrageCoeff < 0 ? -MIN_COEFFICIENT_VALUE : MIN_COEFFICIENT_VALUE;
  }
  
  if (hasSmallTonnageCoeff) {
    console.warn(`Very small tonnage coefficient detected: ${tonnageCoeff}. Adjusting for display.`);
    tonnageCoeff = tonnageCoeff < 0 ? -MIN_COEFFICIENT_VALUE : MIN_COEFFICIENT_VALUE;
  }
  
  // Get exact R² value from data and ensure it's a valid number between 0 and 1
  const rSquared = typeof regressionData.rSquared === 'number' ? 
    Math.max(0, Math.min(1, regressionData.rSquared)) : 0;
    
  // Validate coefficients to ensure they're finite numbers
  const hasValidCoefficients = isFinite(kilometrageCoeff) && 
                              isFinite(tonnageCoeff) && 
                              isFinite(intercept);
  
  // Determine if the regression has good quality (R² > 0.7)
  const isGoodRegression = rSquared > 0.7;
  const isModerateRegression = rSquared > 0.5 && rSquared <= 0.7;

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <LineChart className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
        <span className="font-medium text-slate-800 dark:text-slate-200 font-mono text-sm">
          Modèle de régression linéaire multiple
        </span>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300"
      >          <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
          Formule de régression
          {(hasSmallKilometrageCoeff || hasSmallTonnageCoeff) && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" /> Coefficients ajustés
            </span>
          )}
        </h3>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
          <motion.p 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-slate-800 dark:text-slate-200 text-sm md:text-base"
          >
            Y = {kilometrageCoeff >= 0 ? '' : '-'}{formatCoefficient(Math.abs(kilometrageCoeff))} · X₁ {tonnageCoeff >= 0 ? '+ ' : '- '}{formatCoefficient(Math.abs(tonnageCoeff))} · X₂ {intercept >= 0 ? '+ ' : '- '}{formatCoefficient(Math.abs(intercept))}
          </motion.p>
          <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
            <p>où :</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Y est la consommation (en litres)</li>
              <li>X₁ est le kilométrage (en km)</li>
              <li>X₂ est le tonnage transporté (en tonnes)</li>
            </ul>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <h3 className="text-md font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
            Coefficients
          </h3>
          <div className="grid grid-cols-3 gap-4">            <motion.div 
              whileHover={{ y: -5 }}
              className={`p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border ${hasSmallKilometrageCoeff ? 'border-amber-300 dark:border-amber-800' : 'border-slate-200 dark:border-slate-700'}`}
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex justify-between items-center">
                <span>Kilométrage</span>
                {hasSmallKilometrageCoeff && (
                  <span className="text-xs px-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-sm">Ajusté</span>
                )}
              </div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatCoefficient(kilometrageCoeff)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Coefficient X₁</span>
                {hasSmallKilometrageCoeff && (
                  <span className="text-xxs text-amber-600 dark:text-amber-400">Valeur d'origine: {regressionData.coefficients?.kilometrage.toFixed(6)}</span>
                )}
              </div>
            </motion.div>            <motion.div 
              whileHover={{ y: -5 }}
              className={`p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border ${hasSmallTonnageCoeff ? 'border-amber-300 dark:border-amber-800' : 'border-slate-200 dark:border-slate-700'}`}
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex justify-between items-center">
                <span>Tonnage</span>
                {hasSmallTonnageCoeff && (
                  <span className="text-xs px-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-sm">Ajusté</span>
                )}
              </div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono">
                {tonnageCoeff >= 0 ? '+' : ''}{formatCoefficient(tonnageCoeff)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Coefficient X₂</span>
                {hasSmallTonnageCoeff && (
                  <span className="text-xxs text-amber-600 dark:text-amber-400">Valeur d'origine: {regressionData.coefficients?.tonnage.toFixed(6)}</span>
                )}
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Constante</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono">
                {intercept >= 0 ? '+' : ''}{formatCoefficient(intercept)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Intercept</div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <h3 className="text-md font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center">
            <Target className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
            Qualité du modèle
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">R²</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono flex items-center">
                {formatCoefficient(regressionData.rSquared || 0)}
                {isGoodRegression && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                <span className={`h-2 w-2 rounded-full mr-1 ${isGoodRegression ? 'bg-green-500' : isModerateRegression ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                {isGoodRegression ? 'Excellent' : isModerateRegression ? 'Acceptable' : 'Faible'}
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">R² ajusté</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatCoefficient(regressionData.adjustedRSquared || 0)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Corrigé pour le nb. de variables</div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Erreur standard</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatCoefficient(regressionData.standardError || 0)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Précision des prédictions</div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">F-statistique</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatCoefficient(regressionData.fStatistic || 0)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Significativité globale</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

RegressionMetrics.displayName = 'RegressionMetrics';

export default RegressionMetrics;
