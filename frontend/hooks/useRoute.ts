/**
 * Custom hook for route optimization
 */
import { useState, useCallback } from 'react';

export interface RouteStop {
  listing_id: number;
  lat: number;
  lng: number;
  eta_minutes: number;
}

export interface RouteResponse {
  stops: RouteStop[];
  total_minutes: number;
  warning: string | null;
}

interface RouteRequest {
  listing_ids: number[];
  depot: {
    lat: number;
    lng: number;
  };
}

export function useRoute() {
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optimizeRoute = useCallback(async (request: RouteRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ml/v1/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to optimize route');
      }

      const data: RouteResponse = await res.json();
      setRoute(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return {
    route,
    isLoading,
    error,
    optimizeRoute,
    clearRoute,
  };
}
