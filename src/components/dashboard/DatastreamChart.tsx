'use client';

import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { Datastream, Observation } from '@/types/bgs-sensor';
import { validateSensorValue } from '@/lib/bgs-api';
import { getXAxisConfig, formatDisplayTime, getChartMargins, extractPropertyName } from '@/lib/chart-utils';
import { TrendingUp, BarChart3, Loader2 } from 'lucide-react';

interface DatastreamChartProps {
  datastreams: Datastream[];
  observations: Record<number, Observation[]>;
  isLoading?: boolean;
  className?: string;
  selectedStartDate?: Date;
  selectedEndDate?: Date;
  totalObservations?: number;
  observationLimit?: number;
  isDataLimited?: boolean;
}

// Chart color palette using Tailwind colors
const CHART_COLORS = [
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500  
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444'  // red-500
];

// Moved extractPropertyName to chart-utils.ts for reusability

export function DatastreamChart({ 
  datastreams, 
  observations, 
  isLoading = false, 
  className,
  selectedStartDate,
  selectedEndDate,
  totalObservations,
  observationLimit,
  isDataLimited
}: DatastreamChartProps) {
  const [isNormalised, setIsNormalised] = useState(true);
  const [visibleDatastreams, setVisibleDatastreams] = useState<Set<number>>(
    () => new Set(datastreams.map(ds => ds.datastream_id))
  );

  // Update visible datastreams only when datastream IDs actually change
  useEffect(() => {
    const currentIds = new Set(datastreams.map(ds => ds.datastream_id));
    setVisibleDatastreams(currentIds);
  }, [datastreams.map(ds => ds.datastream_id).join(',')]);

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
  
  // Get x-axis configuration using centralized utility
  const xAxisConfig = getXAxisConfig(selectedStartDate, selectedEndDate);
  const chartMargins = getChartMargins(xAxisConfig);

  const chartData = useMemo(() => {
    if (!datastreams.length || !Object.keys(observations).length) return [];

    // Create individual series for each datastream, then merge by timestamp
    const allDataPoints = new Map<string, any>();

    // Process each datastream's observations
    datastreams.forEach(datastream => {
      const datastreamObs = observations[datastream.datastream_id] || [];
      
      // Use all fetched observations for this datastream
      datastreamObs.forEach(obs => {
        const timestamp = obs.phenomenon_time;
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = new Date(timestamp);
        
        // Create display time using centralized formatting
        const displayTime = formatDisplayTime(date, xAxisConfig.format);
        
        // Initialize or get existing data point
        if (!allDataPoints.has(timestamp)) {
          allDataPoints.set(timestamp, {
            timestamp,
            time,
            date: date.toLocaleDateString(),
            displayTime
          });
        }
        
        const dataPoint = allDataPoints.get(timestamp);
        // Use standardized scientific data validation
        const validatedValue = validateSensorValue(obs.result);
        if (validatedValue !== null) {
          dataPoint[`datastream_${datastream.datastream_id}`] = validatedValue;
        }
      });
    });

    // Convert to array and sort by timestamp (use all data points)
    const rawData = Array.from(allDataPoints.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Apply normalization if enabled
    if (isNormalised && rawData.length > 0) {
      // Calculate min/max for each datastream across all time points
      const datastreamRanges = new Map<string, { min: number; max: number }>();
      
      datastreams.forEach(datastream => {
        const dataKey = `datastream_${datastream.datastream_id}`;
        const values = rawData
          .map(point => point[dataKey])
          .filter(val => validateSensorValue(val) !== null);
        
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          datastreamRanges.set(dataKey, { min, max });
        }
      });

      // Normalise each data point while preserving original values
      return rawData.map(point => {
        const NormalisedPoint = { ...point };
        
        datastreams.forEach(datastream => {
          const dataKey = `datastream_${datastream.datastream_id}`;
          const originalDataKey = `${dataKey}_original`;
          const value = point[dataKey];
          const range = datastreamRanges.get(dataKey);
          
          if (typeof value === 'number' && !isNaN(value) && range) {
            const { min, max } = range;
            // Store original value for tooltip
            NormalisedPoint[originalDataKey] = value;
            // Min-max normalization to 0-1 scale
            NormalisedPoint[dataKey] = max === min ? 0 : (value - min) / (max - min);
          }
        });
        
        return NormalisedPoint;
      });
    }

    return rawData;
  }, [datastreams, observations, isNormalised, xAxisConfig.format]);


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
            {/* <Badge variant="secondary">
              {datastreams.length} datastreams
            </Badge> */}
          </div>
          <Toggle
            pressed={isNormalised}
            onPressedChange={setIsNormalised}
            aria-label="Toggle normalization"
            size="sm"
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            {isNormalised ? 'Normalised' : 'Raw Values'}
          </Toggle>
        </div>
        <p className="text-sm text-muted-foreground">
          {(() => {
            if (selectedStartDate && selectedEndDate) {
              const start = selectedStartDate.toISOString().split('T')[0];
              const end = selectedEndDate.toISOString().split('T')[0];
              return `Readings from ${start} to ${end}`;
            }
            return 'Latest readings showing trends over time';
          })()}
          {isNormalised && ' (Normalised to 0-1 scale for comparison)'}
        </p>
      </CardHeader>
      <CardContent className={isFullHeight ? 'flex-1 flex flex-col' : ''}>
        <div className={`w-full ${isFullHeight ? 'flex-1 min-h-[300px]' : 'h-[300px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={chartMargins}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={axisColor} strokeOpacity={0.5} />
              <XAxis 
                dataKey="displayTime" 
                tick={{ fontSize: 12, fill: textColor }}
                interval={xAxisConfig.interval}
                stroke={axisColor}
                strokeOpacity={0.7}
                angle={xAxisConfig.angle}
                textAnchor={xAxisConfig.textAnchor}
                height={xAxisConfig.height}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: textColor }}
                width={60}
                stroke={axisColor}
                strokeOpacity={0.7}
                domain={isNormalised ? [-0.1, 1.1] : ['auto', 'auto']}
                tickFormatter={isNormalised ? (value: number) => value.toFixed(2) : undefined}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  return (
                    <div className="bg-background border border-border rounded-md shadow-lg p-3 text-sm">
                      <p className="font-medium text-foreground mb-2">
                        {payload[0]?.payload?.date} at {payload[0]?.payload?.time}
                      </p>
                      <div className="space-y-1">
                        {payload.map((entry) => {
                          const datastream = datastreams.find(ds => `datastream_${ds.datastream_id}` === entry.dataKey);
                          const color = entry.color;
                          const normalizedValue = entry.value as number;
                          const unit = datastream?.unit_symbol || '';
                          
                          // Get original value if in normalized mode
                          const originalDataKey = `${entry.dataKey}_original`;
                          const originalValue = isNormalised && entry.payload[originalDataKey] 
                            ? entry.payload[originalDataKey] 
                            : normalizedValue;
                          
                          let displayValue: string;
                          if (isNormalised && typeof originalValue === 'number') {
                            const formattedOriginal = originalValue.toLocaleString('en-US', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 6 
                            });
                            const formattedNormalized = normalizedValue.toFixed(3);
                            displayValue = unit 
                              ? `${formattedOriginal} ${unit} (${formattedNormalized} normalized)`
                              : `${formattedOriginal} (${formattedNormalized} normalized)`;
                          } else if (typeof normalizedValue === 'number') {
                            const formatted = normalizedValue.toLocaleString('en-US', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 6 
                            });
                            displayValue = unit ? `${formatted} ${unit}` : formatted;
                          } else {
                            displayValue = String(normalizedValue);
                          }
                          
                          return (
                            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-muted-foreground">
                                  {datastream?.name ? extractPropertyName(datastream.name) : entry.dataKey}
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
                  {extractPropertyName(datastream.name)} ({datastream.unit_symbol})
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}