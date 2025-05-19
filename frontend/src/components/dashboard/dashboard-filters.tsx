/**
 * @deprecated This component has been replaced by a combination of DateRangeSelector and VehicleTypeFilter
 * For date filtering, use '@/components/date-range-selector'
 * For vehicle type filtering, use '@/components/dashboard/vehicle-type-filter'
 */

"use client"

import { VehicleTypeFilter } from "@/components/dashboard/vehicle-type-filter"
import { DateRangeSelector } from "@/components/date-range-selector"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface DashboardFiltersProps {
  onDateRangeChange?: (range: any) => void
  onVehicleTypeChange?: (type: string) => void
  className?: string
}

export function DashboardFilters({
  onVehicleTypeChange,
  className,
}: DashboardFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0",
        className
      )}
    >
      <DateRangeSelector />
      <VehicleTypeFilter onVehicleTypeChange={onVehicleTypeChange || (() => {})} />
    </motion.div>
  )
}
