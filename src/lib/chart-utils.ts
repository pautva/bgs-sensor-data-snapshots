// Chart utilities for consistent x-axis formatting and configuration
export interface XAxisConfig {
  format: 'time' | 'dateTime' | 'date';
  daysDiff: number;
  interval: 'preserveStartEnd' | number;
  angle: number;
  textAnchor: 'start' | 'middle' | 'end';
  height: number;
}

export interface ChartMargins {
  top: number;
  right: number;
  left: number;
  bottom: number;
}

/**
 * Calculate x-axis configuration based on date range
 */
export function getXAxisConfig(
  selectedStartDate?: Date,
  selectedEndDate?: Date
): XAxisConfig {
  if (!selectedStartDate || !selectedEndDate) {
    return {
      format: 'time',
      daysDiff: 1,
      interval: 'preserveStartEnd',
      angle: 0,
      textAnchor: 'middle',
      height: 20,
    };
  }

  const daysDiff = Math.ceil(
    (selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff <= 1) {
    return {
      format: 'time',
      daysDiff,
      interval: 'preserveStartEnd',
      angle: 0,
      textAnchor: 'middle',
      height: 20,
    };
  }

  if (daysDiff <= 7) {
    return {
      format: 'dateTime',
      daysDiff,
      interval: 'preserveStartEnd',
      angle: 0,
      textAnchor: 'middle',
      height: 20,
    };
  }

  return {
    format: 'date',
    daysDiff,
    interval: 'preserveStartEnd',
    angle: -45,
    textAnchor: 'end',
    height: 35,
  };
}

/**
 * Format display time based on x-axis format type
 */
export function formatDisplayTime(date: Date, format: XAxisConfig['format']): string {
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  switch (format) {
    case 'time':
      return time;
    case 'date':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    case 'dateTime':
      return `${date.toLocaleDateString([], { month: 'numeric', day: 'numeric' })} ${time}`;
    default:
      return time;
  }
}

/**
 * Calculate chart margins based on x-axis configuration
 */
export function getChartMargins(xAxisConfig: XAxisConfig): ChartMargins {
  return {
    top: 5,
    right: 30,
    left: 20,
    bottom: xAxisConfig.daysDiff > 7 ? 35 : 10,
  };
}

/**
 * Extract clean property name from datastream name
 * e.g. "GGERFS_01 Air Temperature" -> "Air Temperature"
 */
export function extractPropertyName(datastreamName: string): string {
  const parts = datastreamName.split(' ');
  if (parts.length > 1) {
    return parts.slice(1).join(' ');
  }
  return datastreamName;
}

/**
 * Calculate appropriate observation limit based on date range for performance
 */
export function calculateObservationLimit(daysDiff: number): number {
  if (daysDiff <= 7) {
    // 1 week: up to 24 readings/day (hourly resolution)
    return Math.min(daysDiff * 24, 500);
  } else if (daysDiff <= 14) {
    // 2 weeks: up to 12 readings/day (2-hourly resolution) - optimized for new default
    return Math.min(daysDiff * 12, 500);
  } else if (daysDiff <= 30) {
    // 1 month: up to 8 readings/day (3-hourly resolution)
    return Math.min(daysDiff * 8, 1000);
  } else {
    // Longer ranges: up to 4 readings/day (6-hourly resolution)
    return Math.min(daysDiff * 4, 2000);
  }
}