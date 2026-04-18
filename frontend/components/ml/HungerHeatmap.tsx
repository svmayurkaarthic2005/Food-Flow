/**
 * Hunger Heatmap Component
 * Displays demand heatmap using Google Maps
 */
'use client';

import { useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useHeatmap } from '@/hooks/useHeatmap';
import { AlertCircle, MapPin } from 'lucide-react';

interface HungerHeatmapProps {
  district?: string;
  center?: { lat: number; lng: number };
  className?: string;
}

const libraries: ('visualization')[] = ['visualization'];

// Default center (India)
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

// Map container style
const containerStyle = {
  width: '100%',
  height: '500px',
};

// Custom gradient (Green → Amber → Red)
const HEATMAP_GRADIENT = [
  'rgba(0, 255, 0, 0)',
  'rgba(0, 255, 0, 1)',
  'rgba(255, 255, 0, 1)',
  'rgba(255, 165, 0, 1)',
  'rgba(255, 0, 0, 1)',
];

function SkeletonMap() {
  return (
    <div className="bg-gray-100 rounded-lg animate-pulse" style={{ height: '500px' }}>
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading map...</div>
      </div>
    </div>
  );
}

export function HungerHeatmap({ district, center, className = '' }: HungerHeatmapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const { heatmapData, isLoading, isError } = useHeatmap({ district });

  // Memoize heatmap data to avoid re-renders
  const heatmapPoints = useMemo(() => {
    if (!heatmapData || !isLoaded || !window.google) return [];

    return heatmapData.map((point) => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: point.intensity,
    }));
  }, [heatmapData, isLoaded]);

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (center) return center;
    if (heatmapData && heatmapData.length > 0) {
      // Calculate average center from heatmap points
      const avgLat = heatmapData.reduce((sum, p) => sum + p.lat, 0) / heatmapData.length;
      const avgLng = heatmapData.reduce((sum, p) => sum + p.lng, 0) / heatmapData.length;
      return { lat: avgLat, lng: avgLng };
    }
    return DEFAULT_CENTER;
  }, [center, heatmapData]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (heatmapPoints.length === 0) return;

      // Create heatmap layer
      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapPoints,
        map: map,
        radius: 50,
        opacity: 0.7,
        gradient: HEATMAP_GRADIENT,
      });

      // Fit bounds to show all points
      if (heatmapData && heatmapData.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        heatmapData.forEach((point) => {
          bounds.extend(new google.maps.LatLng(point.lat, point.lng));
        });
        map.fitBounds(bounds);
      }
    },
    [heatmapPoints, heatmapData]
  );

  // Loading state
  if (!isLoaded || isLoading) {
    return <SkeletonMap />;
  }

  // Load error
  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Failed to load map</h3>
            <p className="text-sm text-red-600 mt-1">
              Google Maps API error. Please check your API key.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Data error
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Failed to load heatmap data</h3>
            <p className="text-sm text-red-600 mt-1">
              {isError.info?.detail || 'Please try again later'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No heatmap data available</h3>
        <p className="text-sm text-gray-600">
          No demand data found{district ? ` for ${district}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={10}
          onLoad={onLoad}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          }}
        />
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Demand Intensity</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
