"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { useVehicleType } from "@/hooks/use-vehicle-type"
import { useYear } from "@/hooks/use-year"
import { VehicleAPI } from "@/lib/api"
import * as React from "react"

const MatriculeContext = React.createContext<{
  selectedMatricules: string[]
  setSelectedMatricules: (matricules: string[]) => void
  matricules: string[]
  toggleMatricule: (matricule: string) => void
  isLoading: boolean
}>(undefined!)

export interface MatriculeProviderProps {
  children: React.ReactNode
  initialMatricules?: string[] | string | null
}

export function MatriculeProvider({
  children,
  initialMatricules = [],
}: MatriculeProviderProps) {
  // Convert single matricule to array for backward compatibility
  const initialMatriculesArray = React.useMemo(() => {
    if (!initialMatricules) return []
    if (Array.isArray(initialMatricules)) return initialMatricules
    return [initialMatricules]
  }, [initialMatricules])

  const [selectedMatricules, setSelectedMatricules] = React.useState<string[]>(
    initialMatriculesArray
  )
  const [matricules, setMatricules] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const { selectedType } = useVehicleType()
  const { selectedYear } = useYear()
  
  // Load matricule options when type or year changes
  React.useEffect(() => {
    let isMounted = true;
    
    async function fetchMatricules() {
      if (!selectedType || !selectedYear) return;
      
      setIsLoading(true);
      try {
        // Get all records and extract unique matricules
        const records = await VehicleAPI.getRecords({
          type: selectedType,
          year: selectedYear
        })
        
        if (!isMounted) return;
        
        const uniqueMatricules = Array.from(new Set(records.map(r => r.matricule)))
        setMatricules(uniqueMatricules)
        
        // Filter out any selected matricules that are no longer in the list
        if (selectedMatricules.length > 0) {
          const validMatricules = selectedMatricules.filter(m => uniqueMatricules.includes(m))
          if (validMatricules.length !== selectedMatricules.length) {
            setSelectedMatricules(validMatricules)
          }
        }
      } catch (error) {
        console.error("Error fetching matricule list:", error)
        if (isMounted) {
          setMatricules([])
          toast({
            title: "Erreur",
            description: "Impossible de charger la liste des véhicules",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    fetchMatricules()
    
    return () => {
      isMounted = false;
    }
  }, [selectedType, selectedYear, selectedMatricules])

  const toggleMatricule = React.useCallback((matricule: string) => {
    setSelectedMatricules(prev => {
      if (prev.includes(matricule)) {
        return prev.filter(m => m !== matricule)
      } else {
        return [...prev, matricule]
      }
    })
  }, [])
  
  const value = React.useMemo(
    () => ({
      selectedMatricules,
      setSelectedMatricules,
      matricules,
      toggleMatricule,
      isLoading,
    }),
    [selectedMatricules, matricules, toggleMatricule, isLoading]
  )
  
  return <MatriculeContext.Provider value={value}>{children}</MatriculeContext.Provider>
}

export function useMatricule() {
  const context = React.useContext(MatriculeContext)
  if (!context) {
    throw new Error("useMatricule must be used within a MatriculeProvider")
  }
  return context
}

export interface MatriculeSelectorProps {
  className?: string
  value?: string[] | string | null
  onChange?: (value: string[]) => void
  availableMatricules?: string[]
  placeholder?: string
  maxSelections?: number
  isLoading?: boolean
}

export function MatriculeSelector({
  className = "",
  value,
  onChange,
  availableMatricules,
  placeholder = "Sélectionner des véhicules",
  maxSelections = 10,
  isLoading = false,
}: MatriculeSelectorProps) {
  const { selectedMatricules, setSelectedMatricules, matricules: contextMatricules, toggleMatricule } = useMatricule()
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  
  // Use provided availableMatricules or fallback to contextMatricules
  const availableOptions = availableMatricules || contextMatricules
  
  // Handle controlled vs uncontrolled component
  const selectedValues = React.useMemo(() => {
    if (value !== undefined) {
      if (Array.isArray(value)) return value
      return value ? [value] : []
    }
    return selectedMatricules
  }, [value, selectedMatricules])
  
  const filteredMatricules = React.useMemo(() => {
    if (isLoading) return []
    if (!searchValue) return availableOptions
    return availableOptions.filter(matricule =>
      matricule.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [availableOptions, searchValue, isLoading])
  
  const handleSelect = React.useCallback((matricule: string) => {
    // Don't allow selection if maxSelections is reached and the matricule isn't already selected
    if (selectedValues.length >= maxSelections && !selectedValues.includes(matricule)) {
      toast({
        title: "Limite atteinte",
        description: `Vous ne pouvez sélectionner que ${maxSelections} véhicules maximum.`,
        variant: "destructive",
      })
      return
    }
    
    if (onChange) {
      const newSelection = selectedValues.includes(matricule)
        ? selectedValues.filter(m => m !== matricule)
        : [...selectedValues, matricule]
      onChange(newSelection)
    } else {
      toggleMatricule(matricule)
    }
  }, [onChange, selectedValues, toggleMatricule, maxSelections])
  
  const removeMatricule = React.useCallback((matricule: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onChange) {
      onChange(selectedValues.filter(m => m !== matricule))
    } else {
      setSelectedMatricules(selectedValues.filter(m => m !== matricule))
    }
  }, [onChange, selectedValues, setSelectedMatricules])
  
  const clearAll = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onChange) {
      onChange([])
    } else {
      setSelectedMatricules([])
    }
  }, [onChange, setSelectedMatricules])
  
  const isMaxSelected = selectedValues.length >= maxSelections
  
  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 p-2"
          >
            <div className="flex flex-wrap gap-1 flex-1 text-left">
              {selectedValues.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selectedValues.map((matricule) => (
                  <Badge
                    key={matricule}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1.5 py-0.5 text-xs"
                  >
                    {matricule}
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMatricule(matricule, e);
                      }}
                      className="rounded-full h-3.5 w-3.5 flex items-center justify-center hover:bg-secondary-foreground/20 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </div>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Rechercher un véhicule..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="h-9"
            />
            <CommandEmpty>Aucun véhicule trouvé.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                <ScrollArea className="max-h-[200px] overflow-y-auto">
                  {filteredMatricules.map((matricule) => {
                    const isSelected = selectedValues.includes(matricule)
                    return (
                      <CommandItem
                        key={matricule}
                        value={matricule}
                        onSelect={() => handleSelect(matricule)}
                        disabled={!isSelected && isMaxSelected}
                        className="cursor-pointer"
                      >
                        <div className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                        )}>
                          <Check className={cn("h-4 w-4")} />
                        </div>
                        <span>{matricule}</span>
                      </CommandItem>
                    )
                  })}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
              <span>
                {selectedValues.length} / {maxSelections} sélectionnés
              </span>
              {selectedValues.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={clearAll}
                >
                  Tout effacer
                </Button>
              )}
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}