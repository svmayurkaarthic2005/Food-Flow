'use client'

import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'

type SelectedPlace = {
  address: string
  latitude: number | null
  longitude: number | null
}

interface AddressAutocompleteInputProps {
  value: string
  onValueChange: (value: string) => void
  onPlaceSelect?: (place: SelectedPlace) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

declare global {
  interface Window {
    google?: any
  }
}

const SCRIPT_ID = 'google-maps-places-script'

function loadGooglePlacesScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve()
      return
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')))
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    document.head.appendChild(script)
  })
}

export function AddressAutocompleteInput({
  value,
  onValueChange,
  onPlaceSelect,
  disabled,
  className,
  placeholder,
}: AddressAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || !inputRef.current || disabled) return

    let placeChangedListener: any

    loadGooglePlacesScript(apiKey)
      .then(() => {
        if (!inputRef.current || !window.google?.maps?.places) return

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry'],
          types: ['geocode'],
        })

        placeChangedListener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const address = place?.formatted_address || inputRef.current?.value || ''
          const latitude = place?.geometry?.location?.lat?.() ?? null
          const longitude = place?.geometry?.location?.lng?.() ?? null

          onValueChange(address)
          onPlaceSelect?.({ address, latitude, longitude })
        })
      })
      .catch((error) => {
        console.error('Google Places initialization failed:', error)
      })

    return () => {
      if (placeChangedListener && window.google?.maps?.event?.removeListener) {
        window.google.maps.event.removeListener(placeChangedListener)
      }
    }
  }, [disabled, onPlaceSelect, onValueChange])

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
    />
  )
}
