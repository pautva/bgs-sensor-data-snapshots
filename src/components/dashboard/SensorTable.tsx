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
import { Sensor, SensorCategory, SensorFilters, SensorStatus, Datastream } from '@/types/bgs-sensor';
import { getEnhancedSensors, getSensorStatusColor, EnhancedSensor, getSensorDatastreams } from '@/lib/bgs-api';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Eye,
  MapPin,
  Activity
} from 'lucide-react';

interface SensorTableProps {
  className?: string;
  onSensorSelect?: (sensor: Sensor) => void;
}

type SortField = 'name' | 'datastreams';
type SortDirection = 'asc' | 'desc';

export function SensorTable({ className, onSensorSelect }: SensorTableProps) {
  const [sensors, setSensors] = useState<EnhancedSensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedDatastreams, setExpandedDatastreams] = useState<Set<number>>(new Set());
  const [sensorDatastreams, setSensorDatastreams] = useState<Record<number, Datastream[]>>({});
  const [loadingDatastreams, setLoadingDatastreams] = useState<Set<number>>(new Set());

  // Fetch enhanced sensors data
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        setIsLoading(true);
        const response = await getEnhancedSensors();
        
        if (response.success) {
          setSensors(response.data.sensors);
          setError(null);
        } else {
          setError(response.error || 'Failed to load sensors');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSensors();
  }, []);

  // Filter and sort sensors
  const filteredAndSortedSensors = useMemo(() => {
    let filtered = sensors.filter(sensor => {
      const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sensor.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sensor.location_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || sensor.type === selectedType;
      
      return matchesSearch && matchesType;
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
  }, [sensors, searchTerm, selectedType, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const toggleDatastreams = async (sensorId: number) => {
    const newExpanded = new Set(expandedDatastreams);
    if (newExpanded.has(sensorId)) {
      newExpanded.delete(sensorId);
    } else {
      newExpanded.add(sensorId);
      
      // Fetch datastreams if we don't have them yet
      if (!sensorDatastreams[sensorId]) {
        const newLoading = new Set(loadingDatastreams);
        newLoading.add(sensorId);
        setLoadingDatastreams(newLoading);
        
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
          const finalLoading = new Set(loadingDatastreams);
          finalLoading.delete(sensorId);
          setLoadingDatastreams(finalLoading);
        }
      }
    }
    setExpandedDatastreams(newExpanded);
  };

  // Get unique types for filter
  const sensorTypes = useMemo(() => {
    const uniqueTypes = [...new Set(sensors.map(sensor => sensor.type))];
    return uniqueTypes;
  }, [sensors]);

  const getStatusColor = (status?: SensorStatus) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

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
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 w-48 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Types</option>
              {sensorTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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
                  <TableRow className="hover:bg-muted/50">
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
                          {sensor.total_datastreams}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDatastreams(sensor.id)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedDatastreams.has(sensor.id) ? 
                            <ArrowUp className="h-3 w-3" /> : 
                            <ArrowDown className="h-3 w-3" />
                          }
                        </Button>
                      </div>
                    </TableCell>
                    
                    {/* Dashboard */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSensorSelect?.(sensor)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details</span>
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
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSearchTerm('')}
            >
              Clear search
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}