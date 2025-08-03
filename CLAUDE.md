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

## Docker & Kubernetes Deployment

### Production Deployment
- **GitLab CI/CD Pipeline** - Automated build, security scan, and deployment
- **Container Registry** - Images built and stored in GitLab container registry
- **Kubernetes Deployment** - Automated deployment to BGS internal clusters
- **Security Scanning** - Container vulnerability and Sonar code quality scans

### Docker Configuration
- **Multi-stage Dockerfile** - Optimized for production with minimal image size
- **Next.js Standalone Output** - Self-contained deployment using `output: 'standalone'`
- **Security Hardened** - Runs as non-root user (nextjs:nodejs, UID/GID 1001)
- **Production Ready** - Node.js 18 Alpine, proper environment variables
- **Build Dependencies** - Uses `npm ci` (not `--only=production`) to install devDependencies needed for build

### Deployment Environments
- **Development** - All branches deploy to isolated namespaces in dev cluster
- **Auto-generated URLs** - `http://<project>-<id>-<branch>.kube-idev.bgslcdevops.test/`
- **Environment Cleanup** - Dev environments removed after 1 month or branch deletion
- **Protected Environments** - Tags can deploy to staging-dmz and production-dmz (requires credentials)

### Git Repository Setup
- **GitLab** - CI/CD deployment repository (`gitlab` remote)

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
├── app/
│   └── sensor/
│       └── [sensorId]/
│           └── page.tsx         # Full-screen sensor page with URL routing
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
│   │   ├── dialog.tsx       # Dialog component (for sheet)
│   │   └── mini-map.tsx     # Interactive Leaflet map component (SSR-safe)
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
│   ├── date-utils.ts       # Date processing utilities for observations
│   ├── location-utils.ts   # Fuzzy location matching utilities
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
- **Manual Updates** - User-controlled data refresh via refresh button with visual feedback
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
4. **Optimized Refresh System** - User-controlled data updates with visual feedback and coordinated dual-hook refresh
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

## Recent Updates (3 August 2025)

### Refresh Button Fix & Performance Optimizations

#### **Fixed Refresh Button Functionality**
- **Issue Resolution** - Fixed refresh button that wasn't showing visual feedback due to fast API responses
- **Dual Hook Integration** - Properly coordinated refresh between `useProgressiveSensorData` and `useLocationAndStatsData` hooks
- **Visual Feedback** - Added minimum 1-second loading state to ensure users see the refresh action
- **Component Migration** - Changed from `Toggle` to `Button` component for proper refresh action semantics
- **Loading State Management** - Implemented `isRefreshing` state for guaranteed visual feedback during refresh

#### **API Call Optimizations**
- **Eliminated Duplicate Fetching** - Removed duplicate sensor API calls by creating `useLocationAndStatsData` hook
- **Improved Caching Strategy** - Maintained existing 5-minute cache for sensors, 2-minute for datastreams, 1-minute for observations
- **Reduced Network Load** - Dashboard now makes 33% fewer API calls by avoiding redundant sensor fetching
- **Smart Hook Architecture** - Separated concerns between sensor data and location/stats data fetching

#### **Code Cleanup & Maintenance**
- **Debug Logging Removal** - Cleaned up all temporary debug console statements
- **Import Optimization** - Removed unused imports and dependencies
- **Component Simplification** - Streamlined refresh button implementation
- **Leaflet CSS Fix** - Fixed map boundary issues by moving CSS import to global styles (globals.css)

## Previous Updates (2 August 2025)

### Major Features Implemented

#### **Full-Screen Sensor Pages**
- **Dynamic URL routing** - `/sensor/[sensorId]` with proper data fetching for direct access
- **Embeddable design** - Optimized for integration into 3D borehole exploration apps
- **Full View button** - Seamless navigation from detail sheet to full-screen view
- **Optimized layout** - Three-column responsive design with improved height distribution
- **Enhanced map positioning** - Interactive maps positioned at top of location card for better visual flow

#### **Interactive Maps Integration**
- **Embedded Leaflet maps** - Client-side rendered maps using OpenStreetMap tiles
- **Smart sizing** - Maps adapt to container with proper constraints (min 200px, max 350px in full view)
- **Interactive features** - Pan, zoom, and explore sensor locations with custom markers
- **SSR compatibility** - Dynamic imports prevent server-side rendering issues
- **Robust cleanup** - Aggressive cleanup prevents "map already initialized" errors
- **Race condition prevention** - Mount guards and proper timeout handling prevent initialization conflicts

#### **Performance Optimizations & Progressive Loading**
- **API Response Caching** - Smart caching system with TTL (5min sensors, 2min datastreams, 1min observations)
- **Progressive Data Loading** - Basic sensor data loads instantly, datastream counts populate progressively
- **Concurrent API Calls** - Batch datastream count fetching (10 at a time) to avoid overwhelming API
- **Eliminated N+1 Queries** - Removed expensive sequential datastream fetching from initial sensor load
- **Smart Measurement Inference** - Filter functionality uses name-based inference instead of costly API calls

