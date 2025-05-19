/**
 * Utility functions for API data handling
 */

import { VehicleRecord, MonthlyData, VehicleTypeBreakdown } from '@/types/dashboard';

/**
 * Calculate monthly aggregates from vehicle records
 * Processes raw vehicle records into aggregated monthly data for charts
 */
export function calculateMonthlyAggregates(records: VehicleRecord[]): MonthlyData[] {
  if (!records || records.length === 0) {
    return [];
  }

  const monthlyData = records.reduce((acc, record) => {
    // Ensure we have the month value (using mois field from backend)
    const month = record.mois || 'Unknown';
    
    if (!acc[month]) {
      acc[month] = {
        month,
        year: record.year || '',
        consommation: 0,
        kilometrage: 0,
        produitsTonnes: 0,
        tonnage: 0, // Alias for produitsTonnes for frontend compatibility
        ipe: 0,
        ipeTonne: 0,
        count: 0,
      };
    }
    
    // Use the correct field names from the backend
    acc[month].consommation += record.consommationL || 0;
    acc[month].kilometrage += record.kilometrage || 0;
    acc[month].produitsTonnes += record.produitsTonnes || 0;
    acc[month].tonnage += record.produitsTonnes || 0; // Duplicate for frontend compatibility
    acc[month].ipe += record.ipeL100km || 0;
    acc[month].ipeTonne += record.ipeL100TonneKm || 0;
    acc[month].count++;
    
    return acc;
  }, {} as Record<string, MonthlyData>);

  // Calculate averages and convert to array
  return Object.values(monthlyData).map(data => ({
    ...data,
    ipe: data.count > 0 ? data.ipe / data.count : 0,
    ipeTonne: data.count > 0 ? data.ipeTonne / data.count : 0,
  }));
}

/**
 * Calculate vehicle type breakdown
 * Processes records to get consumption breakdown by vehicle type
 */
export function calculateVehicleTypeBreakdown(records: VehicleRecord[]): VehicleTypeBreakdown[] {
  if (!records || records.length === 0) {
    return [];
  }

  const breakdown = records.reduce((acc, record) => {
    // Use the type field from the backend
    const type = record.type || 'Unknown';
    
    if (!acc[type]) {
      acc[type] = {
        name: type,
        value: 0,
      };
    }
    
    // Use consommationL from the backend
    acc[type].value += record.consommationL || 0;
    return acc;
  }, {} as Record<string, VehicleTypeBreakdown>);

  return Object.values(breakdown);
}

/**
 * Format number with French locale
 * @param value The number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string with French locale
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00';
  }
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format date to French locale
 * @param date Date string to format
 * @returns Formatted date string with French locale
 */
export function formatDate(date: string): string {
  if (!date) return '';
  
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return date;
  }
}

/**
 * Map backend field names to frontend field names
 * This helps maintain compatibility between backend and frontend
 * @param record The vehicle record from the backend
 * @returns A record with frontend-compatible field names
 */
export function mapBackendToFrontend(record: VehicleRecord): VehicleRecord {
  return {
    ...record,
    // Map backend fields to frontend fields
    vehicleType: record.type,
    consommation: record.consommationL,
    tonnage: record.produitsTonnes,
    // Keep original fields
    type: record.type,
    consommationL: record.consommationL,
    produitsTonnes: record.produitsTonnes,
  };
}

/**
 * Get month name in French
 * @param monthNumber Month number (1-12)
 * @returns French month name
 */
export function getFrenchMonthName(monthNumber: number): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  return months[monthNumber - 1] || '';
}
