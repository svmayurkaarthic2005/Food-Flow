# ML UI Components Documentation

## Overview
Production-grade ML-powered UI components for the FoodFlow platform using Google Maps, SWR, and modern React patterns.

---

## 📦 Components

### 1. NGORecommendations
**File:** `components/ml/NGORecommendations.tsx`

Displays top NGO recommendations for a food listing with scores, distances, and trust labels.

**Features:**
- ✅ SWR data fetching with caching
- ✅ Skeleton loading states
- ✅ Error handling with fallback UI
- ✅ Framer Motion animations
- ✅ Score badges with color coding
- ✅ Confidence tooltips for low scores

**Props:**
```typescript
interface NGORecommendationsProps {
  listingId: string;
  topN?: number; // Default: 3
}
```

**Usage:**
```tsx
import { NGORecommendations } from '@/components/ml';

<NGORecommendations listingId="123" topN={3} />
```

**Score Badge Colors:**
- Green (≥60): High confidence
- Amber (40-59): Moderate confidence with tooltip
- Red (<40): Low confidence with tooltip

---

### 2. PriorityBadge
**File:** `components/ml/PriorityBadge.tsx`

Reusable badge component for displaying priority levels.

**Features:**
- ✅ Color-coded badges
- ✅ Tailwind CSS styling
- ✅ Fully customizable

**Props:**
```typescript
interface PriorityBadgeProps {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  className?: string;
}
```

**Usage:**
```tsx
import { PriorityBadge } from '@/components/ml';

<PriorityBadge priority="HIGH" />
```

**Colors:**
- CRITICAL: Red
- HIGH: Orange
- MEDIUM: Amber
- LOW: Green

---

### 3. HungerHeatmap
**File:** `components/ml/HungerHeatmap.tsx`

Interactive heatmap showing demand intensity using Google Maps.

**Features:**
- ✅ Google Maps HeatmapLayer
- ✅ Custom gradient (Green → Amber → Red)
- ✅ Auto-centering and bounds fitting
- ✅ Legend overlay
- ✅ Memoized data to prevent re-renders
- ✅ District filtering

**Props:**
```typescript
interface HungerHeatmapProps {
  district?: string;
  center?: { lat: number; lng: number };
  className?: string;
}
```

**Usage:**
```tsx
import { HungerHeatmap } from '@/components/ml';

<HungerHeatmap district="Downtown" />
```

**Requirements:**
- Google Maps API key with Visualization library enabled
- Environment variable: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

### 4. DemandChart
**File:** `components/ml/DemandChart.tsx`

Bar chart displaying demand forecast with confidence intervals.

**Features:**
- ✅ Recharts bar chart
- ✅ Error bars for confidence intervals
- ✅ District dropdown selector
- ✅ Responsive design
- ✅ Custom tooltips
- ✅ Loading and error states

**Props:**
```typescript
interface DemandChartProps {
  districts: string[];
  defaultDistrict?: string;
  days?: number; // Default: 7
}
```

**Usage:**
```tsx
import { DemandChart } from '@/components/ml';

<DemandChart 
  districts={['Downtown', 'Uptown', 'Midtown']} 
  defaultDistrict="Downtown"
  days={7}
/>
```

---

### 5. RouteMap
**File:** `components/ml/RouteMap.tsx`

Interactive map showing optimized pickup route with numbered stops.

**Features:**
- ✅ Google Maps with markers and polylines
- ✅ Numbered stop markers
- ✅ Custom depot marker
- ✅ Auto-fit bounds
- ✅ Route details panel
- ✅ ETA display for each stop

**Props:**
```typescript
interface RouteMapProps {
  orderedStops: RouteStop[];
  depot: { lat: number; lng: number };
  className?: string;
}

interface RouteStop {
  listing_id: number;
  lat: number;
  lng: number;
  eta_minutes: number;
}
```

