'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
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

interface SensorDetailModalProps {
  sensor: Sensor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SensorDetailModal({ sensor, isOpen, onClose }: SensorDetailModalProps) {
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
          // Auto-select first datastream
          if (response.data.datastreams.length > 0) {
            setSelectedDatastream(response.data.datastreams[0]);
          }
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

  // Fetch observations when datastream changes
  useEffect(() => {
    if (!selectedDatastream) {
      setObservations([]);
      return;
    }

    const fetchObservations = async () => {
      try {
        setIsLoadingObservations(true);
        setError(null);
        
        const response = await getDatastreamObservations(selectedDatastream.datastream_id, 20);
        
        if (response.success) {
          setObservations(response.data.observations);
        } else {
          setError(response.error || 'Failed to load observations');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoadingObservations(false);
      }
    };

    fetchObservations();
  }, [selectedDatastream]);

  if (!sensor) return null;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'var(--sensor-active)';
      case 'inactive':
        return 'var(--sensor-inactive)';
      case 'pending':
        return 'var(--sensor-pending)';
      default:
        return 'var(--muted)';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={onClose} />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getStatusColor((sensor as any).status) }}
            />
            {sensor.name}
          </DialogTitle>
          <DialogDescription>
            {sensor.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sensor Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Sensor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ID:</span>
                  <span className="font-medium">{sensor.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <Badge 
                    style={{ 
                      backgroundColor: getSensorStatusColor(sensor.category),
                      color: 'white'
                    }}
                  >
                    {sensor.category}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="capitalize font-medium">
                    {(sensor as any).status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Published:</span>
                  <Badge variant={sensor.published ? "default" : "secondary"}>
                    {sensor.published ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Datastreams:</span>
                  <span className="font-medium">{sensor.total_datastreams}</span>
                </div>
                {sensor.metadata_url && (
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Metadata
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Deployment Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sensor.deployment_locations.map((location, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{location}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Measurement Capabilities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Measurement Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sensor.measurement_capabilities.map((capability, index) => (
                  <Badge key={index} variant="outline">
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Datastreams and Observations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Datastreams */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Datastreams
                  {isLoadingDatastreams && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingDatastreams ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : datastreams.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {datastreams.map((datastream) => (
                      <div
                        key={datastream.datastream_id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedDatastream?.datastream_id === datastream.datastream_id
                            ? 'border-primary bg-primary/5'
                            : ''
                        }`}
                        onClick={() => setSelectedDatastream(datastream)}
                      >
                        <div className="font-medium text-sm">{datastream.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {datastream.unit_name} ({datastream.unit_symbol})
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {datastream.description}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No datastreams available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Observations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Observations
                  {isLoadingObservations && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </CardTitle>
                {selectedDatastream && (
                  <div className="text-sm text-muted-foreground">
                    {selectedDatastream.name}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!selectedDatastream ? (
                  <div className="text-sm text-muted-foreground">
                    Select a datastream to view observations
                  </div>
                ) : isLoadingObservations ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : observations.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {observations.map((observation) => (
                      <div
                        key={observation.observation_id}
                        className="flex justify-between items-center p-2 border rounded"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {formatSensorValue(observation.result, selectedDatastream.unit_symbol)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(observation.phenomenon_time).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {observation.result_quality}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No observations available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="p-3 border border-destructive rounded-lg bg-destructive/5">
              <div className="flex items-center gap-2 text-destructive">
                <Activity className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}