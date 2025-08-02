"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatastreamChart } from "./DatastreamChart";
import { DatastreamSummary } from "./DatastreamSummary";
import { Sensor, Datastream, Observation, ObservationQuality, Location } from "@/types/bgs-sensor";
import {
  getSensorDatastreams,
  getDatastreamObservations,
  getSensorStatusColor,
  formatSensorValue,
  listLocations,
} from "@/lib/bgs-api";
import {
  Activity,
  MapPin,
  Calendar,
  TrendingUp,
  Database,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface SensorDetailSheetProps {
  sensor: Sensor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SensorDetailSheet({
  sensor,
  isOpen,
  onClose,
}: SensorDetailSheetProps) {
  const [datastreams, setDatastreams] = useState<Datastream[]>([]);
  const [selectedDatastream, setSelectedDatastream] =
    useState<Datastream | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [chartObservations, setChartObservations] = useState<
    Record<number, Observation[]>
  >({});
  const [sensorLocation, setSensorLocation] = useState<Location | null>(null);
  const [observationStartDate, setObservationStartDate] = useState<string | null>(null);
  const [isLoadingDatastreams, setIsLoadingDatastreams] = useState(false);
  const [isLoadingObservations, setIsLoadingObservations] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch datastreams and location when sensor changes
  useEffect(() => {
    if (!sensor || !isOpen) {
      setDatastreams([]);
      setSelectedDatastream(null);
      setObservations([]);
      setChartObservations({});
      setSensorLocation(null);
      setObservationStartDate(null);
      return;
    }

    const fetchDatastreams = async () => {
      try {
        setIsLoadingDatastreams(true);
        setError(null);
        const response = await getSensorDatastreams(sensor.id);

        if (response.success) {
          setDatastreams(response.data.datastreams);
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
        setIsLoadingLocation(true);
        const locationsResponse = await listLocations();
        
        if (locationsResponse.success && sensor.deployment_locations.length > 0) {
          // Find location that matches the sensor's deployment location
          const matchingLocation = locationsResponse.data.locations.find(loc => 
            sensor.deployment_locations.some(deploc => 
              deploc.toLowerCase().includes(loc.name.toLowerCase()) ||
              loc.name.toLowerCase().includes(deploc.toLowerCase())
            )
          );
          setSensorLocation(matchingLocation || null);
        }
      } catch (err) {
        console.error("Error fetching location:", err);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchDatastreams();
    fetchLocation();
  }, [sensor, isOpen]);

  // Fetch chart observations for all datastreams
  useEffect(() => {
    if (!datastreams.length) {
      setChartObservations({});
      return;
    }

    const fetchChartData = async () => {
      try {
        setIsLoadingChart(true);
        const observationsPromises = datastreams
          .slice(0, 5)
          .map(async (datastream) => {
            const response = await getDatastreamObservations(
              datastream.datastream_id,
              50
            );
            return {
              datastreamId: datastream.datastream_id,
              observations: response.success ? response.data.observations : [],
            };
          });

        const results = await Promise.all(observationsPromises);
        const chartData: Record<number, Observation[]> = {};

        results.forEach(({ datastreamId, observations }) => {
          chartData[datastreamId] = observations;
        });

        setChartObservations(chartData);

        // Find the earliest observation date across all datastreams
        let earliestDate: string | null = null;
        results.forEach(({ observations }) => {
          if (observations.length > 0) {
            // Get the oldest observation (they're ordered by phenomenonTime desc, so take the last one)
            const oldestInThisDatastream = observations[observations.length - 1];
            if (!earliestDate || oldestInThisDatastream.phenomenon_time < earliestDate) {
              earliestDate = oldestInThisDatastream.phenomenon_time;
            }
          }
        });

        if (earliestDate) {
          // Format the date to YYYY-MM-DD
          const formattedDate = new Date(earliestDate).toISOString().split('T')[0];
          setObservationStartDate(formattedDate);
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
      } finally {
        setIsLoadingChart(false);
      }
    };

    fetchChartData();
  }, [datastreams]);

  const getQualityStatus = (quality: ObservationQuality | string | null) => {
    if (!quality) return "Unknown";
    if (typeof quality === "object") {
      return quality.status || quality.quality || "Unknown";
    }
    return quality;
  };

  // Fetch observations when datastream is selected
  useEffect(() => {
    if (!selectedDatastream) {
      setObservations([]);
      return;
    }

    const fetchObservations = async () => {
      try {
        setIsLoadingObservations(true);
        setError(null); // Clear any previous errors
        const response = await getDatastreamObservations(
          selectedDatastream.datastream_id
        );

        if (response.success) {
          setObservations(response.data.observations);
        } else {
          setError(response.error || "Failed to load observations");
          setObservations([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading observations");
        setObservations([]);
      } finally {
        setIsLoadingObservations(false);
      }
    };

    fetchObservations();
  }, [selectedDatastream]);

  if (!sensor) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="pb-6 pr-12">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {sensor.name}
            </SheetTitle>
            {sensor.metadata_url && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={sensor.metadata_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View Metadata</span>
                </a>
              </Button>
            )}
          </div>
          <SheetDescription>
            Detailed sensor information and datastreams
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Sensor Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-4 w-4" />
                Sensor Overview
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Borehole Reference: {sensor.name.match(/[A-Z]{2,3}\d{2,3}/)?.[0] || 'N/A'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Start Date: {observationStartDate || '2021-09-01'}
                  </Badge>
                  <Badge variant="secondary">
                    {sensor.total_datastreams} datastreams
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                  Description
                </h4>
                <p className="text-sm">{sensor.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Category
                    </h4>
                    <Badge variant="secondary">{sensor.category}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Location
                    </h4>
                    <div className="space-y-2">
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
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Status
                    </h4>
                    <Badge variant="outline">
                      {sensor.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Sensor ID
                    </h4>
                    <span className="text-sm font-mono">{sensor.id}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Summary */}
          {datastreams.length > 0 &&
            Object.keys(chartObservations).length > 0 && (
              <DatastreamSummary
                datastreams={datastreams.slice(0, 5)}
                observations={chartObservations}
              />
            )}

          {/* Datastream Chart */}
          <DatastreamChart
            datastreams={datastreams.slice(0, 5)}
            observations={chartObservations}
          />

          {/* Datastreams */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Available Datastreams
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {isLoadingDatastreams ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading datastreams...
                  </span>
                </div>
              ) : datastreams.length > 0 ? (
                <div className="space-y-3">
                  {datastreams.map((datastream) => (
                    <div
                      key={datastream.datastream_id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedDatastream?.datastream_id ===
                        datastream.datastream_id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      onClick={() => setSelectedDatastream(datastream)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">
                              {datastream.name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              ID: {datastream.datastream_id}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {datastream.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No datastreams available for this sensor.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Observations */}
          {selectedDatastream && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Observations
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Latest readings from {selectedDatastream.name}
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingObservations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading observations...
                    </span>
                  </div>
                ) : observations.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {observations.slice(0, 10).map((observation, index) => (
                      <div
                        key={observation.observation_id || index}
                        className="flex justify-between items-center p-2 border-b last:border-b-0"
                      >
                        <div>
                          <span className="font-medium">
                            {formatSensorValue(
                              observation.result,
                              selectedDatastream.unit_symbol
                            )}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Quality: {getQualityStatus(observation.result_quality)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              observation.phenomenon_time
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              observation.phenomenon_time
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent observations available for this datastream.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
