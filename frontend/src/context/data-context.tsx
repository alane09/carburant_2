"use client"

import { VehicleRecord } from "@/lib/api"
import StorageService, { SERCoefficient, UploadedFile, UserPreferences } from "@/lib/storage-service"
import { createContext, useContext, useEffect, useState } from "react"

interface DataContextType {
  // Vehicle records
  vehicleRecords: VehicleRecord[]
  setVehicleRecords: (records: VehicleRecord[]) => void
  addVehicleRecord: (record: VehicleRecord) => void
  updateVehicleRecord: (id: string, record: VehicleRecord) => void
  deleteVehicleRecord: (id: string) => void
  
  // Uploaded files
  uploadedFiles: UploadedFile[]
  setUploadedFiles: (files: UploadedFile[]) => void
  addUploadedFile: (file: UploadedFile) => void
  deleteUploadedFile: (id: string) => void
  
  // User preferences
  userPreferences: UserPreferences
  setUserPreferences: (preferences: UserPreferences) => void
  updateUserPreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void
  
  // SER coefficients
  serCoefficients: SERCoefficient[]
  setSERCoefficients: (coefficients: SERCoefficient[]) => void
  addSERCoefficient: (coefficient: SERCoefficient) => void
  updateSERCoefficient: (vehicleType: string, coefficient: SERCoefficient) => void
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Vehicle records state
  const [vehicleRecords, setVehicleRecordsState] = useState<VehicleRecord[]>([])
  
  // Uploaded files state
  const [uploadedFiles, setUploadedFilesState] = useState<UploadedFile[]>([])
  
  // User preferences state
  const [userPreferences, setUserPreferencesState] = useState<UserPreferences>(
    StorageService.loadUserPreferences()
  )
  
  // SER coefficients state
  const [serCoefficients, setSERCoefficientsState] = useState<SERCoefficient[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Initialize data from storage
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true)
        
        // Load vehicle records
        const records = await StorageService.loadVehicleRecords()
        setVehicleRecordsState(records)
        
        // Load uploaded files
        const files = await StorageService.loadUploadedFiles()
        setUploadedFilesState(files)
        
        // Load user preferences (already loaded in state initialization)
        
        // Load SER coefficients
        const coefficients = StorageService.loadSERCoefficients()
        setSERCoefficientsState(coefficients)
        
        setIsInitialized(true)
      } catch (error) {
        console.error("Error initializing data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeData()
  }, [])
  
  // Save vehicle records when they change
  useEffect(() => {
    if (isInitialized && vehicleRecords.length > 0) {
      StorageService.saveVehicleRecords(vehicleRecords)
    }
  }, [vehicleRecords, isInitialized])
  
  // Save uploaded files when they change
  useEffect(() => {
    if (isInitialized && uploadedFiles.length > 0) {
      StorageService.saveUploadedFiles(uploadedFiles)
    }
  }, [uploadedFiles, isInitialized])
  
  // Save user preferences when they change
  useEffect(() => {
    if (isInitialized) {
      StorageService.saveUserPreferences(userPreferences)
    }
  }, [userPreferences, isInitialized])
  
  // Save SER coefficients when they change
  useEffect(() => {
    if (isInitialized && serCoefficients.length > 0) {
      StorageService.saveSERCoefficients(serCoefficients)
    }
  }, [serCoefficients, isInitialized])
  
  // Vehicle records functions
  const setVehicleRecords = (records: VehicleRecord[]) => {
    setVehicleRecordsState(records)
  }
  
  const addVehicleRecord = (record: VehicleRecord) => {
    setVehicleRecordsState((prevRecords) => [...prevRecords, record])
  }
  
  const updateVehicleRecord = (id: string, record: VehicleRecord) => {
    setVehicleRecordsState((prevRecords) =>
      prevRecords.map((r) => (r.id === id ? record : r))
    )
  }
  
  const deleteVehicleRecord = (id: string) => {
    setVehicleRecordsState((prevRecords) =>
      prevRecords.filter((r) => r.id !== id)
    )
  }
  
  // Uploaded files functions
  const setUploadedFiles = (files: UploadedFile[]) => {
    setUploadedFilesState(files)
  }
  
  const addUploadedFile = (file: UploadedFile) => {
    setUploadedFilesState((prevFiles) => [...prevFiles, file])
  }
  
  const deleteUploadedFile = (id: string) => {
    setUploadedFilesState((prevFiles) =>
      prevFiles.filter((f) => f.id !== id)
    )
  }
  
  // User preferences functions
  const setUserPreferences = (preferences: UserPreferences) => {
    setUserPreferencesState(preferences)
  }
  
  const updateUserPreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setUserPreferencesState((prevPreferences) => ({
      ...prevPreferences,
      [key]: value,
    }))
  }
  
  // SER coefficients functions
  const setSERCoefficients = (coefficients: SERCoefficient[]) => {
    setSERCoefficientsState(coefficients)
  }
  
  const addSERCoefficient = (coefficient: SERCoefficient) => {
    setSERCoefficientsState((prevCoefficients) => [...prevCoefficients, coefficient])
  }
  
  const updateSERCoefficient = (vehicleType: string, coefficient: SERCoefficient) => {
    setSERCoefficientsState((prevCoefficients) => {
      const index = prevCoefficients.findIndex((c) => c.vehicleType === vehicleType)
      
      if (index !== -1) {
        const newCoefficients = [...prevCoefficients]
        newCoefficients[index] = coefficient
        return newCoefficients
      }
      
      return [...prevCoefficients, coefficient]
    })
  }
  
  const contextValue: DataContextType = {
    // Vehicle records
    vehicleRecords,
    setVehicleRecords,
    addVehicleRecord,
    updateVehicleRecord,
    deleteVehicleRecord,
    
    // Uploaded files
    uploadedFiles,
    setUploadedFiles,
    addUploadedFile,
    deleteUploadedFile,
    
    // User preferences
    userPreferences,
    setUserPreferences,
    updateUserPreference,
    
    // SER coefficients
    serCoefficients,
    setSERCoefficients,
    addSERCoefficient,
    updateSERCoefficient,
    
    // Loading states
    isLoading,
    isInitialized,
  }
  
  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  
  return context
}
