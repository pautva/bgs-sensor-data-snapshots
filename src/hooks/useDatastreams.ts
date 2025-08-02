'use client';

import { useState, useEffect, useCallback } from 'react';
import { Datastream, Observation } from '@/types/bgs-sensor';
import { getSensorDatastreams, getDatastreamObservations } from '@/lib/bgs-api';

// Hook for fetching sensor datastreams
export function useDatastreams(sensorId: number | null) {
  const [datastreams, setDatastreams] = useState<Datastream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDatastreams = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getSensorDatastreams(id);
      
      if (response.success) {
        setDatastreams(response.data.datastreams);
      } else {
        setError(response.error || 'Failed to fetch datastreams');
        setDatastreams([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setDatastreams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sensorId) {
      fetchDatastreams(sensorId);
    } else {
      setDatastreams([]);
      setError(null);
    }
  }, [sensorId, fetchDatastreams]);

  const refetch = useCallback(() => {
    if (sensorId) {
      fetchDatastreams(sensorId);
    }
  }, [sensorId, fetchDatastreams]);

  return {
    datastreams,
    isLoading,
    error,
    refetch
  };
}

// Hook for fetching datastream observations
export function useObservations(
  datastreamId: number | null, 
  limit: number = 100,
  autoRefresh: boolean = false,
  refreshInterval: number = 30000
) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchObservations = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getDatastreamObservations(id, limit);
      
      if (response.success) {
        setObservations(response.data.observations);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to fetch observations');
        setObservations([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setObservations([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (datastreamId) {
      fetchObservations(datastreamId);
    } else {
      setObservations([]);
      setError(null);
    }
  }, [datastreamId, fetchObservations]);

  useEffect(() => {
    if (autoRefresh && datastreamId) {
      const interval = setInterval(() => {
        fetchObservations(datastreamId);
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, datastreamId, refreshInterval, fetchObservations]);

  const refetch = useCallback(() => {
    if (datastreamId) {
      fetchObservations(datastreamId);
    }
  }, [datastreamId, fetchObservations]);

  // Helper function to get latest observation
  const getLatestObservation = useCallback(() => {
    if (observations.length === 0) return null;
    
    return observations.reduce((latest, current) => {
      const latestTime = new Date(latest.phenomenon_time).getTime();
      const currentTime = new Date(current.phenomenon_time).getTime();
      return currentTime > latestTime ? current : latest;
    });
  }, [observations]);

  // Helper function to calculate statistics
  const getStatistics = useCallback(() => {
    if (observations.length === 0) return null;

    const values = observations
      .map(obs => obs.result)
      .filter(result => typeof result === 'number') as number[];

    if (values.length === 0) return null;

    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];

    return {
      count: values.length,
      min,
      max,
      mean,
      median
    };
  }, [observations]);

  return {
    observations,
    isLoading,
    error,
    lastUpdated,
    refetch,
    getLatestObservation,
    getStatistics
  };
}

// Combined hook for sensor detail view
export function useSensorDetail(sensorId: number | null) {
  const datastreamsHook = useDatastreams(sensorId);
  const [selectedDatastreamId, setSelectedDatastreamId] = useState<number | null>(null);
  const observationsHook = useObservations(selectedDatastreamId, 50, true, 30000);

  // Auto-select first datastream when datastreams are loaded
  useEffect(() => {
    if (datastreamsHook.datastreams.length > 0 && !selectedDatastreamId) {
      setSelectedDatastreamId(datastreamsHook.datastreams[0].datastream_id);
    }
  }, [datastreamsHook.datastreams, selectedDatastreamId]);

  // Reset selection when sensor changes
  useEffect(() => {
    setSelectedDatastreamId(null);
  }, [sensorId]);

  const selectDatastream = useCallback((datastreamId: number) => {
    setSelectedDatastreamId(datastreamId);
  }, []);

  const selectedDatastream = datastreamsHook.datastreams.find(
    ds => ds.datastream_id === selectedDatastreamId
  ) || null;

  return {
    datastreams: datastreamsHook.datastreams,
    selectedDatastream,
    observations: observationsHook.observations,
    isLoadingDatastreams: datastreamsHook.isLoading,
    isLoadingObservations: observationsHook.isLoading,
    datastreamError: datastreamsHook.error,
    observationError: observationsHook.error,
    lastUpdated: observationsHook.lastUpdated,
    selectDatastream,
    refetchDatastreams: datastreamsHook.refetch,
    refetchObservations: observationsHook.refetch,
    getLatestObservation: observationsHook.getLatestObservation,
    getStatistics: observationsHook.getStatistics
  };
}