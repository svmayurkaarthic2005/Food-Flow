'use client'

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    google?: any
  }
}

interface LocationPickerMapProps {
  latitude: number
  longitude: number
  disabled?: boolean
  onLocationChange: (location: { latitude: number; longitude: number; address?: string }) => void
}

export function LocationPickerMap({
  latitude,
  longitude,
  disabled,
  onLocationChange,
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const listenersRef = useRef<any[]>([])

  // Memoize the location change handler to avoid recreating listeners
  const handleLocationChangeRef = useRef(onLocationChange)
  useEffect(() => {
    handleLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return

    // Only initialize if not already initialized
    if (mapInstanceRef.current) return

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: { lat: latitude || 40.7128, lng: longitude || -74.006 },
      mapTypeControl: true,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
    })

    mapInstanceRef.current = mapInstance

    // Initialize geocoder
    geocoderRef.current = new window.google.maps.Geocoder()

    // Create draggable marker
    const marker = new window.google.maps.Marker({
      position: { lat: latitude || 40.7128, lng: longitude || -74.006 },
      map: mapInstance,
      draggable: !disabled,
      title: 'Drag to set location',
    })

    markerRef.current = marker

    // Handle marker drag
    const dragListener = marker.addListener('dragend', () => {
      const pos = marker.getPosition()
      if (pos) {
        const lat = pos.lat()
        const lng = pos.lng()
        
        // Reverse geocode to get address
        geocoderRef.current.geocode({ location: { lat, lng } }, (results: any[]) => {
          const address = results?.[0]?.formatted_address || ''
          handleLocationChangeRef.current({ latitude: lat, longitude: lng, address })
        })
      }
    })

    // Handle map click
    const clickListener = mapInstance.addListener('click', (e: any) => {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      
      marker.setPosition({ lat, lng })
      mapInstance.setCenter({ lat, lng })
      
      // Reverse geocode to get address
      geocoderRef.current.geocode({ location: { lat, lng } }, (results: any[]) => {
        const address = results?.[0]?.formatted_address || ''
        handleLocationChangeRef.current({ latitude: lat, longitude: lng, address })
      })
    })

    listenersRef.current = [dragListener, clickListener]

    return () => {
      listenersRef.current.forEach((listener) => {
        if (listener) window.google.maps.event.removeListener(listener)
      })
    }
  }, [disabled])

  // Update marker position when latitude/longitude change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setPosition({ lat: latitude || 40.7128, lng: longitude || -74.006 })
      mapInstanceRef.current.setCenter({ lat: latitude || 40.7128, lng: longitude || -74.006 })
    }
  }, [latitude, longitude])

  return (
    <div 
      ref={mapRef} 
      className="w-full h-56 rounded-md border border-border mt-2 bg-gray-100"
      style={{ minHeight: '224px' }}
    />
  )
}
