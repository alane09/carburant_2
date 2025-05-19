"use client"

import { useVehicleType } from "./use-vehicle-type"
import { useYear } from "./use-year"
import { useMatricule } from "@/components/matricule-selector"

export function useVehicleFilter() {
  const { selectedType } = useVehicleType()
  const { selectedYear } = useYear()
  const { selectedMatricules } = useMatricule()

  return {
    selectedType,
    selectedYear,
    selectedMatricules
  }
} 