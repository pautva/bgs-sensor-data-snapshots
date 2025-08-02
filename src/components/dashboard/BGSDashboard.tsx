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
      <header className="border-b bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Satellite className="h-7 w-7" />
                BGS Sensor Network Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time environmental monitoring
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

              {/* Refresh button */}
              <Button
                variant="outline"
                size="sm"
                onClick={refetchAll}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
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

      {/* Sensor Detail Modal */}
      <SensorDetailModal
        sensor={selectedSensor}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}