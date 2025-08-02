'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats } from '@/types/bgs-sensor';
import { getDashboardStats } from '@/lib/bgs-api';
import { Activity, MapPin, Database, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  className?: string;
}

export function StatsCards({ className }: StatsCardsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await getDashboardStats();
        
        if (response.success) {
          setStats(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to load statistics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className={`grid gap-[var(--card-gap)] md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[var(--text-sm)] font-medium">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <Activity className="h-4 w-4" />
              <span className="text-[var(--text-sm)]">Error loading statistics: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const activePercentage = stats.total_locations > 0 
    ? Math.round((stats.active_locations / stats.total_locations) * 100)
    : 0;

  const mostActiveSite = stats.sites.reduce((prev, current) => 
    prev.active_locations > current.active_locations ? prev : current
  );

  const totalMeasurementTypes = stats.measurement_types.length;

  return (
    <div className={`grid gap-[var(--card-gap)] md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {/* Total Sensors Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[var(--text-sm)] font-medium">
            Total Sensor Types
          </CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-[var(--text-2xl)] font-bold">
            {stats.total_sensors}
          </div>
          <p className="text-[var(--text-xs)] text-muted-foreground">
            {Object.entries(stats.categories)
              .filter(([, count]) => count > 0)
              .length} active categories
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(stats.categories)
              .filter(([, count]) => count > 0)
              .map(([category, count]) => (
                <Badge 
                  key={category} 
                  variant="secondary" 
                  className="text-[var(--text-xs)]"
                >
                  {category.split(' ')[0]} ({count})
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Locations Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[var(--text-sm)] font-medium">
            Active Locations
          </CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-[var(--text-2xl)] font-bold">
            {stats.active_locations}
          </div>
          <p className="text-[var(--text-xs)] text-muted-foreground">
            of {stats.total_locations} total locations ({activePercentage}%)
          </p>
          <div className="mt-2">
            <div 
              className="h-2 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={activePercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div 
                className="h-full bg-[var(--sensor-active)] transition-all duration-300"
                style={{ width: `${activePercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Major Sites Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[var(--text-sm)] font-medium">
            Major Sites
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-[var(--text-2xl)] font-bold">
            {stats.sites.length}
          </div>
          <p className="text-[var(--text-xs)] text-muted-foreground">
            Most active: {mostActiveSite.site.split(' ')[0]}
          </p>
          <div className="mt-2 space-y-1">
            {stats.sites.map((site) => (
              <div key={site.site} className="flex justify-between items-center">
                <span className="text-[var(--text-xs)] text-muted-foreground truncate">
                  {site.site.split(' ')[0]}
                </span>
                <Badge 
                  variant={site.active_locations > 0 ? "default" : "secondary"}
                  className="text-[var(--text-xs)]"
                >
                  {site.active_locations}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Measurement Types Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[var(--text-sm)] font-medium">
            Measurement Types
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-[var(--text-2xl)] font-bold">
            {totalMeasurementTypes}
          </div>
          <p className="text-[var(--text-xs)] text-muted-foreground">
            Available measurement capabilities
          </p>
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {stats.measurement_types.slice(0, 3).map((type) => (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className="text-[var(--text-xs)]"
                >
                  {type.split(' ')[0]}
                </Badge>
              ))}
              {stats.measurement_types.length > 3 && (
                <Badge variant="outline" className="text-[var(--text-xs)]">
                  +{stats.measurement_types.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}