'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin, Clock, Zap, Navigation, Wifi, WifiOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface TrackingData {
  delivery: {
    id: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    estimatedArrival?: string;
  };
  current_location?: {
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    timestamp: string;
  };
  route_points: Array<{
    lat: number;
    lng: number;
    timestamp: string;
  }>;
  pickup: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    donor: string;
  };
  destination: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  driver: {
    name: string;
    email: string;
  };
  distance_km?: number;
  eta_minutes?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: 13.0827,
  lng: 80.2707,
};

export default function DeliveryTrackingPage() {
  const searchParams = useSearchParams();
  const deliveryId = searchParams.get('id');

  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTrackingData = async () => {
    if (!deliveryId) {
      setError('No delivery ID provided');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/tracking/${deliveryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tracking data');
      }
      const data = await response.json();
      setTrackingData(data);
      setLastUpdateTime(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!deliveryId || !autoRefresh) return;

    // Connect to WebSocket
    const socket = io({
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setWsConnected(true);
      
      // Subscribe to delivery tracking
      socket.emit('subscribe_tracking', deliveryId);
    });

    socket.on('subscribed', (data) => {
      console.log('Subscribed to delivery:', data.deliveryId);
    });

    socket.on('location_update', (data) => {
      console.log('Received location update:', data);
      
      // Update tracking data with new location
      setTrackingData((prev) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          current_location: {
            lat: data.lat,
            lng: data.lng,
            speed: data.speed,
            timestamp: data.timestamp,
          },
          route_points: [
            ...prev.route_points,
            {
              lat: data.lat,
              lng: data.lng,
              timestamp: data.timestamp,
            },
          ].slice(-100), // Keep only last 100 points
        };
      });
      
      setLastUpdateTime(new Date());
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setWsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe_tracking', deliveryId);
        socketRef.current.disconnect();
      }
    };
  }, [deliveryId, autoRefresh]);

  // Polling fallback (every 3 seconds)
  useEffect(() => {
    if (!autoRefresh || !deliveryId) return;

    // Initial fetch
    fetchTrackingData();

    // Set up polling as fallback
    pollingIntervalRef.current = setInterval(() => {
      // Only poll if WebSocket is not connected
      if (!wsConnected) {
        console.log('Polling for updates (WebSocket not connected)');
        fetchTrackingData();
      }
    }, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [autoRefresh, deliveryId, wsConnected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Error</span>
            </div>
            <p>{error || 'Delivery not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { delivery, current_location, route_points, pickup, destination, driver, distance_km, eta_minutes } = trackingData;

  // Calculate distance remaining (simple Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distanceRemaining = distance_km || (current_location
    ? calculateDistance(
        current_location.lat,
        current_location.lng,
        destination.lat,
        destination.lng
      )
    : null);

  const estimatedArrivalTime = eta_minutes 
    ? `${Math.round(eta_minutes)} minutes`
    : 'Calculating...';

  const mapCenter = current_location
    ? { lat: current_location.lat, lng: current_location.lng }
    : { lat: pickup.lat, lng: pickup.lng };

  const routePath = route_points.map((loc) => ({
    lat: loc.lat,
    lng: loc.lng,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Delivery Tracking</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge className={getStatusColor(delivery.status)}>
              {delivery.status}
            </Badge>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-sm px-3 py-1 bg-primary text-white rounded hover:bg-primary/90"
            >
              {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
            </button>
            <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded ${wsConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {wsConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span>{wsConnected ? 'Live Updates' : 'Polling Mode'}</span>
            </div>
            {lastUpdateTime && (
              <span className="text-sm text-gray-600">
                Last update: {lastUpdateTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Map */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Location</span>
              {!showMap && (
                <Button onClick={() => setShowMap(true)} size="sm">
                  Show Interactive Map
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showMap ? (
              // Static map preview - uses Google Static Maps API (much cheaper)
              <div className="relative">
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${mapCenter.lat},${mapCenter.lng}&zoom=14&size=600x400&markers=color:blue%7C${current_location?.lat},${current_location?.lng}&markers=color:green%7C${pickup.lat},${pickup.lng}&markers=color:red%7C${destination.lat},${destination.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                  alt="Delivery Map"
                  className="w-full h-[400px] object-cover rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                  <Button onClick={() => setShowMap(true)} size="lg">
                    Load Interactive Map
                  </Button>
                </div>
              </div>
            ) : (
              <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={14}
                >
                  {/* Current location marker */}
                  {current_location && (
                    <Marker
                      position={{
                        lat: current_location.lat,
                        lng: current_location.lng,
                      }}
                      title="Current Location"
                      icon={{
                        path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
                        fillColor: '#3b82f6',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                        scale: 1.5,
                      }}
                    />
                  )}

                  {/* Pickup location marker */}
                  <Marker
                    position={{
                      lat: pickup.lat,
                      lng: pickup.lng,
                    }}
                    title="Pickup Location"
                    icon={{
                      path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
                      fillColor: '#10b981',
                      fillOpacity: 1,
                      strokeColor: '#fff',
                      strokeWeight: 2,
                      scale: 1.5,
                    }}
                  />

                  {/* Destination marker */}
                  <Marker
                    position={{
                      lat: destination.lat,
                      lng: destination.lng,
                    }}
                    title="Destination"
                    icon={{
                      path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
                      fillColor: '#ef4444',
                      fillOpacity: 1,
                      strokeColor: '#fff',
                      strokeWeight: 2,
                      scale: 1.5,
                    }}
                  />

                  {/* Route polyline */}
                  {routePath.length > 1 && (
                    <Polyline
                      path={routePath}
                      options={{
                        strokeColor: '#3b82f6',
                        strokeOpacity: 0.8,
                        strokeWeight: 3,
                      }}
                    />
                  )}
                </GoogleMap>
              </LoadScript>
            )}
          </CardContent>
        </Card>

        {/* Tracking Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Current Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {current_location ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Latitude: {current_location.lat.toFixed(6)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Longitude: {current_location.lng.toFixed(6)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Updated: {new Date(current_location.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No location data available</p>
              )}
            </CardContent>
          </Card>

          {/* Estimated Arrival */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Estimated Arrival
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary mb-2">
                {estimatedArrivalTime}
              </p>
              <p className="text-sm text-gray-600">
                {eta_minutes ? `About ${Math.round(eta_minutes)} minutes away` : 'Calculating...'}
              </p>
            </CardContent>
          </Card>

          {/* Distance Remaining */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Distance Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary mb-2">
                {distanceRemaining ? `${distanceRemaining.toFixed(2)} km` : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                To: {destination.name}
              </p>
            </CardContent>
          </Card>

          {/* Current Speed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Current Speed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary mb-2">
                {current_location?.speed ? `${current_location.speed.toFixed(1)} km/h` : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                {current_location?.heading ? `Heading: ${current_location.heading.toFixed(0)}°` : 'No heading data'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Delivery Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pickup Details */}
          <Card>
            <CardHeader>
              <CardTitle>Pickup Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-600">Item</p>
                <p>{pickup.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">From</p>
                <p>{pickup.donor}</p>
                <p className="text-sm text-gray-600">{pickup.address}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Driver</p>
                <p>{driver.name}</p>
                <p className="text-sm text-gray-600">{driver.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-600">Destination</p>
                <p>{destination.name}</p>
                <p className="text-sm text-gray-600">{destination.address}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Status</p>
                <Badge className={getStatusColor(delivery.status)}>
                  {delivery.status}
                </Badge>
              </div>
              {delivery.completedAt && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Completed</p>
                  <p>{new Date(delivery.completedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
