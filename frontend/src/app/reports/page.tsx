import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, LineChart, PieChart } from "lucide-react"
import { Metadata } from "next"
import { Suspense } from "react"
import { ReportGeneratorClient } from "../../app/reports/components/report-generator-client"
import { ReportsListClient } from "../../app/reports/components/reports-list-client"

export const metadata: Metadata = {
  title: "Rapports | COFICAB ENERGIX",
  description: "Génération et consultation des rapports d'analyse de consommation",
};

// Dynamic page with server-side data fetching
export const dynamic = 'force-dynamic';
export const revalidate = 1800; // Revalidate every 30 minutes

// Define types for the report data
interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface SavedReport {
  id: string;
  name: string;
  type: string;
  title: string;
  format: string;
  dateGenerated: string;
  downloadUrl: string;
}

interface ReportData {
  reportTypes: ReportType[];
  savedReports: SavedReport[];
  vehicleTypes: string[];
}

// Static report types that don't change often
function getReportTypes() {
  return [
    {
      id: "fuel-consumption",
      title: "Consommation de carburant",
      description: "Analyse de la consommation de carburant par période",
      icon: <LineChart className="h-10 w-10 text-[#4CAF50] dark:text-[#48BB78] opacity-80" />,
    },
    {
      id: "vehicle-efficiency",
      title: "Efficacité des véhicules",
      description: "Comparaison de l'efficacité énergétique des véhicules",
      icon: <BarChart3 className="h-10 w-10 text-[#4CAF50] dark:text-[#48BB78] opacity-80" />,
    },
    {
      id: "ser-analysis",
      title: "Analyse SER",
      description: "Analyse de la spécifique énergétique de référence",
      icon: <PieChart className="h-10 w-10 text-[#4CAF50] dark:text-[#48BB78] opacity-80" />,
    },
    {
      id: "performance-comparison",
      title: "Comparaison de performance",
      description: "Comparaison des performances entre différents types de véhicules",
      icon: <BarChart3 className="h-10 w-10 text-[#4CAF50] dark:text-[#48BB78] opacity-80" />,
    },
  ];
}

// Server-side data fetching for reports and vehicle types
async function fetchReportsData() {
  try {
    // In a real environment, this would call your backend API directly
    // For now, we'll simulate API responses
    
    // Example of direct API calls:
    // const reportsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
    //   cache: 'no-store',
    //   next: { revalidate: 1800 }
    // });
    // const typesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicle-types`, {
    //   cache: 'no-store',
    //   next: { revalidate: 1800 }
    // });
    
    // For now, return mock data that matches your API schema
    const savedReports = [
      {
        id: "rep-001",
        name: "Rapport mensuel de consommation - Avril 2024",
        type: "monthly",
        title: "Rapport mensuel de consommation - Avril 2024",
        format: "PDF",
        dateGenerated: "2024-04-30T14:35:22Z",
        downloadUrl: "#"
      },
      {
        id: "rep-002",
        name: "Analyse comparative par type de véhicule - Q1 2024",
        type: "comparative",
        title: "Analyse comparative par type de véhicule - Q1 2024",
        format: "PDF",
        dateGenerated: "2024-03-31T09:12:45Z",
        downloadUrl: "#"
      }
    ];
    
    const vehicleTypes = ["Camion", "Voiture", "Utilitaire"];
    
    return {
      savedReports,
      vehicleTypes
    };
  } catch (error) {
    console.error("Error fetching reports data:", error);
    return {
      savedReports: [],
      vehicleTypes: ["Camion", "Voiture", "Utilitaire"]
    };
  }
}

// Reports page skeleton for loading state
function ReportsPageSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  );
}

export default async function ReportsPage() {
  // Get static report types
  const reportTypes = getReportTypes();
  
  // Fetch dynamic data server-side
  const { savedReports, vehicleTypes } = await fetchReportsData();
  
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
          Rapports
        </h1>
      </div>
      
      <Suspense fallback={<ReportsPageSkeleton />}>
        <div className="grid gap-6 md:grid-cols-2">
          <ReportGeneratorClient reportTypes={reportTypes} vehicleTypes={vehicleTypes} />
          <ReportsListClient savedReports={savedReports} />
        </div>
      </Suspense>
    </div>
  )
}
