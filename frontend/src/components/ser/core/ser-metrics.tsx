"use client";

import { formatCoefficient } from "@/lib/format-utils";
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
  
  // Extract coefficients for display
  const kilometrageCoeff = regressionData.coefficients?.kilometrage || 0;
  const tonnageCoeff = regressionData.coefficients?.tonnage || 0;
  const intercept = regressionData.intercept || 0;
  
  // Determine if the regression has good quality (R² > 0.7)
  const isGoodRegression = (regressionData.rSquared || 0) > 0.7;
  const isModerateRegression = (regressionData.rSquared || 0) > 0.5 && (regressionData.rSquared || 0) <= 0.7;

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
      >
        <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
          Formule de régression
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
          <div className="grid grid-cols-3 gap-4">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Kilométrage</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatCoefficient(kilometrageCoeff)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Coefficient X₁</div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Tonnage</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono">
                {tonnageCoeff >= 0 ? '+' : ''}{formatCoefficient(tonnageCoeff)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Coefficient X₂</div>
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
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono flex items-center">                {/* Display R² with 4 decimal places and proper formatting */}
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

        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <h3 className="text-md font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center">
            <Target className="h-5 w-5 mr-2 text-orange-500 dark:text-orange-400" />
            Objectif d'amélioration
          </h3>
          <div className="grid gap-4">          <motion.div 
            whileHover={{ y: -5 }}
            className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/50"
          >
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Réduction de consommation cible</div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono flex items-center">
              3.00%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              La consommation cible est calculée comme {(100 - 3).toFixed(0)}% de la consommation actuelle
            </div>
          </motion.div>
                {/* Add this section only if we have actual monthly data to analyze */}
          {monthlyData && monthlyData.length > 0 && (
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Progression vers l'objectif</div>
              
              {/* Calculate actual progress based on improvement percentage */}
              {(() => {
                // Calculate total consumption and total reference consumption
                const totalConsommation = monthlyData.reduce((sum, item) => sum + item.consommation, 0);
                const totalKilometrage = monthlyData.reduce((sum, item) => sum + item.kilometrage, 0);
                const totalTonnage = monthlyData.reduce((sum, item) => sum + item.tonnage, 0);
                
                let improvementPercent = 0;
                let actualImprovementText = "0%";
                
                // Calculate actual improvement percentage if we have regression data
                if (regressionData?.coefficients) {
                  const totalReferenceConsumption = 
                    (regressionData.coefficients.kilometrage * totalKilometrage) +
                    (regressionData.coefficients.tonnage * totalTonnage) +
                    (regressionData.intercept * 1); // Add intercept once
                  
                  // Calculate improvement using standard formula
                  if (totalConsommation > 0) {
                    improvementPercent = ((totalConsommation - totalReferenceConsumption) / totalConsommation) * 100;
                    actualImprovementText = `${Math.abs(improvementPercent).toFixed(1)}%`;
                  }
                }
                
                // Convert improvement to 0-100 scale for progress bar
                // Negative values (meaning consumption is less than reference) are good
                const progressValue = improvementPercent <= 0 
                  ? Math.min(100, Math.abs(improvementPercent) / 3 * 100) // Scale relative to 3% target
                  : 0; // No progress if actual consumption is higher than reference
                  
                return (
                  <>
                    <div className="relative h-3 mt-3 mb-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      {/* Add benchmark indicators */}
                      <div className="absolute top-0 left-[33%] h-full w-[1px] bg-slate-400 dark:bg-slate-500"></div>
                      <div className="absolute top-0 left-[66%] h-full w-[1px] bg-slate-400 dark:bg-slate-500"></div>
                      
                      {/* Progress bar with animated fill */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressValue}%` }} 
                        transition={{ delay: 0.5, duration: 1, type: "spring" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-400 dark:from-orange-600 dark:to-orange-500"
                      ></motion.div>
                      
                      {/* Show current value indicator */}
                      {progressValue > 0 && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="absolute top-0 right-1 h-full flex items-center"
                        >
                          <span className="text-xs font-semibold text-white px-1 rounded">
                            {actualImprovementText}
                          </span>
                        </motion.div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>0%</span>
                      <span>1%</span>
                      <span>2%</span>
                      <span>3%</span>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

RegressionMetrics.displayName = 'RegressionMetrics';

export { RegressionMetrics };

