import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadClient } from "@/app/upload/upload-client"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Import de fichiers | COFICAB ENERGIX",
  description: "Importer des fichiers de données pour analyse de consommation",
}

// Dynamic page with server-side data fetching
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

// Server component for fetching configuration data
async function getUploadConfig() {
  try {
    // In a real environment, this would call your backend API directly
    // For now, we'll simulate API responses
    
    // Example of direct API calls:
    // const configRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/config/upload`, {
    //   cache: 'no-store',
    //   next: { revalidate: 3600 }
    // });
    // if (!configRes.ok) throw new Error('Failed to fetch upload configuration');
    // return await configRes.json();
    
    // For now, return structured mock data that matches your API schema
    return {
      maxFileSize: 100, // MB
      allowedFileTypes: ['.xlsx', '.xls', '.csv'],
      vehicleTypes: ["Camion", "Voiture", "Utilitaire"],
      // Ensure we use the normalized base URL pattern from the memory
      uploadEndpoint: process.env.NEXT_PUBLIC_API_URL ? 
        `${process.env.NEXT_PUBLIC_API_URL.endsWith('/') ? 
          process.env.NEXT_PUBLIC_API_URL.slice(0, -1) : 
          process.env.NEXT_PUBLIC_API_URL}/api/upload` : 
        "http://localhost:8080/api/upload"
    }
  } catch (error) {
    console.error("Error fetching upload configuration:", error)
    // Return default values if there's an error
    return {
      maxFileSize: 50, // MB
      allowedFileTypes: ['.xlsx', '.xls', '.csv'],
      vehicleTypes: ["Camion", "Voiture", "Utilitaire"],
      uploadEndpoint: "http://localhost:8080/api/upload"
    }
  }
}

// Upload page skeleton for loading state
function UploadPageSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
      </div>
      
      <Skeleton className="h-[600px] w-full rounded-lg" />
    </div>
  );
}

export default async function UploadPage() {
  // Fetch configuration data from the server/backend
  const config = await getUploadConfig()
  
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
          Import de fichiers
        </h1>
      </div>
      
      <Suspense fallback={<UploadPageSkeleton />}>
        <Card className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
              Importer un nouveau fichier
            </CardTitle>
            <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
              Formats acceptés: {config.allowedFileTypes.join(", ")} (max {config.maxFileSize}MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadClient 
              maxFileSize={config.maxFileSize} 
              allowedFileTypes={config.allowedFileTypes}
            />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  )
}
