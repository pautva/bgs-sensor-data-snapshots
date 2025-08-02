'use client';

import { useState } from 'react';
import { SensorTable } from './SensorTable';
import { SensorDetailSheet } from './SensorDetailSheet';
import { SummaryCards } from './SummaryCards';
import { Toggle } from '@/components/ui/toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sensor } from '@/types/bgs-sensor';
import { useRealTimeData } from '@/hooks/useSensorData';
import { useProgressiveSensorData } from '@/hooks/useProgressiveSensorData';
import { 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Satellite
} from 'lucide-react';

export default function BGSDashboard() {
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Use progressive loading for sensors to get datastream counts
  const {
    sensors,
    isLoadingBasic,
    isLoadingCounts,
    isComplete,
    error: sensorError,
    refetch: refetchSensors
  } = useProgressiveSensorData();

  // Still use the original hook for locations and stats
  const {
    locations,
    stats,
    isLoading: isLoadingOther,
    hasError,
    errors,
    lastUpdated,
    refetchAll
  } = useRealTimeData();

  // Combine loading states
  const isLoading = isLoadingBasic || isLoadingOther;

  const handleSensorSelect = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedSensor(null);
  };

  // Calculate summary metrics
  const totalSensors = sensors?.length || 0;
  const totalLocations = locations?.length || 0;
  const activeSites = stats?.sites?.length || 4; // Default to 4 major BGS sites
  const totalDatastreams = sensors?.reduce((sum, sensor) => sum + sensor.total_datastreams, 0) || 0;

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return lastUpdated.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Satellite className="h-7 w-7" />
                BGS Sensor Network Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Environmental monitoring across BGS sites
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection status */}
              <div className="flex items-center gap-2">
                {hasError ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">Issues</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Connected</span>
                  </>
                )}
              </div>

              {/* Last updated */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatLastUpdated()}</span>
              </div>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Refresh button */}
              <Toggle
                variant="outline"
                size="sm"
                pressed={false}
                onPressedChange={refetchAll}
                disabled={isLoading}
                aria-label="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Toggle>
            </div>
          </div>

          {/* Error display */}
          {hasError && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Connection Errors:</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-destructive/90">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary Cards */}
          <SummaryCards
            totalSensors={totalSensors}
            totalLocations={totalLocations}
            activeSites={activeSites}
            totalDatastreams={totalDatastreams}
            isLoading={isLoadingBasic}
            isLoadingDatastreams={isLoadingCounts}
          />

          {/* Primary Tool - Sensor Network Overview (Full Width) */}
          <section aria-labelledby="table-heading">
            <h2 id="table-heading" className="sr-only">Sensor Overview</h2>
            <SensorTable 
              onSensorSelect={handleSensorSelect}
              className="w-full"
            />
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              © 2025 British Geological Survey
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Live Data</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Sensor Detail Sheet */}
      <SensorDetailSheet
        sensor={selectedSensor}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
      />
    </div>
  );
}