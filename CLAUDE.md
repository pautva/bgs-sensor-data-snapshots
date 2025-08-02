# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.4.5 project using the App Router, TypeScript, and Tailwind CSS v4. The project is configured with shadcn/ui components and includes modern React 19 with turbopack for development.

## Commands

- `npm run dev --turbopack` - Start development server with turbopack (fast refresh)
- `npm run dev -- -p 4000` - Start development server on port 4000  
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality checks

## Architecture & Structure

### Framework Stack
- **Next.js 15.4.5** with App Router (`src/app/` directory)
- **React 19** with modern features
- **TypeScript 5** with strict configuration
- **Tailwind CSS v4** with PostCSS integration

### Key Dependencies
- `class-variance-authority` & `clsx` - For conditional CSS classes
- `tailwind-merge` - Merges Tailwind classes efficiently
- `lucide-react` - Icon library
- `tw-animate-css` - Animation utilities

### Component Architecture
- **shadcn/ui** configured with "new-york" style
- Components aliased to `@/components`, utils to `@/lib/utils`
- Uses `cn()` utility function in `src/lib/utils.ts` for class merging
- Path mapping configured for `@/*` pointing to `src/*`

### Styling System
- **Tailwind CSS v4** with custom theme configuration
- CSS variables for design tokens (colors, radius, etc.)
- Dark mode support with `.dark` class variant
- Stone-based color palette as base theme
- CSS custom properties defined in `globals.css`

### File Organization
```
src/
├── app/           # Next.js App Router pages
│   ├── globals.css # Global styles with Tailwind + theme
│   ├── layout.tsx  # Root layout with fonts
│   └── page.tsx    # Home page component
└── lib/
    └── utils.ts    # Utility functions (cn helper)
```

## Development Notes

- Uses Geist font family (Sans & Mono) from Google Fonts
- Turbopack enabled for faster development builds
- PostCSS configured with `@tailwindcss/postcss` plugin
- TypeScript paths configured for clean imports
- No testing framework currently configured