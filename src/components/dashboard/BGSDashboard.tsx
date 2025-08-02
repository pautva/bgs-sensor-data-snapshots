'use client';

import { useState } from 'react';
import { SensorTable } from './SensorTable';
import { SensorDetailModal } from './SensorDetailModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sensor } from '@/types/bgs-sensor';
import { useRealTimeData } from '@/hooks/useSensorData';
import { 
  Activity, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Satellite
} from 'lucide-react';

export default function BGSDashboard() {
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    sensors,
    locations,
    isLoading,
    hasError,
    errors,
    lastUpdated,
    refetchAll
  } = useRealTimeData();

  const handleSensorSelect = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setIsModalOpen(true);
  };


  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSensor(null);
  };

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
      <header className="bg-primary text-primary-foreground p-[var(--dashboard-padding)] border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-[var(--text-xl)] lg:text-[var(--text-2xl)] font-bold flex items-center gap-2 lg:gap-3">
                <Satellite className="h-6 w-6 lg:h-8 lg:w-8" />
                <span className="hidden sm:inline">BGS Sensor Network Dashboard</span>
                <span className="sm:hidden">BGS Dashboard</span>
              </h1>
              <p className="text-[var(--text-xs)] lg:text-[var(--text-sm)] opacity-90">
                Real-time environmental monitoring across 4 major sites
              </p>
            </div>
            
            {/* Status and controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              {/* Connection status */}
              <div className="flex items-center gap-2">
                {hasError ? (
                  <div className="flex items-center gap-2 text-destructive-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Connection Issues</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-100">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Connected</span>
                  </div>
                )}
              </div>

              {/* Last updated */}
              <div className="flex items-center gap-2 text-xs lg:text-sm opacity-80">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Updated: {formatLastUpdated()}</span>
                <span className="sm:hidden">{formatLastUpdated()}</span>
              </div>

              {/* Refresh button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={refetchAll}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Error display */}
          {hasError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Connection Errors:</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {errors.map((error, index) => (
                  <li key={index} className="text-destructive-foreground/90">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="p-[var(--dashboard-padding)]">
        <div className="max-w-7xl mx-auto space-y-[var(--card-gap)]">
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
      <footer className="border-t bg-muted/30 mt-12">
        <div className="max-w-7xl mx-auto p-[var(--dashboard-padding)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>© 2025 British Geological Survey</span>
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Live Data
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Connected to BGS API Server</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--sensor-active)]" />
                <span>bgs-sensor-data</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Sensor Detail Modal */}
      <SensorDetailModal
        sensor={selectedSensor}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}