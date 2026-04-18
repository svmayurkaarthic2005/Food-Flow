/**
 * Route Map Component
 * Displays optimized route with Google Maps
 */
'use client';

import { useMemo, useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { RouteStop } from '@/hooks/useRoute';
import { formatETA } from '@/utils/ml-helpers';
import { MapPin, Navigation, Clock, AlertCircle } from 'lucide-react';

interface RouteMapProps {
  orderedStops: RouteStop[];
  depot: { lat: number; lng: number };
  className?: string;
}

const containerStyle = {
  width: '100%',
  height: '500px',
};

// Polyline options
const polylineOptions = {
  strokeColor: '#3b82f6',
  strokeOpacity: 1,
  strokeWeight: 3,
};

function SkeletonMap() {
  return (
    <div className="bg-gray-100 rounded-lg animate-pulse" style={{ height: '500px' }}>
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading map...</div>
      </div>
    </div>
  );
}

export function RouteMap({ orderedStops, depot, className = '' }: RouteMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Calculate route path (depot → stops → depot)
  const routePath = useMemo(() => {
    const path = [depot];
    orderedStops.forEach((stop) => {
      path.push({ lat: stop.lat, lng: stop.lng });
    });
    path.push(depot); // Return to depot
    return path;
  }, [orderedStops, depot]);

  // Calculate map center and bounds
  const { center, bounds } = useMemo(() => {
    if (orderedStops.length === 0) {
      return { center: depot, bounds: null };
    }

    const allPoints = [depot, ...orderedStops.map((s) => ({ lat: s.lat, lng: s.lng }))];
    const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
    const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;

    const bounds = new google.maps.LatLngBounds();
    allPoints.forEach((point) => {
      bounds.extend(new google.maps.LatLng(point.lat, point.lng));
    });

    return { center: { lat: avgLat, lng: avgLng }, bounds };
  }, [orderedStops, depot]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      if (bounds) {
        map.fitBounds(bounds);
      }
    },
    [bounds]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Loading state
  if (!isLoaded) {
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

  // Empty state
  if (orderedStops.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No route to display</h3>
        <p className="text-sm text-gray-600">Add stops to see the optimized route</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Depot Marker */}
          <Marker
            position={depot}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#10b981',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            label={{
              text: 'D',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
            title="Depot"
          />

          {/* Stop Markers */}
          {orderedStops.map((stop, index) => (
            <Marker
              key={stop.listing_id}
              position={{ lat: stop.lat, lng: stop.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
              label={{
                text: String(index + 1),
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
              title={`Stop ${index + 1} - Listing #${stop.listing_id}`}
            />
          ))}

          {/* Route Polyline */}
          <Polyline path={routePath} options={polylineOptions} />
        </GoogleMap>
      </div>

      {/* Stop List Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600" />
          Route Details
        </h3>

        <div className="space-y-3">
          {/* Depot Start */}
          <div className="flex items-start gap-3 pb-3 border-b border-gray-200">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Depot (Start)</div>
              <div className="text-sm text-gray-600">
                {depot.lat.toFixed(4)}, {depot.lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Stops */}
          {orderedStops.map((stop, index) => (
            <div key={stop.listing_id} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Stop {index + 1}</div>
                <div className="text-sm text-gray-600">Listing #{stop.listing_id}</div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>ETA: {formatETA(stop.eta_minutes)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Depot End */}
          <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Return to Depot</div>
              <div className="text-sm text-gray-600">Route complete</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
