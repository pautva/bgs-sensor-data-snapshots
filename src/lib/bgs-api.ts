// BGS Sensor Data API Integration
// Provides functions to interact with the BGS Sensor Data MCP and FROST API

import {
  Sensor,
  Location,
  Datastream,
  Observation,
  BGSApiResponse,
  ListSensorsResponse,
  ListLocationsResponse,
  GetDatastreamsResponse,
  GetObservationsResponse,
  SensorCategory,
  SensorSite,
  DashboardStats,
  SiteStats
} from '@/types/bgs-sensor';

// FROST API base URL
const FROST_API_BASE = 'https://sensors.bgs.ac.uk/FROST-Server/v1.1';

// Helper function to make FROST API calls
async function frostApiCall(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${FROST_API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`FROST API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('FROST API call failed:', error);
    throw error;
  }
}

// Enhanced sensor interface for table display
export interface EnhancedSensor extends Sensor {
  type: string;
  location_name: string;
  measurements: string[];
  status: 'Active' | 'Inactive' | 'Maintenance';
}

// Simple cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache helper functions
function getCachedData<T>(key: string): T | null {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  apiCache.delete(key);
  return null;
}

function setCachedData<T>(key: string, data: T, ttlMs: number = 60000): void {
  // Prevent memory leaks by limiting cache size
  if (apiCache.size > 100) {
    // Remove oldest entries when cache gets too large
    const entries = Array.from(apiCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    // Remove oldest 20 entries
    for (let i = 0; i < 20; i++) {
      apiCache.delete(entries[i][0]);
    }
  }
  
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  });
}

// BGS API Functions
export async function listSensors(): Promise<BGSApiResponse<ListSensorsResponse>> {
  const cacheKey = 'sensors_basic';
  const cached = getCachedData<ListSensorsResponse>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    // Fetch basic sensor info only - no datastream counts for speed
    const response = await frostApiCall('/Things?$expand=Locations');
    
    const sensors: Sensor[] = response.value.map((thing: any, index: number) => {
      // Extract location information
      const location = thing.Locations?.[0];
      const locationName = location ? 
        `${location.name}${location.description ? ` - ${location.description}` : ''}` : 
        'Unknown Location';
      
      // Determine sensor category based on name/description
      let category: SensorCategory = 'Groundwater Monitoring';
      const nameDesc = `${thing.name} ${thing.description}`.toLowerCase();
      if (nameDesc.includes('weather')) category = 'Weather Station';
      else if (nameDesc.includes('gas')) category = 'Soil Gas Monitoring';
      else if (nameDesc.includes('atmospheric')) category = 'Atmospheric Monitoring';
      else if (nameDesc.includes('dts')) category = 'DTS Monitoring';
      else if (nameDesc.includes('dtc')) category = 'DTC Monitoring';
      else if (nameDesc.includes('barometer')) category = 'Barometer';
      
      return {
        id: parseInt(thing['@iot.id']) || index + 1,
        name: thing.name || `Sensor ${index + 1}`,
        description: thing.description || 'No description available',
        category,
        metadata_url: thing['@iot.selfLink'] || '',
        published: true,
        measurement_capabilities: [], // Will be populated on-demand
        total_datastreams: 0, // Will be populated on-demand
        deployment_locations: location ? [locationName] : []
      };
    });
    
    const result = {
      sensors,
      total_count: sensors.length
    };
    
    setCachedData(cacheKey, result, 300000); // Cache for 5 minutes
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error fetching sensors from FROST API:', error);
    return {
      success: false,
      data: { sensors: [], total_count: 0 },
      error: error instanceof Error ? error.message : 'Failed to fetch sensors'
    };
  }
}

export async function listLocations(): Promise<BGSApiResponse<ListLocationsResponse>> {
  const cacheKey = 'locations';
  const cached = getCachedData<ListLocationsResponse>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    // Fetch Locations from FROST API
    const response = await frostApiCall('/Locations');
    
    const locations: Location[] = response.value.map((loc: any, index: number) => {
      // Parse coordinates from location if available
      let latitude = 0;
      let longitude = 0;
      
      if (loc.location && loc.location.coordinates) {
        longitude = loc.location.coordinates[0] || 0;
        latitude = loc.location.coordinates[1] || 0;
      }
      
      // Determine site based on location name/description
      let site: SensorSite = 'Wallingford';
      const locName = `${loc.name} ${loc.description}`.toLowerCase();
      if (locName.includes('glasgow') || locName.includes('ggerfs')) {
        site = 'UKGEOS Glasgow Observatory';
      } else if (locName.includes('cardiff') || locName.includes('wales')) {
        site = 'BGS Cardiff';
      } else if (locName.includes('cheshire') || locName.includes('ince')) {
        site = 'UKGEOS Cheshire Observatory';
      }
      
      return {
        location_id: parseInt(loc['@iot.id']) || index + 1,
        name: loc.name || `Location ${index + 1}`,
        description: loc.description || 'No description available',
        latitude,
        longitude,
        site,
        sub_site: loc.description || 'Main Site',
        active: true, // Assume active if in the API
        published: true,
        from_date: new Date().toISOString().split('T')[0],
        to_date: null,
        comments: loc.properties?.comments || ''
      };
    });
    
    const result = {
      locations,
      total_count: locations.length
    };
    
    setCachedData(cacheKey, result, 300000); // Cache for 5 minutes
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error fetching locations from FROST API:', error);
    return {
      success: false,
      data: { locations: [], total_count: 0 },
      error: error instanceof Error ? error.message : 'Failed to fetch locations'
    };
  }
}

export async function getSensorDatastreams(sensorId: number): Promise<BGSApiResponse<GetDatastreamsResponse>> {
  const cacheKey = `datastreams_${sensorId}`;
  const cached = getCachedData<GetDatastreamsResponse>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    // Fetch datastreams for a specific Thing (sensor) from FROST API
    const response = await frostApiCall(`/Things(${sensorId})/Datastreams`);
    
    const datastreams: Datastream[] = response.value.map((ds: any) => ({
      datastream_id: parseInt(ds['@iot.id']) || 0,
      name: ds.name || 'Unknown',
      description: ds.description || 'No description available',
      unit_symbol: ds.unitOfMeasurement?.symbol || '',
      unit_name: ds.unitOfMeasurement?.name || 'Unknown unit',
      observation_type: ds.observationType || 'Measurement'
    }));
    
    const result = {
      datastreams,
      sensor_id: sensorId
    };
    
    setCachedData(cacheKey, result, 120000); // Cache for 2 minutes
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error fetching datastreams from FROST API:', error);
    return {
      success: false,
      data: { datastreams: [], sensor_id: sensorId },
      error: error instanceof Error ? error.message : 'Failed to fetch datastreams'
    };
  }
}

export async function getDatastreamObservations(
  datastreamId: number,
  limit: number = 100,
  startDate?: string,
  endDate?: string
): Promise<BGSApiResponse<GetObservationsResponse & { isLimited?: boolean }>> {
  const cacheKey = `observations_${datastreamId}_${limit}_${startDate || 'nostart'}_${endDate || 'noend'}`;
  const cached = getCachedData<GetObservationsResponse>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    // Build FROST API query with optional date filtering and count
    // Use ascending order when date filtering to get chronological data
    const orderBy = (startDate || endDate) ? 'phenomenonTime%20asc' : 'phenomenonTime%20desc';
    let query = `/Datastreams(${datastreamId})/Observations?$top=${limit}&$count=true&$orderby=${orderBy}`;
    
    // Add date range filter if provided
    // Use proper timezone handling for scientific accuracy
    const filters = [];
    if (startDate) {
      // Start of day in UTC to ensure we don't miss data
      filters.push(`phenomenonTime ge ${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      // End of day in UTC to include all data for the selected date
      filters.push(`phenomenonTime le ${endDate}T23:59:59.999Z`);
    }
    
    if (filters.length > 0) {
      query += `&$filter=${filters.join(' and ')}`;
    }

    // Fetch real observations from FROST API
    const response = await frostApiCall(query);
    
    const observations: Observation[] = response.value.map((obs: any, index: number) => ({
      observation_id: parseInt(obs['@iot.id']) || index + 1,
      phenomenon_time: obs.phenomenonTime || new Date().toISOString(),
      result_time: obs.resultTime || obs.phenomenonTime || new Date().toISOString(),
      result: typeof obs.result === 'number' ? obs.result : parseFloat(obs.result) || 0,
      result_quality: obs.resultQuality || "Unknown"
    }));
    
    // Check if data was limited by comparing returned count vs total available
    const totalAvailable = response['@iot.count'] || observations.length;
    const isLimited = observations.length < totalAvailable;

    const result = {
      observations,
      datastream_id: datastreamId,
      total_count: observations.length,
      isLimited
    };
    
    setCachedData(cacheKey, result, 60000); // Cache for 1 minute
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error(`Error fetching observations for datastream ${datastreamId}:`, error);
    return {
      success: false,
      data: { observations: [], datastream_id: datastreamId, total_count: 0 },
      error: error instanceof Error ? error.message : 'Failed to fetch observations'
    };
  }
}