**Usage:**
```tsx
import { RouteMap } from '@/components/ml';
import { useRoute } from '@/hooks/useRoute';

const { route, optimizeRoute } = useRoute();

// Optimize route
await optimizeRoute({
  listing_ids: [1, 2, 3],
  depot: { lat: 40.7580, lng: -73.9855 }
});

// Display route
{route && (
  <RouteMap 
    orderedStops={route.stops} 
    depot={{ lat: 40.7580, lng: -73.9855 }}
  />
)}
```

---

## 🪝 Custom Hooks

### useRecommendations
**File:** `hooks/useRecommendations.ts`

Fetches NGO recommendations using SWR.

```typescript
const { recommendations, isLoading, isError, mutate } = useRecommendations({
  listingId: '123',
  topN: 3
});
```

### useHeatmap
**File:** `hooks/useHeatmap.ts`

Fetches heatmap data using SWR.

```typescript
const { heatmapData, isLoading, isError, mutate } = useHeatmap({
  district: 'Downtown'
});
```

### useRoute
**File:** `hooks/useRoute.ts`

Handles route optimization requests.

```typescript
const { route, isLoading, error, optimizeRoute, clearRoute } = useRoute();

await optimizeRoute({
  listing_ids: [1, 2, 3],
  depot: { lat: 40.7580, lng: -73.9855 }
});
```

### useDemandForecast
**File:** `hooks/useDemandForecast.ts`

Fetches demand forecast data using SWR.

```typescript
const { forecasts, isLoading, isError, mutate } = useDemandForecast({
  district: 'Downtown',
  days: 7
});
```

---

## 🛠️ Utility Functions

**File:** `utils/ml-helpers.ts`

### getScoreColor(score: number)
Returns color classes for score badges.

### getPriorityColor(priority: string)
Returns color classes for priority badges.

### formatDistance(km: number)
Formats distance for display (e.g., "5.2km" or "850m").

### formatETA(minutes: number)
Formats ETA for display (e.g., "45 min" or "1h 30m").

### getConfidenceMessage(score: number)
Returns confidence message for tooltips.

---

## 📦 Dependencies

### Required Packages
```json
{
  "swr": "^2.2.4",
  "@react-google-maps/api": "^2.19.3",
  "framer-motion": "^11.0.3",
  "recharts": "2.15.0"
}
```

### Installation
```bash
cd frontend
npm install swr @react-google-maps/api framer-motion
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local` in the frontend directory:

```bash
# Google Maps API Key (required)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# Backend API URL (optional, defaults to relative URLs)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Google Maps API Setup

1. **Enable APIs:**
   - Maps JavaScript API
   - Places API (optional)
   - Directions API (optional)

2. **Enable Libraries:**
   - Visualization (for heatmap)

3. **API Key Restrictions:**
   - HTTP referrers: `localhost:3000/*`, `yourdomain.com/*`
   - API restrictions: Enable only required APIs

---

## 🚀 Usage Examples

### Example 1: Listing Detail Page

```tsx
'use client';

import { NGORecommendations, PriorityBadge } from '@/components/ml';

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-4">Listing Details</h1>
          <PriorityBadge priority="HIGH" />
          {/* ... other listing details ... */}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <NGORecommendations listingId={params.id} topN={3} />
        </div>
      </div>
    </div>
  );
}
```

### Example 2: Analytics Dashboard

```tsx
'use client';

import { HungerHeatmap, DemandChart } from '@/components/ml';

export default function AnalyticsDashboard() {
  const districts = ['Downtown', 'Uptown', 'Midtown'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div>
          <HungerHeatmap />
        </div>

        {/* Demand Chart */}
        <div>
          <DemandChart districts={districts} defaultDistrict="Downtown" />
        </div>
      </div>
    </div>
  );
}
```

### Example 3: Route Planning Page

```tsx
'use client';

import { useState } from 'react';
import { RouteMap } from '@/components/ml';
import { useRoute } from '@/hooks/useRoute';
import { Button } from '@/components/ui/button';

