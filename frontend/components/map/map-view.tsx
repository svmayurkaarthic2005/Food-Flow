'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchListings, ListingWithUrgency } from '@/lib/api'
import { useGoogleMaps } from '@/app/providers/google-maps-provider'

const MapContent = dynamic(() => import('./map-content'), { ssr: false })

interface MapViewProps {
  center?: [number, number]
  zoom?: number
  height?: string
  listings?: any[]
  onMarkerClick?: (listing: any) => void
}

export function MapView({ 
  center = [40.7128, -74.0060],
  zoom = 12,
  height = 'h-96',
  listings: externalListings,
  onMarkerClick 
}: MapViewProps) {
  const { isLoaded } = useGoogleMaps()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(!externalListings)

  useEffect(() => {
    if (externalListings) {
      setListings(externalListings)
      setLoading(false)
      return
    }

    const loadListings = async () => {
      try {
        const response = await fetchListings('AVAILABLE')
        setListings(response.data.map((listing: ListingWithUrgency) => ({
          id: listing.id,
          name: listing.name,
          quantity: listing.quantity,
          location: listing.address,
          expiryTime: listing.expiryTime,
          donorName: listing.donor.businessName,
          donorType: listing.donor.businessType,
          latitude: listing.latitude,
          longitude: listing.longitude,
          status: listing.status,
        })))
      } catch (error) {
        console.error('Failed to load listings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadListings()
    // Refresh listings every 5 minutes
    const interval = setInterval(loadListings, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [externalListings])

  if (!isLoaded || loading) {
    return (
      <Card className="overflow-hidden">
        <Skeleton className={height} />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <Suspense fallback={<Skeleton className={height} />}>
        <MapContent
          listings={listings}
          center={center}
          zoom={zoom}
          height={height}
          onMarkerClick={onMarkerClick}
        />
      </Suspense>
    </Card>
  )
}
