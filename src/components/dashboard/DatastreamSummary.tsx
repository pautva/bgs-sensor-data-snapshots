'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Datastream, Observation } from '@/types/bgs-sensor';
import { formatSensorValue, processObservationValues } from '@/lib/bgs-api';
import { getPropertyName } from '@/lib/chart-utils';
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from 'lucide-react';

interface DatastreamSummaryProps {
  datastreams: Datastream[];
  observations: Record<number, Observation[]>;
  isLoading?: boolean;
  className?: string;
}

interface StreamStats {
  min: number;
  max: number;
  avg: number;
  latest: number;
  count: number;
  trend: 'up' | 'down' | 'neutral';
}

export function DatastreamSummary({ datastreams, observations, isLoading = false, className }: DatastreamSummaryProps) {
  const streamStats = useMemo(() => {
    const stats: Record<number, StreamStats> = {};
    
    datastreams.forEach(datastream => {
      const datastreamObs = observations[datastream.datastream_id] || [];
      
      if (datastreamObs.length === 0) {
        stats[datastream.datastream_id] = {
          min: 0, max: 0, avg: 0, latest: 0, count: 0, trend: 'neutral'
        };
        return;
      }
      
      // Use standardized scientific data validation
      const values = processObservationValues(datastreamObs);
      
      if (values.length === 0) {
        stats[datastream.datastream_id] = {
          min: 0, max: 0, avg: 0, latest: 0, count: 0, trend: 'neutral'
        };
        return;
      }
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      // Use the most recent validated value - first in the processed array
      const latest = values[0];
      const count = values.length;
      
      // Calculate trend from last few readings
      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      if (values.length >= 3) {
        const recent = values.slice(0, 3);
        const older = values.slice(-3);
        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
        
        if (recentAvg > olderAvg * 1.02) trend = 'up';
        else if (recentAvg < olderAvg * 0.98) trend = 'down';
      }
      
      stats[datastream.datastream_id] = { min, max, avg, latest, count, trend };
    });
    
    return stats;
  }, [datastreams, observations]);


  if (!datastreams.length) {
    return null;
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // Determine optimal grid layout based on number of cards
  const getGridColumns = (count: number) => {
    if (count <= 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    return "grid-cols-2 lg:grid-cols-3";
  };

  const validDatastreams = datastreams.filter(datastream => {
    const stats = streamStats[datastream.datastream_id];
    return stats && stats.count > 0;
  });

  return (
    <Card className={`flex flex-col ${className || ""}`}>
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Data Summary
          <Badge variant="secondary" className="ml-auto">
            {validDatastreams.length} valid datastreams
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading datastream trends...
            </span>
          </div>
        ) : !Object.keys(observations).length ? (
          <div className="flex items-center justify-center py-8 h-full">
            <span className="text-sm text-muted-foreground">
              No observation data available
            </span>
          </div>
        ) : (
          <div className={`grid ${getGridColumns(validDatastreams.length)} gap-3 h-full`}>
          {datastreams.map(datastream => {
            const stats = streamStats[datastream.datastream_id];
            if (!stats || stats.count === 0) return null;
            
            const propertyName = getPropertyName(datastream.name);
            
            return (
              <div 
                key={datastream.datastream_id}
                className="p-3 border rounded-lg bg-muted/20 space-y-2 flex flex-col h-full"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">{propertyName}</h4>
                  {getTrendIcon(stats.trend)}
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs">
                    Latest: <span className="font-mono font-medium text-foreground">
                      {formatSensorValue(stats.latest, datastream.unit_symbol)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span>
                      Min: <span className="font-mono text-blue-600">
                        {formatSensorValue(stats.min, datastream.unit_symbol)}
                      </span>
                    </span>
                    <span>
                      Max: <span className="font-mono text-red-600">
                        {formatSensorValue(stats.max, datastream.unit_symbol)}
                      </span>
                    </span>
                  </div>
                  
                  <div className="text-xs">
                    Avg: <span className="font-mono text-muted-foreground">
                      {formatSensorValue(stats.avg, datastream.unit_symbol)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}