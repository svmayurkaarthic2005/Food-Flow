/**
 * Custom hook for fetching ML insights
 */
import useSWR from 'swr'

export interface MLInsights {
  peakDonationTimes: {
    peakHours: string
    peakDay: string
    description: string
  }
  recommendedCategories: {
    topCategory: string
    claimRate: number
    categories: string[]
    description: string
  }
  avgPickupTime: {
    hours: number
    formatted: string
    description: string
  }
  insights: {
    totalAnalyzed: number
    categoriesAnalyzed: number
    claimsAnalyzed: number
  }
}

interface UseMLInsightsOptions {
  userId?: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  
  if (!res.ok) {
    const error: any = new Error('Failed to fetch ML insights')
    error.status = res.status
    try {
      error.info = await res.json()
    } catch {
      error.info = { message: 'Failed to parse error response' }
    }
    throw error
  }
  
  return res.json()
}

export function useMLInsights({ userId }: UseMLInsightsOptions = {}) {
  const url = userId ? `/api/ml/insights?userId=${userId}` : '/api/ml/insights'
  
  const { data, error, isLoading, mutate } = useSWR<MLInsights>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  )

  return {
    insights: data,
    isLoading,
    isError: error,
    mutate,
  }
}
