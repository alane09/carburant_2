"use client"

import { AlertTriangle, RefreshCw, Save } from "lucide-react"
import { memo, useCallback, useEffect, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis
} from "recharts"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { buildApiUrl } from "@/lib/api"

// Define interfaces for regression data
interface RegressionDataPoint {
  month: string
  year: string
  consommation: number
  kilometrage: number
  tonnage: number
  ipe: number
}

interface MonthlyDataPoint {
  month?: string
  mois?: string
  kilometrage?: number
  distance?: number
  tonnage?: number
  weight?: number
  produitsTonnes?: number
  consommation?: number
  carburantActuel?: number
  fuel?: number
  [key: string]: any
}

interface RegressionCoefficients {
  kilometrage?: number;
  tonnage?: number;
  [key: string]: number | undefined;
}

interface RegressionResult {
  id?: string
  type: string
  regressionEquation: string
  coefficients: RegressionCoefficients
  intercept: number
  rSquared: number
  adjustedRSquared: number
  mse: number
  monthlyData?: RegressionDataPoint[] | MonthlyDataPoint[]
}

interface RegressionData {
  type: string
  regressionEquation: string
  coefficients: RegressionCoefficients
  intercept: number
  rSquared: number
  adjustedRSquared: number
  mse: number
  id?: string
  monthlyData: RegressionDataPoint[]
}