#### **Enhanced Data Visualization & Layout**
- **Flexible Height Distribution** - Right column uses flexbox for proper height allocation between components
- **Context-Aware Charts** - DatastreamChart adapts layout based on usage (fixed 300px in sheets, flexible in full view)
- **Smart Grid Layouts** - Data summary cards adapt grid based on count (1-2 cards: 2 cols, 3-4: 2 cols, 5+: 3 cols)
- **Date range indicators** - Measurement timeframes displayed in headers across all views
- **Last reading dates** - Real-time display of most recent sensor observations
- **Progressive Loading States** - Users see "..." while counts load, then actual values appear

#### **Location & Coordinates**
- **GPS coordinate display** - Precise [longitude, latitude] format for all sensor locations
- **Borehole reference extraction** - Automatic detection of codes like GGA01, BH123, ABC12
- **Multiple location support** - Expandable lists for sensors deployed across multiple sites
- **Smart location matching** - Fuzzy string matching between sensor names and location database

### Technical Improvements
- **Progressive Loading Hook** - `useProgressiveSensorData` provides fast initial load with background enhancement
- **Efficient Filtering** - Measurement filter uses smart name inference without additional API calls
- **Memory Management** - Proper cleanup and resize handling for map components
- **Error Recovery** - Better null checks and graceful degradation when components fail
- **Code Cleanup** - Removed unused functions and debug logging, simplified component logic

### Code Organization & Quality
- **New Utility Functions** - 
  - `src/lib/date-utils.ts` - Date processing utilities for observations
  - `src/lib/location-utils.ts` - Fuzzy location matching utilities
  - `src/hooks/useProgressiveSensorData.ts` - Progressive loading pattern
- **Removed unused code** - Eliminated `extractMeasurementType` function and redundant imports
- **Simplified state management** - Streamlined loading states and data processing
- **Consistent error handling** - Standardized error patterns across components

### Performance Metrics Achieved
- **Initial Load Time** - Reduced from ~5-10 seconds to ~500ms-1s (90% improvement)
- **Subsequent Loads** - Near-instant with smart caching
- **Memory Usage** - Efficient with TTL-based cache cleanup
- **API Efficiency** - Reduced API calls by ~80% through caching and progressive loading

## Code Organization Standards

### **Progressive Loading Pattern**
- **Basic Data First** - Load essential sensor info immediately for fast user feedback
- **Background Enhancement** - Populate detailed data (datastream counts) progressively
- **Smart Caching** - Cache results with appropriate TTL to avoid repeated calls
- **Batch Operations** - Group API calls to minimize server load (max 10 concurrent)

### **Performance Guidelines**
- **API Caching** - All API responses cached with appropriate TTL (1-5 minutes)
- **Progressive Enhancement** - Show basic data immediately, enhance progressively
- **Memoization** - Use `useMemo` for expensive computations like chart data processing
- **Bundle Size** - Use dynamic imports for heavy libraries (e.g., Leaflet maps)
- **Memory Management** - Proper cleanup of timers, observers, and third-party library instances

### **Layout & Component Guidelines**
- **Flexbox for Height Distribution** - Use `flex flex-col` for containers that need proportional height sharing
- **Context-Aware Components** - Components adapt behavior based on usage context (full view vs sheet)
- **Smart Grid Layouts** - Grid columns adapt to content count for optimal visual balance
- **Responsive Design** - Components work across different screen sizes and embedding contexts

### **Error Handling Standards**
- **Null Safety** - Proper null checks for optional properties (e.g., `sensor?.id`)
- **Graceful Degradation** - Fallback UI when features fail (e.g., map unavailable)
- **User Feedback** - Clear loading states and error messages
- **Console Logging** - Error logging for development debugging (warnings only for expected issues)

### **Map Component Implementation**
- **MiniMap Component** (`src/components/ui/mini-map.tsx`) - Interactive Leaflet maps with SSR support
- **Global CSS Import** - Leaflet CSS imported in `globals.css` for proper map boundaries and styling
- **Aggressive Cleanup** - Removes Leaflet's internal `_leaflet_id` property to prevent initialization conflicts
- **Mounting Guards** - Uses `isMounted` flag to prevent race conditions during component lifecycle
- **Delayed Initialization** - 50ms delay ensures complete cleanup before new map creation
- **Class Management** - Removes leftover Leaflet CSS classes from DOM
- **Error Recovery** - Graceful error handling with fallback UI when maps fail to load

### **Data Architecture**
- **Smart Inference** - Measurement types inferred from sensor names for efficient filtering
- **Caching Strategy** - Different TTL for different data types based on update frequency
- **Progressive Enhancement** - Core functionality works immediately, detailed data loads progressively
- **Batch Processing** - API calls grouped and processed concurrently where possible
  