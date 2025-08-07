'use client';

import { Card, CardContent } from '@/components/ui/card';
import { 
  Satellite, 
  MapPin, 
  Building2, 
  Activity
} from 'lucide-react';

interface SummaryCardsProps {
  totalSensors: number;
  totalLocations: number;
  activeSites: number;
  totalDatastreams: number;
  isLoading?: boolean;
  isLoadingDatastreams?: boolean;
}

export function SummaryCards({ 
  totalSensors, 
  totalLocations, 
  activeSites, 
  totalDatastreams,
  isLoading = false,
  isLoadingDatastreams = false 
}: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-8 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Sensors',
      value: totalSensors.toLocaleString(),
      icon: Satellite,
      description: 'Monitoring devices'
    },
    {
      title: 'Locations',
      value: totalLocations.toLocaleString(),
      icon: MapPin,
      description: 'Locations'
    },
    {
      title: 'Active Sites',
      value: activeSites.toLocaleString(),
      icon: Building2,
      description: 'Major BGS sites'
    },
    {
      title: 'Datastreams',
      value: isLoadingDatastreams ? '...' : totalDatastreams.toLocaleString(),
      icon: Activity,
      description: 'Datastreams monitored'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}