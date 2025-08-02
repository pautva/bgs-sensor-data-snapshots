# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimal, professional BGS Sensor Network Dashboard built with Next.js 15.4.5, TypeScript, and shadcn/ui components using the stone theme. The dashboard provides real-time monitoring of BGS's environmental sensor network using data from the BGS FROST API.

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
- `@radix-ui/react-select` - Accessible select component
- `@radix-ui/react-toggle` - Toggle component for interactive elements
- `@radix-ui/react-slot` - Slot component for asChild pattern
- `chart` - React charting library for data visualizations
- `class-variance-authority` & `clsx` - For conditional CSS classes
- `tailwind-merge` - Merges Tailwind classes efficiently
- `lucide-react` - Icon library for UI elements
- `tw-animate-css` - Animation utilities

### Key Features
- **Real-time Data Integration** - Direct connection to BGS FROST API (`https://sensors.bgs.ac.uk/FROST-Server/v1.1`)
- **Sensor Network Overview** - Main table showing all sensors with expandable datastreams
- **Search & Filter** - Filter sensors by type and search by name/description
- **Dark Mode Support** - System-aware theme switching with persistent preferences
- **Minimal UI** - Clean, professional interface using shadcn/ui stone theme
- **No Limitations** - Fetches all available sensors (no artificial limits)

### Component Architecture
- **shadcn/ui** configured with stone theme
- Components aliased to `@/components`, utils to `@/lib/utils`
- Uses `cn()` utility function in `src/lib/utils.ts` for class merging
- Path mapping configured for `@/*` pointing to `src/*`
- **Minimal Design** - No custom CSS variables, only shadcn/ui styles

### Dashboard Components
```
src/
├── components/
│   ├── ui/              # shadcn/ui base components
│   │   ├── button.tsx       # Button component
│   │   ├── card.tsx         # Card component
│   │   ├── table.tsx        # Table components
│   │   ├── select.tsx       # Select dropdown component
│   │   ├── input.tsx        # Input component
│   │   ├── badge.tsx        # Badge component
│   │   ├── toggle.tsx       # Toggle component
│   │   ├── chart.tsx        # Chart components (shadcn/ui + recharts)
│   │   ├── sheet.tsx        # Sheet/sidebar component
│   │   └── dialog.tsx       # Dialog component (for sheet)
│   └── dashboard/       # Dashboard components
│       ├── BGSDashboard.tsx      # Main dashboard layout (manual refresh only)
│       ├── SensorTable.tsx       # Primary sensor table with filtering
│       ├── SensorDetailSheet.tsx # Enhanced sensor details with location & borehole ref
│       ├── DatastreamChart.tsx   # Stable chart component (no auto-refresh)
│       ├── DatastreamSummary.tsx # Compact statistics cards for datastream data
│       └── SummaryCards.tsx      # Overview metrics cards
│   ├── theme-provider.tsx   # Theme context provider for dark mode
│   ├── theme-toggle.tsx     # Dark mode toggle component
├── hooks/
│   └── useSensorData.ts     # Manual sensor data fetching (auto-refresh disabled)
├── lib/
│   ├── bgs-api.ts          # BGS FROST API integration with location support
│   └── utils.ts            # Utility functions (cn helper)
└── types/
    └── bgs-sensor.ts       # TypeScript interfaces for BGS data
```

### Styling System
- **Tailwind CSS v4** with shadcn/ui stone theme
- **No Custom CSS Variables** - Uses only standard shadcn/ui color tokens
- **Minimal Approach** - Standard Tailwind classes (text-green-600, text-blue-600, etc.)
- **Dark Mode Support** - System-aware theme switching with `.dark` class variant
- **Theme Persistence** - User preferences saved to localStorage
- **Easy Maintenance** - No custom design tokens to maintain

