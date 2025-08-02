'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sensor, Datastream, Observation } from '@/types/bgs-sensor';
import { listSensors, getSensorDatastreams, getDatastreamObservations } from '@/lib/bgs-api';
import { 
  TrendingUp, 
  BarChart3, 
  Activity,
  Thermometer,
  Droplets,
  Wind,
  Zap
} from 'lucide-react';

interface DataVisualizationProps {
  className?: string;
}

interface ChartData {
  sensor: Sensor;
  datastream: Datastream;
  observations: Observation[];
}

export function DataVisualization({ className }: DataVisualizationProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<'temperature' | 'water-level' | 'conductivity'>('temperature');

  useEffect(() => {
    const fetchVisualizationData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get sensors first
        const sensorsResponse = await listSensors();
        if (!sensorsResponse.success) {
          throw new Error(sensorsResponse.error || 'Failed to load sensors');
        }

        // Get sample datastreams and observations for the first few sensors
        const chartPromises = sensorsResponse.data.sensors.slice(0, 3).map(async (sensor) => {
          const datastreamsResponse = await getSensorDatastreams(sensor.id);
          if (datastreamsResponse.success && datastreamsResponse.data.datastreams.length > 0) {
            const datastream = datastreamsResponse.data.datastreams[0];
            const observationsResponse = await getDatastreamObservations(datastream.datastream_id, 10);
            
            if (observationsResponse.success) {
              return {
                sensor,
                datastream,
                observations: observationsResponse.data.observations
              };
            }
          }
          return null;
        });

        const results = await Promise.all(chartPromises);
        const validChartData = results.filter((data): data is ChartData => data !== null);
        
        setChartData(validChartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisualizationData();
  }, []);

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'water-level':
        return <Droplets className="h-4 w-4" />;
      case 'conductivity':
        return <Zap className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const generateMockChartData = (type: string) => {
    const baseValue = type === 'temperature' ? 15 : type === 'water-level' ? 2.5 : 150;
    const variance = type === 'temperature' ? 5 : type === 'water-level' ? 0.5 : 50;
    
    return Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      value: baseValue + (Math.random() - 0.5) * variance * 2,
      hour: i
    }));
  };

  const renderChart = (data: any[], title: string, unit: string, color: string) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{title}</h4>
          <Badge variant="outline">{unit}</Badge>
        </div>
        
        {/* Simple line chart visualization */}
        <div className="h-32 border rounded-lg p-4 bg-gradient-to-br from-muted/20 to-muted/5">
          <div className="h-full relative">
            <svg className="w-full h-full" viewBox="0 0 100 40">
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              {/* Chart area */}
              <path
                d={`M 0,${40 - ((data[0].value - minValue) / range) * 35} ${data
                  .map((point, index) => 
                    `L ${(index * 100) / (data.length - 1)},${40 - ((point.value - minValue) / range) * 35}`
                  )
                  .join(' ')} L 100,40 L 0,40 Z`}
                fill={`url(#gradient-${title})`}
                stroke={color}
                strokeWidth="1"
              />
              
              {/* Data points */}
              {data.map((point, index) => (
                <circle
                  key={index}
                  cx={(index * 100) / (data.length - 1)}
                  cy={40 - ((point.value - minValue) / range) * 35}
                  r="1"
                  fill={color}
                />
              ))}
            </svg>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
              <span>{maxValue.toFixed(1)}</span>
              <span>{minValue.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Latest values */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold" style={{ color }}>
              {data[data.length - 1]?.value.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {maxValue.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Max 24h</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {minValue.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Min 24h</div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Data Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
            <div className="h-48 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
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
            <span>Error loading visualization data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const temperatureData = generateMockChartData('temperature');
  const waterLevelData = generateMockChartData('water-level');
  const conductivityData = generateMockChartData('conductivity');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Real-time Data Visualization
        </CardTitle>
        
        {/* Chart type selector */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={selectedChart === 'temperature' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart('temperature')}
          >
            {getChartIcon('temperature')}
            Temperature
          </Button>
          <Button
            variant={selectedChart === 'water-level' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart('water-level')}
          >
            {getChartIcon('water-level')}
            Water Level
          </Button>
          <Button
            variant={selectedChart === 'conductivity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart('conductivity')}
          >
            {getChartIcon('conductivity')}
            Conductivity
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {selectedChart === 'temperature' && renderChart(
          temperatureData, 
          'Water Temperature (24h)', 
          '°C',
          'var(--chart-1)'
        )}
        
        {selectedChart === 'water-level' && renderChart(
          waterLevelData, 
          'Water Level (24h)', 
          'm', 
          'var(--chart-2)'
        )}
        
        {selectedChart === 'conductivity' && renderChart(
          conductivityData, 
          'Conductivity (24h)', 
          'μS/cm', 
          'var(--chart-3)'
        )}

        {/* Data sources info */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Data sources: {chartData.length} active sensors</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}