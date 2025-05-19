"use client"

import { SERClient } from "@/components/ser"
import { Button } from "@/components/ui/button"
import { API } from "@/lib/api"
import { RefreshCw, UploadCloud } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface SERPageClientProps {
  initialVehicleType: string
}

export function SERPageClient({ initialVehicleType }: SERPageClientProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regressionData, setRegressionData] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  const fetchData = async (vehicleType: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // First try to get existing regression result
      let regressionResult = null;
      try {
        regressionResult = await API.Regression.getRegressionResultByType(vehicleType);
        if (regressionResult) {
          console.log(`Successfully fetched existing regression data for ${vehicleType}`);
        }
      } catch (fetchError) {
        console.warn(`No existing regression data for ${vehicleType}, will try to perform regression`);
      }

      // If no existing result, try to perform regression
      if (!regressionResult) {
        try {
          console.log(`Attempting to perform regression for ${vehicleType}`);
          regressionResult = await API.Regression.performRegression(vehicleType);
          if (regressionResult) {
            toast.success(`Analyse de régression effectuée pour ${vehicleType}`);
          }
        } catch (regressionError: any) {
          console.error(`Error performing regression for ${vehicleType}:`, regressionError);
          
          if (regressionError.toString().includes("No data found")) {
            setError(`Aucune donnée disponible pour ${vehicleType}. Veuillez d'abord télécharger des données.`);
          } else {
            setError(`Erreur lors de l'analyse de régression pour ${vehicleType}: ${regressionError.message || 'Erreur inconnue'}`);
          }

          // Provide a default regression result structure for the UI to avoid errors
          regressionResult = {
            type: vehicleType,
            regressionEquation: `Y = 0.0000 * X₁ + C`,
            coefficients: { consommation: 0 },
            intercept: 0,
            rSquared: 0,
            adjustedRSquared: 0,
            mse: 0,
            monthlyData: []
          };
        }
      }

      setRegressionData(regressionResult);

      // Get monthly data for regression analysis
      try {
        console.log(`Fetching monthly data for ${vehicleType}`);
        const monthlyRegressionData = await API.Regression.getMonthlyTotalsForRegression(vehicleType);
        
        if (monthlyRegressionData && typeof monthlyRegressionData === 'object') {
          // Transform the data into an array format expected by the UI
          const transformedData = Object.entries(monthlyRegressionData).map(([month, data]: [string, any]) => ({
            month,
            year: '2024',
            consommation: parseFloat(data.consommation || data.totalConsommationL || 0),
            kilometrage: parseFloat(data.kilometrage || data.totalKilometrage || 0),
            tonnage: parseFloat(data.produitsTonnes || data.totalProduitsTonnes || 0),
            ipe: parseFloat(data.ipeL100km || data.avgIpeL100km || 0)
          }));

          // Sort by month order from January to December
          const monthOrder = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
          ];

          const sortedData = transformedData.sort(
            (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
          );

          setMonthlyData(sortedData);

          if (sortedData.length > 0) {
            toast.success(`Données mensuelles chargées pour ${vehicleType}`);
          } else {
            toast.warning(`Aucune donnée mensuelle disponible pour ${vehicleType}`);
            if (!error) setError(`Aucune donnée mensuelle disponible pour ${vehicleType}`);
          }
        } else {
          setMonthlyData([]);
          if (!error) setError(`Aucune donnée mensuelle disponible pour ${vehicleType}`);
        }
      } catch (monthlyError: any) {
        console.error(`Error fetching monthly data for ${vehicleType}:`, monthlyError);
        setMonthlyData([]);
        if (!error) {
          setError(`Erreur lors du chargement des données mensuelles pour ${vehicleType}`);
        }
      }
    } catch (e: any) {
      console.error("General error in fetchData:", e);
      setError(`Erreur lors du chargement des données SER: ${e.message || 'Erreur inconnue'}`);

      // Set default data structures to prevent UI errors
      setRegressionData({
        type: vehicleType,
        regressionEquation: `Y = 0.0000 * X₁ + C`,
        coefficients: { consommation: 0 },
        intercept: 0,
        rSquared: 0,
        adjustedRSquared: 0,
        mse: 0
      });

      setMonthlyData([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData(initialVehicleType)
  }, [initialVehicleType])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-lg">Chargement de la situation énergétique de référence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
          Situation Énergétique de Référence
        </h1>
      </div>

      {error && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-6 border border-amber-200 dark:border-amber-800">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200">
              Données non disponibles
            </h2>
            <p className="text-amber-700 dark:text-amber-300">{error}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                onClick={() => fetchData(initialVehicleType)}
                variant="outline"
                className="bg-white dark:bg-slate-900"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
              <Link href="/upload" passHref>
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Télécharger des données
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <SERClient
        vehicleType={initialVehicleType}
        regressionData={regressionData}
        monthlyData={monthlyData}
      />
    </div>
  )
}
