"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Car, CheckCircle, Package, Truck } from "lucide-react"
import { toast } from "sonner"
import * as React from "react"
import { VehicleType, useVehicleType } from "@/hooks/use-vehicle-type"

interface VehicleTypeButtonProps {
  label: string
  value: VehicleType
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
  disabled?: boolean
}

function VehicleTypeButton({
  label,
  value,
  icon,
  isActive,
  onClick,
  disabled = false,
}: VehicleTypeButtonProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </Button>
  )
}

export interface VehicleTypeSelectorProps {
  onChange?: (type: VehicleType) => void
  className?: string
  disabled?: boolean
}

// Helper function to convert UI type to API type
function convertToApiType(uiType: VehicleType): string {
  switch (uiType) {
    case 'voitures':
      return 'VOITURE'
    case 'camions':
      return 'CAMION'
    case 'chariots':
      return 'CHARIOT'
    case 'all':
      return 'all'
    default:
      return uiType
  }
}

// Helper function to convert API type to UI type
function convertToUiType(apiType: string): VehicleType {
  switch (apiType) {
    case 'VOITURE':
      return 'voitures'
    case 'CAMION':
      return 'camions'
    case 'CHARIOT':
      return 'chariots'
    case 'all':
      return 'all'
    default:
      return apiType as VehicleType
  }
}

export function VehicleTypeSelector({ 
  onChange,
  className,
  disabled = false,
}: VehicleTypeSelectorProps) {
  const { selectedType, setSelectedType } = useVehicleType()
  
  const handleTypeChange = React.useCallback((type: VehicleType) => {
    if (disabled) return
    
    // Convert UI type to API type before setting
    const apiType = convertToApiType(type)
    setSelectedType(apiType as VehicleType)
    
    if (onChange) {
      onChange(type)
    }
    
    // Show a subtle notification
    toast.success(`Filtré par: ${getTypeLabel(type)}`, {
      description: "Le tableau de bord a été mis à jour",
      duration: 2000,
    })
  }, [setSelectedType, onChange, disabled])
  
  // Helper to get label from type
  const getTypeLabel = (type: VehicleType): string => {
    const found = vehicleTypes.find(vt => vt.value === type)
    return found ? found.label : "Tous les véhicules"
  }
  
  // Specific vehicle types as per requirements
  const vehicleTypes = [
    { label: "Tous", value: 'all' as const, icon: <CheckCircle className="text-emerald-500" size={24} /> },
    { label: "Voitures", value: 'voitures' as const, icon: <Car className="text-blue-500" size={24} /> },
    { label: "Camions", value: 'camions' as const, icon: <Truck className="text-amber-500" size={24} /> },
    { label: "Chariots", value: 'chariots' as const, icon: <Package className="text-purple-500" size={24} /> },
  ]

  // Convert API type to UI type for display
  const displayType = convertToUiType(selectedType)

  return (
    <div className={cn("grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3", className)}>
      {vehicleTypes.map((type) => (
        <VehicleTypeButton
          key={type.value}
          label={type.label}
          value={type.value}
          icon={type.icon}
          isActive={displayType === type.value}
          onClick={() => handleTypeChange(type.value)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}