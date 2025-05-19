"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReportsAPI } from "@/lib/api"
import { useState, useCallback } from "react"
import { toast } from "sonner"
import { CalendarIcon, Download } from "lucide-react"
import { DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"
import { fr } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface ReportType {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

interface ReportGeneratorClientProps {
  reportTypes: ReportType[]
  vehicleTypes: string[]
}

export function ReportGeneratorClient({ reportTypes, vehicleTypes }: ReportGeneratorClientProps) {
  const [selectedReportType, setSelectedReportType] = useState<string>("")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [isGenerating, setIsGenerating] = useState(false)

  // Memoized generate report handler
  const handleGenerateReport = useCallback(async () => {
    if (!selectedReportType) {
      toast.error("Veuillez sélectionner un type de rapport")
      return
    }

    if (!selectedVehicleType) {
      toast.error("Veuillez sélectionner un type de véhicule")
      return
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Veuillez sélectionner une période")
      return
    }

    setIsGenerating(true)

    try {
      const params = {
        type: selectedReportType,
        vehicleType: selectedVehicleType,
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : format(dateRange.from, "yyyy-MM-dd"),
        options: {
          format: "PDF",
          includeCharts: true,
          includeRawData: false,
        },
      }

      const result = await ReportsAPI.generateReport(params)

      if (result) {
        toast.success("Rapport généré avec succès. Vous pouvez le télécharger dans la liste des rapports.")
      } else {
        toast.error("Erreur lors de la génération du rapport")
      }
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Erreur lors de la génération du rapport")
    } finally {
      setIsGenerating(false)
    }
  }, [selectedReportType, selectedVehicleType, dateRange])

  return (
    <Card className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
          Générer un nouveau rapport
        </CardTitle>
        <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
          Sélectionnez les paramètres pour générer un rapport personnalisé
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#4B5563] dark:text-[#E2E8F0]">
            Type de rapport
          </label>
          <Select value={selectedReportType} onValueChange={setSelectedReportType}>
            <SelectTrigger className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C]">
              <SelectValue placeholder="Sélectionner un type de rapport" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center">
                    <span className="mr-2">{type.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[#4B5563] dark:text-[#E2E8F0]">
            Type de véhicule
          </label>
          <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
            <SelectTrigger className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C]">
              <SelectValue placeholder="Sélectionner un type de véhicule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les véhicules</SelectItem>
              {vehicleTypes.map((type) => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[#4B5563] dark:text-[#E2E8F0]">
            Période
          </label>
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yyyy", { locale: fr })} -{" "}
                        {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: fr })
                    )
                  ) : (
                    <span>Sélectionner une période</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating || !selectedReportType || !selectedVehicleType || !dateRange?.from}
          className="w-full bg-[#4CAF50] hover:bg-[#43A047] dark:bg-[#48BB78] dark:hover:bg-[#38A169]"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Génération en cours...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Générer le rapport
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
