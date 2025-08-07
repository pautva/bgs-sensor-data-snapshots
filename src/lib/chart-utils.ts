// Simple chart utilities - minimal and focused

/**
 * Extract clean property name from datastream name
 * Handles gas measurements, environmental sensors, and generic patterns
 */
export function getPropertyName(datastreamName: string): string {
  const nameLower = datastreamName.toLowerCase();
  
  // Gas measurements
  if (nameLower.includes('carbon dioxide') || nameLower.includes('co2')) return 'Carbon Dioxide';
  if (nameLower.includes('methane') || nameLower.includes('ch4')) return 'Methane';
  if (nameLower.includes('oxygen') || nameLower.includes('o2')) return 'Oxygen';
  if (nameLower.includes('hydrogen sulfide') || nameLower.includes('h2s')) return 'Hydrogen Sulfide';
  if (nameLower.includes('nitrogen') || nameLower.includes('n2')) return 'Nitrogen';
  
  // Environmental measurements
  if (nameLower.includes('temperature')) return 'Temperature';
  if (nameLower.includes('conductivity')) return 'Conductivity';
  if (nameLower.includes('pressure')) return 'Pressure';
  if (nameLower.includes('humidity')) return 'Humidity';
  if (nameLower.includes('salinity')) return 'Salinity';
  if (nameLower.includes('tds')) return 'TDS';
  if (nameLower.includes('ph')) return 'pH';
  if (nameLower.includes('wind speed')) return 'Wind Speed';
  if (nameLower.includes('wind direction')) return 'Wind Direction';
  if (nameLower.includes('water level')) return 'Water Level';
  if (nameLower.includes('dissolved oxygen')) return 'Dissolved Oxygen';
  
  // Extract property from sensor prefix patterns (e.g., "GGS05_01 Temperature" -> "Temperature")
  const words = datastreamName.split(' ');
  if (words.length > 1 && words[0].match(/^[A-Z]{2,3}\d+_\d+$/)) {
    return words.slice(1).join(' ');
  }
  
  // Fallback: return longest meaningful word or first word
  return words.find(word => word.length > 2) || words[0] || 'Measurement';
}

/**
 * Format chart time based on date range span - enhanced for better time visibility
 */
export function formatChartTime(date: Date, daysDiff: number): string {
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  
  if (daysDiff <= 1) {
    // Same day: show time only
    return date.toLocaleTimeString([], timeOptions);
  }
  if (daysDiff <= 3) {
    // Up to 3 days: show date and time with abbreviated day
    return `${date.toLocaleDateString([], { 
      weekday: 'short', 
      day: 'numeric' 
    })} ${date.toLocaleTimeString([], timeOptions)}`;
  }
  if (daysDiff <= 7) {
    // Up to a week: show month/day and time
    return `${date.toLocaleDateString([], { 
      month: 'numeric', 
      day: 'numeric' 
    })} ${date.toLocaleTimeString([], timeOptions)}`;
  }
  if (daysDiff <= 30) {
    // Up to a month: show abbreviated month/day and time
    return `${date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    })} ${date.toLocaleTimeString([], timeOptions)}`;
  }
  // More than a month: show date only
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}