### Data Integration
- **BGS FROST API** - Real sensor data from `https://sensors.bgs.ac.uk/FROST-Server/v1.1`
- **Location Data** - GPS coordinates and deployment site information
- **Sensor Types** - Groundwater Monitoring, Weather Station, Soil Gas Monitoring, etc.
- **Gas Measurements** - Carbon Dioxide, Methane, Oxygen from GasClam probes
- **Sites Covered** - UKGEOS Glasgow Observatory, BGS Cardiff, UKGEOS Cheshire Observatory, Wallingford
- **Manual Updates** - User-controlled data refresh via refresh button
- **Borehole References** - Automatic extraction from sensor names (GGA01, BH123, etc.)

### Current Implementation
1. **Summary Cards** - Key metrics overview (sensors, locations, sites, datastreams)
2. **Sensor Network Table** - Primary feature showing all sensors with:
   - **Click-to-expand rows** - Click entire row to view datastreams
   - **Advanced Filtering** - Search, sensor type, and measurement type filters
   - **Smart measurement extraction** - Filters by core types (Temperature, Conductivity, etc.)
   - **Sortable columns** - Sort by name or datastream count
3. **Enhanced Right-side Sheet** - Click "Explore" to open sensor details with:
   - **Location & Coordinates** - GPS coordinates in [longitude, latitude] format
   - **Borehole Reference** - Automatic extraction from sensor names (e.g., GGA01)
   - **Multiple Location Support** - Expandable list for sensors with multiple deployment sites
   - **Stable Charts** - No auto-refresh to prevent chart resets
4. **Manual Refresh System** - User-controlled data updates via refresh button only
5. **Dark Mode Toggle** - System-aware theme switching in navbar with persistent preferences
6. **Datastream Visualization** - Interactive line charts showing latest 50 readings per datastream
7. **Data Summary Cards** - Compact statistics showing min/max/avg/latest values with trend indicators
8. **Minimal Design** - Clean, professional shadcn/ui stone theme

## Data Structure

### Main Sensor Interface
- **ID** - Sequential numbering for table display
- **Sensor Name** - BGS sensor identifier (e.g., "BGS GGERFS Barometer")
- **Description** - Detailed sensor information
- **Datastreams** - Count of available data measurements (expandable to show details)
- **Explore** - View detailed sensor information in right-side sheet

### BGS Sites & Data
- **4 Major Sites** with 200+ sensor locations
- **No Artificial Limits** - Fetches all available sensors from FROST API
- **Real Datastream Counts** - Accurate counts from FROST API endpoints
- **Consistent Data** - Both table and expanded views use same API endpoints

## Development Notes

- Uses Geist font family (Sans & Mono) from Google Fonts
- Turbopack enabled for faster development builds
- PostCSS configured with `@tailwindcss/postcss` plugin
- TypeScript paths configured for clean imports
- Real-time data fetching with error handling and loading states
- **Minimal Design** - Only shadcn/ui components, no custom styling
- **Easy to Maintain** - Standard design patterns, no complex customizations

## API Integration Notes

- **Real Data Integration** - Uses actual BGS FROST API endpoints instead of mock data
- **Observations Endpoint** - `/Datastreams(${id})/Observations?$top=${limit}&$orderby=phenomenonTime%20desc`
- **No Limitations** - Removed `$top=100` parameter to fetch all sensors
- **Consistent Endpoints** - Both main table and expanded views use `/Things(${sensorId})/Datastreams`
- **Error Handling** - Graceful fallbacks for API failures
- **Caching** - Intelligent caching of datastream details to avoid repeated calls
- **Rate Limiting** - Considerate API usage with appropriate delays

## Styling Guidelines

- **Always use shadcn/ui components first** - Before creating custom components, always check if shadcn/ui has a suitable component (Button, Card, Table, Select, Input, Badge, Sheet, Toggle, Switch, etc.)
- **Standard Tailwind classes only** - No custom CSS variables
- **Stone theme colors** - Consistent with shadcn/ui stone theme
- **Minimal approach** - Professional, clean, easy to maintain
- **No BGS-specific styling** - Use standard design tokens only
- **Component preference order**: 1) shadcn/ui components, 2) Radix primitives if shadcn/ui doesn't exist, 3) custom components as last resort

