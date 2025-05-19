"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Car, Truck, Forklift } from "lucide-react"
import { useState } from "react"

interface VehicleTypeFilterProps {
  onVehicleTypeChange: (type: string) => void
  className?: string
}

export function VehicleTypeFilter({
  onVehicleTypeChange,
  className,
}: VehicleTypeFilterProps) {
  const [selectedType, setSelectedType] = useState<string>("all")

  // Standardized vehicle types with IDs matching backend data
  const vehicleTypes = [
    { id: "all", label: "Tous", icon: null },
    { id: "voiture", label: "Voitures", icon: <Car className="mr-2 h-4 w-4" /> },
    { id: "camion", label: "Camions", icon: <Truck className="mr-2 h-4 w-4" /> },
    { id: "chariot", label: "Chariots", icon: <Forklift className="mr-2 h-4 w-4" /> },
  ]

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    onVehicleTypeChange(type)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex flex-wrap gap-3", className)}
    >
      {vehicleTypes.map((type) => (
        <Button
          key={type.id}
          variant={selectedType === type.id ? "default" : "outline"}
          className={cn(
            "h-10 px-4 text-sm font-medium transition-all duration-300 hover:scale-105",
            selectedType === type.id
              ? "bg-[#4CAF50] hover:bg-[#43A047] dark:bg-[#48BB78] dark:hover:bg-[#38A169] text-white"
              : "border-[#E5E7EB] dark:border-[#4A5568] text-[#4B5563] dark:text-[#E2E8F0]"
          )}
          onClick={() => handleTypeChange(type.id)}
        >
          <div className="flex items-center">
            {type.icon}
            {type.label}
          </div>
        </Button>
      ))}
    </motion.div>
  )
}
