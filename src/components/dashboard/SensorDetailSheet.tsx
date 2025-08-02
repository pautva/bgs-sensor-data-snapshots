'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sensor, Datastream, Observation } from '@/types/bgs-sensor';
import { getSensorDatastreams, getDatastreamObservations, getSensorStatusColor, formatSensorValue } from '@/lib/bgs-api';
import { 
  Activity, 
  MapPin, 
  Calendar,
  TrendingUp,
  Database,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface SensorDetailSheetProps {
  sensor: Sensor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SensorDetailSheet({ sensor, isOpen, onClose }: SensorDetailSheetProps) {
  const [datastreams, setDatastreams] = useState<Datastream[]>([]);
  const [selectedDatastream, setSelectedDatastream] = useState<Datastream | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isLoadingDatastreams, setIsLoadingDatastreams] = useState(false);
  const [isLoadingObservations, setIsLoadingObservations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch datastreams when sensor changes
  useEffect(() => {
    if (!sensor || !isOpen) {
      setDatastreams([]);
      setSelectedDatastream(null);
      setObservations([]);
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
          setError(response.error || 'Failed to load datastreams');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoadingDatastreams(false);
      }
    };

    fetchDatastreams();
  }, [sensor, isOpen]);

  // Fetch observations when datastream is selected
  useEffect(() => {
    if (!selectedDatastream) {
      setObservations([]);
      return;
    }

    const fetchObservations = async () => {
      try {
        setIsLoadingObservations(true);
        const response = await getDatastreamObservations(selectedDatastream.datastream_id);
        
        if (response.success) {
          setObservations(response.data.observations);
        } else {
          console.error('Failed to load observations:', response.error);
        }
      } catch (err) {
        console.error('Error fetching observations:', err);
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
                <a href={sensor.metadata_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
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
                <Badge variant="secondary" className="ml-auto">
                  {sensor.total_datastreams} datastreams
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{sensor.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Category</h4>
                    <Badge variant="secondary">
                      {sensor.category}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Deployment Locations</h4>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{sensor.deployment_locations.join(', ')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                    <Badge variant="outline">
                      {sensor.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Sensor ID</h4>
                    <span className="text-sm font-mono">{sensor.id}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <span className="ml-2 text-sm text-muted-foreground">Loading datastreams...</span>
                </div>
              ) : datastreams.length > 0 ? (
                <div className="space-y-3">
                  {datastreams.map((datastream) => (
                    <div
                      key={datastream.datastream_id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedDatastream?.datastream_id === datastream.datastream_id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                      onClick={() => setSelectedDatastream(datastream)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{datastream.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              ID: {datastream.datastream_id}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {datastream.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Unit: {datastream.unit_name} ({datastream.unit_symbol})</span>
                            <span>Type: {datastream.observation_type}</span>
                          </div>
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
                    <span className="ml-2 text-sm text-muted-foreground">Loading observations...</span>
                  </div>
                ) : observations.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {observations.slice(0, 10).map((observation, index) => (
                      <div key={observation.observation_id || index} className="flex justify-between items-center p-2 border-b last:border-b-0">
                        <div>
                          <span className="font-medium">
                            {formatSensorValue(observation.result, selectedDatastream.unit_symbol)}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Quality: {observation.result_quality}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(observation.phenomenon_time).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(observation.phenomenon_time).toLocaleTimeString()}
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