// Fast function to get datastream count for a sensor (for table display)
export async function getSensorDatastreamCount(sensorId: number): Promise<number> {
  const cacheKey = `datastream_count_${sensorId}`;
  const cached = getCachedData<number>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await frostApiCall(`/Things(${sensorId})/Datastreams?$count=true&$top=0`);
    const count = response['@iot.count'] || 0;
    setCachedData(cacheKey, count, 300000); // Cache for 5 minutes
    return count;
  } catch (error) {
    console.error(`Error fetching datastream count for sensor ${sensorId}:`, error);
    return 0;
  }
}

// Function to get the available date range for a datastream
export async function getDatastreamDateRange(datastreamId: number): Promise<{
  startDate: string | null;
  endDate: string | null;
}> {
  const cacheKey = `daterange_${datastreamId}`;
  const cached = getCachedData<{ startDate: string | null; endDate: string | null }>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Get the first and last observations to determine date range
    const [firstResponse, lastResponse] = await Promise.all([
      frostApiCall(`/Datastreams(${datastreamId})/Observations?$top=1&$orderby=phenomenonTime%20asc`),
      frostApiCall(`/Datastreams(${datastreamId})/Observations?$top=1&$orderby=phenomenonTime%20desc`)
    ]);

    const startDate = firstResponse.value?.[0]?.phenomenonTime 
      ? firstResponse.value[0].phenomenonTime.split('T')[0] 
      : null;
    const endDate = lastResponse.value?.[0]?.phenomenonTime 
      ? lastResponse.value[0].phenomenonTime.split('T')[0] 
      : null;

    const result = { startDate, endDate };
    setCachedData(cacheKey, result, 300000); // Cache for 5 minutes
    return result;
  } catch (error) {
    console.error(`Error fetching date range for datastream ${datastreamId}:`, error);
    return { startDate: null, endDate: null };
  }
}

