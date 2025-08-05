"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatastreamChart } from "@/components/dashboard/DatastreamChart";
import { DatastreamSummary } from "@/components/dashboard/DatastreamSummary";
import { ThemeToggle } from "@/components/theme-toggle";
import { MiniMap } from "@/components/ui/mini-map";
import { DatePicker } from "@/components/ui/date-picker";
import { Sensor, Datastream, Observation, Location } from "@/types/bgs-sensor";
import {
  getSensorDatastreams,
  getDatastreamObservations,
  getDatastreamDateRange,
  listLocations,
} from "@/lib/bgs-api";
import { findMatchingLocation } from "@/lib/location-utils";
import {
  Activity,
  MapPin,
  Database,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Calendar,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// Helper function to fetch sensor details from FROST API
async function getSensorDetails(sensorId: string): Promise<Sensor | null> {
  try {
    const response = await fetch(
      `https://sensors.bgs.ac.uk/FROST-Server/v1.1/Things(${sensorId})?$expand=Locations`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sensor: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform FROST API response to our Sensor interface
    const sensor: Sensor = {
      id: data["@iot.id"],
      name: data.name,
      description: data.description,
      category: data.properties?.category || "Unknown",
      metadata_url: data.properties?.metadataUrl || "",
      total_datastreams: 0, // Will be updated when we fetch datastreams
      published: true,
      measurement_capabilities: [], // Will be populated from datastreams
      deployment_locations: data.Locations?.map((loc: any) => loc.name) || [],
    };
    
    return sensor;
  } catch (error) {
    console.error("Error fetching sensor details:", error);
    return null;
  }
}

export default function SensorPage() {
  const params = useParams();
  const sensorId = params.sensorId as string;

  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [datastreams, setDatastreams] = useState<Datastream[]>([]);
  const [chartObservations, setChartObservations] = useState<
    Record<number, Observation[]>
  >({});
  const [sensorLocation, setSensorLocation] = useState<Location | null>(null);
  
  // Date range selection state
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [availableStartDate, setAvailableStartDate] = useState<Date | undefined>(undefined);
  const [availableEndDate, setAvailableEndDate] = useState<Date | undefined>(undefined);
  const [isLoadingDateRange, setIsLoadingDateRange] = useState(false);
  const [totalObservations, setTotalObservations] = useState(0);
  const [observationLimit, setObservationLimit] = useState(50);
  const [isDataLimited, setIsDataLimited] = useState(false);
  
  const [isLoadingSensor, setIsLoadingSensor] = useState(true);
  const [isLoadingDatastreams, setIsLoadingDatastreams] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset function to return to initial state
  const handleReset = () => {
    // Reset date selections
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
    
    // Clear chart data first
    setChartObservations({});
    setTotalObservations(0);
    setIsDataLimited(false);
    
    // Force re-calculation of default dates if we have available dates
    if (availableStartDate && availableEndDate) {
      // Validate available dates for scientific integrity
      if (availableStartDate <= availableEndDate) {
        // Default to last 30 days from the end date, or available range if shorter
        const thirtyDaysFromEnd = new Date(availableEndDate);
        thirtyDaysFromEnd.setDate(thirtyDaysFromEnd.getDate() - 30);
        
        // Ensure the calculated start date isn't before the available start date
        const defaultStartDate = thirtyDaysFromEnd < availableStartDate ? availableStartDate : thirtyDaysFromEnd;
        
        // Final validation: ensure start date is not after end date
        if (defaultStartDate <= availableEndDate) {
          setSelectedStartDate(defaultStartDate);
          setSelectedEndDate(availableEndDate);
        }
      }
    }
  };

  // Fetch sensor details on component mount
  useEffect(() => {
    if (!sensorId) return;

    const fetchSensorData = async () => {
      try {
        setIsLoadingSensor(true);
        setError(null);
        
        const sensorData = await getSensorDetails(sensorId);
        if (!sensorData) {
          setError("Sensor not found");
          return;
        }
        
        setSensor(sensorData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sensor");
      } finally {
        setIsLoadingSensor(false);
      }
    };

    fetchSensorData();
  }, [sensorId]);

  // Fetch datastreams when sensor is loaded
  useEffect(() => {
    if (!sensor) return;

    const fetchDatastreams = async () => {
      try {
        setIsLoadingDatastreams(true);
        const response = await getSensorDatastreams(sensor.id);

        if (response.success) {
          setDatastreams(response.data.datastreams);
          // Don't update sensor state here - it causes infinite loop
          // The datastream count will be shown from the datastreams array length
        } else {
          setError(response.error || "Failed to load datastreams");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoadingDatastreams(false);
      }
    };

    const fetchLocation = async () => {
      try {
        const locationsResponse = await listLocations();
        
        if (locationsResponse.success && sensor.deployment_locations.length > 0) {
          const matchingLocation = findMatchingLocation(
            sensor.deployment_locations, 
            locationsResponse.data.locations
          );
          setSensorLocation(matchingLocation);
        }
      } catch (err) {
        console.error("Error fetching location:", err);
      }
    };

    fetchDatastreams();
    fetchLocation();
  }, [sensor?.id]); // Only depend on sensor.id, not the entire sensor object

  // Fetch available date range when datastreams are loaded
  useEffect(() => {
    if (!datastreams.length) return;

    const fetchDateRange = async () => {
      try {
        setIsLoadingDateRange(true);
        
        // Get date range from the first datastream (assuming all datastreams have similar ranges)
        const dateRange = await getDatastreamDateRange(datastreams[0].datastream_id);
        
        if (dateRange.startDate && dateRange.endDate) {
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          
          setAvailableStartDate(startDate);
          setAvailableEndDate(endDate);
          
          // Set default selected dates if not already set
          if (!selectedStartDate || !selectedEndDate) {
            // Default to last 30 days from the end date, or available range if shorter
            const thirtyDaysFromEnd = new Date(endDate);
            thirtyDaysFromEnd.setDate(thirtyDaysFromEnd.getDate() - 30);
            
            // Ensure the calculated start date isn't before the available start date
            const defaultStartDate = thirtyDaysFromEnd < startDate ? startDate : thirtyDaysFromEnd;
            
            if (!selectedStartDate) {
              setSelectedStartDate(defaultStartDate);
            }
            if (!selectedEndDate) {
              setSelectedEndDate(endDate);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching date range:", err);
      } finally {
        setIsLoadingDateRange(false);
      }
    };

    fetchDateRange();
  }, [datastreams]);

  // Fetch chart observations for datastreams
  useEffect(() => {
    if (!datastreams.length) {
      setChartObservations({});
      return;
    }

    // Wait for dates to be set before fetching chart data
    if (!selectedStartDate || !selectedEndDate) {
      return;
    }

    const fetchChartData = async () => {
      try {
        setIsLoadingChart(true);
        
        // Convert selected dates to strings for API call
        const startDateStr = selectedStartDate ? selectedStartDate.toISOString().split('T')[0] : undefined;
        const endDateStr = selectedEndDate ? selectedEndDate.toISOString().split('T')[0] : undefined;
        
        // Calculate appropriate limit based on date range
        let limit = 50; // default for recent data
        if (selectedStartDate && selectedEndDate) {
          const daysDiff = Math.ceil((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24));
          // Balance between scientific accuracy and performance
          // For initial load (30 days), use moderate limits for fast display
          // For longer ranges, increase limits to ensure completeness
          if (daysDiff <= 7) {
            // 1 week: up to 24 readings/day (hourly)
            limit = Math.min(daysDiff * 24, 1000);
          } else if (daysDiff <= 30) {
            // 1 month: up to 8 readings/day (3-hourly) for performance
            limit = Math.min(daysDiff * 8, 1000);
          } else {
            // Longer ranges: up to 4 readings/day (6-hourly)
            limit = Math.min(daysDiff * 4, 2000);
          }
        }
        setObservationLimit(limit);
        
        const observationsPromises = datastreams
          .slice(0, 5)
          .map(async (datastream) => {
            const response = await getDatastreamObservations(
              datastream.datastream_id,
              limit,
              startDateStr,
              endDateStr
            );
            return {
              datastreamId: datastream.datastream_id,
              observations: response.success ? response.data.observations : [],
              isLimited: response.success ? response.data.isLimited : false,
            };
          });

        const results = await Promise.all(observationsPromises);
        const chartData: Record<number, Observation[]> = {};
        let totalObs = 0;
        let isLimited = false;

        results.forEach(({ datastreamId, observations, isLimited: datastreamLimited }) => {
          chartData[datastreamId] = observations;
          totalObs += observations.length;
          // Use the accurate information from the API
          if (datastreamLimited) {
            isLimited = true;
          }
        });

        setChartObservations(chartData);
        setTotalObservations(totalObs);
        // Store whether any datastream was actually limited
        setIsDataLimited(isLimited);

        // Note: We don't need to extract observation date range since we already have selected dates
      } catch (err) {
        console.error("Error fetching chart data:", err);
      } finally {
        setIsLoadingChart(false);
      }
    };

    fetchChartData();
  }, [datastreams, selectedStartDate, selectedEndDate]);


  if (isLoadingSensor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading sensor data...</span>
        </div>
      </div>
    );
  }

  if (error || !sensor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            {error || "Sensor not found"}
          </h1>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6" />
                <h1 className="text-2xl font-bold">{sensor.name}</h1>
              </div>
              {selectedStartDate && selectedEndDate && (
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {selectedStartDate.toISOString().split('T')[0]} to {selectedEndDate.toISOString().split('T')[0]}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {sensor.metadata_url && (
                <Button variant="outline" asChild>
                  <a
                    href={sensor.metadata_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Metadata
                  </a>
                </Button>
              )}
              
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>

              {/* Reset button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isLoadingChart || isLoadingDateRange}
                aria-label="Reset to default view"
                className="cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingChart || isLoadingDateRange ? 'animate-spin' : ''}`} />
              </Button>

              {/* Theme toggle */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
          {/* Left Column - Sensor Summary */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Sensor Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Description
                  </h4>
                  <p className="text-sm">{sensor.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Category
                    </h4>
                    <Badge variant="secondary">{sensor.category}</Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Datastreams
                    </h4>
                    <Badge variant="secondary">
                      {Object.keys(chartObservations).length || datastreams.length} active
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Borehole Reference
                    </h4>
                    <Badge variant="outline">
                      {sensor.name.match(/[A-Z]{2,3}\d{2,3}/)?.[0] || 'N/A'}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Sensor ID
                    </h4>
                    <span className="text-sm font-mono">{sensor.id}</span>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Start Date
                    </h4>
                    <DatePicker
                      date={selectedStartDate}
                      onDateChange={setSelectedStartDate}
                      placeholder="Select start date"
                      disabled={isLoadingDateRange}
                      fromDate={availableStartDate}
                      toDate={selectedEndDate || availableEndDate}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      End Date
                    </h4>
                    <DatePicker
                      date={selectedEndDate}
                      onDateChange={setSelectedEndDate}
                      placeholder="Select end date"
                      disabled={isLoadingDateRange}
                      fromDate={selectedStartDate || availableStartDate}
                      toDate={availableEndDate}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Map at the top for visual impact */}
                {sensorLocation && (sensorLocation.latitude !== 0 || sensorLocation.longitude !== 0) && (
                  <div className="flex-1 min-h-[200px] max-h-[350px] mb-4">
                    <MiniMap 
                      latitude={sensorLocation.latitude}
                      longitude={sensorLocation.longitude}
                    />
                  </div>
                )}
                
                {/* Location details below map */}
                <div className="space-y-4 flex-shrink-0">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {sensor.deployment_locations.length > 0 
                          ? sensor.deployment_locations[0]
                          : "Unknown Location"
                        }
                      </div>
                      {sensorLocation && (sensorLocation.latitude !== 0 || sensorLocation.longitude !== 0) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Coordinates: [{sensorLocation.longitude}, {sensorLocation.latitude}]
                        </div>
                      )}
                      {sensor.deployment_locations.length > 1 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          +{sensor.deployment_locations.length - 1} additional location{sensor.deployment_locations.length > 2 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  {sensor.deployment_locations.length > 1 && (
                    <div className="pl-6 space-y-1">
                      {sensor.deployment_locations.slice(1).map((location, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          • {location}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Flexbox layout for proper height distribution */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Data Summary Section - Allow flexible height */}
            <div className="flex-shrink-0">
              {datastreams.length > 0 && (
                <DatastreamSummary
                  datastreams={datastreams.slice(0, 5)}
                  observations={chartObservations}
                  isLoading={isLoadingChart}
                  className="h-full"
                />
              )}
            </div>

            {/* Chart Section - Takes remaining space */}
            <div className="flex-1 min-h-0">
              <DatastreamChart
                datastreams={datastreams.slice(0, 5)}
                observations={chartObservations}
                isLoading={isLoadingChart}
                className="h-full"
                selectedStartDate={selectedStartDate}
                selectedEndDate={selectedEndDate}
                totalObservations={totalObservations}
                observationLimit={observationLimit}
                isDataLimited={isDataLimited}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}