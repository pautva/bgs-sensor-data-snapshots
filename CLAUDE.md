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
- `class-variance-authority` & `clsx` - For conditional CSS classes
- `tailwind-merge` - Merges Tailwind classes efficiently
- `lucide-react` - Icon library for UI elements
- `tw-animate-css` - Animation utilities

### Key Features
- **Real-time Data Integration** - Direct connection to BGS FROST API (`https://sensors.bgs.ac.uk/FROST-Server/v1.1`)
- **Sensor Network Overview** - Main table showing all sensors with expandable datastreams
- **Search & Filter** - Filter sensors by type and search by name/description
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
│   │   ├── sheet.tsx        # Sheet/sidebar component
│   │   └── dialog.tsx       # Dialog component (for sheet)
│   └── dashboard/       # Dashboard components
│       ├── BGSDashboard.tsx      # Main dashboard layout
│       ├── SensorTable.tsx       # Primary sensor table with filtering
│       ├── SensorDetailSheet.tsx # Right-side sheet for sensor details
│       └── SummaryCards.tsx      # Overview metrics cards
├── hooks/
│   └── useSensorData.ts     # Real-time sensor data fetching
├── lib/
│   ├── bgs-api.ts          # BGS FROST API integration
│   └── utils.ts            # Utility functions (cn helper)
└── types/
    └── bgs-sensor.ts       # TypeScript interfaces for BGS data
```

### Styling System
- **Tailwind CSS v4** with shadcn/ui stone theme
- **No Custom CSS Variables** - Uses only standard shadcn/ui color tokens
- **Minimal Approach** - Standard Tailwind classes (text-green-600, text-blue-600, etc.)
- Dark mode support with `.dark` class variant
- **Easy Maintenance** - No custom design tokens to maintain

### Data Integration
- **BGS FROST API** - Real sensor data from `https://sensors.bgs.ac.uk/FROST-Server/v1.1`
- **Sensor Types** - Groundwater Monitoring, Weather Station, Soil Gas Monitoring, etc.
- **Sites Covered** - UKGEOS Glasgow Observatory, BGS Cardiff, UKGEOS Cheshire Observatory, Wallingford
- **Real-time Updates** - Automatic data refresh with configurable intervals

### Current Implementation
1. **Summary Cards** - Key metrics overview (sensors, locations, sites, datastreams)
2. **Sensor Network Table** - Primary feature showing all sensors with:
   - **Click-to-expand rows** - Click entire row to view datastreams
   - **Advanced Filtering** - Search, sensor type, and measurement type filters
   - **Smart measurement extraction** - Filters by core types (Temperature, Conductivity, etc.)
   - **Sortable columns** - Sort by name or datastream count
3. **Right-side Sheet** - Click "Explore" to open sensor details in half-screen sidebar
4. **Real-time Updates** - Live connection status and automatic data refresh
5. **Minimal Design** - Clean, professional shadcn/ui stone theme

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

- **No Limitations** - Removed `$top=100` parameter to fetch all sensors
- **Consistent Endpoints** - Both main table and expanded views use `/Things(${sensorId})/Datastreams`
- **Error Handling** - Graceful fallbacks for API failures
- **Caching** - Intelligent caching of datastream details to avoid repeated calls
- **Rate Limiting** - Considerate API usage with appropriate delays

## Styling Guidelines

- **Always use shadcn/ui components** - Button, Card, Table, Select, Input, Badge, Sheet
- **Standard Tailwind classes only** - No custom CSS variables
- **Stone theme colors** - Consistent with shadcn/ui stone theme
- **Minimal approach** - Professional, clean, easy to maintain
- **No BGS-specific styling** - Use standard design tokens only

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
  - Wind Speed, Wind Direction, Dissolved Oxygen, etc.
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
- **Metadata access** - Direct link to BGS metadata in header
- **Clickable datastreams** - Select to view recent observations
- **Smooth animations** - Slides in from right with overlay

### **Performance Optimizations**
- **No API limits** - Fetches all available sensors (removed $top=100)
- **Smart caching** - Intelligent datastream caching to avoid repeated calls
- **Memoized calculations** - Efficient filtering and sorting
- **Loading states** - Proper loading indicators throughout