'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Location, SensorSite } from '@/types/bgs-sensor';
import { listLocations, getSensorStatusColor } from '@/lib/bgs-api';
import { MapPin, Map, Globe } from 'lucide-react';

interface SensorMapProps {
  className?: string;
  onLocationSelect?: (location: Location) => void;
}

// Site coordinates for the map visualization
const SITE_COORDINATES = {
  'UKGEOS Glasgow Observatory': { lat: 55.8642, lng: -4.2518 },
  'BGS Cardiff': { lat: 51.4816, lng: -3.1791 },
  'UKGEOS Cheshire Observatory': { lat: 53.1462, lng: -2.4349 },
  'Wallingford': { lat: 51.6012, lng: -1.1117 }
};

export function SensorMap({ className, onLocationSelect }: SensorMapProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<SensorSite | 'all'>('all');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        const response = await listLocations();
        
        if (response.success) {
          setLocations(response.data.locations);
          setError(null);
        } else {
          setError(response.error || 'Failed to load locations');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const filteredLocations = selectedSite === 'all' 
    ? locations 
    : locations.filter(loc => loc.site === selectedSite);

  const siteStats = Object.keys(SITE_COORDINATES).map(site => {
    const siteLocations = locations.filter(loc => loc.site === site);
    const activeLocations = siteLocations.filter(loc => loc.active);
    
    return {
      site: site as SensorSite,
      total: siteLocations.length,
      active: activeLocations.length,
      coordinates: SITE_COORDINATES[site as SensorSite]
    };
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Location Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-64 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-destructive ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <Map className="h-4 w-4" />
            <span>Error loading locations: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Location Overview
        </CardTitle>
        
        {/* Site Filter */}
        <div className="mt-4">
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value as SensorSite | 'all')}
            className="h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
          >
            <option value="all">All Sites</option>
            {Object.keys(SITE_COORDINATES).map(site => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Site Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {siteStats.map((stat) => (
            <div
              key={stat.site}
              className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedSite === stat.site ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setSelectedSite(stat.site)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{stat.site.split(' ')[0]}</h4>
                  <p className="text-xs text-muted-foreground">
                    {stat.coordinates.lat.toFixed(4)}, {stat.coordinates.lng.toFixed(4)}
                  </p>
                </div>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: stat.active > 0 ? 'var(--sensor-active)' : 'var(--sensor-inactive)' 
                    }}
                  />
                  <span className="text-sm font-medium">{stat.active}</span>
                  <span className="text-xs text-muted-foreground">active</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stat.total} total
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Map Placeholder - In a real implementation, this would be an interactive map */}
        <div className="relative h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Map className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Interactive Map Visualization
              </p>
              <p className="text-xs text-muted-foreground">
                {filteredLocations.length} locations across {siteStats.length} sites
              </p>
            </div>
          </div>

          {/* Site markers overlay */}
          {siteStats.map((stat, index) => (
            <div
              key={stat.site}
              className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              style={{
                backgroundColor: stat.active > 0 ? 'var(--sensor-active)' : 'var(--sensor-inactive)',
                left: `${20 + (index * 15)}%`,
                top: `${30 + (index * 10)}%`
              }}
              title={`${stat.site}: ${stat.active}/${stat.total} active`}
            >
              <MapPin className="h-3 w-3 text-white" />
            </div>
          ))}
        </div>

        {/* Location Details */}
        {selectedSite !== 'all' && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              {selectedSite} Locations ({filteredLocations.length})
            </h4>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {filteredLocations.map((location) => (
                <div
                  key={location.location_id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => onLocationSelect?.(location)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ 
                          backgroundColor: location.active ? 'var(--sensor-active)' : 'var(--sensor-inactive)' 
                        }}
                      />
                      <span className="font-medium text-sm">{location.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {location.sub_site} • {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </p>
                  </div>
                  <Badge variant={location.active ? "default" : "secondary"} className="text-xs">
                    {location.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{locations.length}</div>
              <div className="text-xs text-muted-foreground">Total Locations</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--sensor-active)]">
                {locations.filter(loc => loc.active).length}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-lg font-bold">{siteStats.length}</div>
              <div className="text-xs text-muted-foreground">Sites</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}