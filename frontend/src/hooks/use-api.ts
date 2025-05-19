"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api1'

interface UseApiOptions<T> {
  initialData?: T
  dependencies?: unknown[]
  cacheKey?: string
  cacheDuration?: number // in milliseconds
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  errorMessage?: string
  successMessage?: string
  retries?: number
  retryDelay?: number
}

/**
 * Custom hook for API data fetching with caching, error handling, and abort control
 * 
 * @param fetchFn - The API fetch function to call
 * @param options - Configuration options
 * @returns Object containing data, loading state, error state, and refetch function
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const {
    initialData,
    dependencies = [],
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    onSuccess,
    onError,
    errorMessage = 'An error occurred',
    successMessage,
    retries = 1,
    retryDelay = 1000,
  } = options

  const [data, setData] = useState<T | undefined>(initialData)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const cacheTimeoutRef = useRef<NodeJS.Timeout>()

  const execute = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    let attempts = 0
    let lastError: Error | null = null

    while (attempts <= retries) {
          try {
        const result = await apiCall()
        setData(result)
        if (successMessage) {
          toast.success(successMessage)
        }
        onSuccess?.(result)
        return result
      } catch (err) {
        lastError = err as Error
        attempts++
        if (attempts <= retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }

    setError(lastError)
    toast.error(errorMessage)
    onError?.(lastError!)
    throw lastError
  }, [apiCall, errorMessage, onError, onSuccess, retries, retryDelay, successMessage])

  useEffect(() => {
    execute()

    if (cacheKey) {
      // Clear previous cache timeout
      if (cacheTimeoutRef.current) {
        clearTimeout(cacheTimeoutRef.current)
      }

      // Set new cache timeout
      cacheTimeoutRef.current = setTimeout(() => {
        execute()
      }, cacheDuration)
      }

    return () => {
      if (cacheTimeoutRef.current) {
        clearTimeout(cacheTimeoutRef.current)
      }
    }
  }, [...dependencies, execute, cacheKey, cacheDuration])

  return {
    data,
    error,
    isLoading,
    refetch: execute,
  }
}

// Convenience hooks for specific API endpoints
export function useVehicles(params: { type?: string; mois?: string; matricule?: string } = {}) {
  return useApi(() => api.vehicle.getAll(params))
}

export function useRegression(type: string) {
  return useApi(() => api.regression.getByType(type))
}

export function useReports() {
  return useApi(() => api.reports.getAll())
}

export function useVehicleTypes() {
  return useApi(() => api.upload.getVehicleTypes())
}
