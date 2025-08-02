# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive BGS Sensor Network Dashboard built with Next.js 15.4.5, TypeScript, and shadcn/ui components. The dashboard provides real-time monitoring and analysis of BGS's environmental sensor network using data from the BGS FROST API.

## Commands

- `npm run dev --turbopack` - Start development server with turbopack (fast refresh)
- `npm run dev -- -p 4000` - Start development server on port 4000  
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality checks

## Architecture & Structure

### Framework Stack
- **Next.js 15.4.5** with App Router (`src/app/` directory)
- **React 19** with modern features and Fragment support
- **TypeScript 5** with strict configuration
- **Tailwind CSS v4** with PostCSS integration

### Key Dependencies
- `class-variance-authority` & `clsx` - For conditional CSS classes
- `tailwind-merge` - Merges Tailwind classes efficiently
- `lucide-react` - Icon library for UI elements
- `tw-animate-css` - Animation utilities

### BGS-Specific Features
- **Real-time Data Integration** - Direct connection to BGS FROST API (`https://sensors.bgs.ac.uk/FROST-Server/v1.1`)
- **Sensor Network Monitoring** - Live sensor data across 4 major BGS sites
- **Expandable Datastreams** - Interactive exploration of sensor capabilities
- **Responsive Design** - Mobile-friendly interface with consistent touch targets

### Component Architecture
- **shadcn/ui** configured with "new-york" style
- Components aliased to `@/components`, utils to `@/lib/utils`
- Uses `cn()` utility function in `src/lib/utils.ts` for class merging
- Path mapping configured for `@/*` pointing to `src/*`

### Dashboard Components
```
src/
├── components/
│   ├── ui/              # shadcn/ui base components
│   └── dashboard/       # BGS-specific dashboard components
│       ├── BGSDashboard.tsx      # Main dashboard layout
│       ├── StatsCards.tsx        # Real-time metrics cards
│       ├── SensorTable.tsx       # Primary sensor overview table
│       ├── SensorMap.tsx         # Location visualization
│       ├── DataVisualization.tsx # Time-series charts
│       └── SensorDetailModal.tsx # Detailed sensor information
├── hooks/
│   ├── useSensorData.ts     # Real-time sensor data fetching
│   └── useDatastreams.ts    # Datastream management
├── lib/
│   ├── bgs-api.ts          # BGS FROST API integration
│   └── utils.ts            # Utility functions
└── types/
    └── bgs-sensor.ts       # TypeScript interfaces for BGS data
```

### Styling System
- **Tailwind CSS v4** with custom theme configuration
- **BGS Design Tokens** - Custom CSS variables for sensor status and categories:
  ```css
  --sensor-active: hsl(142 76% 36%);
  --sensor-inactive: hsl(0 84% 60%);
  --groundwater-monitoring: hsl(220 70% 50%);
  --weather-station: hsl(260 60% 50%);
  ```
- Dark mode support with `.dark` class variant
- Consistent spacing tokens (`--dashboard-padding`, `--card-gap`)

### Data Integration
- **BGS FROST API** - Real sensor data from `https://sensors.bgs.ac.uk/FROST-Server/v1.1`
- **Sensor Types** - Groundwater Monitoring, Weather Station, Soil Gas Monitoring, etc.
- **Sites Covered** - UKGEOS Glasgow Observatory, BGS Cardiff, UKGEOS Cheshire Observatory, Wallingford
- **Real-time Updates** - Automatic data refresh with configurable intervals

### Key Features Implemented
1. **Primary Sensor Table** - Full-width sortable table with sensor details
2. **Expandable Datastreams** - Click to view detailed datastream information
3. **Live Statistics** - Real-time metrics cards showing network health
4. **Interactive Map** - Geographic visualization of sensor locations
5. **Data Visualization** - Time-series charts for sensor measurements
6. **Responsive Layout** - Mobile-optimized interface

## Data Structure

### Main Sensor Interface
- **ID** - Sequential numbering for table display
- **Sensor Name** - BGS sensor identifier (e.g., "BGS GGERFS Barometer")
- **Description** - Detailed sensor information
- **Datastreams** - Count of available data measurements (expandable to show details)
- **Dashboard** - View detailed sensor information

### BGS Sites & Data
- **4 Major Sites** with 202+ sensor locations
- **Real Datastream Counts** - Accurate counts from FROST API endpoints
- **Consistent Data** - Both table and expanded views use same API endpoints

## Development Notes

- Uses Geist font family (Sans & Mono) from Google Fonts
- Turbopack enabled for faster development builds
- PostCSS configured with `@tailwindcss/postcss` plugin
- TypeScript paths configured for clean imports
- Real-time data fetching with error handling and loading states
- Debug logging enabled for BGS API calls (check browser console)

## API Integration Notes

- **Consistent Endpoints** - Both main table and expanded views use `/Things(${sensorId})/Datastreams`
- **Error Handling** - Graceful fallbacks for API failures
- **Caching** - Intelligent caching of datastream details to avoid repeated calls
- **Rate Limiting** - Considerate API usage with appropriate delays