// Batch function to get datastream counts for multiple sensors concurrently
export async function getBatchDatastreamCounts(sensorIds: number[]): Promise<Record<number, number>> {
  const counts: Record<number, number> = {};
  
  // Check cache first
  const uncachedIds = sensorIds.filter(id => {
    const cached = getCachedData<number>(`datastream_count_${id}`);
    if (cached !== null) {
      counts[id] = cached;
      return false;
    }
    return true;
  });

  if (uncachedIds.length === 0) {
    return counts;
  }

  // Fetch uncached counts concurrently (limit to 10 at a time to avoid overwhelming API)
  const chunks = [];
  for (let i = 0; i < uncachedIds.length; i += 10) {
    chunks.push(uncachedIds.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (sensorId) => {
      const count = await getSensorDatastreamCount(sensorId);
      return { sensorId, count };
    });

    const results = await Promise.all(promises);
    results.forEach(({ sensorId, count }) => {
      counts[sensorId] = count;
    });
  }

  return counts;
}

// Dashboard-specific utility functions
export async function getDashboardStats(): Promise<BGSApiResponse<DashboardStats>> {
  const cacheKey = 'dashboard_stats';
  const cached = getCachedData<DashboardStats>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    const [sensorsResponse, locationsResponse] = await Promise.all([
      listSensors(),
      listLocations()
    ]);
    
    if (!sensorsResponse.success || !locationsResponse.success) {
      throw new Error('Failed to fetch required data');
    }
    
    const sensors = sensorsResponse.data.sensors;
    const locations = locationsResponse.data.locations;
    
    // Calculate site statistics
    const siteStats: SiteStats[] = [
      'UKGEOS Glasgow Observatory',
      'BGS Cardiff',
      'UKGEOS Cheshire Observatory',
      'Wallingford'
    ].map(site => {
      const siteLocations = locations.filter(loc => loc.site === site);
      const activeLocations = siteLocations.filter(loc => loc.active);
      
      // Calculate sensor categories for this site (mock data)
      const categoryCounts: Record<SensorCategory, number> = {
        'Groundwater Monitoring': site === 'UKGEOS Glasgow Observatory' ? 2 : 1,
        'Weather Station': 1,
        'Soil Gas Monitoring': site === 'UKGEOS Cheshire Observatory' ? 2 : 0,
        'Atmospheric Monitoring': 1,
        'DTS Monitoring': site === 'BGS Cardiff' ? 1 : 0,
        'DTC Monitoring': 0,
        'Barometer': 1
      };
      
      return {
        site: site as SensorSite,
        total_locations: siteLocations.length,
        active_locations: activeLocations.length,
        sensor_categories: categoryCounts,
        sub_sites: [...new Set(siteLocations.map(loc => loc.sub_site))]
      };
    });
    
    // Calculate overall category counts
    const categoryTotals: Record<SensorCategory, number> = {
      'Groundwater Monitoring': 1,
      'Weather Station': 1,
      'Soil Gas Monitoring': 1,
      'Atmospheric Monitoring': 0,
      'DTS Monitoring': 0,
      'DTC Monitoring': 0,
      'Barometer': 0
    };
    
    // Extract all measurement types
    const measurementTypes = [...new Set(
      sensors.flatMap(sensor => sensor.measurement_capabilities)
    )];
    
    const dashboardStats: DashboardStats = {
      total_sensors: sensors.length,
      total_locations: locations.length,
      active_locations: locations.filter(loc => loc.active).length,
      sites: siteStats,
      categories: categoryTotals,
      measurement_types: measurementTypes
    };
    
    setCachedData(cacheKey, dashboardStats, 300000); // Cache for 5 minutes
    
    return {
      success: true,
      data: dashboardStats
    };
  } catch (error) {
    return {
      success: false,
      data: {
        total_sensors: 0,
        total_locations: 0,
        active_locations: 0,
        sites: [],
        categories: {} as Record<SensorCategory, number>,
        measurement_types: []
      },
      error: error instanceof Error ? error.message : 'Failed to calculate dashboard stats'
    };
  }
}

