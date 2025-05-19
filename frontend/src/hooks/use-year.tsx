"use client"

import React, { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react"

export type Year = string

interface YearContextType {
  years: Year[]
  selectedYear: Year
  setSelectedYear: (year: Year) => void
  resetYear: () => void
}

const YearContext = createContext<YearContextType | undefined>(undefined)

export interface YearProviderProps {
  children: ReactNode
  initialYear?: Year
}

export function YearProvider({
  children,
  initialYear = "all",
}: YearProviderProps) {
  const [selectedYear, setSelectedYear] = useState<Year>(initialYear)
  
  // Generate list of years - last 10 years
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return ['all', ...Array.from({ length: 10 }, (_, i) => String(currentYear - i))]
  }, [])
  
  const resetYear = useCallback(() => {
    setSelectedYear("all")
  }, [])
  
  // Create a context value object
  const contextValue: YearContextType = {
    years,
    selectedYear,
    setSelectedYear,
    resetYear,
  }
  
  // Return the provider with the context value
  return (
    <YearContext.Provider value={contextValue}>
      {children}
    </YearContext.Provider>
  )
}

export function useYear(): YearContextType {
  const context = useContext(YearContext)
  
  if (!context) {
    throw new Error("useYear must be used within a YearProvider")
  }
  
  return context
}