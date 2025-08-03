"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface MiniMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export function MiniMap({ latitude, longitude, className = "" }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    let isMounted = true;

    // More aggressive cleanup - check if container has _leaflet_id
    const container = mapRef.current;
    if (container && (container as any)._leaflet_id) {
      try {
        // Remove any existing Leaflet instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }
        // Clear the _leaflet_id property
        delete (container as any)._leaflet_id;
      } catch (e) {
        console.warn('Error during aggressive cleanup:', e);
      }
    }

    // Clean up any existing map instance first
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Error removing existing map:', e);
      }
      mapInstanceRef.current = null;
    }

    // Clear the container completely
    if (mapRef.current) {
      mapRef.current.innerHTML = '';
      // Remove any Leaflet-related classes
      mapRef.current.className = mapRef.current.className
        .split(' ')
        .filter(cls => !cls.startsWith('leaflet-'))
        .join(' ');
    }

    // Short delay to ensure cleanup is complete
    const initTimeout = setTimeout(() => {
      if (!isMounted || !mapRef.current) return;

      // Dynamic import to avoid SSR issues
      const loadMap = async () => {
        try {
          const L = await import('leaflet');

          if (!isMounted || !mapRef.current) return;

          // Double-check container is clean
          const container = mapRef.current;
          if ((container as any)._leaflet_id) {
            console.warn('Container still has _leaflet_id, skipping map creation');
            return;
          }

          // Create map instance
          const map = L.default.map(mapRef.current, {
            center: [latitude, longitude],
            zoom: 13,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            dragging: true,
            attributionControl: true,
          });

          // Add OpenStreetMap tiles
          L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          // Create custom marker icon
          const customIcon = L.default.divIcon({
            html: `<div style="
              background-color: #3b82f6;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            "></div>`,
            className: 'custom-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          // Add marker
          L.default.marker([latitude, longitude], { icon: customIcon }).addTo(map);

          if (isMounted) {
            mapInstanceRef.current = map;
            setIsLoading(false);

            // Trigger resize after a short delay to ensure container is sized
            setTimeout(() => {
              if (isMounted && mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
              }
            }, 100);
          } else {
            // Component was unmounted, clean up the map we just created
            map.remove();
          }
        } catch (err) {
          console.error('Error loading map:', err);
          if (isMounted) {
            setError(true);
            setIsLoading(false);
          }
        }
      };

      loadMap();
    }, 50);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error cleaning up map:', e);
        }
        mapInstanceRef.current = null;
      }

      // Final cleanup of container
      if (mapRef.current) {
        const container = mapRef.current;
        if ((container as any)._leaflet_id) {
          delete (container as any)._leaflet_id;
        }
      }
    };
  }, [latitude, longitude]);

  // Add resize observer to handle container size changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          // Double-check map instance still exists before calling invalidateSize
          if (mapInstanceRef.current) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch (e) {
              console.warn('Error invalidating map size:', e);
            }
          }
        }, 10);
      }
    });

    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isLoading]);

  if (error) {
    return (
      <div 
        className={`w-full h-full rounded border border-border/50 bg-muted/30 flex items-center justify-center ${className}`}
      >
        <div className="text-center text-muted-foreground">
          <MapPin className="h-6 w-6 mx-auto mb-2" />
          <div className="text-sm">Map unavailable</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 rounded border border-border/50 bg-muted/30 flex items-center justify-center z-10"
        >
          <div className="text-center text-muted-foreground">
            <MapPin className="h-6 w-6 mx-auto mb-2 animate-pulse" />
            <div className="text-sm">Loading map...</div>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded border border-border/50 bg-muted"
      />
    </div>
  );
}