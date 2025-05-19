import { create } from "zustand"

// Standardized vehicle types - using lowercase for consistent API interaction
export type VehicleType = 'all' | 'voitures' | 'camions' | 'chariots' | string

interface VehicleTypeState {
  types: VehicleType[]
  selectedType: VehicleType
  isLoading: boolean
  error: string | null
  setSelectedType: (type: VehicleType) => void
  resetType: () => void
  isAllCategory: () => boolean
  getVehicleTypeForApi: () => string
  // Normalize legacy uppercase types to new lowercase format
  normalizeVehicleType: (type: string) => VehicleType
}

export const useVehicleType = create<VehicleTypeState>()((set, get) => ({
  types: ['all', 'voitures', 'camions', 'chariots'],
  selectedType: 'all',
  isLoading: false,
  error: null,
  setSelectedType: (type) => {
    // Normalize any legacy vehicle type format to the new format
    const normalizedType = get().normalizeVehicleType(type);
    set({ selectedType: normalizedType });
  },
  resetType: () => set({ selectedType: 'all' }),
  isAllCategory: () => get().selectedType === 'all',
  // Return the exact selectedType as the backend expects the exact type string
  getVehicleTypeForApi: () => get().selectedType === 'all' ? 'all' : get().selectedType,
  // Helper to normalize vehicle types
  normalizeVehicleType: (type: string): VehicleType => {
    if (!type) return 'all';
    
    const typeLower = type.toLowerCase();
    if (typeLower === 'all') return 'all';
    if (typeLower === 'voiture' || typeLower === 'voitures' || type === 'VOITURE') return 'voitures';
    if (typeLower === 'camion' || typeLower === 'camions' || type === 'CAMION') return 'camions';
    if (typeLower === 'chariot' || typeLower === 'chariots' || type === 'CHARIOT') return 'chariots';
    
    return 'all';
  }
}))