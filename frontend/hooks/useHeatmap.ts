/**
 * Custom hook for fetching heatmap data
 */
import useSWR from 'swr';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface UseHeatmapOptions {
  district?: string | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error: any = new Error('Failed to fetch heatmap data');
    error.status = res.status;
    error.info = await res.json();
    throw error;
  }
  
  return res.json();
};

export function useHeatmap({ district }: UseHeatmapOptions = {}) {
  const url = district 
    ? `/api/ml/v1/heatmap?district=${encodeURIComponent(district)}`
    : '/api/ml/v1/heatmap';

  const { data, error, isLoading, mutate } = useSWR<HeatmapPoint[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  );

  return {
    heatmapData: data,
    isLoading,
    isError: error,
    mutate,
  };
}
