"use client"

// Import from tsx file explicitly to match our provider
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useYear } from "@/hooks/use-year"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"
import * as React from "react"

export interface YearSelectorProps {
  className?: string
  onChange?: (year: string) => void
  value?: string
  showIcon?: boolean
  label?: string
  placeholder?: string
  disabled?: boolean
}

export function YearSelector({
  className = "",
  onChange,
  value,
  showIcon = false,
  label,
  placeholder = "Sélectionner une année",
  disabled = false,
}: YearSelectorProps) {
  const { years, selectedYear, setSelectedYear } = useYear()
  
  // Create a list of last 10 years if not provided by context
  const yearOptions = React.useMemo(() => {
    if (years && years.length > 0) {
      return years
    } 
    
    const currentYear = new Date().getFullYear()
    return ['all', ...Array.from({ length: 10 }, (_, i) => String(currentYear - i))]
  }, [years])
  
  const handleYearChange = React.useCallback(
    (year: string) => {
      // Always call both onChange and setSelectedYear to ensure consistency
      if (onChange) {
        onChange(year)
      }
      
      // Always update context state regardless of onChange prop
      setSelectedYear(year)
    },
    [onChange, setSelectedYear]
  )
  
  // Determine which value to display (controlled vs uncontrolled)
  const effectiveValue = value !== undefined ? value : selectedYear
  
  const displayValue = React.useMemo(() => {
    return effectiveValue === 'all' ? 'Toutes les années' : effectiveValue
  }, [effectiveValue])
  
  return (
    <div className={cn("relative", label ? "space-y-2" : "")}>
      {label && (
        <label className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">{label}</label>
      )}
      <Select 
        onValueChange={handleYearChange} 
        value={effectiveValue}
        disabled={disabled}
      >
        <SelectTrigger 
          className={cn(
            "w-full transition-all duration-200",
            showIcon ? "pl-2" : "",
            disabled ? "opacity-70 cursor-not-allowed" : "hover:border-primary/80",
            className
          )}
        >
          {showIcon && <Calendar className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />}
          <SelectValue placeholder={placeholder}>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <SelectItem value="all" className="cursor-pointer">Toutes les années</SelectItem>
          {yearOptions.filter(year => year !== 'all').map((year) => (
            <SelectItem key={year} value={year} className="cursor-pointer">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}