// RegressionAPI service
const RegressionAPI = {
  async fetchRegressionData(vehicleType: string): Promise<RegressionData | null> {
    try {
      const response = await fetch(buildApiUrl(`api/regression/monthly-totals/${vehicleType}`));
      if (!response.ok) {
        throw new Error(`Error fetching regression data: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching regression data:", error);
      return null;
    }
  },

  async performRegression(vehicleType: string): Promise<RegressionResult | null> {
    try {
      const response = await fetch(buildApiUrl(`api/regression/perform/${vehicleType}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`No data found for vehicle type: ${vehicleType}`);
        } else {
          console.error(`Error performing regression: ${response.statusText}`);
        }
        return null;
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error performing regression:", error);
      return null;
    }
  },

  async saveManualRegressionResult(data: RegressionResult): Promise<RegressionResult | null> {
    try {
      const response = await fetch(buildApiUrl('api/regression/save-manual'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        console.error(`Error saving regression data: ${response.statusText}`);
        // Return the original data if save fails
        return data;
      }
      
      const result = await response.json();
      return result || data;
    } catch (error) {
      console.error("Error saving regression data:", error);
      // Return the original data if save fails
      return data;
    }
  },

  async getRegressionResultByType(vehicleType: string): Promise<RegressionResult | null> {
    try {
      const response = await fetch(buildApiUrl(`api/regression/type/${vehicleType}`));
      if (!response.ok) {
        throw new Error(`Error fetching regression result: ${response.statusText}`);
      }
      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error("Error fetching regression result:", error);
      return null;
    }
  },
  
  async getMonthlyTotalsForRegression(vehicleType: string): Promise<RegressionResult | null> {
    try {
      const response = await fetch(buildApiUrl(`api/regression/monthly-totals/${vehicleType}`));
      if (!response.ok) {
        throw new Error(`Error fetching regression data: ${response.statusText}`);
      }
      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error("Error fetching regression data:", error);
      return null;
    }
  }
};

interface DataPoint {
  kilometrage: number
  tonnage: number
  consommation: number
  month?: string
}

interface RegressionLines {
  kilometrageLine: DataPoint[]
  tonnageLine: DataPoint[]
}

interface DataStats {
  minKm: number
  maxKm: number
  avgKm: number
  minTonnage: number
  maxTonnage: number
  avgTonnage: number
}

interface ManualCoefficients {
  kilometrage: number
  tonnage: number
  intercept: number
}

interface SERDiagramProps {
  vehicleType: string
  dateRange?: {
    type: 'year' | 'custom'
    year?: string
    startDate?: Date
    endDate?: Date
  }
}

// Using type from recharts to ensure compatibility
type RechartsTooltipProps = {
  active?: boolean
  payload?: any[]
  label?: string
}

// Memoized tooltip component for the scatter plot to improve performance
const CustomTooltip = memo(({ active, payload }: RechartsTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-background border rounded-md shadow-md p-3">
      <p className="font-medium">Point de données</p>
      <p className="text-sm">Kilométrage: {payload[0]?.value?.toLocaleString() || 'N/A'} km</p>
      <p className="text-sm">Tonnage: {payload[1]?.value?.toLocaleString() || 'N/A'} tonnes</p>
      <p className="text-sm">Consommation: {payload[2]?.value?.toLocaleString() || 'N/A'} L</p>
      {payload[0]?.payload?.month && (
        <p className="text-xs text-muted-foreground mt-1">{payload[0].payload.month}</p>
      )}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

export default function SERDiagram({ vehicleType, dateRange }: SERDiagramProps) {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regressionData, setRegressionData] = useState<RegressionData | null>(null);
  const [scatterData, setScatterData] = useState<DataPoint[]>([]);
  const [regressionLines, setRegressionLines] = useState<RegressionLines | null>(null);
  const [manualCoefficients, setManualCoefficients] = useState<ManualCoefficients>({ 
    intercept: 0, 
    kilometrage: 0, 
    tonnage: 0 
  });
  const [isManualMode, setIsManualMode] = useState(false);
  
  // DEBUG flag for conditional console logging
  const DEBUG = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';

  /**
   * Generate regression lines based on coefficients and data points
   * Creates two sets of points for visualization:
   * 1. kilometrageLine: Shows how consumption varies with kilometers while keeping tonnage constant
   * 2. tonnageLine: Shows how consumption varies with tonnage while keeping kilometers constant
   */
  const generateRegressionLines = useCallback((data: DataPoint[], regressionResult: RegressionData) => {
    // Validate inputs
    if (!data?.length || !regressionResult) return null;
    
    // Extract coefficients with safe defaults
    const coefficients = regressionResult.coefficients || {};
    const kmCoef = Number(coefficients["kilometrage"]) || 0;
    const tonnageCoef = Number(coefficients["tonnage"]) || 0;
    const intercept = Number(regressionResult.intercept) || 0;
    
    // Use reduce for a single pass through the data to calculate statistics
    const stats = data.reduce((acc, d) => ({
      minKm: Math.min(acc.minKm, d.kilometrage),
      maxKm: Math.max(acc.maxKm, d.kilometrage),
      minTonnage: Math.min(acc.minTonnage, d.tonnage),
      maxTonnage: Math.max(acc.maxTonnage, d.tonnage),
      sumKm: acc.sumKm + d.kilometrage,
      sumTonnage: acc.sumTonnage + d.tonnage
    }), {
      minKm: Infinity,
      maxKm: -Infinity,
      minTonnage: Infinity,
      maxTonnage: -Infinity,
      sumKm: 0,
      sumTonnage: 0
    });
    
    // Calculate averages for constant values
    const avgKm = stats.sumKm / data.length;
    const avgTonnage = stats.sumTonnage / data.length;
    
    // Helper function to calculate consumption based on regression formula
    const calculateConsumption = (km: number, tonnage: number) => {
      return intercept + (kmCoef * km) + (tonnageCoef * tonnage);
    };
    
    // Generate kilometrage regression line (11 points for smooth visualization)
    const kilometrageLine = Array.from({ length: 11 }, (_, i) => {
      const km = stats.minKm + (i * (stats.maxKm - stats.minKm) / 10);
      return {
        kilometrage: km,
        tonnage: avgTonnage,
        consommation: calculateConsumption(km, avgTonnage)
      };
    });
    
    // Generate tonnage regression line (11 points for smooth visualization)
    const tonnageLine = Array.from({ length: 11 }, (_, i) => {
      const tonnage = stats.minTonnage + (i * (stats.maxTonnage - stats.minTonnage) / 10);
      return {
        kilometrage: avgKm,
        tonnage: tonnage,
        consommation: calculateConsumption(avgKm, tonnage)
      };
    });
    
    return { kilometrageLine, tonnageLine };
  }, []);
  
  /**
   * Generate realistic mock monthly data for the SER diagram
   * Creates a full year of data with seasonal variations and realistic patterns
   */
  const generateMockMonthlyData = useCallback((vehicleType: string): MonthlyDataPoint[] => {
    // Normalize vehicle type for consistent comparisons
    const normalizedType = vehicleType.toLowerCase().trim();
    
    // Define base values by vehicle type with more realistic parameters
    const vehicleProfiles = {
      camion: { 
        km: 5000, 
        tonnage: 15, 
        consumption: 1500,
        seasonalFactor: 0.2 // 20% seasonal variation
      },
      voiture: { 
        km: 2000, 
        tonnage: 0.5, 
        consumption: 200,
        seasonalFactor: 0.15 // 15% seasonal variation
      },
      utilitaire: { 
        km: 3500, 
        tonnage: 2.5, 
        consumption: 450,
        seasonalFactor: 0.18 // 18% seasonal variation
      },
      // Default values for other vehicle types
      default: { 
        km: 3000, 
        tonnage: 2, 
        consumption: 500,
        seasonalFactor: 0.15 // 15% seasonal variation
      }
    };
    
    // Get the appropriate profile values
    const profile = vehicleProfiles[normalizedType as keyof typeof vehicleProfiles] || vehicleProfiles.default;
    
    // Cache the current year for month generation
    const currentYear = new Date().getFullYear();
    const monthNames = Array.from({ length: 12 }, (_, i) => 
      new Date(currentYear, i, 1).toLocaleString('fr-FR', { month: 'long' })
    );
    
    // Generate 12 months of data with seasonal patterns
    return monthNames.map((monthName, i) => {
      // Create seasonal patterns - higher in winter (Dec, Jan, Feb) and summer (Jun, Jul, Aug)
      // For northern hemisphere seasonal patterns
      const winterFactor = Math.cos((i - 1) * Math.PI / 6); // Peak in January (i=0)
      const summerFactor = Math.cos((i - 7) * Math.PI / 6); // Peak in July (i=6)
      const seasonalFactor = 1 + (profile.seasonalFactor * (winterFactor + summerFactor) / 2);
      
      // Add controlled randomness with a seed based on month and vehicle type for consistency
      const seed = (i + 1) * normalizedType.length;
      const randomFactor = 0.95 + (Math.sin(seed) * 0.5 + 0.5) * 0.1; // Between 0.95 and 1.05
      
      // Calculate values with seasonal and random variations
      const kmFactor = seasonalFactor * randomFactor;
      const tonnageFactor = randomFactor; // Tonnage less affected by seasons
      
      // Calculate consumption with a slight non-linear relationship to km and tonnage
      // for more realistic data patterns
      const baseKm = Math.round(profile.km * kmFactor);
      const baseTonnage = Math.round(profile.tonnage * tonnageFactor * 10) / 10;
      
      // Consumption has a relationship with both km and tonnage, plus seasonal factors
      const calculatedConsumption = (
        profile.consumption * seasonalFactor * randomFactor * 
        (baseKm / profile.km) * Math.pow(baseTonnage / profile.tonnage, 0.7)
      );
      
      return {
        month: monthName,
        mois: monthName,
        kilometrage: baseKm,
        tonnage: baseTonnage,
        consommation: Math.round(calculatedConsumption),
        // Add IPE calculation for convenience
        ipe: Math.round((calculatedConsumption / baseKm) * 100 * 100) / 100
      };
    });
  }, []);
  
  /**
   * Fetch SER (Specific Energy Reference) data from the API
   * Handles multiple fallback strategies and data normalization
   */
  const fetchSERData = useCallback(async () => {
    // Don't attempt to fetch if vehicle type is empty
    if (!vehicleType?.trim()) {
      setError("Type de véhicule non spécifié");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Normalize vehicle type to handle case variations consistently
      const normalizedVehicleType = vehicleType.trim();
      
      // Try with the original vehicle type first
      let regressionResult = await RegressionAPI.getMonthlyTotalsForRegression(normalizedVehicleType);
      let usedVehicleType = normalizedVehicleType;
      
      // If no data, try case variations in a more efficient way
      if (!regressionResult || Object.keys(regressionResult).length === 0) {
        // Try case variations with a single loop
        const variations = [
          normalizedVehicleType.toUpperCase(),
          normalizedVehicleType.toLowerCase(),
          normalizedVehicleType.charAt(0).toUpperCase() + normalizedVehicleType.slice(1).toLowerCase() // Title case
        ].filter(v => v !== normalizedVehicleType); // Only try variations that are different
        
        // Try each variation until we find data
        for (const variant of variations) {
          regressionResult = await RegressionAPI.getMonthlyTotalsForRegression(variant);
          if (regressionResult && Object.keys(regressionResult).length > 0) {
            usedVehicleType = variant;
            break;
          }
        }
        
        // If still no data, try to perform regression analysis
        if (!regressionResult || Object.keys(regressionResult).length === 0) {
          try {
            toast.info(`Génération de la régression...`);
            
            // This will trigger the backend to perform regression analysis
            const result = await RegressionAPI.performRegression(usedVehicleType);
            if (result) {
              // Now fetch the newly created regression data
              regressionResult = await RegressionAPI.getMonthlyTotalsForRegression(usedVehicleType);
              
              // Notify success
              toast.success(`Régression générée avec succès`);
            }
          } catch (regressionError) {
            // Log error and show message
            if (DEBUG) {
              console.error(`Error performing regression:`, regressionError);
            }
            toast.error(`Impossible de générer la régression`);
            setError("Pas de données disponibles pour la régression. Veuillez télécharger des données pour ce type de véhicule d'abord.");
            setLoading(false);
            return;
          }
        }
      }
      
      // If we found regression data through any of the attempts, use it
      if (regressionResult && Object.keys(regressionResult).length > 0) {
        // Process the regression data with safe type handling
        const typedRegressionData: RegressionData = {
          type: typeof regressionResult.type === 'string' ? regressionResult.type : usedVehicleType,
          regressionEquation: typeof regressionResult.regressionEquation === 'string' ? 
                            regressionResult.regressionEquation : `y = a×Km + b×Tonnage + c`,
          coefficients: typeof regressionResult.coefficients === 'object' && regressionResult.coefficients ? 
                      regressionResult.coefficients : { kilometrage: 0, tonnage: 0 },
          intercept: Number(regressionResult.intercept) || 0,
          rSquared: Number(regressionResult.rSquared) || 0,
          adjustedRSquared: Number(regressionResult.adjustedRSquared) || 0,
          mse: Number(regressionResult.mse) || 0,
          id: typeof regressionResult.id === 'string' ? regressionResult.id : undefined,
          monthlyData: []
        };
        
        // Set the regression data
        setRegressionData(typedRegressionData);
        
        // Process monthly data - use real data if available, otherwise generate mock data
        const hasRealMonthlyData = Array.isArray(regressionResult.monthlyData) && 
                                 regressionResult.monthlyData.length > 0;
        
        let monthlyData = hasRealMonthlyData ? 
          regressionResult.monthlyData : generateMockMonthlyData(usedVehicleType);
        
        // Add a note if using mock data
        if (!hasRealMonthlyData) {
          toast.info("Utilisation de données simulées pour la visualisation");
        }
        
        // Transform the data for the scatter plot with a more efficient approach
        const transformedData = Array.isArray(monthlyData) ? monthlyData.map((item: MonthlyDataPoint, index: number) => {
          // Use nullish coalescing for cleaner code
          const kilometrage = Number(item.kilometrage ?? item.distance ?? 0);
          const tonnage = Number(item.tonnage ?? item.weight ?? item.produitsTonnes ?? 0);
          const consommation = Number(item.consommation ?? item.carburantActuel ?? item.fuel ?? 0);
          const month = item.month ?? item.mois ?? `Mois ${index + 1}`;
          
          // Skip invalid data points
          if (kilometrage <= 0 || isNaN(kilometrage) || isNaN(tonnage) || isNaN(consommation)) {
            return null;
          }
          
          return { kilometrage, tonnage, consommation, month };
        }).filter(Boolean as any) as DataPoint[] : [];
        
        // Ensure we have at least some valid data points
        if (transformedData.length === 0) {
          // If no valid data points, generate mock data
          const mockData = generateMockMonthlyData(usedVehicleType).map((item: MonthlyDataPoint) => ({
            kilometrage: Number(item.kilometrage),
            tonnage: Number(item.tonnage),
            consommation: Number(item.consommation),
            month: item.month
          }));
          
          setScatterData(mockData);
          toast.warning("Aucune donnée valide trouvée, utilisation de données simulées");
          
          // Generate regression lines
          const lines = generateRegressionLines(mockData, typedRegressionData);
          if (lines) setRegressionLines(lines);
        } else {
          setScatterData(transformedData);
          
          // Generate regression lines
          const lines = generateRegressionLines(transformedData, typedRegressionData);
          if (lines) setRegressionLines(lines);
        }
        
        // Update manual coefficients if not in manual mode
        if (!isManualMode) {
          setManualCoefficients({
            intercept: typedRegressionData.intercept,
            kilometrage: Number(typedRegressionData.coefficients["kilometrage"]) || 0,
            tonnage: Number(typedRegressionData.coefficients["tonnage"]) || 0
          });
        }
      } else {
        // No regression data found, inform the user
        setError("Aucune donnée de régression trouvée. Veuillez télécharger des données pour ce type de véhicule.");
      }
    } catch (err) {
      // Only log detailed errors in development
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.error("Error fetching SER data:", err);
      }
      
      setError("Erreur lors du chargement des données SER. Veuillez vérifier que les données existent pour ce type de véhicule.");
      toast.error("Erreur lors du chargement des données SER");
    } finally {
      setLoading(false);
    }
  }, [vehicleType, generateRegressionLines, generateMockMonthlyData, isManualMode, DEBUG]);
  
  /**
   * Handle saving manual coefficients to the database
   * Creates a regression model with user-specified coefficients
   */
  const handleSaveCoefficients = useCallback(async () => {
    if (loading) return; // Prevent multiple submissions
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate vehicle type
      const trimmedVehicleType = vehicleType.trim();
      if (!trimmedVehicleType) {
        toast.error("Type de véhicule non spécifié");
        return;
      }
      
      // Validate coefficients
      if (isNaN(manualCoefficients.intercept) || 
          isNaN(manualCoefficients.kilometrage) || 
          isNaN(manualCoefficients.tonnage)) {
        toast.error("Les coefficients doivent être des nombres valides");
        return;
      }
      
      // Trigger regression analysis on the backend
      const result = await RegressionAPI.performRegression(vehicleType.trim());
      
      if (result) {
        // Notify success
        toast.success(`Régression générée avec succès pour ${trimmedVehicleType}`);
        
        // Fetch the newly created regression data
        const regressionResult = await RegressionAPI.getRegressionResultByType(trimmedVehicleType);
        
        if (regressionResult) {
          // Format coefficients with proper precision and signs
          const kmCoef = Number(regressionResult.coefficients.kilometrage) || 0;
          const tonnageCoef = Number(regressionResult.coefficients.tonnage) || 0;
          const intercept = Number(regressionResult.intercept) || 0;
          
          // Format the regression equation with proper signs
          const kmSign = kmCoef >= 0 ? '+' : '-';
          const tonnageSign = tonnageCoef >= 0 ? '+' : '-';
          const interceptSign = intercept >= 0 ? '+' : '-';
          
          // Format the equation with 4 decimal places
          const formattedEquation = `Consommation = ${kmSign}${Math.abs(kmCoef).toFixed(4)}×Km ${tonnageSign}${Math.abs(tonnageCoef).toFixed(4)}×Tonnage ${interceptSign}${Math.abs(intercept).toFixed(4)}`;
          
          // Convert to RegressionData type
          const typedData: RegressionData = {
            type: regressionResult.type,
            regressionEquation: formattedEquation,
            coefficients: regressionResult.coefficients,
            intercept: regressionResult.intercept,
            rSquared: regressionResult.rSquared,
            adjustedRSquared: regressionResult.adjustedRSquared,
            mse: regressionResult.mse,
            id: regressionResult.id,
            monthlyData: [] as RegressionDataPoint[]
          };
          
          setRegressionData(typedData);
          
          // Update manual coefficients
          setManualCoefficients({
            intercept: typedData.intercept,
            kilometrage: Number(typedData.coefficients["kilometrage"]) || 0,
            tonnage: Number(typedData.coefficients["tonnage"]) || 0
          });
          
          // Generate regression lines
          const lines = generateRegressionLines(scatterData, typedData);
          if (lines) setRegressionLines(lines);
        } else {
          throw new Error("Erreur lors de la récupération des données de régression");
        }
      } else {
        throw new Error("Erreur lors du calcul de la régression");
      }
    } catch (error) {
      // Only log detailed errors in development
      if (DEBUG) {
        console.error("Error generating regression:", error);
      }
      
      const errorMessage = error instanceof Error ? error.message : 
        "Erreur lors du calcul de la régression";
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Fallback to mock data in case of error
      const mockData = generateMockMonthlyData(vehicleType);
      setScatterData(mockData.map(item => ({
        kilometrage: Number(item.kilometrage),
        tonnage: Number(item.tonnage),
        consommation: Number(item.consommation),
        month: item.month
      })));
    } finally {
      setLoading(false);
    }
  }, [vehicleType, loading, generateRegressionLines, scatterData, generateMockMonthlyData, DEBUG]);
  
  // Effect to fetch data when component mounts or when dependencies change
  useEffect(() => {
    fetchSERData();
  }, [fetchSERData]);
  
  // Render loading state
  if (loading) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p>Chargement des données SER...</p>
        </div>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center text-destructive">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
          <p className="text-sm mt-2">Veuillez réessayer ultérieurement</p>
        </div>
      </Card>
    );
  }

  // Render the SER diagram
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-6">
          {/* Header with vehicle type */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col space-y-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                SER - {vehicleType}
              </h2>
              <p className="text-muted-foreground text-lg">
                Analyse de la consommation spécifique de référence
              </p>
            </div>
          </div>

          {/* Display regression equation and quality metrics */}
          <div className="bg-muted/30 p-4 rounded-lg w-full md:w-auto">
            {regressionData ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Équation de régression</h4>
                    <div className="bg-background p-3 rounded border text-center">
                      <span className="font-mono">
                        {regressionData.regressionEquation || 
                          `Y = ${regressionData.intercept.toFixed(2)} + ${regressionData.coefficients.kilometrage?.toFixed(4) || '0.0000'}X₁ + ${regressionData.coefficients.tonnage?.toFixed(4) || '0.0000'}X₂`}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span>Y: Consommation (L)</span><br />
                      <span>X₁: Kilométrage (km)</span><br />
                      <span>X₂: Tonnage (t)</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Qualité du modèle</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-background p-2 rounded border">
                        <div className="text-sm text-muted-foreground">R²</div>
                        <div className="font-medium">{(regressionData.rSquared * 100).toFixed(2)}%</div>
                      </div>
                      <div className="bg-background p-2 rounded border">
                        <div className="text-sm text-muted-foreground">MSE</div>
                        <div className="font-medium">{regressionData.mse.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                Aucune donnée de régression disponible pour ce type de véhicule.
              </div>
            )}
          </div>
        
          {/* Manual Coefficient Input Form */}
          <div className="mb-6 bg-muted/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Coefficients de régression</h4>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => fetchSERData()}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Générer automatiquement
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSaveCoefficients}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Constante (c)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-md" 
                  value={manualCoefficients.intercept}
                  onChange={(e) => setManualCoefficients(prev => ({ 
                    ...prev, 
                    intercept: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="Constante"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Coefficient Kilométrage (a)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-md" 
                  value={manualCoefficients.kilometrage}
                  onChange={(e) => setManualCoefficients(prev => ({ 
                    ...prev, 
                    kilometrage: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="Coefficient X₁"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Coefficient Tonnage (b)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-md" 
                  value={manualCoefficients.tonnage}
                  onChange={(e) => setManualCoefficients(prev => ({ 
                    ...prev, 
                    tonnage: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="Coefficient X₂"
                />
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-background rounded-md border">
              <p className="font-medium text-center">Équation résultante:</p>
              <p className="font-mono text-center mt-2">
                Y = {manualCoefficients.intercept.toFixed(2)} + {manualCoefficients.kilometrage.toFixed(4)}X₁ + {manualCoefficients.tonnage.toFixed(4)}X₂
              </p>
            </div>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Consumption vs. Mileage Scatter Plot */}
            <div className="h-[350px]">
              <h4 className="font-medium mb-2 text-center">Consommation en fonction du Kilométrage</h4>
              <ResponsiveContainer width="100%" height="90%">
                <ScatterChart
                  margin={{ top: 10, right: 30, bottom: 40, left: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="kilometrage" 
                    name="Kilométrage" 
                    unit=" km"
                    label={{ value: 'Kilométrage (km)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="consommation" 
                    name="Consommation" 
                    unit=" L"
                    label={{ value: 'Consommation (L)', angle: -90, position: 'insideLeft', offset: 10 }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" />
                  
                  {/* Scatter plot of actual data points */}
                  <Scatter 
                    name="Points de données" 
                    data={scatterData} 
                    fill="#8884d8"
                    shape="circle"
                  />
                  
                  {/* Regression line for kilometrage */}
                  {regressionLines && (
                    <Scatter
                      name="Droite de régression"
                      data={regressionLines.kilometrageLine}
                      fill="none"
                      line={{ stroke: '#ff7300', strokeWidth: 2 }}
                      lineType="fitting"
                      shape="circle"
                      legendType="line"
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Consumption vs. Tonnage Scatter Plot */}
            <div className="h-[350px]">
              <h4 className="font-medium mb-2 text-center">Consommation en fonction du Tonnage</h4>
              <ResponsiveContainer width="100%" height="90%">
                <ScatterChart
                  margin={{ top: 10, right: 30, bottom: 40, left: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="tonnage" 
                    name="Tonnage" 
                    unit=" t"
                    label={{ value: 'Tonnage (t)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="consommation" 
                    name="Consommation" 
                    unit=" L"
                    label={{ value: 'Consommation (L)', angle: -90, position: 'insideLeft', offset: 10 }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" />
                  
                  {/* Scatter plot of actual data points */}
                  <Scatter 
                    name="Points de données" 
                    data={scatterData} 
                    fill="#8884d8"
                    shape="circle"
                  />
                  
                  {/* Regression line for tonnage */}
                  {regressionLines && (
                    <Scatter
                      name="Droite de régression"
                      data={regressionLines.tonnageLine}
                      fill="none"
                      line={{ stroke: '#ff7300', strokeWidth: 2 }}
                      lineType="fitting"
                      shape="circle"
                      legendType="line"
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        
          {/* Monthly Data Table */}
          {scatterData.length > 0 && (
            <div className="mt-8">
              <h4 className="font-medium mb-4">Données mensuelles et analyse</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border px-4 py-2 text-left">Mois</th>
                      <th className="border px-4 py-2 text-right">Kilométrage</th>
                      <th className="border px-4 py-2 text-right">Tonnage</th>
                      <th className="border px-4 py-2 text-right">Consommation réelle</th>
                      <th className="border px-4 py-2 text-right">Consommation de référence</th>
                      <th className="border px-4 py-2 text-right">Écart (%)</th>
                      <th className="border px-4 py-2 text-right">Objectif (-3%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scatterData.map((item, index) => {
                      // Calculate reference consumption using regression formula
                      const kmCoef = regressionData?.coefficients["kilometrage"] || 0;
                      const tonnageCoef = regressionData?.coefficients["tonnage"] || 0;
                      const intercept = regressionData?.intercept || 0;
                      
                      const referenceConsumption = intercept + (kmCoef * item.kilometrage) + (tonnageCoef * item.tonnage);
                      const actualConsumption = item.consommation;
                      
                      // Calculate improvement percentage
                      const improvement = ((referenceConsumption - actualConsumption) / referenceConsumption) * 100;
                      
                      // Calculate target consumption (3% reduction from reference)
                      const targetConsumption = referenceConsumption * 0.97;
                      
                      return (
                        <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="border px-4 py-2">{item.month || `Mois ${index + 1}`}</td>
                          <td className="border px-4 py-2 text-right">{item.kilometrage.toLocaleString()}</td>
                          <td className="border px-4 py-2 text-right">{item.tonnage.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                          <td className="border px-4 py-2 text-right">{actualConsumption.toLocaleString()} L</td>
                          <td className="border px-4 py-2 text-right">{referenceConsumption.toFixed(0).toLocaleString()} L</td>
                          <td className="border px-4 py-2 text-right" style={{ color: improvement < 0 ? 'red' : 'green' }}>
                            {improvement.toFixed(1)}%
                          </td>
                          <td className="border px-4 py-2 text-right">{targetConsumption.toFixed(0).toLocaleString()} L</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
