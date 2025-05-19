import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API } from "@/lib/api";
import { EmissionData, processEmissionData, validateEmissionData } from "@/lib/emission-utils";
import { EmissionChart } from "@/components/charts/emission-chart";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmissionAnalyticsProps {
  className?: string;
  selectedVehicle?: string;
}

export function EmissionAnalytics({ className, selectedVehicle }: EmissionAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [emissionData, setEmissionData] = useState<EmissionData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [trends, setTrends] = useState<{
    monthly: number;
    yearly: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const records = await API.Vehicle.getRecords({
          matricule: selectedVehicle,
        });

        const validation = validateEmissionData(records);
        if (!validation.isValid) {
          throw new Error(validation.errors.join('\n'));
        }

        const data = processEmissionData(records, 'all');
        setEmissionData(data);

        // Calculate trends
        const monthlyData = data.monthlyEmissions;
        if (monthlyData.length >= 2) {
          const lastMonth = monthlyData[monthlyData.length - 1].value;
          const prevMonth = monthlyData[monthlyData.length - 2].value;
          const monthlyTrend = ((lastMonth - prevMonth) / prevMonth) * 100;

          const firstMonth = monthlyData[0].value;
          const yearlyTrend = ((lastMonth - firstMonth) / firstMonth) * 100;

          setTrends({
            monthly: monthlyTrend,
            yearly: yearlyTrend,
          });
        }
      } catch (error) {
        console.error("Error fetching emission data:", error);
        toast.error("Erreur lors du chargement des données d&apos;émission");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedVehicle]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!emissionData) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucune donnée d&apos;émission disponible
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Analyse Détaillée des Émissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="trends">Tendances</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">
                    Émissions Totales
                  </div>
                  <div className="text-2xl font-bold">
                    {emissionData.totalEmissions.toLocaleString()} kg
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">
                    Score LCA
                  </div>
                  <div className="text-2xl font-bold">
                    {emissionData.lcaScore.toFixed(1)}
                  </div>
                </CardContent>
              </Card>
            </div>
            <EmissionChart
              data={emissionData.monthlyEmissions}
              title="Évolution des Émissions"
            />
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {trends && (
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      {trends.monthly > 0 ? (
                        <TrendingUp className="h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Tendance Mensuelle
                        </div>
                        <div className="text-2xl font-bold">
                          {Math.abs(trends.monthly).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      {trends.yearly > 0 ? (
                        <TrendingUp className="h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Tendance Annuelle
                        </div>
                        <div className="text-2xl font-bold">
                          {Math.abs(trends.yearly).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Répartition Mensuelle
                  </div>
                  <div className="space-y-2">
                    {emissionData.monthlyEmissions.map((month) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <span className="text-sm">{month.month}</span>
                        <span className="font-medium">
                          {month.value.toLocaleString()} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 