## Key Features Implemented

### **Summary Cards**
- Live metrics: Total sensors, locations, active sites, total datastreams
- Responsive grid layout (2 cols mobile, 4 cols desktop)
- Loading states with skeleton animations

### **Advanced Sensor Filtering**
- **Text Search** - Search sensor names, descriptions, locations
- **Sensor Type Filter** - Filter by Groundwater Logger, Weather Station, etc.
- **Measurement Type Filter** - Smart extraction of core measurement types:
  - Temperature, Conductivity, Salinity, TDS, pH, Pressure, Humidity
  - Wind Speed, Wind Direction, Dissolved Oxygen
  - Gas Measurements: Carbon Dioxide, Methane, Oxygen, etc.
- **Combined Filtering** - All filters work together
- **Clear Filters** - One-click reset of all filters

### **Interactive Table**
- **Click-to-expand** - Click entire row to view sensor datastreams
- **Sortable columns** - Sort by sensor name or datastream count
- **Responsive design** - Mobile-friendly with proper touch targets
- **Visual feedback** - Hover states and cursor indicators

### **Right-side Detail Sheet**
- **Half-screen width** - Non-blocking sidebar view
- **Comprehensive details** - Sensor overview, datastreams, recent observations
- **Data Summary Cards** - Compact grid showing min/max/avg statistics with trend indicators
- **Real-time Charts** - Interactive line charts with actual sensor data from BGS FROST API
- **Gas Measurement Support** - Proper display of Carbon Dioxide, Methane, Oxygen measurements
- **Metadata access** - Direct link to BGS metadata in header
- **Clickable datastreams** - Select to view recent observations
- **Smooth animations** - Slides in from right with overlay

### **Performance Optimizations**
- **No API limits** - Fetches all available sensors (removed $top=100)
- **Smart caching** - Intelligent datastream caching to avoid repeated calls
- **Real Data Processing** - Actual sensor observations with proper error handling
- **Memoized calculations** - Efficient filtering and sorting
- **Loading states** - Proper loading indicators throughout

### **Data Summary Features**
- **Compact Grid Layout** - 2-3 cards per row for efficient space usage
- **Smart Property Detection** - Automatically extracts measurement types from datastream names
- **Gas Measurement Recognition** - Handles sensor patterns like "GGS05_01 Carbon Dioxide"
- **Statistical Analysis** - Min, Max, Average, Latest values with trend indicators
- **Visual Indicators** - Color-coded trends (green=up, red=down) and value highlighting

## Recent Updates (2 August 2025)

### Latest Features Implemented
- **Enhanced Sensor Detail View** - Comprehensive sensor information with location coordinates and borehole references
- **Location & Coordinates Display** - Shows sensor deployment locations with GPS coordinates in format [longitude, latitude]
- **Borehole Reference Integration** - Automatic extraction and display of borehole reference codes (e.g., GGA01, BH123)
- **Removed Auto-refresh** - Eliminated automatic data refreshing to prevent chart resets and improve user experience
- **Interactive Charts** - Multi-datastream visualization with toggle controls and normalization (stable, no auto-reset)
- **Smart Location Matching** - Fuzzy string matching between sensor names and location database
- **Multiple Location Support** - Handles sensors deployed across multiple sites with expandable location lists

### Technical Improvements
- **Manual Refresh System** - User-controlled data updates via refresh button only
- **Location Data Integration** - Fetches coordinate data for precise sensor positioning
- **Borehole Reference Extraction** - Regex pattern matching for codes like GGA01, BH123, ABC12
- **Enhanced Error Handling** - Better user feedback for API failures and loading states
- **Performance Optimization** - Eliminated unnecessary API calls from auto-refresh
  