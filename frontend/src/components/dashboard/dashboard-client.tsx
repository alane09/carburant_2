/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from "react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

// Icons
import {
  AlertCircle,
  AlertTriangle,
  Car,
  Droplet,
  FileBarChart,
  Forklift,
  Fuel,
  Gauge,
  LineChart,
  Loader2,
  MapPin,
  Package,
  Truck,
  Upload,
  RefreshCw
} from "lucide-react";

// Hooks and Utilities
import { useVehicleType } from '@/hooks/use-vehicle-type';

// API
import type { VehicleRecord, DashboardStats, MonthlyData } from "@/types/dashboard";

// Custom Dashboard Components
import ChartContainer from "@/components/dashboard/chart-container";
import DashboardFilter from "@/components/dashboard/dashboard-filter";
import DashboardTabContent from "@/components/dashboard/dashboard-tab-content";
import { EmissionLCACard } from "@/components/dashboard/emission-lca-card";

// Chart Types
interface ChartData {
  title: string;
  type: 'pie' | 'bar' | 'line' | 'histogram';
  dataKey: string;
  height?: number;
  color?: string;
}

interface ChartSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  charts: ChartData[];
}

// Extended vehicle record for dashboard display
// This interface extends VehicleRecord with additional display properties
interface ExtendedVehicleRecord {
  // Required fields from backend
  id?: string;
  type: string;             // Vehicle type
  matricule: string;        // Vehicle registration number
  mois: string;             // Month
  year: string;             // Year
  consommationL: number;    // Consumption in L
  consommationTEP: number;  // Consumption in TEP
  coutDT: number;           // Cost in DT
  kilometrage: number;      // Distance in Km
  produitsTonnes: number;   // Transported products in Tons
  ipeL100km: number;        // IPE in L/100km
  ipeL100TonneKm: number;   // IPE in L/Tonne.100Km
  
  // Frontend display fields
  month: string;            // Formatted month for display
  consommation: number;     // Alias for consommationL
  ipe: number;              // Alias for ipeL100km
  distance?: number;
  vehicleType?: string;     // Alias for type
  tonnage?: number;         // Alias for produitsTonnes
  
  // Optional fields
  region?: string;          // Region
  rawValues?: Record<string, number>; // Raw values
}

// Vehicle type options
const vehicleTypeOptions = [
  { 
    id: 'all', 
    name: 'Tous', 
    icon: Truck, 
    noDataMessage: 'Aucune donnée disponible',
    label: 'Tous les véhicules'
  },
  { 
    id: 'voiture', 
    name: 'Voitures', 
    icon: Car, 
    noDataMessage: 'Aucune donnée disponible pour les voitures',
    label: 'Voitures'
  },
  { 
    id: 'camion', 
    name: 'Camions', 
    icon: Truck, 
    noDataMessage: 'Aucune donnée disponible pour les camions',
    label: 'Camions'
  },
  { 
    id: 'chariot', 
    name: 'Chariots', 
    icon: Forklift, 
    noDataMessage: 'Aucune donnée disponible pour les chariots',
    label: 'Chariots'
  }
];