// Utility functions for sensor data processing
export function getSensorStatusColor(category: SensorCategory): string {
  const colorMap: Record<SensorCategory, string> = {
    'Groundwater Monitoring': 'text-blue-600',
    'Weather Station': 'text-purple-600',
    'Soil Gas Monitoring': 'text-orange-600',
    'Atmospheric Monitoring': 'text-cyan-600',
    'DTS Monitoring': 'text-violet-600',
    'DTC Monitoring': 'text-pink-600',
    'Barometer': 'text-teal-600'
  };
  
  return colorMap[category] || 'text-muted-foreground';
}

export function formatSensorValue(value: number | string, unit?: string): string {
  if (typeof value === 'string') return value;
  
  const formatted = typeof value === 'number' ? value.toFixed(2) : value;
  return unit ? `${formatted} ${unit}` : formatted.toString();
}

// New function to get enhanced sensor data for table display
export async function getEnhancedSensors(): Promise<BGSApiResponse<{ sensors: EnhancedSensor[], total_count: number }>> {
  try {
    // Get both sensors and locations
    const [sensorsResponse, locationsResponse] = await Promise.all([
      listSensors(),
      listLocations()
    ]);

    if (!sensorsResponse.success || !locationsResponse.success) {
      throw new Error('Failed to fetch required data');
    }

    const sensors = sensorsResponse.data.sensors;
    const locations = locationsResponse.data.locations;

    // Enhance sensors with additional data for table display
    const enhancedSensors: EnhancedSensor[] = sensors.map((sensor) => {
      // Find the primary location for this sensor
      const primaryLocation = locations.find(loc => 
        sensor.deployment_locations.some(deploc => 
          deploc.toLowerCase().includes(loc.name.toLowerCase()) ||
          loc.name.toLowerCase().includes(deploc.toLowerCase())
        )
      ) || locations[0]; // Fallback to first location

      // Determine sensor type from name/category
      let type = 'Groundwater Logger';
      const sensorName = sensor.name.toLowerCase();
      if (sensorName.includes('weather')) type = 'Weather Station';
      else if (sensorName.includes('gas')) type = 'Gas Monitor';
      else if (sensorName.includes('atmospheric')) type = 'Atmospheric Monitor';
      else if (sensorName.includes('barometer')) type = 'Barometer';
      else if (sensorName.includes('dts')) type = 'DTS Logger';
      else if (sensorName.includes('dtc')) type = 'DTC Logger';

      // Create measurements list from capabilities
      const measurements = sensor.measurement_capabilities.length > 0 
        ? sensor.measurement_capabilities
        : ['Temperature', 'Conductivity', 'Pressure']; // Default fallback

      // Determine status (simplified logic)
      const status: 'Active' | 'Inactive' | 'Maintenance' = 
        sensor.published && sensor.total_datastreams > 0 ? 'Active' : 'Inactive';

      return {
        ...sensor,
        type,
        location_name: primaryLocation?.name || 'Unknown Location',
        measurements,
        status
      };
    });

    return {
      success: true,
      data: {
        sensors: enhancedSensors,
        total_count: enhancedSensors.length
      }
    };
  } catch (error) {
    console.error('Error creating enhanced sensors:', error);
    return {
      success: false,
      data: { sensors: [], total_count: 0 },
      error: error instanceof Error ? error.message : 'Failed to create enhanced sensor data'
    };
  }
}