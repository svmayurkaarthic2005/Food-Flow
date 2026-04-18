'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ListingCard } from '@/components/dashboard/listing-card'
import { MapView } from '@/components/map/map-view'
import { fetchListings } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Plus, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export default function DonorListingsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('AVAILABLE')
  const [listings, setListings] = useState<any[]>([])
  const [donorId, setDonorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCurrentDonor = async () => {
      try {
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) return
        const me = await meRes.json()
        setDonorId(me?.donorId || null)
      } catch (error) {
        console.error('Failed to load donor info:', error)
      }
    }

    loadCurrentDonor()
  }, [])

  useEffect(() => {
    if (!donorId) {
      setListings([])
      setLoading(false)
      return
    }

    const loadListings = async () => {
      try {
        const response = await fetchListings(statusFilter as any, undefined, 1, 100, donorId)
        setListings(response.data)
      } catch (error) {
        console.error('Failed to load listings:', error)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    loadListings()
  }, [statusFilter, donorId])

  const filteredListings = listings.filter(listing =>
    listing.name.toLowerCase().includes(search.toLowerCase()) ||
    listing.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleViewDetails = (listingId: string) => {
    router.push(`/donor/listings/${listingId}`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Listings</h1>
          <p className="text-muted-foreground mt-2">Manage all your active donations</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/donor/create">
            <Plus className="w-4 h-4" />
            New Donation
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="CLAIMED">Claimed</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Map View */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Map View</h2>
        <MapView
          height="h-96"
          listings={filteredListings.map((listing) => ({
            id: listing.id,
            name: listing.name,
            quantity: listing.quantity,
            location: listing.address,
            expiryTime: listing.expiryTime,
            donorName: listing.donor?.businessName || 'Unknown',
            donorType: listing.donor?.businessType || 'Unknown',
            latitude: listing.latitude,
            longitude: listing.longitude,
            status: listing.status,
          }))}
        />
      </div>

      {/* Listings Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Listings ({filteredListings.length})
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                foodType={listing.name}
                quantity={listing.quantity}
                location={listing.address}
                donor={listing.donor?.businessName || 'Unknown'}
                expiresIn={listing.expiryTime}
                status={listing.status || 'unclaimed'}
                urgency="normal"
                onViewDetails={() => handleViewDetails(listing.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {donorId ? 'No listings found for your account' : 'No donor profile found for this account'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
