'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface GoogleMapsContextType {
  isLoaded: boolean
  loadScript: () => Promise<void>
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined)

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [scriptLoading, setScriptLoading] = useState(false)

  const loadScript = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.maps) {
        setIsLoaded(true)
        resolve()
        return
      }

      // Check if script already exists in DOM
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]'
      )
      if (existingScript) {
        setIsLoaded(true)
        resolve()
        return
      }

      setScriptLoading(true)
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,routes`
      script.async = true
      script.defer = true
      
      script.onload = () => {
        setIsLoaded(true)
        setScriptLoading(false)
        resolve()
      }

      script.onerror = () => {
        setScriptLoading(false)
        console.error('Failed to load Google Maps')
        reject(new Error('Failed to load Google Maps'))
      }

      document.head.appendChild(script)
    })
  }

  useEffect(() => {
    // Load script on mount
    loadScript()
  }, [])

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadScript }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext)
  if (context === undefined) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider')
  }
  return context
}
