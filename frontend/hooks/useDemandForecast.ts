/**
 * Custom hook for fetching demand forecast data
 */
import useSWR from 'swr';

export interface DemandForecast {
  date: string;
  category: string;
  predicted: number;
  low: number;
  high: number;
}

interface UseDemandForecastOptions {
  district: string | null;
  days?: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error: any = new Error('Failed to fetch demand forecast');
    error.status = res.status;
    error.info = await res.json();
    throw error;
  }
  
  return res.json();
};

export function useDemandForecast({ district, days = 7 }: UseDemandForecastOptions) {
  const { data, error, isLoading, mutate } = useSWR<DemandForecast[]>(
    district ? `/api/ml/v1/demand?district=${encodeURIComponent(district)}&days=${days}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  );

  return {
    forecasts: data,
    isLoading,
    isError: error,
    mutate,
  };
}
