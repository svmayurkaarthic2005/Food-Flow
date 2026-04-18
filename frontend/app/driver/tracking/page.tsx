'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin, Navigation, Play, Square, Zap } from 'lucide-react';

interface DeliveryInfo {
  id: string;
  status: string;
  pickup: {
    name: string;
    address: string;
    businessName: string;
  };
  destination: {
    name: string;
    address: string;
  };
}

export default function DriverTrackingPage() {
  const searchParams = useSearchParams();
  const deliveryId = searchParams.get('id');

  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locationCount, setLocationCount] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch delivery info
  useEffect(() => {
    if (!deliveryId) return;

    const fetchDelivery = async () => {
      try {
        const response = await fetch(`/api/tracking/${deliveryId}`);
        if (!response.ok) throw new Error('Failed to fetch delivery');
        const data = await response.json();
        
        setDelivery({
          id: data.delivery.id,
          status: data.delivery.status,
          pickup: {
            name: data.pickup.name,
            address: data.pickup.address,
            businessName: data.pickup.donor,
          },
          destination: {
            name: data.destination.name,
            address: data.destination.address,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching delivery');
      }
    };

    fetchDelivery();
  }, [deliveryId]);

  // Send location update
  const sendLocationUpdate = async (position: GeolocationPosition) => {
    if (!deliveryId) return;

    // Calculate speed if not provided by GPS
    let speed = position.coords.speed;
    if (speed === null && lastPositionRef.current) {
      const timeDiff = (position.timestamp - lastPositionRef.current.timestamp) / 1000; // seconds
      if (timeDiff > 0) {
        const distance = calculateDistance(
          lastPositionRef.current.coords.latitude,
          lastPositionRef.current.coords.longitude,
          position.coords.latitude,
          position.coords.longitude
        );
        speed = (distance / timeDiff) * 3600; // km/h
      }
    }

    lastPositionRef.current = position;
    setCurrentSpeed(speed);

    try {
      const response = await fetch(`/api/driver/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_id: deliveryId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: speed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      setLastUpdate(new Date());
      setLocationCount((prev) => prev + 1);
      setError(null);
    } catch (err) {
      console.error('Error sending location:', err);
      setError(err instanceof Error ? err.message : 'Error updating location');
    }
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  // Start tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Watch position with high accuracy
    const id = navigator.geolocation.watchPosition(
      sendLocationUpdate,
      (err) => {
        console.error('Geolocation error:', err);
        setError(`Location error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setWatchId(id);

    // Also send updates every 2 seconds even if position hasn't changed much
    updateIntervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        sendLocationUpdate(lastPositionRef.current);
      }
    }, 2000);
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    setIsTracking(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [watchId]);

  if (!deliveryId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>No delivery ID provided</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Driver Tracking</h1>
          <p className="text-gray-600">Share your location during delivery</p>
        </div>

        {/* Tracking Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tracking Status</span>
              <Badge className={isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {isTracking ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Location Updates Sent</p>
                  <p className="text-2xl font-bold text-primary">{locationCount}</p>
                </div>
                {lastUpdate && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-600">Last Update</p>
                    <p className="text-sm">{lastUpdate.toLocaleTimeString()}</p>
                  </div>
                )}
              </div>

              {currentSpeed !== null && (
                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Current Speed</p>
                    <p className="text-lg font-bold text-blue-600">
                      {currentSpeed.toFixed(1)} km/h
                    </p>
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex gap-3">
                {!isTracking ? (
                  <Button
                    onClick={startTracking}
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    <Play className="h-5 w-5" />
                    Start Tracking
                  </Button>
                ) : (
                  <Button
                    onClick={stopTracking}
                    variant="destructive"
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    <Square className="h-5 w-5" />
                    Stop Tracking
                  </Button>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {isTracking && (
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                  <Navigation className="h-5 w-5 animate-pulse" />
                  <span className="text-sm">
                    Your location is being shared automatically
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        {delivery && (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Pickup Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{delivery.pickup.name}</p>
                <p className="text-sm text-gray-600">{delivery.pickup.businessName}</p>
                <p className="text-sm text-gray-600 mt-1">{delivery.pickup.address}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Delivery Destination
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{delivery.destination.name}</p>
                <p className="text-sm text-gray-600 mt-1">{delivery.destination.address}</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Instructions */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Click "Start Tracking" to begin sharing your location</li>
              <li>• Keep this page open during the entire delivery</li>
              <li>• Your location will update automatically</li>
              <li>• The NGO can see your real-time location</li>
              <li>• Click "Stop Tracking" when delivery is complete</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
