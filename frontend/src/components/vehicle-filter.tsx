"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useVehicleType } from "@/hooks/use-vehicle-type"
import { useYear } from "@/hooks/use-year"
import { FilterX } from "lucide-react"
import * as React from "react"
import { MatriculeProvider, MatriculeSelector } from "./matricule-selector"
import { VehicleTypeSelector } from "./vehicle-type-selector"
import { YearSelector } from "./year-selector"
import { VehicleType } from "@/hooks/use-vehicle-type"

// Provider type definition
interface VehicleFilterContextType {
  vehicleType: VehicleType;
  setVehicleType: (type: VehicleType) => void;
  year: string;
  setYear: (year: string) => void;
  matricule: string | null;
  setMatricule: (matricule: string | null) => void;
}

// Create context with default values
const VehicleFilterContext = React.createContext<VehicleFilterContextType>({
  vehicleType: 'all',
  setVehicleType: () => {},
  year: new Date().getFullYear().toString(),
  setYear: () => {},
  matricule: null,
  setMatricule: () => {},
});

// Provider props interface
interface VehicleFilterProviderProps {
  children: React.ReactNode;
  initialVehicleType?: VehicleType;
  initialYear?: string;
  initialMatricule?: string | null;
}

// Provider component
export function VehicleFilterProvider({
  children,
  initialVehicleType = 'all',
  initialYear = new Date().getFullYear().toString(),
  initialMatricule = null
}: VehicleFilterProviderProps) {
  const [vehicleType, setVehicleType] = React.useState<VehicleType>(initialVehicleType);
  const [year, setYear] = React.useState<string>(initialYear);
  const [matricule, setMatricule] = React.useState<string | null>(initialMatricule);

  const value = React.useMemo(() => ({
    vehicleType,
    setVehicleType,
    year,
    setYear,
    matricule,
    setMatricule
  }), [vehicleType, year, matricule]);

  return (
    <VehicleFilterContext.Provider value={value}>
      {children}
    </VehicleFilterContext.Provider>
  );
}

// Hook to use the filter context
export const useVehicleFilter = () => React.useContext(VehicleFilterContext);

export interface VehicleFilterProps {
  onFilterChange?: (filters: {
    vehicleType: VehicleType;
    year: string;
    matricule: string | null;
  }) => void;
  className?: string;
  showTitle?: boolean;
}

export function VehicleFilter({
  onFilterChange,
  className = "",
  showTitle = true
}: VehicleFilterProps) {
  const { vehicleType, setVehicleType, year, setYear, matricule, setMatricule } = useVehicleFilter()
  
  // Notify parent component when filters change
  React.useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        vehicleType,
        year,
        matricule
      })
    }
  }, [vehicleType, year, matricule, onFilterChange])
  
  // Reset all filters
  const handleResetFilters = () => {
    setVehicleType('all')
    setYear(new Date().getFullYear().toString())
    setMatricule(null)
  }
  
  return (
    <Card className={`border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] shadow-sm ${className}`}>
      {showTitle && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
                Filtres
              </CardTitle>
              <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
                Filtrer par type de véhicule, année et matricule
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetFilters}
              className="h-8 px-2 text-[#6B7280] hover:text-[#EF4444] dark:text-[#A0AEC0] dark:hover:text-[#F56565]"
            >
              <FilterX className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className={showTitle ? "" : "pt-4"}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#4B5563] dark:text-[#E2E8F0] mb-1 block">
              Type de véhicule
            </label>
            <VehicleTypeSelector />
          </div>
          
          <div>
            <label className="text-sm font-medium text-[#4B5563] dark:text-[#E2E8F0] mb-1 block">
              Année
            </label>
            <YearSelector />
          </div>
          
          <div>
            <label className="text-sm font-medium text-[#4B5563] dark:text-[#E2E8F0] mb-1 block">
              Matricule du véhicule
            </label>
            <MatriculeProvider>
              <MatriculeSelector onChange={setMatricule} value={matricule} />
            </MatriculeProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}