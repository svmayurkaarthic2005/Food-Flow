/**
 * Custom hook for fetching NGO recommendations
 */
import useSWR from 'swr';

export interface NGOMatch {
  ngo_id: number;
  name: string;
  score: number;
  distance_km: number;
  trust_score: number | null;
  trust_label: string | null;
}

interface UseRecommendationsOptions {
  listingId: string | null;
  topN?: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error: any = new Error('Failed to fetch recommendations');
    error.status = res.status;
    error.info = await res.json();
    throw error;
  }
  
  return res.json();
};

export function useRecommendations({ listingId, topN = 3 }: UseRecommendationsOptions) {
  const { data, error, isLoading, mutate } = useSWR<NGOMatch[]>(
    listingId ? `/api/ml/v1/recommendations/${listingId}?top_n=${topN}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    recommendations: data,
    isLoading,
    isError: error,
    mutate,
  };
}
