'use client';

import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { Datastream, Observation } from '@/types/bgs-sensor';
import { validateSensorValue } from '@/lib/bgs-api';
import { getPropertyName, formatChartTime } from '@/lib/chart-utils';
import { formatDateForDisplay } from '@/lib/date-utils';
import { TrendingUp, Loader2, BarChart3 } from 'lucide-react';

interface DatastreamChartProps {
  datastreams: Datastream[];
  observations: Record<number, Observation[]>;
  isLoading?: boolean;
  className?: string;
  selectedStartDate?: Date;
  selectedEndDate?: Date;
}

// Expanded chart color palette for unique colors
const CHART_COLORS = [
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500  
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5a2b', // brown-600
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
  '#64748b', // slate-500
  '#059669', // emerald-600
  '#dc2626'  // red-600
];


export function DatastreamChart({ 
  datastreams, 
  observations, 
  isLoading = false, 
  className,
  selectedStartDate,
  selectedEndDate
}: DatastreamChartProps) {
  const [isNormalized, setIsNormalized] = useState(true);
  const [visibleDatastreams, setVisibleDatastreams] = useState<Set<number>>(
    () => new Set(datastreams.map(ds => ds.datastream_id))
  );

  // Update visible datastreams only when datastreams change
  useEffect(() => {
    const currentIds = new Set(datastreams.map(ds => ds.datastream_id));
    setVisibleDatastreams(currentIds);
  }, [datastreams]);

  const toggleDatastreamVisibility = (datastreamId: number) => {
    setVisibleDatastreams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(datastreamId)) {
        newSet.delete(datastreamId);
      } else {
        newSet.add(datastreamId);
      }
      return newSet;
    });
  };
  
  // Theme-aware colors for light and dark mode
  const axisColor = '#94a3b8'; // slate-400 - works well in both themes
  const textColor = '#64748b'; // slate-500 - readable in both themes

  const chartData = useMemo(() => {
    if (!datastreams.length || !Object.keys(observations).length) return [];

    // Collect all observations with their timestamps for processing
    const allObservations: Array<{ obs: any; datastreamId: number; timestamp: string; date: Date }> = [];
    
    datastreams.forEach(datastream => {
      const datastreamObs = observations[datastream.datastream_id] || [];
      datastreamObs.forEach(obs => {
        const date = new Date(obs.phenomenon_time);
        if (!isNaN(date.getTime())) { // Only include valid dates
          allObservations.push({
            obs,
            datastreamId: datastream.datastream_id,
            timestamp: obs.phenomenon_time,
            date
          });
        }
      });
    });

    if (allObservations.length === 0) return [];

    // Calculate date range for time formatting
    const timestamps = allObservations.map(item => item.date.getTime());
    const actualDaysDiff = Math.max(1, Math.ceil((Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24)));

    // Build chart data points efficiently
    const allDataPoints = new Map<string, any>();

    allObservations.forEach(({ obs, datastreamId, timestamp, date }) => {
      const displayTime = formatChartTime(date, actualDaysDiff);
      
      // Initialize or get existing data point
      if (!allDataPoints.has(timestamp)) {
        allDataPoints.set(timestamp, {
          timestamp,
          displayTime,
          date: date.getTime() // For sorting
        });
      }
      
      // Add validated data to the point
      const validatedValue = validateSensorValue(obs.result);
      if (validatedValue !== null) {
        allDataPoints.get(timestamp)![`datastream_${datastreamId}`] = validatedValue;
      }
    });

    // Convert to array and sort by timestamp
    const rawData = Array.from(allDataPoints.values())
      .sort((a, b) => a.date - b.date);

    // Simple normalization if enabled
    if (isNormalized && rawData.length > 0) {
      // Find min/max for each datastream
      const ranges = new Map();
      datastreams.forEach(ds => {
        const key = `datastream_${ds.datastream_id}`;
        const values = rawData.map(point => point[key]).filter(v => v != null);
        if (values.length > 0) {
          ranges.set(key, { min: Math.min(...values), max: Math.max(...values) });
        }
      });

      // Apply normalization
      return rawData.map(point => {
        const normalized = { ...point };
        datastreams.forEach(ds => {
          const key = `datastream_${ds.datastream_id}`;
          const range = ranges.get(key);
          if (range && point[key] != null) {
            normalized[`${key}_original`] = point[key];
            normalized[key] = range.max === range.min ? 0 : (point[key] - range.min) / (range.max - range.min);
          }
        });
        return normalized;
      });
    }

    return rawData;
  }, [datastreams, observations, isNormalized]);


  if (!datastreams.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Datastream Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No datastreams available to display.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !chartData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Datastream Trends
            <Badge variant="secondary" className="ml-auto">
              {datastreams.length} datastreams
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading chart data...
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No chart data available
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Check if this is being used in a full-height context
  const isFullHeight = className?.includes('h-full');

  return (
    <Card className={`${isFullHeight ? 'flex flex-col' : ''} ${className || ""}`}>
      <CardHeader className={isFullHeight ? "flex-shrink-0" : ""}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <CardTitle className="text-lg">Datastream Trends</CardTitle>
            <Badge variant="secondary">
              {datastreams.length} datastreams
            </Badge>
          </div>
          <Toggle
            pressed={isNormalized}
            onPressedChange={setIsNormalized}
            size="sm"
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            {isNormalized ? 'Normalised' : 'Raw'}
          </Toggle>
        </div>
        <p className="text-sm text-muted-foreground">
          {(() => {
            const totalReadings = Object.values(observations).flat().length;
            const readingText = totalReadings === 1 ? 'reading' : 'readings';
            
            if (selectedStartDate && selectedEndDate) {
              const start = formatDateForDisplay(selectedStartDate);
              const end = formatDateForDisplay(selectedEndDate);
              return `${totalReadings.toLocaleString()} ${readingText} from ${start} to ${end}`;
            }
            return `${totalReadings.toLocaleString()} ${readingText} showing trends over time`;
          })()}
          {isNormalized && ' • Normalised 0-1 scale'}
        </p>
      </CardHeader>
      <CardContent className={isFullHeight ? 'flex-1 flex flex-col' : ''}>
        <div className={`w-full ${isFullHeight ? 'flex-1 min-h-[300px]' : 'h-[300px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={axisColor} strokeOpacity={0.5} />
              <XAxis 
                dataKey="displayTime" 
                tick={{ fontSize: 11, fill: textColor }}
                stroke={axisColor}
                strokeOpacity={0.7}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: textColor }}
                width={60}
                stroke={axisColor}
                strokeOpacity={0.7}
                domain={isNormalized ? [-0.05, 1.05] : ['dataMin - 5%', 'dataMax + 5%']}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  return (
                    <div className="bg-background border border-border rounded-md shadow-lg p-3 text-sm">
                      <p className="font-medium text-foreground mb-2">
                        {(() => {
                          const timestamp = payload[0]?.payload?.timestamp;
                          if (!timestamp) return 'Unknown time';
                          const date = new Date(timestamp);
                          return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                        })()}
                      </p>
                      <div className="space-y-1">
                        {payload.map((entry) => {
                          const datastream = datastreams.find(ds => `datastream_${ds.datastream_id}` === entry.dataKey);
                          const color = entry.color;
                          const value = entry.value as number;
                          const unit = datastream?.unit_symbol || '';
                          
                          // Show appropriate value based on mode
                          const originalValue = entry.payload[`${entry.dataKey}_original`];
                          let displayValue;
                          
                          if (isNormalized && originalValue != null) {
                            // Normalised mode: show original value + normalised value
                            displayValue = `${originalValue.toLocaleString('en-GB', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 4 
                            })}${unit ? ` ${unit}` : ''} (${value.toFixed(2)} norm)`;
                          } else if (!isNormalized && originalValue != null) {
                            // Raw mode but we have stored original (shouldn't happen, but fallback)
                            displayValue = `${originalValue.toLocaleString('en-GB', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 6 
                            })}${unit ? ` ${unit}` : ''}`;
                          } else {
                            // Raw mode: show actual value
                            displayValue = typeof value === 'number' 
                              ? `${value.toLocaleString('en-GB', { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 6 
                                })}${unit ? ` ${unit}` : ''}`
                              : String(value);
                          }
                          
                          return (
                            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-muted-foreground">
                                  {datastream?.name ? getPropertyName(datastream.name) : entry.dataKey}
                                </span>
                              </div>
                              <span className="font-mono font-medium text-foreground text-right">
                                {displayValue}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              {datastreams.map((datastream, index) => {
                const color = CHART_COLORS[index % CHART_COLORS.length];
                const dataKey = `datastream_${datastream.datastream_id}`;
                const isVisible = visibleDatastreams.has(datastream.datastream_id);
                
                return (
                  <Line
                    key={datastream.datastream_id}
                    type="monotone"
                    dataKey={dataKey}
                    stroke={isVisible ? color : 'transparent'}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={true}
                    name={datastream.name}
                    isAnimationActive={false}
                    hide={!isVisible}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-1 pt-1 border-t">
          {datastreams.map((datastream, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length];
            const isVisible = visibleDatastreams.has(datastream.datastream_id);
            
            return (
              <button
                key={datastream.datastream_id}
                onClick={() => toggleDatastreamVisibility(datastream.datastream_id)}
                className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all hover:bg-muted/50 cursor-pointer ${
                  isVisible ? 'opacity-100' : 'opacity-50'
                }`}
                title={`Click to ${isVisible ? 'hide' : 'show'} ${datastream.name}`}
              >
                <div 
                  className={`w-3 h-3 rounded-full transition-all ${
                    isVisible ? '' : 'border-2 border-current bg-transparent'
                  }`}
                  style={{ 
                    backgroundColor: isVisible ? color : 'transparent',
                    borderColor: !isVisible ? color : 'transparent'
                  }}
                />
                <span className={`text-sm transition-all ${
                  isVisible ? '' : 'line-through'
                }`}>
                  {getPropertyName(datastream.name)} ({datastream.unit_symbol})
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}