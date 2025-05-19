"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  initialDate?: {
    from: Date | undefined
    to: Date | undefined
  }
  initialYear?: string
  className?: string
  onChange: (value: {
    preset: "custom" | "year"
    from?: Date
    to?: Date
    year?: string
  }) => void
}

export function DateRangePicker({
  initialDate,
  initialYear,
  className,
  onChange
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: initialDate?.from,
    to: initialDate?.to,
  })

  const [selectedYear, setSelectedYear] = React.useState<string>(
    initialYear || new Date().getFullYear().toString()
  )

  const [mode, setMode] = React.useState<"custom" | "year">(
    initialDate ? "custom" : "year"
  )
  
  // Track if popover is open
  const [open, setOpen] = React.useState(false)

  // Generate year options (current year and 5 previous years)
  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => (currentYear - i).toString())
  }, [])

  // Handle date selection in the calendar
  const handleSelect = (range: { from: Date; to: Date }) => {
    setDate(range)
    setMode("custom")
    onChange({
      preset: "custom",
      from: range.from,
      to: range.to
    })
    setOpen(false) // Close popover after selection
  }

  // Handle year selection
  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }
  
  // Handle apply button click for year selection
  const handleApplyYear = () => {
    setMode("year")
    onChange({
      preset: "year",
      year: selectedYear
    })
    setOpen(false) // Close popover after applying year
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date.from && !selectedYear && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {mode === "year" ? (
              <span>Année: {selectedYear}</span>
            ) : date.from ? (
              date.to ? (
                <span>
                  {format(date.from, "d MMMM yyyy", { locale: fr })} -{" "}
                  {format(date.to, "d MMMM yyyy", { locale: fr })}
                </span>
              ) : (
                <span>{format(date.from, "d MMMM yyyy", { locale: fr })}</span>
              )
            ) : (
              <span>Sélectionner une période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Select
                value={mode}
                onValueChange={(value) => setMode(value as "custom" | "year")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Mode de sélection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">Par année</SelectItem>
                  <SelectItem value="custom">Période personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {mode === "year" ? (
            <div className="p-4 space-y-4">
              <Select
                value={selectedYear}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                onClick={handleApplyYear}
              >
                Appliquer
              </Button>
            </div>
          ) : (
            <Calendar
              mode="range"
              defaultMonth={date.from}
              selected={date}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  handleSelect(range as { from: Date; to: Date })
                }
              }}
              numberOfMonths={2}
              locale={fr}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}