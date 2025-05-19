/**
 * Comprehensive formatting utilities for the application
 */

/**
 * Format a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Format a number with specified decimal places
 */
export function formatNumber(
  value: number | undefined | null,
  options: {
    decimals?: number;
    locale?: string;
    style?: 'decimal' | 'currency' | 'percent';
    currency?: string;
  } = {}
): string {
  const {
    decimals = 2,
    locale = 'fr-FR',
    style = 'decimal',
    currency = 'TND'
  } = options;

  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat(locale, {
    style,
    currency: style === 'currency' ? currency : undefined,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a currency value
 */
export function formatCurrency(
  value: number | undefined | null,
  options: {
    decimals?: number;
    locale?: string;
    currency?: string;
  } = {}
): string {
  return formatNumber(value, { ...options, style: 'currency' });
}

/**
 * Format a date string to a locale string
 */
export function formatDate(
  date: string | Date | undefined | null,
  options: {
    locale?: string;
    format?: 'short' | 'medium' | 'long' | 'full';
    includeTime?: boolean;
  } = {}
): string {
  const {
    locale = 'fr-FR',
    format = 'long',
    includeTime = false
  } = options;

  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: format === 'short' ? 'numeric' : 'long',
      day: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit'
      })
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a percentage value
 */
export function formatPercentage(
  value: number | undefined | null,
  options: {
    decimals?: number;
    locale?: string;
  } = {}
): string {
  return formatNumber(value, { ...options, style: 'percent' });
}

/**
 * Format a number with high precision for scientific/technical display
 */
export function formatPreciseNumber(
  value: number | undefined | null,
  options: {
    precision?: number;
    maxDecimals?: number;
    minDecimals?: number;
  } = {}
): string {
  const {
    precision = 6,
    maxDecimals = 6,
    minDecimals = 0
  } = options;

  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }

  // Handle very small values that are effectively zero
  if (Math.abs(value) < Math.pow(10, -precision)) {
    return '0'.padEnd(minDecimals + 2, '0');
  }

  // Handle extremely large values
  if (Math.abs(value) > Math.pow(10, precision)) {
    return value > 0 
      ? `1e${precision}+` 
      : `-1e${precision}+`;
  }

  return value.toFixed(maxDecimals)
    .replace(/\.?0+$/, '') // Remove trailing zeros
    .padEnd(minDecimals + 2, '0'); // Ensure minimum decimal places
}
