// BGS Sensor Network Data Types
// Based on BGS Sensor Data MCP API structure

export type SensorCategory = 
  | 'Groundwater Monitoring'
  | 'Weather Station' 
  | 'Soil Gas Monitoring'
  | 'Atmospheric Monitoring'
  | 'DTS Monitoring'
  | 'DTC Monitoring'
  | 'Barometer';

export type SensorSite = 
  | 'UKGEOS Glasgow'
  | 'BGS Cardiff'
  | 'UKGEOS Cheshire'
  | 'Wallingford';

export type SensorStatus = 'Active' | 'Inactive' | 'Maintenance';

export interface Sensor {
  id: number;
  name: string;
  description: string;
  category: SensorCategory;
  metadata_url: string;
  published: boolean;
  measurement_capabilities: string[];
  total_datastreams: number;
  deployment_locations: string[];
  location_site?: SensorSite; // Site determined from location data
  status?: SensorStatus; // Derived field for UI
}

export interface Location {
  location_id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  site: SensorSite;
  sub_site: string;
  active: boolean;
  published: boolean;
  from_date: string;
  to_date: string | null;
  comments: string;
}

export interface Datastream {
  datastream_id: number;
  name: string;
  description: string;
  unit_symbol: string;
  unit_name: string;
  observation_type: string;
}

export interface ObservationQuality {
  status: string;
  reason?: string;
  quality?: string;
  event_id?: string;
}

export interface Observation {
  observation_id: number;
  phenomenon_time: string;
  result_time: string;
  result: number | string;
  result_quality: ObservationQuality | string;
  parameters?: Record<string, unknown>;
}

// Dashboard-specific interfaces
export interface SensorWithLocation extends Sensor {
  location: Location;
  datastreams: Datastream[];
  latest_observations?: Observation[];
}

export interface SiteStats {
  site: SensorSite;
  total_locations: number;
  active_locations: number;
  sensor_categories: Record<SensorCategory, number>;
  sub_sites: string[];
}

export interface DashboardStats {
  total_sensors: number;
  total_locations: number;
  active_locations: number;
  sites: SiteStats[];
  categories: Record<SensorCategory, number>;
  measurement_types: string[];
}

// Filter interfaces for dashboard controls
export interface SensorFilters {
  site?: SensorSite[];
  category?: SensorCategory[];
  status?: SensorStatus[];
  date_range?: {
    from: string;
    to: string;
  };
  search_term?: string;
}

// Chart data interfaces
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  sensor_id: number;
  location_name: string;
}

export interface TimeSeriesData {
  sensor: Sensor;
  datastream: Datastream;
  data_points: ChartDataPoint[];
}

// API Response interfaces for MCP integration
export interface BGSApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ListSensorsResponse {
  sensors: Sensor[];
  total_count: number;
}

export interface ListLocationsResponse {
  locations: Location[];
  total_count: number;
}

export interface GetDatastreamsResponse {
  datastreams: Datastream[];
  sensor_id: number;
}

export interface GetObservationsResponse {
  observations: Observation[];
  datastream_id: number;
  total_count: number;
}