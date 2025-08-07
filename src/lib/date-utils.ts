// Date utility functions for sensor data processing

import { Observation } from '@/types/bgs-sensor';

/**
 * Extracts the earliest and latest observation dates from a collection of datastream observations
 * @param observations Record of datastream ID to array of observations
 * @returns Object with formatted start and end dates (YYYY-MM-DD format)
 */
export function extractObservationDateRange(observations: Record<number, Observation[]>) {
  let earliestDate: string | null = null;
  let latestDate: string | null = null;
  
  Object.values(observations).forEach((obsArray) => {
    if (obsArray.length > 0) {
      // Get the oldest observation (they're ordered by phenomenonTime desc, so take the last one)
      const oldestInThisDatastream = obsArray[obsArray.length - 1];
      if (!earliestDate || oldestInThisDatastream.phenomenon_time < earliestDate) {
        earliestDate = oldestInThisDatastream.phenomenon_time;
      }
      
      // Get the newest observation (first in the array since ordered desc)
      const newestInThisDatastream = obsArray[0];
      if (!latestDate || newestInThisDatastream.phenomenon_time > latestDate) {
        latestDate = newestInThisDatastream.phenomenon_time;
      }
    }
  });

  return {
    startDate: earliestDate ? formatDateForDisplay(new Date(earliestDate)) : null,
    endDate: latestDate ? formatDateForDisplay(new Date(latestDate)) : null
  };
}

/**
 * Format a Date object to YYYY-MM-DD format without timezone conversion issues
 * @param date The Date object to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateForDisplay(date: Date): string {
  return date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0');
}