// Dashboard sections configuration
const dashboardSections: ChartSection[] = [
  {
    id: 'consumption-cost',
    title: 'Consommation & Coût',
    icon: <Fuel className="h-4 w-4" />,
    charts: [
      { type: 'pie', title: 'Part du camion / Consommation totale du carburant', dataKey: 'consommation' },
      { type: 'bar', title: 'Répartition de la consommation du carburant / Camion (en litres)', dataKey: 'consommation' },
      { type: 'pie', title: 'Part du camion / Coût total', dataKey: 'cost' },
      { type: 'line', title: 'Évolution mensuelle du coût total de la consommation (en DT)', dataKey: 'consommation' }
    ]
  },
  {
    id: 'mileage',
    title: 'Kilométrage',
    icon: <MapPin className="h-4 w-4" />,
    charts: [
      { type: 'line', title: 'Évolution mensuelle du kilométrage total parcouru des camions', dataKey: 'kilometrage' },
      { type: 'pie', title: 'Part du camion / Kilométrage total parcouru', dataKey: 'kilometrage' }
    ]
  },
  {
    id: 'products',
    title: 'Produits Transportés',
    icon: <Package className="h-4 w-4" />,
    charts: [
      { type: 'pie', title: 'Part du camion / Quantité totale de produits finis transportés', dataKey: 'produitsTonnes' },
      { type: 'bar', title: 'Répartition de la quantité de produits finis transportés / Camion (en Kg)', dataKey: 'produitsTonnes', color: '#8b5cf6' }
    ]
  },
  {
    id: 'ipe',
    title: 'IPE',
    icon: <LineChart className="h-4 w-4" />,
    charts: [
      { type: 'line', title: 'IPE (L/100km) - Global', dataKey: 'ipe' },
      { type: 'line', title: 'IPE (L/100km.Tonne) - Global', dataKey: 'ipeTonne' },
      { type: 'line', title: 'IPE (L/100km) par véhicule (par mois)', dataKey: 'ipe' },
      { type: 'line', title: 'IPE (L/100km.Tonne) par véhicule (par mois)', dataKey: 'ipeTonne' }
    ]
  },
  {
    id: 'reports',
    title: 'Rapports',
    icon: <FileBarChart className="h-4 w-4" />,
    charts: []
  }
];

// Dynamic imports with SSR disabled
const IPELineChart = dynamic(() => import("@/components/charts/ipe-line-chart"), { ssr: false });
const DashboardCard = dynamic(() => import("@/components/dashboard/dashboard-card"), { ssr: false });
const ConsumptionPieChart = dynamic(() => import("@/components/charts/consumption-pie-chart"), { ssr: false });
const ConsumptionBarChart = dynamic(() => import("@/components/charts/consumption-bar-chart"), { ssr: false });
const ConsumptionLineChart = dynamic(() => import("@/components/charts/consumption-line-chart"), { ssr: false });

// Process records for dashboard
const processRecordsForDashboard = (records: VehicleRecord[]): DashboardStats | null => {
  if (!records || records.length === 0) return null;

  try {
    // Extract monthly data
    const monthsMap: Record<string, MonthlyData> = {};
    const vehicleTypeCount: Record<string, number> = {};
    
    let totalConsommation = 0;
    let totalKilometrage = 0;
    let totalIPE = 0;
    let ipeCount = 0;
    const totalVehicles = new Set<string>();
    
    // Process each record
    records.forEach(record => {
      // Use backend field names directly
      const month = record.mois || 'Unknown';
      const consommation = record.consommationL || 0;
      const kilometrage = record.kilometrage || 0;
      const vehicleType = record.type || 'Unknown';
      const matricule = record.matricule || 'Unknown';
      const ipe = record.ipeL100km || 0;
      
      // Accumulate totals
      totalConsommation += consommation;
      totalKilometrage += kilometrage;
      totalVehicles.add(matricule);
      
      // Only count valid IPE values
      if (ipe > 0) {
        totalIPE += ipe;
        ipeCount++;
      }
      
      // Count vehicle types
      vehicleTypeCount[vehicleType] = (vehicleTypeCount[vehicleType] || 0) + 1;
      
      // Aggregate monthly data
      if (!monthsMap[month]) {
        monthsMap[month] = {
          month,
          year: record.year || '',
          consommation: 0,
          kilometrage: 0,
          produitsTonnes: 0,
          tonnage: 0,
          ipe: 0,
          ipeTonne: 0,
          count: 0
        };
      }
      
      // Update monthly aggregates
      monthsMap[month].consommation += consommation;
      monthsMap[month].kilometrage += kilometrage;
      monthsMap[month].produitsTonnes += record.produitsTonnes || 0;
      monthsMap[month].tonnage += record.produitsTonnes || 0; // Alias for frontend compatibility
      
      // Only add valid IPE values
      if (ipe > 0) {
        monthsMap[month].ipe += ipe;
        monthsMap[month].ipeTonne += record.ipeL100TonneKm || 0;
      }
      
      monthsMap[month].count += 1;
    });
    
    // Calculate averages and finalize monthly data
    const monthlyData = Object.values(monthsMap).map(data => ({
      ...data,
      // Calculate averages based on count
      ipe: data.count > 0 ? data.ipe / data.count : 0,
      ipeTonne: data.count > 0 ? data.ipeTonne / data.count : 0
    }));
    
    // Convert vehicle type breakdown to array format
    const vehicleTypeBreakdown = Object.entries(vehicleTypeCount).map(([name, value]) => ({
      name,
      value
    }));
    
    return {
      totalVehicles: totalVehicles.size,
      totalConsommation,
      totalKilometrage,
      avgIPE: ipeCount > 0 ? totalIPE / ipeCount : 0, // Use actual IPE values from records
      monthlyData,
      vehicleTypeBreakdown
    } as DashboardStats;
  } catch (error) {
    console.error('Error processing records:', error);
    return null;
  }
};

