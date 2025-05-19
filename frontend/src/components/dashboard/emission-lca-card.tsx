"use client";

import { EmissionChart } from "@/components/charts/emission-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVehicleType } from "@/hooks/use-vehicle-type";
import { API } from "@/lib/api";
import { EmissionData, processEmissionData, validateEmissionData } from "@/lib/emission-utils";
import { cn } from "@/lib/utils";
import { AlertCircle, Cloud, Leaf, LineChart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EmissionLCACardProps {
  className?: string;
  selectedVehicle?: string;
}

export function EmissionLCACard({ className, selectedVehicle }: EmissionLCACardProps) {
  const { selectedType } = useVehicleType();
  const [isLoading, setIsLoading] = useState(true);
  const [emissionData, setEmissionData] = useState<EmissionData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");  useEffect(() => {
    const fetchEmissionData = async () => {
      setIsLoading(true);
      try {
        // Fetch vehicle records
        const records = await API.Vehicle.getRecords({
          type: selectedType !== 'all' ? selectedType : undefined,
          matricule: selectedVehicle,
        });

        // Check if we have any records
        if (!records || records.length === 0) {
          toast.error("Aucune donnée d'émission disponible");
          setEmissionData(null);
          return;
        }

        // Validate records
        const validation = validateEmissionData(records);
        if (!validation.isValid) {
          toast.warning(validation.errors.join(', '));
        }

        // Process emission data
        const data = processEmissionData(records, selectedType);
        setEmissionData(data);
        setEmissionData(data);
      } catch (error) {
        console.error("Error fetching emission data:", error);
        toast.error("Erreur lors du chargement des données d&apos;émission");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmissionData();
  }, [selectedType, selectedVehicle]);

  const getVehicleTypeLabel = (type: string) => {
    switch (type) {
      case "VOITURE":
        return "Voitures";
      case "CAMION":
        return "Camions";
      case "CHARIOT":
        return "Chariots";
      case "all":
        return "Tous les véhicules";
      default:
        return type;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Empreinte Carbone & LCA
        </CardTitle>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Données d&apos;émission et d&apos;analyse du cycle de vie</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : emissionData ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">Émissions CO2</p>
                      <p className="text-2xl font-bold">
                        {emissionData.totalEmissions.toLocaleString()} kg
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Score LCA</p>
                      <p className="text-2xl font-bold">
                        {emissionData.lcaScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getVehicleTypeLabel(emissionData.vehicleType)}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </TabsContent>
          <TabsContent value="details">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : emissionData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Évolution mensuelle</p>
                </div>
                <EmissionChart
                  data={emissionData.monthlyEmissions}
                  title="Émissions CO2 mensuelles"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 