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
- **Dual Push** - `git push origin main && git push gitlab main` to sync both repos

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
- **Real-time Data Integration** - Direct connection to BGS FROST API (configurable base URL)
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
│   ├── api-config.ts       # Centralized API base URL configuration
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

### Data Integration & API Configuration
- **Centralized API Configuration** - Single source for API base URL in `src/lib/api-config.ts`
- **Easy API Switching** - Switch between public (`sensors.bgs.ac.uk`) and internal (`sensors-internal.bgs.ac.uk`) APIs
- **BGS FROST API** - Real sensor data with configurable endpoints
- **Location Data** - GPS coordinates and deployment site information
- **Sensor Types** - Groundwater Monitoring, Weather Station, Soil Gas Monitoring, etc.
- **Gas Measurements** - Carbon Dioxide, Methane, Oxygen from GasClam probes
- **Sites Covered** - UKGEOS Glasgow Observatory, BGS Cardiff, UKGEOS Cheshire Observatory, Wallingford
- **Manual Updates** - User-controlled data refresh via refresh button with visual feedback
- **Borehole References** - Automatic extraction from sensor names (GGA01, BH123, etc.)
- **Scientific Data Validation** - Standardized validation functions ensure data integrity across all components

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

- **Centralized Configuration** - API base URL managed in `src/lib/api-config.ts` for easy switching
- **Real Data Integration** - Uses actual BGS FROST API endpoints instead of mock data
- **Observations Endpoint** - `/Datastreams(${id})/Observations?$top=${limit}&$orderby=phenomenonTime%20desc`
- **No Limitations** - Removed `$top=100` parameter to fetch all sensors
- **Consistent Endpoints** - Both main table and expanded views use `/Things(${sensorId})/Datastreams`
- **Error Handling** - Graceful fallbacks for API failures
- **Caching** - Intelligent caching of datastream details to avoid repeated calls
- **Rate Limiting** - Considerate API usage with appropriate delays

### API Configuration
To switch between API endpoints, edit `src/lib/api-config.ts`:
```typescript
// Current (public)
export const FROST_API_BASE = 'https://sensors.bgs.ac.uk/FROST-Server/v1.1';

// Switch to internal
// export const FROST_API_BASE = 'https://sensors-internal.bgs.ac.uk/FROST-Server/v1.1';
```

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

## Recent Updates (6 August 2025)

### Centralized API Configuration
- **Single Configuration Source** - Created `src/lib/api-config.ts` for centralized API base URL management
- **Easy API Switching** - Simple one-line change to switch between public and internal APIs
- **Clean Architecture** - Removed hardcoded URLs from all components
- **Dead Code Removal** - Cleaned up unused `getSensorStatusColor` function
- **Production Ready** - Build verified and ready for deployment

## Previous Updates (5 August 2025)

### Scientific Data Validation & Calculation Accuracy Fix

#### **Standardized Data Processing**
- **Scientific Validation Functions** - Added `validateSensorValue()` and `processObservationValues()` in `src/lib/bgs-api.ts`
- **Strict Data Integrity** - Rejects `NaN`, `Infinity`, and `-Infinity` values for scientific accuracy
- **Consistent Processing** - Both DatastreamChart and DatastreamSummary use identical validation logic
- **Research-Grade Accuracy** - Ensures calculations match between chart display and statistical summaries

#### **Enhanced Data Reliability**
- **Unified Validation Pipeline** - Single source of truth for data validation across all components
- **Geological Research Ready** - Data processing meets scientific standards for BGS researchers
- **Calculation Consistency** - Chart values and summary statistics now perfectly match
- **Type Safety** - Enhanced TypeScript validation for sensor observation data

### Advanced Date Range Selection & Interactive Chart Features

#### **Interactive Date Range Selection**
- **Custom Date Pickers** - Added shadcn/ui calendar components with date picker interface in sensor overview
- **Smart Default Dates** - Automatically sets last 30 days (or full available range if shorter) on initial load
- **Date Range Constraints** - Date pickers respect available data ranges and prevent invalid selections
- **Calendar UX** - Calendar opens to currently selected date's month/year for better navigation
- **Reset Functionality** - Reset button (RefreshCw icon) returns to default view with one click

#### **Enhanced Chart & Data Processing**
- **Dynamic Date Filtering** - BGS FROST API integration with date range parameters for precise data fetching
- **Intelligent Limits** - Adaptive observation limits based on date range (daysDiff * 4, capped at 2000)
- **Chronological Display** - Uses ascending order for date-filtered data to show progression across time ranges
- **Full Range Coverage** - Displays ALL fetched observations across selected date range (removed 50-point limit)
- **Clean Property Names** - Legend and tooltips show only measurement properties (e.g., "Air Temperature" vs "GGERFS_01 Air Temperature")

#### **Improved Chart Interactions**
- **Interactive Legend** - Click legend items to show/hide datastreams with visual feedback
- **Pointer Cursors** - Clear indication of interactive elements with proper cursor states
- **Enhanced Tooltips** - Show full date and time context for better data interpretation
- **Clean Data Labels** - Streamlined datastream names focus on measurement properties only

#### **Performance & API Optimizations**
- **Smart API Caching** - Enhanced caching with date-aware keys and appropriate TTL values
- **Efficient Date Range Detection** - Uses FROST API $count parameter for accurate limiting detection
- **Reduced Network Calls** - Prevented premature data fetching with proper useEffect dependencies
- **Optimized Query Building** - Dynamic ORDER BY based on filtering context (asc for date ranges, desc for recent data)

#### **Code Quality & Maintenance**
- **Unused Code Removal** - Cleaned up obsolete state variables and unused imports
- **TypeScript Improvements** - Enhanced type safety for date handling and API responses
- **Component Organization** - Clean separation of concerns between date selection and chart rendering
- **Consistent Styling** - Maintained shadcn/ui design system throughout new components
- **Memory Management** - Added cache size limits to prevent memory leaks in production
- **Scientific Data Validation** - Enhanced data filtering with `isFinite()` checks for data integrity

#### **Performance Optimization for Production**
- **Tiered Data Loading** - Smart limits based on date range for optimal performance:
  - **≤7 days**: Up to 24 readings/day (hourly resolution) 
  - **≤30 days**: Up to 8 readings/day (3-hourly resolution) - **Default view optimized**
  - **>30 days**: Up to 4 readings/day (6-hourly resolution)
- **92% Data Reduction** - Default 30-day view loads 1,200 vs 15,000 observations 
- **Cache Memory Management** - Automatic cleanup prevents memory leaks in long-running sessions
- **Scientific Accuracy Maintained** - Sufficient resolution for analysis while ensuring fast loading

## Previous Major Updates

### Key Features Implemented
- **Full-Screen Sensor Pages** - Dynamic URL routing with `/sensor/[sensorId]` 
- **Interactive Maps** - Leaflet integration with SSR compatibility
- **Progressive Loading** - Fast initial load with background data enhancement
- **Date Range Selection** - Custom date pickers with smart defaults
- **Scientific Data Validation** - Standardized validation ensuring data integrity
- **Performance Optimizations** - 90% load time improvement through caching and progressive loading

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
  