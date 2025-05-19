import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from "next"
import { Suspense } from "react"
import { HistoricalClient } from "./historical-client"

export const metadata: Metadata = {
  title: "Données Historiques | COFICAB ENERGIX",
  description: "Consultez l'historique complet des données d'exploitation",
}

// This is a server component that fetches initial data at request time
export const dynamic = 'force-dynamic'; // Ensure this page is always server-rendered
export const revalidate = 0; // No revalidation cache to ensure fresh data

// Define the props for the HistoricalPage component
interface HistoricalPageProps {
  searchParams?: {
    type?: string;
    region?: string;
    year?: string;
    matricule?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

// Fetch historical data from the backend API
async function fetchHistoricalData(params: Record<string, string | undefined> = {}) {
  try {
    // Build query string for the API request
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value);
      }
    });
    const queryString = queryParams.toString();
    // Use direct API URLs
    const recordsRes = await fetch(`http://localhost:8080/api/records?${queryString}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const typesRes = await fetch(`http://localhost:8080/api/upload/vehicles`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    let records = [];
    let vehicleTypes = ['VOITURE', 'CAMION', 'CHARIOT'];
    const regionsList = ['Nord', 'Sud', 'Est', 'Ouest', 'Tunis', 'Mjez ELBEB'];
    if (recordsRes.ok) {
      records = await recordsRes.json();
      console.log("Historical records fetched successfully");
    } else {
      console.error("Error fetching historical records");
      throw new Error("Failed to fetch historical records");
    }
    if (typesRes.ok) {
      const fetchedTypes = await typesRes.json();
      if (fetchedTypes && Array.isArray(fetchedTypes) && fetchedTypes.length > 0) {
        vehicleTypes = fetchedTypes.filter(type => type !== 'Sheet1');
      }
      console.log("Vehicle types processed");
    } else {
      console.warn("Using default vehicle types");
    }
    return {
      records,
      vehicleTypes,
      regionsList
    };
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return {
      records: [],
      vehicleTypes: ['VOITURE', 'CAMION', 'CHARIOT', 'Sheet1'],
      regionsList: ['Nord', 'Sud', 'Est', 'Ouest', 'Tunis', 'Mjez ELBEB']
    };
  }
}

export default async function HistoricalPage({ searchParams = {} }: HistoricalPageProps) {
  // Extract search params without awaiting them, as they're already available
  const params: Record<string, string | undefined> = {
    type: searchParams.type || undefined,
    region: searchParams.region || undefined,
    year: searchParams.year || undefined,
    matricule: searchParams.matricule || undefined,
    dateFrom: searchParams.dateFrom || undefined,
    dateTo: searchParams.dateTo || undefined
  };
  
  // Fetch initial data server-side
  const { records, vehicleTypes, regionsList } = await fetchHistoricalData(params);
  
  return (
    <div className="container pb-8">
      <div className="flex flex-col gap-2 py-6">
        <h1 className="text-3xl font-bold tracking-tight">Données historiques</h1>
        <p className="text-muted-foreground">
          Consultez l&apos;historique complet des données d&apos;exploitation
        </p>
      </div>
      <Suspense fallback={<HistoricalSkeleton />}>
        <HistoricalClient 
          initialData={records} 
          vehicleType={params.type} 
          region={params.region}
          year={params.year}
          matricule={params.matricule}
          availableVehicleTypes={vehicleTypes}
          availableRegions={regionsList}
        />
      </Suspense>
    </div>
  );
}

function HistoricalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex justify-between mt-4">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      
      <div className="border rounded-lg p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-2">
          <div className="flex items-center border-b pb-2">
            {Array(9).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-5 flex-1 mr-2" />
            ))}
          </div>
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="flex items-center py-3">
              {Array(9).fill(0).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1 mr-2" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