export default function RoutePlanningPage() {
  const { route, isLoading, optimizeRoute } = useRoute();
  const [listingIds, setListingIds] = useState<number[]>([1, 2, 3]);

  const handleOptimize = async () => {
    await optimizeRoute({
      listing_ids: listingIds,
      depot: { lat: 40.7580, lng: -73.9855 }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Route Planning</h1>

      <div className="mb-6">
        <Button onClick={handleOptimize} disabled={isLoading}>
          {isLoading ? 'Optimizing...' : 'Optimize Route'}
        </Button>
      </div>

      {route && (
        <RouteMap 
          orderedStops={route.stops} 
          depot={{ lat: 40.7580, lng: -73.9855 }}
        />
      )}
    </div>
  );
}
```

---

## 🎨 Styling

All components use Tailwind CSS for styling. Customize by:

1. **Passing className prop:**
```tsx
<NGORecommendations listingId="123" className="custom-class" />
```

2. **Modifying component styles:**
Edit the component files directly to change colors, spacing, etc.

3. **Tailwind configuration:**
Update `tailwind.config.js` for global theme changes.

---

## 🧪 Testing

### Component Testing

```tsx
import { render, screen } from '@testing-library/react';
import { NGORecommendations } from '@/components/ml';
import { SWRConfig } from 'swr';

// Mock SWR data
const mockData = [
  {
    ngo_id: 1,
    name: 'Food Bank Central',
    score: 85,
    distance_km: 5.2,
    trust_score: 78,
    trust_label: 'High'
  }
];

test('renders recommendations', () => {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <NGORecommendations listingId="123" />
    </SWRConfig>
  );
  
  // Add assertions
});
```

---

## 🐛 Troubleshooting

### Google Maps not loading

**Issue:** Map shows blank or error

**Solutions:**
1. Check API key is set: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Verify API key has correct permissions
3. Enable required APIs in Google Cloud Console
4. Check browser console for errors

### SWR data not fetching

**Issue:** Components show loading state indefinitely

**Solutions:**
1. Check backend API is running
2. Verify API endpoints are correct
3. Check network tab for failed requests
4. Ensure CORS is configured correctly

### Heatmap not displaying

**Issue:** Heatmap layer not visible

**Solutions:**
1. Enable Visualization library in Google Maps
2. Check heatmap data has valid lat/lng
3. Verify intensity values are between 0-1
4. Check map zoom level

---

## 📈 Performance Optimization

### SWR Caching
```typescript
// Configure global SWR settings
<SWRConfig value={{
  refreshInterval: 60000, // Refresh every minute
  dedupingInterval: 5000, // Dedupe requests within 5s
  revalidateOnFocus: false,
}}>
  <App />
</SWRConfig>
```

### Map Performance
- Use `useMemo` for heatmap data
- Implement marker clustering for many points
- Lazy load map components with `dynamic` import

### Code Splitting
```tsx
import dynamic from 'next/dynamic';

const HungerHeatmap = dynamic(
  () => import('@/components/ml').then(mod => mod.HungerHeatmap),
  { ssr: false, loading: () => <SkeletonMap /> }
);
```

---

## 🚦 Best Practices

1. **Always handle loading and error states**
2. **Use SWR for data fetching (automatic caching)**
3. **Memoize expensive computations**
4. **Lazy load Google Maps components**
5. **Secure API keys with environment variables**
6. **Test components with mock data**
7. **Follow accessibility guidelines**
8. **Optimize images and assets**

---

## 📚 Additional Resources

- [SWR Documentation](https://swr.vercel.app/)
- [Google Maps React Documentation](https://react-google-maps-api-docs.netlify.app/)
- [Recharts Documentation](https://recharts.org/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

---

## 🎉 Summary

All ML UI components are production-ready with:
- ✅ 5 polished components
- ✅ 4 custom hooks
- ✅ Utility functions
- ✅ Google Maps integration
- ✅ SWR data fetching
- ✅ Loading/error states
- ✅ Responsive design
- ✅ Accessibility features
- ✅ Complete documentation

Ready for integration into the FoodFlow platform! 🚀
