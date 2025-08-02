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

// BGS API Functions
export async function listSensors(): Promise<BGSApiResponse<ListSensorsResponse>> {
  try {
    // First, fetch Things (sensors) without datastreams to get basic info
    const response = await frostApiCall('/Things?$expand=Locations');
    
    const sensors: Sensor[] = await Promise.all(response.value.map(async (thing: any, index: number) => {
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
      
      // Get accurate datastream count using the same endpoint as the expanded view
      let datastreamCount = 0;
      let measurementCapabilities: string[] = [];
      
      try {
        const datastreamResponse = await frostApiCall(`/Things(${thing['@iot.id']})/Datastreams`);
        const datastreams = datastreamResponse.value || [];
        datastreamCount = datastreams.length;
        measurementCapabilities = datastreams.map((ds: any) => 
          ds.name || 'Unknown'
        );
        
        // Debug logging for specific sensor
        if (thing.name && thing.name.includes('Barometer')) {
          console.log(`DEBUG: ${thing.name} - Datastreams from direct call:`, datastreams.map((ds: any) => ({
            id: ds['@iot.id'],
            name: ds.name,
            description: ds.description
          })));
        }
      } catch (error) {
        console.error(`Failed to fetch datastreams for sensor ${thing['@iot.id']}:`, error);
      }
      
      return {
        id: parseInt(thing['@iot.id']) || index + 1,
        name: thing.name || `Sensor ${index + 1}`,
        description: thing.description || 'No description available',
        category,
        metadata_url: thing['@iot.selfLink'] || '',
        published: true,
        measurement_capabilities: measurementCapabilities,
        total_datastreams: datastreamCount,
        deployment_locations: location ? [locationName] : []
      };
    }));
    
    return {
      success: true,
      data: {
        sensors,
        total_count: sensors.length
      }
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
    
    return {
      success: true,
      data: {
        locations,
        total_count: locations.length
      }
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
  try {
    // Fetch datastreams for a specific Thing (sensor) from FROST API
    const response = await frostApiCall(`/Things(${sensorId})/Datastreams`);
    
    // Debug logging
    console.log(`DEBUG: Direct datastreams fetch for sensor ${sensorId}:`, response.value.map((ds: any) => ({
      id: ds['@iot.id'],
      name: ds.name,
      description: ds.description
    })));
    
    const datastreams: Datastream[] = response.value.map((ds: any) => ({
      datastream_id: parseInt(ds['@iot.id']) || 0,
      name: ds.name || 'Unknown',
      description: ds.description || 'No description available',
      unit_symbol: ds.unitOfMeasurement?.symbol || '',
      unit_name: ds.unitOfMeasurement?.name || 'Unknown unit',
      observation_type: ds.observationType || 'Measurement'
    }));
    
    return {
      success: true,
      data: {
        datastreams,
        sensor_id: sensorId
      }
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
  limit: number = 100
): Promise<BGSApiResponse<GetObservationsResponse>> {
  try {
    // Fetch real observations from FROST API
    const response = await frostApiCall(
      `/Datastreams(${datastreamId})/Observations?$top=${limit}&$orderby=phenomenonTime%20desc`
    );
    
    const observations: Observation[] = response.value.map((obs: any, index: number) => ({
      observation_id: parseInt(obs['@iot.id']) || index + 1,
      phenomenon_time: obs.phenomenonTime || new Date().toISOString(),
      result_time: obs.resultTime || obs.phenomenonTime || new Date().toISOString(),
      result: typeof obs.result === 'number' ? obs.result : parseFloat(obs.result) || 0,
      result_quality: obs.resultQuality || "Unknown"
    }));
    
    return {
      success: true,
      data: {
        observations,
        datastream_id: datastreamId,
        total_count: observations.length
      }
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

// Dashboard-specific utility functions
export async function getDashboardStats(): Promise<BGSApiResponse<DashboardStats>> {
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