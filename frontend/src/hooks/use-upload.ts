import { useCallback } from 'react'
import api from '@/lib/api1'

export function useUpload() {
  const uploadFile = useCallback(async (file: File) => {
    return api.upload.uploadFile(file)
  }, [])

  const saveData = useCallback(async (
    file: File,
    sheetName: string,
    year: string,
    month?: string,
    replaceExisting?: boolean
  ) => {
    return api.upload.saveData(file, sheetName, year, month, replaceExisting)
  }, [])

  const getVehicleTypes = useCallback(async () => {
    return api.upload.getVehicleTypes()
  }, [])

  return {
    uploadFile,
    saveData,
    getVehicleTypes
  }
} 