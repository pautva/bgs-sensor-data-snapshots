'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sensor, Location, DashboardStats, BGSApiResponse } from '@/types/bgs-sensor';
import { listSensors, listLocations, getDashboardStats } from '@/lib/bgs-api';

// Hook for fetching sensor data
export function useSensorData(autoRefresh: boolean = false, refreshInterval: number = 30000) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSensors = useCallback(async () => {
    try {
      setError(null);
      const response = await listSensors();
      
      if (response.success) {
        setSensors(response.data.sensors);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to fetch sensors');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSensors();

    if (autoRefresh) {
      const interval = setInterval(fetchSensors, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSensors, autoRefresh, refreshInterval]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchSensors();
  }, [fetchSensors]);

  return {
    sensors,
    isLoading,
    error,
    lastUpdated,
    refetch
  };
}

// Hook for fetching location data
export function useLocationData(autoRefresh: boolean = false, refreshInterval: number = 60000) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setError(null);
      const response = await listLocations();
      
      if (response.success) {
        setLocations(response.data.locations);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to fetch locations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();

    if (autoRefresh) {
      const interval = setInterval(fetchLocations, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchLocations, autoRefresh, refreshInterval]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    isLoading,
    error,
    lastUpdated,
    refetch
  };
}

// Hook for fetching dashboard statistics
export function useDashboardStats(autoRefresh: boolean = false, refreshInterval: number = 45000) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const response = await getDashboardStats();
      
      if (response.success) {
        setStats(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to fetch dashboard statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, autoRefresh, refreshInterval]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    lastUpdated,
    refetch
  };
}

// Hook for managing real-time updates across multiple data sources
export function useRealTimeData() {
  const sensorData = useSensorData(false, 30000);
  const locationData = useLocationData(false, 60000);
  const statsData = useDashboardStats(false, 45000);

  const isLoading = sensorData.isLoading || locationData.isLoading || statsData.isLoading;
  const hasError = !!(sensorData.error || locationData.error || statsData.error);
  const errors = [sensorData.error, locationData.error, statsData.error].filter(Boolean);

  const refetchAll = useCallback(() => {
    sensorData.refetch();
    locationData.refetch();
    statsData.refetch();
  }, [sensorData.refetch, locationData.refetch, statsData.refetch]);

  const lastUpdated = [
    sensorData.lastUpdated,
    locationData.lastUpdated,
    statsData.lastUpdated
  ]
    .filter(date => date !== null)
    .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0] || null;

  return {
    sensors: sensorData.sensors,
    locations: locationData.locations,
    stats: statsData.stats,
    isLoading,
    hasError,
    errors,
    lastUpdated,
    refetchAll
  };
}