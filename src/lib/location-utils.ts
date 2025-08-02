// Location utility functions for sensor location matching

import { Location } from '@/types/bgs-sensor';

/**
 * Finds a matching location from the locations database based on deployment location names
 * Uses fuzzy string matching to handle variations in location names
 * @param deploymentLocations Array of sensor deployment location names
 * @param locations Array of available locations from the API
 * @returns Matching location or null if no match found
 */
export function findMatchingLocation(
  deploymentLocations: string[], 
  locations: Location[]
): Location | null {
  if (!deploymentLocations.length || !locations.length) {
    return null;
  }

  return locations.find(loc => 
    deploymentLocations.some(deploc => 
      deploc.toLowerCase().includes(loc.name.toLowerCase()) ||
      loc.name.toLowerCase().includes(deploc.toLowerCase())
    )
  ) || null;
}