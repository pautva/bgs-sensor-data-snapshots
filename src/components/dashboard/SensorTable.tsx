'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sensor, Datastream } from '@/types/bgs-sensor';
import { getEnhancedSensors, EnhancedSensor, getSensorDatastreams } from '@/lib/bgs-api';
import { useProgressiveSensorData } from '@/hooks/useProgressiveSensorData';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Activity
} from 'lucide-react';

interface SensorTableProps {
  className?: string;
  onSensorSelect?: (sensor: Sensor) => void;
}

type SortField = 'name' | 'datastreams';
type SortDirection = 'asc' | 'desc';

export function SensorTable({ className, onSensorSelect }: SensorTableProps) {
  // Use progressive loading for sensor data
  const {
    sensors: basicSensors,
    isLoadingBasic,
    isLoadingCounts,
    error: progressiveError
  } = useProgressiveSensorData();
  
  const [sensors, setSensors] = useState<EnhancedSensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>('all');
  const [expandedDatastreams, setExpandedDatastreams] = useState<Set<number>>(new Set());
  const [sensorDatastreams, setSensorDatastreams] = useState<Record<number, Datastream[]>>({});
  const [loadingDatastreams, setLoadingDatastreams] = useState<Set<number>>(new Set());

  // Transform progressive sensor data to enhanced sensors
  useEffect(() => {
    if (progressiveError) {
      setError(progressiveError);
      setIsLoading(false);
      return;
    }

    if (basicSensors.length > 0) {
      // Transform basic sensors to enhanced format
      const enhancedSensors: EnhancedSensor[] = basicSensors.map((sensor) => {
        // Determine sensor type from name/category
        let type = 'Groundwater Logger';
        const sensorName = sensor.name.toLowerCase();
        if (sensorName.includes('weather')) type = 'Weather Station';
        else if (sensorName.includes('gas')) type = 'Gas Monitor';
        else if (sensorName.includes('atmospheric')) type = 'Atmospheric Monitor';
        else if (sensorName.includes('barometer')) type = 'Barometer';
        else if (sensorName.includes('dts')) type = 'DTS Logger';
        else if (sensorName.includes('dtc')) type = 'DTC Logger';

        // Create measurements list from name-based inference for filtering
        const measurements = inferMeasurementsFromSensorName(sensor.name, sensor.description);

        // Determine status
        const status: 'Active' | 'Inactive' | 'Maintenance' = 
          sensor.published && sensor.total_datastreams > 0 ? 'Active' : 'Inactive';

        return {
          ...sensor,
          type,
          location_name: sensor.deployment_locations[0] || 'Unknown Location',
          measurements,
          status
        };
      });

      setSensors(enhancedSensors);
      setError(null);
      setIsLoading(isLoadingBasic);
    }
  }, [basicSensors, isLoadingBasic, progressiveError]);

  // Infer likely measurements from sensor name and description (for filtering)
  const inferMeasurementsFromSensorName = (name: string, description: string): string[] => {
    const text = `${name} ${description}`.toLowerCase();
    const measurements: string[] = [];

    // Common measurement patterns based on sensor names
    if (text.includes('temp')) measurements.push('Temperature');
    if (text.includes('conduct')) measurements.push('Conductivity');
    if (text.includes('salin')) measurements.push('Salinity');
    if (text.includes('pressure') || text.includes('barom')) measurements.push('Pressure');
    if (text.includes('humid')) measurements.push('Humidity');
    if (text.includes('wind')) measurements.push('Wind Speed', 'Wind Direction');
    if (text.includes('water') && text.includes('level')) measurements.push('Water Level');
    if (text.includes('ph')) measurements.push('pH');
    if (text.includes('dissolv') && text.includes('oxygen')) measurements.push('Dissolved Oxygen');
    if (text.includes('tds')) measurements.push('TDS');
    if (text.includes('turb')) measurements.push('Turbidity');
    if (text.includes('gas') || text.includes('co2') || text.includes('methane')) {
      measurements.push('Carbon Dioxide', 'Methane', 'Oxygen');
    }
    if (text.includes('weather')) {
      measurements.push('Temperature', 'Humidity', 'Pressure', 'Wind Speed');
    }
    if (text.includes('groundwater') || text.includes('logger')) {
      measurements.push('Temperature', 'Conductivity', 'Water Level');
    }

    // Default fallback if no specific measurements detected
    if (measurements.length === 0) {
      measurements.push('Temperature', 'Pressure');
    }

    return measurements;
  };


  // Filter and sort sensors
  const filteredAndSortedSensors = useMemo(() => {
    let filtered = sensors.filter(sensor => {
      const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sensor.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sensor.location_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || sensor.type === selectedType;
      const matchesMeasurement = selectedMeasurement === 'all' || 
                                sensor.measurements.includes(selectedMeasurement);
      
      return matchesSearch && matchesType && matchesMeasurement;
    });

    // Sort sensors
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'datastreams':
          aValue = a.total_datastreams;
          bValue = b.total_datastreams;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      return 0;
    });

    return filtered;
  }, [sensors, searchTerm, selectedType, selectedMeasurement, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const toggleDatastreams = async (sensorId: number) => {
    const isCurrentlyExpanded = expandedDatastreams.has(sensorId);
    
    if (isCurrentlyExpanded) {
      setExpandedDatastreams(prev => {
        const newSet = new Set(prev);
        newSet.delete(sensorId);
        return newSet;
      });
    } else {
      setExpandedDatastreams(prev => new Set(prev).add(sensorId));
      
      // Fetch datastreams if we don't have them yet
      if (!sensorDatastreams[sensorId]) {
        setLoadingDatastreams(prev => new Set(prev).add(sensorId));
        
        try {
          const response = await getSensorDatastreams(sensorId);
          if (response.success) {
            setSensorDatastreams(prev => ({
              ...prev,
              [sensorId]: response.data.datastreams
            }));
          }
        } catch (error) {
          console.error('Failed to fetch datastreams:', error);
        } finally {
          setLoadingDatastreams(prev => {
            const newSet = new Set(prev);
            newSet.delete(sensorId);
            return newSet;
          });
        }
      }
    }
  };

  // Get unique types for filter
  const sensorTypes = useMemo(() => {
    const uniqueTypes = [...new Set(sensors.map(sensor => sensor.type))];
    return uniqueTypes;
  }, [sensors]);

  // Get unique measurement types for filter
  const measurementTypes = useMemo(() => {
    const allMeasurements = sensors.flatMap(sensor => sensor.measurements);
    const uniqueMeasurementTypes = [...new Set(allMeasurements)].sort();
    return uniqueMeasurementTypes;
  }, [sensors]);


  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sensor Network Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-destructive ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <Activity className="h-4 w-4" />
            <span>Error loading sensors: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Sensor Network Overview
        </CardTitle>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sensors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger size="lg" className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {sensorTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedMeasurement} onValueChange={setSelectedMeasurement}>
              <SelectTrigger size="lg" className="w-48">
                <SelectValue placeholder="Measurement Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {measurementTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 w-48"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Sensor Name
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead className="w-96">Description</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 w-32"
                  onClick={() => handleSort('datastreams')}
                >
                  <div className="flex items-center gap-2">
                    Datastreams
                    {getSortIcon('datastreams')}
                  </div>
                </TableHead>
                <TableHead className="w-24">Dashboard</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSensors.map((sensor, index) => (
                <React.Fragment key={sensor.id}>
                  <TableRow 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleDatastreams(sensor.id)}
                  >
                    {/* ID */}
                    <TableCell className="font-medium text-center">
                      {index + 1}
                    </TableCell>
                    
                    {/* Sensor Name */}
                    <TableCell className="font-medium">
                      <div className="font-semibold">{sensor.name}</div>
                    </TableCell>
                    
                    {/* Description */}
                    <TableCell className="max-w-md">
                      <span className="text-sm text-muted-foreground">
                        {sensor.description}
                      </span>
                    </TableCell>
                    
                    {/* Datastreams */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm">
                          {isLoadingCounts && sensor.total_datastreams === 0 ? '...' : sensor.total_datastreams}
                        </Badge>
                        {expandedDatastreams.has(sensor.id) ? 
                          <ArrowUp className="h-4 w-4 text-muted-foreground" /> : 
                          <ArrowDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                    </TableCell>
                    
                    {/* Dashboard */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSensorSelect?.(sensor);
                        }}
                        className="flex items-center gap-2 hover:cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Explore</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Datastreams Row */}
                  {expandedDatastreams.has(sensor.id) && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/20 p-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Available Datastreams:</h4>
                          
                          {loadingDatastreams.has(sensor.id) ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                              <span className="text-sm text-muted-foreground">Loading datastreams...</span>
                            </div>
                          ) : sensorDatastreams[sensor.id] ? (
                            <div className="space-y-2">
                              {sensorDatastreams[sensor.id].map((datastream, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-2 bg-background rounded border">
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    ID: {datastream.datastream_id}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{datastream.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {datastream.description}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <p className="text-xs text-muted-foreground pt-2 border-t">
                                Found: {sensorDatastreams[sensor.id].length} datastreams
                                {sensorDatastreams[sensor.id].length !== sensor.total_datastreams && (
                                  <span className="text-orange-600 ml-2">
                                    (Expected: {sensor.total_datastreams})
                                  </span>
                                )}
                              </p>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No datastreams available or failed to load
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedSensors.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No sensors found matching your criteria.
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Showing {filteredAndSortedSensors.length} of {sensors.length} sensors
          </span>
          {(searchTerm || selectedType !== 'all' || selectedMeasurement !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedMeasurement('all');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}