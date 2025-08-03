'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sensor } from '@/types/bgs-sensor';
import { listSensors, getBatchDatastreamCounts } from '@/lib/bgs-api';

interface ProgressiveSensorData {
  sensors: Sensor[];
  isLoadingBasic: boolean;
  isLoadingCounts: boolean;
  isComplete: boolean;
  error: string | null;
  refetch: () => void;
}

// Hook for progressive sensor loading - basic data first, then enhanced
export function useProgressiveSensorData(): ProgressiveSensorData {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isLoadingBasic, setIsLoadingBasic] = useState(true);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBasicSensors = useCallback(async () => {
    try {
      setError(null);
      setIsLoadingBasic(true);
      
      const response = await listSensors();
      
      if (response.success) {
        setSensors(response.data.sensors);
        setIsLoadingBasic(false);
        
        // Start loading datastream counts in background
        setIsLoadingCounts(true);
        
        // Get datastream counts for all sensors
        const sensorIds = response.data.sensors.map(s => s.id);
        const counts = await getBatchDatastreamCounts(sensorIds);
        
        // Update sensors with datastream counts
        setSensors(prevSensors => 
          prevSensors.map(sensor => ({
            ...sensor,
            total_datastreams: counts[sensor.id] || 0
          }))
        );
        
        setIsLoadingCounts(false);
        setIsComplete(true);
      } else {
        setError(response.error || 'Failed to fetch sensors');
        setIsLoadingBasic(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsLoadingBasic(false);
      setIsLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    fetchBasicSensors();
  }, [fetchBasicSensors]);

  const refetch = useCallback(() => {
    setIsComplete(false);
    setIsLoadingBasic(true);  // Set loading state immediately
    setIsLoadingCounts(false);
    setError(null);
    fetchBasicSensors();
  }, [fetchBasicSensors]);

  return {
    sensors,
    isLoadingBasic,
    isLoadingCounts,
    isComplete,
    error,
    refetch
  };
}