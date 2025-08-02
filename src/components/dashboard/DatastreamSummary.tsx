'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Datastream, Observation } from '@/types/bgs-sensor';
import { formatSensorValue } from '@/lib/bgs-api';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface DatastreamSummaryProps {
  datastreams: Datastream[];
  observations: Record<number, Observation[]>;
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

export function DatastreamSummary({ datastreams, observations, className }: DatastreamSummaryProps) {
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
      
      const values = datastreamObs
        .map(obs => typeof obs.result === 'number' ? obs.result : parseFloat(obs.result) || 0)
        .filter(val => !isNaN(val));
      
      if (values.length === 0) {
        stats[datastream.datastream_id] = {
          min: 0, max: 0, avg: 0, latest: 0, count: 0, trend: 'neutral'
        };
        return;
      }
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const latest = values[0]; // First value (most recent due to desc order)
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

  // Extract measurement type from datastream name
  const getPropertyName = (datastreamName: string) => {
    const nameLower = datastreamName.toLowerCase();
    
    // Handle gas measurements with sensor prefix (e.g., "GGS05_01 Carbon Dioxide")
    if (nameLower.includes('carbon dioxide') || nameLower.includes('co2')) return 'Carbon Dioxide';
    if (nameLower.includes('methane') || nameLower.includes('ch4')) return 'Methane';
    if (nameLower.includes('oxygen') || nameLower.includes('o2')) return 'Oxygen';
    if (nameLower.includes('hydrogen sulfide') || nameLower.includes('h2s')) return 'Hydrogen Sulfide';
    if (nameLower.includes('nitrogen') || nameLower.includes('n2')) return 'Nitrogen';
    
    // Common environmental measurements
    if (nameLower.includes('temperature')) return 'Temperature';
    if (nameLower.includes('conductivity')) return 'Conductivity';
    if (nameLower.includes('pressure')) return 'Pressure';
    if (nameLower.includes('humidity')) return 'Humidity';
    if (nameLower.includes('salinity')) return 'Salinity';
    if (nameLower.includes('tds')) return 'TDS';
    if (nameLower.includes('wind speed')) return 'Wind Speed';
    if (nameLower.includes('wind direction')) return 'Wind Direction';
    if (nameLower.includes('water level')) return 'Water Level';
    if (nameLower.includes('ph')) return 'pH';
    if (nameLower.includes('dissolved oxygen')) return 'Dissolved Oxygen';
    
    // For sensor prefix patterns like "GGS05_01 SomeProperty", extract the property part
    const words = datastreamName.split(' ');
    if (words.length > 1 && words[0].match(/^[A-Z]{2,3}\d+_\d+$/)) {
      // If first word is sensor ID pattern, return the rest
      return words.slice(1).join(' ');
    }
    
    // Fallback: take the longest meaningful word or first word
    return words.find(word => word.length > 2) || words[0] || 'Measurement';
  };

  if (!datastreams.length || !Object.keys(observations).length) {
    return null;
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Data Summary
          <Badge variant="secondary" className="ml-auto">
            {datastreams.length} streams
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {datastreams.map(datastream => {
            const stats = streamStats[datastream.datastream_id];
            if (!stats || stats.count === 0) return null;
            
            const propertyName = getPropertyName(datastream.name);
            
            return (
              <div 
                key={datastream.datastream_id}
                className="p-3 border rounded-lg bg-muted/20 space-y-2"
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
      </CardContent>
    </Card>
  );
}