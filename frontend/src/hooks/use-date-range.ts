"use client"

import { createContext, createElement, useCallback, useContext, useState } from 'react'

// Export these types so they can be imported elsewhere
export type DateRange = 'year' | 'custom'
export interface DateRangeState {
  type: DateRange
  year?: string
  startDate?: Date
  endDate?: Date
}

interface DateRangeContextType {
  dateRange: DateRangeState
  setYear: (year: string) => void
  setCustomRange: (start: Date, end: Date) => void
  setRangeType: (type: DateRange) => void
  resetDateRange: () => void
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

export interface DateRangeProviderProps {
  children: React.ReactNode
  initialYear?: string
}

export function DateRangeProvider({
  children,
  initialYear = new Date().getFullYear().toString(),
}: DateRangeProviderProps) {
  // Default to the current year
  const [dateRange, setDateRange] = useState<DateRangeState>({
    type: 'year',
    year: initialYear,
  })
  
  // Set year and automatically switch type to 'year'
  const setYear = useCallback((year: string) => {
    setDateRange(prev => ({
      ...prev,
      type: 'year',
      year,
    }))
  }, [])
  
  // Set custom date range and automatically switch type to 'custom'
  const setCustomRange = useCallback((start: Date, end: Date) => {
    setDateRange({
      type: 'custom',
      startDate: start,
      endDate: end,
    })
  }, [])
  
  // Explicitly set the range type and preserve existing values
  const setRangeType = useCallback((type: DateRange) => {
    setDateRange(prev => ({
      ...prev,
      type,
    }))
  }, [])
  
  // Reset to default (current year)
  const resetDateRange = useCallback(() => {
    setDateRange({
      type: 'year',
      year: new Date().getFullYear().toString(),
    })
  }, [])
  
  const contextValue = {
    dateRange,
    setYear,
    setCustomRange,
    setRangeType,
    resetDateRange,
  }
  
  return createElement(DateRangeContext.Provider, { value: contextValue }, children)
}

export function useDateRange(): DateRangeContextType {
  const context = useContext(DateRangeContext)
  
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider')
  }
  
  return context
}