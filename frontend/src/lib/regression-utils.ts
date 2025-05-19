/**
 * IMPORTANT: This file no longer contains client-side regression calculations.
 * All regression calculations are now performed by the backend API.
 * These utility functions are only for formatting and calculating derived values
 * from the regression results returned by the API.
 */

/**
 * Calculate reference consumption based on regression coefficients from the backend
 * 
 * @param coefficients Regression coefficients from the backend API
 * @param kilometrage Kilometrage value
 * @param tonnage Tonnage value
 * @returns Reference consumption value
 */
export function calculateReferenceConsumption(
  coefficients: { kilometrage: number; tonnage: number; intercept: number },
  kilometrage: number,
  tonnage: number
): number {
  if (!coefficients || typeof kilometrage !== 'number' || typeof tonnage !== 'number') {
    return 0;
  }
  
  return (
    coefficients.intercept +
    coefficients.kilometrage * kilometrage +
    coefficients.tonnage * tonnage
  );
}

/**
 * Format a number with consistent precision for display
 * 
 * @param value Number to format
 * @param precision Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(value: number | undefined | null, precision: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "N/A";
  }
  
  return value.toFixed(precision);
}

/**
 * Calculate improvement percentage between actual and reference consumption
 * This calculates how much actual consumption deviates from reference, relative to actual
 * 
 * @param actual Actual consumption value
 * @param reference Reference consumption value
 * @returns Improvement percentage (positive means better than reference)
 */
export function calculateImprovement(actual: number, reference: number): number {
  if (!actual || !reference || actual === 0) {
    return 0;
  }
  
  // Positive value means actual is higher than reference (improvement potential)
  return ((actual - reference) / actual) * 100;
}

/**
 * Calculate target consumption based on actual consumption and improvement goal
 * 
 * @param actual Actual consumption value
 * @param improvementGoal Improvement goal percentage (e.g., 3 for 3%)
 * @returns Target consumption value
 */
export function calculateTargetConsumption(actual: number, improvementGoal: number = 3): number {
  if (!actual || actual === 0) {
    return 0;
  }
  
  return actual * (1 - (improvementGoal / 100));
}