// Dashboard client component
export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();
  
  // State management
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // Filter states with URL sync
  const [selectedYear, setSelectedYear] = useState<string>(
    searchParams.get('year') || 'all'
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    searchParams.get('month') || 'all'
  );
  const [selectedType, setSelectedType] = useState<string>(
    searchParams.get('type') || 'all'
  );
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('tab') || 'overview'
  );
  
  // Update URL when filters change
  useEffect(() => {
    if (!isMounted) return;
    
    const params = new URLSearchParams();
    if (selectedYear) params.set('year', selectedYear);
    if (selectedMonth && selectedMonth !== 'all') params.set('month', selectedMonth);
    if (selectedType && selectedType !== 'all') params.set('type', selectedType);
    if (activeTab && activeTab !== 'overview') params.set('tab', activeTab);
    
    router.push(`${pathname}?${params.toString()}`);
  }, [selectedYear, selectedMonth, selectedType, activeTab, isMounted, pathname, router]);
  
  // Constants
  const chartHeight = 300; // Standard chart height
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  
  // Get vehicle type information
  const { types: vehicleTypes, isLoading: isLoadingTypes } = useVehicleType();
  const selectedVehicleType = useMemo(() => 
    vehicleTypeOptions.find(type => type.id === selectedType) || vehicleTypeOptions[0],
    [selectedType]
  );

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Normalize vehicle type to match backend expectations
      // Backend expects plural forms: 'camions', 'voitures', 'chariots'
      let normalizedType: string | undefined;
      if (selectedType !== "all") {
        // Convert singular to plural form for backend compatibility
        normalizedType = selectedType === "camion" ? "camions" : 
                         selectedType === "voiture" ? "voitures" : 
                         selectedType === "chariot" ? "chariots" : 
                         selectedType;
      } else {
        normalizedType = "all";
      }
      
      // Log the request parameters for debugging
      console.log(`Fetching data with params: year=${selectedYear}, mois=${selectedMonth}, type=${normalizedType}`);
      
      // Import the getDashboardStats function from api-dashboard.ts
      const { getDashboardStats } = await import('@/lib/api-dashboard');
      
      // Use dedicated dashboard API instead of direct record fetching
      const dashData = await getDashboardStats(
        normalizedType,
        selectedYear,
        selectedMonth !== "all" ? selectedMonth : undefined
      );

      if (!dashData) {
        setError("Aucune donnée disponible pour les critères sélectionnés");
        setDashboardData(null);
        return;
      }

      // If monthly data exists, process it, otherwise inform the user
      if (dashData.monthlyData && dashData.monthlyData.length > 0) {
        setDashboardData(dashData as DashboardStats);
      } else {
        // Inform the user that no data is available
        setError(`Aucune donnée mensuelle disponible pour ${normalizedType === 'all' ? 'tous les véhicules' : normalizedType}`);
        setDashboardData(null);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Erreur lors du chargement des données");
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedType]);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchDashboardData();
    }
  }, [isMounted, selectedYear, selectedMonth, selectedType, fetchDashboardData]);

  const handleVehicleTypeChange = useCallback((type: string) => {
    setSelectedType(type);
  }, []);

  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year);
  }, []);
  
  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month);
  }, []);

  const getVehicleTypeById = (id: string) => {
    return vehicleTypeOptions.find(option => option.id === id) || vehicleTypeOptions[0];
  };

  const renderNoDataMessage = () => {
    const vehicleType = getVehicleTypeById(selectedType);
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune donnée disponible</h3>
        <p className="text-muted-foreground">
          {vehicleType.noDataMessage}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => window.location.href = '/upload'}
        >
          <Upload className="mr-2 h-4 w-4" /> Importer des données
        </Button>
      </div>
    );
  };

  if (!isMounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }
  
  if (error && !dashboardData) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button onClick={fetchDashboardData} variant="outline">
            Réessayer
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedYear(new Date().getFullYear().toString());
              setSelectedMonth("all");
              setSelectedType("all");
              setError(null);
              toast.info('Tentative de récupération des données avec les paramètres par défaut');
            }}
          >
            Réessayer avec les paramètres par défaut
          </Button>
          <Button 
            variant="default" 
            onClick={() => window.location.href = '/upload'}
          >
            <Upload className="mr-2 h-4 w-4" /> Importer des données
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center rounded-full bg-warning/10 p-3">
          <AlertTriangle className="h-6 w-6 text-warning" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Aucune donnée</h3>
          <p className="text-muted-foreground">
            Aucune donnée disponible pour les filtres sélectionnés
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedYear}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedMonth}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mois</SelectItem>
              <SelectItem value="1">Janvier</SelectItem>
              <SelectItem value="2">Février</SelectItem>
              <SelectItem value="3">Mars</SelectItem>
              <SelectItem value="4">Avril</SelectItem>
              <SelectItem value="5">Mai</SelectItem>
              <SelectItem value="6">Juin</SelectItem>
              <SelectItem value="7">Juillet</SelectItem>
              <SelectItem value="8">Août</SelectItem>
              <SelectItem value="9">Septembre</SelectItem>
              <SelectItem value="10">Octobre</SelectItem>
              <SelectItem value="11">Novembre</SelectItem>
              <SelectItem value="12">Décembre</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedType}
            onValueChange={handleVehicleTypeChange}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type de véhicule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {vehicleTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          Rafraîchir
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => {
            setSelectedYear(new Date().getFullYear().toString());
            setSelectedMonth("all");
            setSelectedType("all");
            setError(null);
            toast.info('Tentative de récupération des données avec les paramètres par défaut');
          }}
        >
          Réessayer avec les paramètres par défaut
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 mb-4">
        <div className="flex-1">
          {/* Title and Description already in page.tsx */}
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          {/* Filters and Actions */}
          <DashboardFilter 
            selectedYear={selectedYear}
            setSelectedYear={handleYearChange}
            selectedMonth={selectedMonth}
            setSelectedMonth={handleMonthChange}
            selectedType={selectedType}
            setSelectedType={handleVehicleTypeChange}
            vehicleTypeOptions={vehicleTypeOptions}
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardData}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualiser
          </Button>
        </div>
      </div>

      {dashboardData ? (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Global</TabsTrigger>
            {/* Render tabs for other sections */}
            {dashboardSections.map(section => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.icon} {section.title}
              </TabsTrigger>
            ))}
            <TabsTrigger value="reports">
              <FileBarChart className="h-4 w-4 mr-2" /> Rapports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Render dashboard cards */}
              <DashboardCard 
                title="Total Véhicules"
                value={dashboardData.totalVehicles !== undefined ? dashboardData.totalVehicles.toLocaleString() : 'N/A'}
                description={`Total des véhicules ${selectedType !== 'all' ? getVehicleTypeById(selectedType).name.toLowerCase() : ''}`}
                icon={<Car className="h-4 w-4" />}
              />
              <DashboardCard 
                title="Consommation Totale (L)"
                value={dashboardData.totalConsommation !== undefined ? dashboardData.totalConsommation.toFixed(2).toLocaleString() : 'N/A'}
                description="Total de carburant consommé"
                icon={<Droplet className="h-4 w-4" />}
              />
              <DashboardCard 
                title="Kilométrage Total (Km)"
                value={dashboardData.totalKilometrage !== undefined ? dashboardData.totalKilometrage.toLocaleString() : 'N/A'}
                description="Total de distance parcourue"
                icon={<MapPin className="h-4 w-4" />}
              />
              <DashboardCard 
                title="IPE Moyen (L/100km)"
                value={dashboardData.avgIPE !== undefined ? dashboardData.avgIPE.toFixed(2) : 'N/A'}
                description="Indice de performance énergétique"
                icon={<Gauge className="h-4 w-4" />}
              />
            </div>
            {/* Monthly Data Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution Mensuelle (Consommation, Kilométrage, IPE)</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {dashboardData.monthlyData && dashboardData.monthlyData.length > 0 ? (
                  <DashboardTabContent title="Évolution Mensuelle (Consommation, Kilométrage, IPE)" showContent={true} noDataMessage={renderNoDataMessage()}>
                    {/* Render monthly data chart here */}
                     <ConsumptionLineChart 
                      data={dashboardData.monthlyData || []}
                      dataKey="consommation"
                      title="Consommation"
                    />
                     <ConsumptionLineChart 
                      data={dashboardData.monthlyData || []}
                      dataKey="kilometrage"
                      title="Kilométrage"
                    />
                     <IPELineChart 
                      data={dashboardData.monthlyData || []}
                      dataKey="ipe"
                      title="IPE"
                    />
                  </DashboardTabContent>
                ) : (
                  <div className="text-center text-muted-foreground py-8">Aucune donnée mensuelle disponible</div>
                )}
              </CardContent>
            </Card>
            {/* Emission LCA Card */}
             <EmissionLCACard />
          </TabsContent>

          {/* Render content for other sections */}
          {dashboardSections
            // Filter sections based on selected vehicle type
            .filter(section => 
              selectedType === 'all' || 
              selectedType === 'chariot' ? section.id === 'consumption-cost' : true
            )
            .map(section => (
              <TabsContent key={section.id} value={section.id} className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Filter charts based on selected vehicle type */}
                  {section.charts
                    .filter(chart => 
                      selectedType === 'chariot' ? chart.dataKey === 'consommation' : true
                    )
                    .map((chart, index) => (
                    <ChartContainer 
                      key={index}
                      title={chart.title}
                      height={chart.height}
                      // Pass chart component as children
                      >
                        {chart.type === 'pie' && (
                          <ConsumptionPieChart 
                            data={dashboardData.vehicleTypeBreakdown || []}
                            title={chart.title}
                          />
                        )}
                        {chart.type === 'bar' && (
                          <ConsumptionBarChart 
                            data={dashboardData.monthlyData || []}
                            dataKey={chart.dataKey}
                            title={chart.title}
                          />
                        )}
                        {chart.type === 'line' && (
                          <ConsumptionLineChart 
                            data={dashboardData.monthlyData || []}
                            dataKey={chart.dataKey}
                            title={chart.title}
                          />
                        )}
                         {/* Add other chart types as needed */}
                    </ChartContainer>
                  ))}
                </div>
              </TabsContent>
            ))
          }

          {/* Reports Tab Content */}
          <TabsContent value="reports" className="space-y-4">
             <Card>
                <CardHeader>
                   <CardTitle>Rapports détaillés</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                   <div className="text-center text-muted-foreground py-8">Fonctionnalité de rapport à venir</div>
                </CardContent>
             </Card>
          </TabsContent>

        </Tabs>
      ) : (
        renderNoDataMessage()
      )}
    </>
  );
}
