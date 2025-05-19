"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegressionAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
    Edit,
    LineChart,
    Loader2,
    Save,
    Settings
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { SERCoefficientInput } from '../inputs/ser-coefficient-input';
import { SERControls } from '../inputs/ser-controls';
import { MonthlyDataTable } from '../visualizations/monthly-data-table';
import { RegressionAnalysisCharts } from '../visualizations/regression-analysis-charts';
import { SEREquation } from './ser-equation';
import { RegressionMetrics } from './ser-metrics';

interface SERClientProps {
  vehicleType: string;
  regressionData: any;
  monthlyData: any[];
}

export function SERClient({ vehicleType, regressionData: initialRegressionData, monthlyData }: SERClientProps) {
  // State for regression data to allow updates
  const [regressionData, setRegressionData] = useState(initialRegressionData);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedCoefficients, setEditedCoefficients] = useState({
    intercept: regressionData?.intercept || 0,
    kilometrage: regressionData?.coefficients?.kilometrage || 0,
    tonnage: regressionData?.coefficients?.tonnage || 0
  });
  
  // State for processed monthly data
  const [processedMonthlyData, setProcessedMonthlyData] = useState<any[]>([]);
  
  // Function to fetch regression coefficients from the backend API
  const fetchRegressionCoefficients = useCallback(async () => {
    try {
      // Use the RegressionAPI to get regression results
      const result = await RegressionAPI.getRegressionResultByType(vehicleType);
      return result;
    } catch (error) {
      console.error('Error fetching regression coefficients:', error);
      return null;
    }
  }, [vehicleType]);
  
  // Process monthly data function with calculations based on regression coefficients
  const processMonthlyData = useCallback((monthlyData: any[], coefficients: any) => {
    if (!monthlyData || !coefficients) return [];
    
    // Ensure coefficients are valid numbers to prevent NaN results
    const safeCoefficients = {
      kilometrage: typeof coefficients.kilometrage === 'number' ? coefficients.kilometrage : 0,
      tonnage: typeof coefficients.tonnage === 'number' ? coefficients.tonnage : 0,
      intercept: typeof coefficients.intercept === 'number' ? coefficients.intercept : 0
    };
    
    // Target improvement percentage (5% by default)
    const targetImprovementPercentage = 0.05;
    
    return monthlyData.map(item => {
      // Extract values ensuring they are valid numbers
      const safeKilometrage = typeof item.kilometrage === 'number' ? item.kilometrage : parseFloat(item.kilometrage || '0');
      const safeTonnage = typeof item.tonnage === 'number' ? item.tonnage : parseFloat(item.tonnage || '0');
      const safeConsommation = typeof item.consommation === 'number' ? item.consommation : parseFloat(item.consommation || '0');
      
      // Calculate reference consumption using regression formula: Y = a*X₁ + b*X₂ + c
      const referenceConsumption = (
        safeCoefficients.kilometrage * safeKilometrage + 
        safeCoefficients.tonnage * safeTonnage + 
        safeCoefficients.intercept
      );
      
      // Calculate improvement and target values
      const ecart = safeConsommation - referenceConsumption;
      const ecartPercentage = referenceConsumption !== 0 ? (ecart / referenceConsumption) * 100 : 0;
      const improvementPercentage = safeConsommation !== 0 ? (ecart / safeConsommation) * 100 : 0;
      const targetConsumption = safeConsommation * (1 - targetImprovementPercentage);
      
      // Return processed item with all calculated values
      return {
        ...item,
        consommationReference: Number(Math.max(0, referenceConsumption).toFixed(3)),
        ecart: Number(ecart.toFixed(3)),
        ecartPercentage: Number(ecartPercentage.toFixed(3)),
        improvementPercentage: Number(improvementPercentage.toFixed(3)),
        consommationTarget: Number(targetConsumption.toFixed(3))
      };
    });
  }, []);
  
  // Update edited coefficients and process monthly data when regression data changes
  useEffect(() => {
    if (regressionData) {
      // Update coefficient inputs
      setEditedCoefficients({
        kilometrage: regressionData.coefficients?.kilometrage || 0,
        tonnage: regressionData.coefficients?.tonnage || 0,
        intercept: regressionData.intercept || 0
      });
      
      // Process monthly data with coefficients on initial load
      const processed = processMonthlyData(monthlyData, {
        kilometrage: regressionData.coefficients?.kilometrage || 0,
        tonnage: regressionData.coefficients?.tonnage || 0,
        intercept: regressionData.intercept || 0
      });
      
      setProcessedMonthlyData(processed);
    }
  }, [regressionData, monthlyData, processMonthlyData]);
  
  // Handler for saving coefficients
  const handleSaveCoefficients = async () => {
    setIsSaving(true);
    try {
      // Create an updated regression result with the edited coefficients
      const updatedRegressionData = {
        ...regressionData,
        coefficients: {
          kilometrage: editedCoefficients.kilometrage,
          tonnage: editedCoefficients.tonnage,
          ...(regressionData?.coefficients || {})
        },
        intercept: editedCoefficients.intercept,
        
        // Update the equation string to match the new coefficients
        regressionEquation: `Y = ${editedCoefficients.kilometrage.toFixed(4)} · X₁ + ${editedCoefficients.tonnage.toFixed(4)} · X₂ + ${editedCoefficients.intercept.toFixed(4)}`
      };
      
      // Use the RegressionAPI to save the coefficients to the backend
      const savedResult = await RegressionAPI.saveManualRegressionResult(updatedRegressionData);
      
      if (savedResult) {
        // Update local state with the saved result
        setRegressionData(savedResult);
        console.log("Coefficients saved successfully:", savedResult);
        
        // Process monthly data with new coefficients
        const processed = processMonthlyData(monthlyData, {
          kilometrage: editedCoefficients.kilometrage,
          tonnage: editedCoefficients.tonnage,
          intercept: editedCoefficients.intercept
        });
        setProcessedMonthlyData(processed);
      } else {
        // If save failed, still update local UI state but log the error
        console.warn("Could not save coefficients to backend, updating UI only");
        setRegressionData(updatedRegressionData);
      }
      
      // Close the editing interface
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving coefficients:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handler for generating regression equation
  const generateRegressionEquation = async () => {
    setIsLoading(true);
    try {
      // Use RegressionAPI to perform regression analysis
      console.log(`Performing regression for type: ${vehicleType}`);
      const result = await RegressionAPI.performRegression(vehicleType);
      
      if (result) {
        console.log("Regression successful, updating data:", result);
        // Update regression data with the result from the API
        setRegressionData(result);
        
        // Update coefficient inputs
        setEditedCoefficients({
          kilometrage: result.coefficients.kilometrage || 0,
          tonnage: result.coefficients.tonnage || 0,
          intercept: result.intercept || 0
        });
        
        // Fetch fresh monthly data after regression
        try {
          const freshMonthlyData = await RegressionAPI.getMonthlyTotalsForRegression(vehicleType);
          if (freshMonthlyData) {
            // Transform monthly data for the UI
            const transformedData = Object.entries(freshMonthlyData).map(([month, data]: [string, any]) => ({
              month,
              year: '2024',
              consommation: parseFloat(data.consommation || data.totalConsommationL || 0),
              kilometrage: parseFloat(data.kilometrage || data.totalKilometrage || 0),
              tonnage: parseFloat(data.produitsTonnes || data.totalProduitsTonnes || 0),
              ipe: parseFloat(data.ipeL100km || data.avgIpeL100km || 0)
            }));
            
            // Process with new coefficients
            const processed = processMonthlyData(transformedData, result.coefficients);
            setProcessedMonthlyData(processed);
          }
        } catch (monthlyError) {
          console.error('Error refreshing monthly data after regression:', monthlyError);
        }
      } else {
        console.error('Regression returned no result');
      }
    } catch (error) {
      console.error('Error generating regression equation:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // If no regression data is available, show a placeholder
  if (!regressionData && (!monthlyData || monthlyData.length === 0)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Situation Énergétique de Référence</CardTitle>
          <CardDescription>
            Aucune donnée de régression disponible pour {vehicleType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Veuillez d'abord télécharger des données pour ce type de véhicule.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="w-full overflow-hidden border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
          <div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <LineChart className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
                Situation Énergétique de Référence
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Analyse de régression pour <span className="font-semibold">{vehicleType}</span>
              </CardDescription>
            </motion.div>
          </div>
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <Badge variant="outline" className="text-xs bg-white dark:bg-slate-700 shadow-sm">
              {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
            </Badge>
            {isEditing ? (
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  size="sm"
                  className="text-xs"
                >
                  Annuler
                </Button>
                <Button 
                  variant="default"
                  onClick={handleSaveCoefficients}
                  disabled={isSaving}
                  size="sm"
                  className="text-xs"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Enregistrer...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1 h-3 w-3" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs"
              >
                <Edit className="mr-1 h-3 w-3" />
                Éditer
              </Button>
            )}
          </motion.div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="charts">Graphiques</TabsTrigger>
              <TabsTrigger value="data">Données mensuelles</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column: Regression metrics and visualization */}
                <div className="space-y-6">
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <LineChart className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Modèle de régression linéaire
                      </CardTitle>
                      <CardDescription>
                        Analyse de la consommation énergétique basée sur le kilométrage et le tonnage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <SEREquation 
                        kilometrageCoeff={regressionData?.coefficients?.kilometrage || 0}
                        tonnageCoeff={regressionData?.coefficients?.tonnage || 0}
                        intercept={regressionData?.intercept || 0}
                      />
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">R²</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {regressionData?.rSquared != null ? regressionData.rSquared.toFixed(3).replace('.', ',') : 'N/A'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Coefficient de détermination</div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">R² ajusté</div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {regressionData?.adjustedRSquared != null ? regressionData.adjustedRSquared.toFixed(3).replace('.', ',') : 'N/A'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Ajusté au nombre de variables</div>
                        </div>
                      </div>
                      
                      <RegressionMetrics 
                        regressionData={regressionData} 
                        coefficient={0}
                        monthlyData={monthlyData}
                      />
                    </CardContent>
                  </Card>
                </div>
                
                {/* Right column: Coefficient inputs and controls */}
                <div>
                  <Card>
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <Settings className="h-5 w-5 mr-2 text-slate-600 dark:text-slate-400" />
                        Paramètres du modèle
                      </CardTitle>
                      <CardDescription>
                        Ajustez les coefficients de régression pour optimiser le modèle
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <SERCoefficientInput 
                            coefficients={editedCoefficients}
                            onChange={setEditedCoefficients}
                          />
                          
                          <SERControls
                            isEditing={isEditing}
                            isLoading={isLoading}
                            isSaving={isSaving}
                            onEdit={() => setIsEditing(true)}
                            onCancel={() => setIsEditing(false)}
                            onSave={handleSaveCoefficients}
                            onGenerate={generateRegressionEquation}
                            onCalculateApi={async () => {
                              // Calculate regression coefficients using the backend API
                              const apiCoefficients = await fetchRegressionCoefficients();
                              if (apiCoefficients) {
                                setRegressionData(apiCoefficients);
                                setEditedCoefficients({
                                  kilometrage: apiCoefficients.coefficients.kilometrage,
                                  tonnage: apiCoefficients.coefficients.tonnage,
                                  intercept: apiCoefficients.intercept
                                });
                                
                                // Process monthly data with new coefficients
                                const processed = processMonthlyData(monthlyData, {
                                  kilometrage: apiCoefficients.coefficients.kilometrage,
                                  tonnage: apiCoefficients.coefficients.tonnage,
                                  intercept: apiCoefficients.intercept
                                });
                                setProcessedMonthlyData(processed);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-md font-semibold mb-3">Coefficients actuels</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Kilométrage</div>
                              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                                {regressionData?.coefficients?.kilometrage != null ? 
                                  regressionData.coefficients.kilometrage.toFixed(3).replace('.', ',') : 
                                  '0,000'}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Coefficient X₁</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Tonnage</div>
                              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                                {regressionData?.coefficients?.tonnage != null ? 
                                  (regressionData.coefficients.tonnage >= 0 ? '+' : '') + 
                                  regressionData.coefficients.tonnage.toFixed(3).replace('.', ',') : 
                                  '0,000'}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Coefficient X₂</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Intercept</div>
                              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                                {regressionData?.intercept != null ? 
                                  (regressionData.intercept >= 0 ? '+' : '') + 
                                  regressionData.intercept.toFixed(3).replace('.', ',') : 
                                  '0,000'}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Constante</div>
                            </div>
                          </div>
                          <SERControls
                            isEditing={isEditing}
                            isLoading={isLoading}
                            isSaving={isSaving}
                            onEdit={() => setIsEditing(true)}
                            onCancel={() => setIsEditing(false)}
                            onSave={handleSaveCoefficients}
                            onGenerate={generateRegressionEquation}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="charts" className="pt-4">
              <RegressionAnalysisCharts
                monthlyData={processedMonthlyData.length > 0 ? processedMonthlyData : monthlyData}
                regressionData={regressionData}
                coefficient={0}
              />
            </TabsContent>
            <TabsContent value="data" className="pt-4">
              <MonthlyDataTable 
                data={processedMonthlyData.length > 0 ? processedMonthlyData : monthlyData}
                regressionCoefficients={editedCoefficients}
                className="w-full max-w-full overflow-x-auto"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
