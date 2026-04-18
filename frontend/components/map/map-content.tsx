'use client'

import { useEffect, useRef, useState } from 'react'
import { getUrgency, getUrgencyColor, getHoursLeft } from '@/lib/urgency'
import { useGoogleMaps } from '@/app/providers/google-maps-provider'

interface FoodListing {
  id: string
  name: string
  quantity: string
  location: string
  expiryTime: Date | string
  donorName: string
  donorType: string
  latitude: number
  longitude: number
  status?: 'available' | 'claimed' | 'expired'
}

interface MapContentProps {
  listings: FoodListing[]
  center: [number, number]
  zoom: number
  height: string
  onMarkerClick?: (listing: FoodListing) => void
}

export default function MapContent({ listings, center, zoom, height, onMarkerClick }: MapContentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  const userLocationMarker = useRef<any>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const { isLoaded } = useGoogleMaps()

  // Function to add user location marker
  const addUserLocationMarker = (lat: number, lng: number) => {
    if (!map.current || !window.google) return

    // Remove existing user location marker
    if (userLocationMarker.current) {
      userLocationMarker.current.setMap(null)
    }

    // Create user location marker
    const userIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `

    userLocationMarker.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: map.current,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(userIcon),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12),
      },
      zIndex: 1000,
    })
  }

  // Function to center map on user location
  const centerOnUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude
          const userLng = position.coords.longitude
          setUserLocation([userLat, userLng])
          
          if (map.current) {
            map.current.setCenter({ lat: userLat, lng: userLng })
            map.current.setZoom(14)
          }
          
          addUserLocationMarker(userLat, userLng)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your location. Please enable location services.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  // Initialize map and add markers
  useEffect(() => {
    if (!isLoaded || !mapContainer.current || !window.google) return

    // Initialize map only once
    if (!map.current) {
      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude
            const userLng = position.coords.longitude
            setUserLocation([userLat, userLng])
            
            // Double-check mapContainer is still available
            if (!mapContainer.current) return
            
            map.current = new window.google.maps.Map(mapContainer.current, {
              zoom: zoom,
              center: { lat: userLat, lng: userLng },
              mapTypeControl: true,
              fullscreenControl: true,
              streetViewControl: true,
              zoomControl: true,
            })
            
            // Add user location marker
            addUserLocationMarker(userLat, userLng)
          },
          () => {
            // Fallback to default center if geolocation fails
            if (!mapContainer.current) return
            
            map.current = new window.google.maps.Map(mapContainer.current, {
              zoom: zoom,
              center: { lat: center[0], lng: center[1] },
              mapTypeControl: true,
              fullscreenControl: true,
              streetViewControl: true,
              zoomControl: true,
            })
          }
        )
      } else {
        // Geolocation not supported, use default center
        if (!mapContainer.current) return
        
        map.current = new window.google.maps.Map(mapContainer.current, {
          zoom: zoom,
          center: { lat: center[0], lng: center[1] },
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: true,
          zoomControl: true,
        })
      }
    }

    // Clear existing markers
    markersRef.current.forEach((marker: any) => marker.setMap(null))
    markersRef.current = []

    // Add markers for each listing
    listings.forEach((listing) => {
      const urgency = getUrgency(listing.expiryTime)
      const hoursLeft = getHoursLeft(listing.expiryTime)
      const color = getUrgencyColor(urgency)

      const colorMap: Record<string, string> = {
        critical: '#EF4444',
        medium: '#EAB308',
        fresh: '#22C55E',
      }

      const markerColor = colorMap[urgency] || '#3B82F6'

      // Use Google Maps built-in marker with color
      const marker = new window.google.maps.Marker({
        position: { lat: listing.latitude, lng: listing.longitude },
        map: map.current,
        title: listing.name,
        icon: new window.google.maps.MarkerImage(
          `https://maps.google.com/mapfiles/ms/micons/red.png`,
          null,
          null,
          null,
          new window.google.maps.Size(32, 32)
        ),
      })

      // Create a custom marker with color using SVG
      const markerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 7 10 13 10 13s10-6 10-13c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="${markerColor}" stroke="white" stroke-width="0.5"/>
        </svg>
      `

      marker.setIcon({
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 32),
      })

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }

        const infoContent = `
          <div style="padding: 12px; font-family: system-ui; max-width: 280px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #000; font-size: 14px;">
              ${listing.name}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 6px; line-height: 1.6;">
              <div><strong>Quantity:</strong> ${listing.quantity}</div>
              <div><strong>Donor:</strong> ${listing.donorName}</div>
              <div><strong>Location:</strong> ${listing.location}</div>
              <div style="margin-top: 6px;">
                <strong>Expires in:</strong> 
                <span style="color: ${color}; font-weight: bold;">
                  ${hoursLeft}h
                </span>
              </div>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <button 
                onclick="window.open('/', '_self')" 
                style="
                  width: 100%;
                  padding: 6px;
                  background-color: #3b82f6;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 500;
                "
              >
                View Details
              </button>
            </div>
          </div>
        `

        infoWindowRef.current = new window.google.maps.InfoWindow({
          content: infoContent,
        })

        infoWindowRef.current.open(map.current, marker)
        onMarkerClick?.(listing)
      })

      markersRef.current.push(marker)
    })

    // Fit bounds if listings exist
    if (listings.length > 0 && map.current) {
      const bounds = new window.google.maps.LatLngBounds()
      listings.forEach((listing) => {
        bounds.extend({ lat: listing.latitude, lng: listing.longitude })
      })
      map.current.fitBounds(bounds, 50)
    }
  }, [isLoaded, listings, center, zoom, onMarkerClick])

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className={`${height} w-full rounded-lg relative bg-gray-100`}
        style={{ zIndex: 0 }}
      />
      {/* Current Location Button */}
      <button
        onClick={centerOnUserLocation}
        className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-lg shadow-lg border border-gray-200 transition-colors z-10 flex items-center gap-2"
        title="Center on my location"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="text-sm font-medium">My Location</span>
      </button>
    </div>
  )
}
