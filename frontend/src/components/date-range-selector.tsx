"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { YearSelector } from "@/components/year-selector"
import { useDateRange } from "@/hooks/use-date-range"
import { cn } from "@/lib/utils"
import { addYears, format, isSameMonth, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { motion } from "framer-motion"
import { CalendarIcon, ChevronDown, InfoIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export function DateRangeSelector() {
  const { dateRange, setYear, setCustomRange, setRangeType } = useDateRange()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [temporaryRange, setTemporaryRange] = useState<{
    from?: Date;
    to?: Date;
  }>({})
  const isInitialMount = useRef(true)

  // Handle year selection
  const handleYearChange = (year: string) => {
    if (!year) return
    
    // This ensures the year is always properly set in the state
    setYear(year)
    
    // Important: explicitly set the range type to year
    setRangeType('year')
    
    // Show confirmation to user
    toast.success(`Données filtrées pour l'année ${year}`, {
      description: "Le tableau de bord a été mis à jour",
      duration: 2000,
    })
  }
  
  // Handle custom date range selection - fixed to work with Calendar's DateRange type
  const handleDateRangeChange = (range: { from?: Date, to?: Date } | undefined) => {
    // Only update if we have a valid range with at least a start date
    if (range && range.from) {
      setTemporaryRange(range)
    }
  }

  // Quick date range options
  const setQuickDateRange = (months: number) => {
    const end = new Date()
    const start = subMonths(end, months)
    setTemporaryRange({ from: start, to: end })
  }
  
  // Apply selected date range
  const applyDateRange = () => {
    if (temporaryRange.from && temporaryRange.to) {
      setCustomRange(temporaryRange.from, temporaryRange.to)
      setRangeType('custom')
      setIsCalendarOpen(false)
      
      // Show confirmation to user
      const fromDate = format(temporaryRange.from, "dd/MM/yyyy")
      const toDate = format(temporaryRange.to, "dd/MM/yyyy")
      toast.success(`Période personnalisée appliquée: ${fromDate} - ${toDate}`, {
        description: "Le tableau de bord a été mis à jour",
        duration: 2000,
      })
      
      // Reset temporary range
      setTemporaryRange({})
    } else {
      toast.error("Veuillez sélectionner une période complète (début et fin)")
    }
  }
  
  // Reset to current selection when opening the calendar
  useEffect(() => {
    if (isCalendarOpen) {
      if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
        setTemporaryRange({
          from: dateRange.startDate,
          to: dateRange.endDate
        })
      } else {
        // Default to last month if no custom range is set
        const end = new Date()
        const start = subMonths(end, 1)
        setTemporaryRange({ from: start, to: end })
      }
    }
  }, [isCalendarOpen, dateRange])
  
  // Warn when selecting a date range spanning more than 1 year
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    
    if (temporaryRange.from && temporaryRange.to) {
      const oneYearFromStart = addYears(temporaryRange.from, 1)
      if (temporaryRange.to > oneYearFromStart) {
        toast.warning("Sélection d'une période supérieure à 1 an", {
          description: "Cela peut affecter les performances et la lisibilité",
          duration: 4000,
        })
      }
    }
  }, [temporaryRange.from, temporaryRange.to])

  // Format date for display with proper localization
  const formatDateRange = () => {
    if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
      // If same month, only show the month once
      if (isSameMonth(dateRange.startDate, dateRange.endDate)) {
        return `${format(dateRange.startDate, "d", { locale: fr })} - ${format(dateRange.endDate, "d MMMM yyyy", { locale: fr })}`
      }
      // If same year, only show the year once
      if (dateRange.startDate.getFullYear() === dateRange.endDate.getFullYear()) {
        return `${format(dateRange.startDate, "d MMM", { locale: fr })} - ${format(dateRange.endDate, "d MMM yyyy", { locale: fr })}`
      }
      // Different years
      return `${format(dateRange.startDate, "d MMM yyyy", { locale: fr })} - ${format(dateRange.endDate, "d MMM yyyy", { locale: fr })}`
    }
    return "Sélectionner une période"
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap items-center gap-2"
      >
        <Tabs 
          defaultValue={dateRange.type} 
          className="w-[320px]"
          onValueChange={(value) => {
            if (value === 'year' && dateRange.year) {
              setRangeType('year')
            } else if (value === 'custom' && dateRange.startDate && dateRange.endDate) {
              setRangeType('custom')
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger 
              value="year"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              Par année
            </TabsTrigger>
            <TabsTrigger 
              value="custom" 
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              Personnalisé
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-2">
            {dateRange.type === 'year' ? (
              <YearSelector
                value={dateRange.year}
                onChange={handleYearChange}
                showIcon={true}
                placeholder="Sélectionner une année"
                className="w-full transition-all duration-200 focus-within:ring-1 focus-within:ring-primary"
              />
            ) : (
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange.type === 'custom' ? "default" : "outline"}
                    className={cn(
                      "justify-between text-left font-normal w-full ring-offset-background group",
                      !dateRange.startDate && "text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="truncate">
                        {dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate
                          ? formatDateRange()
                          : "Sélectionner une période"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-all" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 shadow-md" align="start">
                  <div className="p-2 border-b flex justify-between items-center">
                    <span className="text-sm font-medium">Période personnalisée</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            Sélectionnez une date de début et de fin pour filtrer les données
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="p-2 border-b">
                    <div className="flex flex-wrap gap-1.5 justify-between">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setQuickDateRange(1)}
                        className="h-7 text-xs"
                      >
                        1 mois
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setQuickDateRange(3)}
                        className="h-7 text-xs"
                      >
                        3 mois
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setQuickDateRange(6)}
                        className="h-7 text-xs"
                      >
                        6 mois
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setQuickDateRange(12)}
                        className="h-7 text-xs"
                      >
                        1 an
                      </Button>
                    </div>
                  </div>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={temporaryRange.from || (dateRange.type === 'custom' && dateRange.startDate) ? 
                      dateRange.startDate : new Date()}
                    selected={temporaryRange.from ? {
                      from: temporaryRange.from,
                      to: temporaryRange.to,
                    } : undefined}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                    locale={fr}
                    className="border-b"
                  />
                  <div className="p-3 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsCalendarOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Annuler
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={applyDateRange}
                      disabled={!temporaryRange.from || !temporaryRange.to}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      Appliquer
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </Tabs>
      </motion.div>
      
      {/* Current selection display - only show when no filters are active elsewhere */}
      <div className="text-xs text-muted-foreground">
        {dateRange.type === 'year' && dateRange.year ? (
          <p>Données pour l&apos;année {dateRange.year}</p>
        ) : dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate ? (
          <p>
            Période: {format(dateRange.startDate, "d MMMM yyyy", { locale: fr })} au {format(dateRange.endDate, "d MMMM yyyy", { locale: fr })}
          </p>
        ) : null}
      </div>
    </div>
  )
}