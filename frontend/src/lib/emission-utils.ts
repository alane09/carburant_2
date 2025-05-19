import { VehicleRecord } from '@/types/dashboard';

// Emission factors (kg CO2 per liter)
const EMISSION_FACTORS = {
  DIESEL: 2.68,
  ESSENCE: 2.31,
  ELECTRIC: 0.0, // Direct emissions only
};

// LCA factors (environmental impact score)
const LCA_FACTORS = {
  DIESEL: 1.0,
  ESSENCE: 0.9,
  ELECTRIC: 0.5,
};

export interface EmissionData {
  totalEmissions: number;
  lcaScore: number;
  monthlyEmissions: Array<{
    month: string;
    value: number;
  }>;
  vehicleType: string;
}

/**
 * Calculate CO2 emissions from fuel consumption
 */
export function calculateEmissions(consumption: number, fuelType: 'DIESEL' | 'ESSENCE' | 'ELECTRIC' = 'DIESEL'): number {
  return consumption * EMISSION_FACTORS[fuelType];
}

/**
 * Calculate LCA score based on fuel type and consumption
 */
export function calculateLCAScore(consumption: number, fuelType: 'DIESEL' | 'ESSENCE' | 'ELECTRIC' = 'DIESEL'): number {
  return consumption * LCA_FACTORS[fuelType];
}

/**
 * Process vehicle records to calculate emissions and LCA data
 * @param records Vehicle records from the backend
 * @param vehicleType Type of vehicle being analyzed
 * @returns Processed emission data for visualization
 */
export function processEmissionData(records: VehicleRecord[], vehicleType: string): EmissionData {
  // If no records or empty array, return null
  if (!records || records.length === 0) {
    throw new Error("No records available for emission calculation");
  }

  // Group by month
  const monthlyData = records.reduce((acc, record) => {
    // Use the mois field from the backend model
    const month = record.mois || 'Unknown';
    if (!acc[month]) {
      acc[month] = {
        month,
        consumption: 0,
      };
    }
    acc[month].consumption += record.consommationL || 0;
    return acc;
  }, {} as Record<string, { month: string; consumption: number }>);

  // Calculate total consumption
  const totalConsumption = Object.values(monthlyData).reduce((sum, data) => sum + data.consumption, 0);

  // Calculate emissions and LCA score
  const totalEmissions = calculateEmissions(totalConsumption);
  const lcaScore = calculateLCAScore(totalConsumption);

  // Format monthly data
  const monthlyEmissions = Object.values(monthlyData).map(data => ({
    month: data.month,
    value: calculateEmissions(data.consumption),
  }));

  return {
    totalEmissions,
    lcaScore,
    monthlyEmissions,
    vehicleType,
  };
}

/**
 * Validate vehicle records for emission calculations
 */
export function validateEmissionData(records: VehicleRecord[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!records || records.length === 0) {
    errors.push('No records provided');
    return { isValid: false, errors };
  }

  records.forEach((record, index) => {
    if (!record.mois) {
      errors.push(`Record ${index + 1}: Missing month`);
    }
    if (typeof record.consommationL !== 'number' || isNaN(record.consommationL)) {
      errors.push(`Record ${index + 1}: Invalid consumption value`);
    }
    if (record.consommationL < 0) {
      errors.push(`Record ${index + 1}: Negative consumption value`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
} 