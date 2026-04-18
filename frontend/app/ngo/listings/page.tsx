'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ListingCard } from '@/components/dashboard/listing-card'
import { MapView } from '@/components/map/map-view'
import { fetchListings, createClaim } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, Filter, Zap } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function NGOListingsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)

  useEffect(() => {
    const loadListings = async () => {
      try {
        const response = await fetchListings('AVAILABLE')
        setListings(response.data)
      } catch (error) {
        console.error('Failed to load listings:', error)
        toast.error('Failed to load listings')
      } finally {
        setLoading(false)
      }
    }

    loadListings()
  }, [])

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(search.toLowerCase()) ||
      listing.description.toLowerCase().includes(search.toLowerCase())
    
    const matchesUrgency = urgencyFilter === 'all' || listing.urgency === urgencyFilter
    
    return matchesSearch && matchesUrgency
  })

  const handleClaim = async (listingId: string) => {
    if (!user?.ngoId) {
      toast.error('NGO profile not found')
      return
    }

    try {
      setClaiming(listingId)
      await createClaim(listingId, user.ngoId)
      toast.success('Listing claimed successfully!')
      // Refresh listings
      const response = await fetchListings('AVAILABLE')
      setListings(response.data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim listing')
    } finally {
      setClaiming(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Available Donations</h1>
          <p className="text-muted-foreground mt-2">Browse and claim food donations nearby</p>
        </div>
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
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgencies</SelectItem>
            <SelectItem value="critical">Critical (≤2h)</SelectItem>
            <SelectItem value="medium">Medium (2-6h)</SelectItem>
            <SelectItem value="fresh">Fresh (&gt;6h)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Map View */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Map View</h2>
        <MapView height="h-96" />
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
              <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{listing.name}</h3>
                      <p className="text-sm text-muted-foreground">{listing.donor?.businessName}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      listing.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                      listing.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {listing.urgency === 'critical' ? '🔴 Critical' :
                       listing.urgency === 'medium' ? '🟡 Medium' :
                       '🟢 Fresh'}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{listing.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{listing.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires in:</span>
                      <span className="font-medium text-red-600">{listing.hoursRemaining}h</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{listing.address}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {listing.description}
                  </p>

                  {/* Pickup Window */}
                  {listing.pickupWindow && (
                    <div className="bg-blue-50 p-2 rounded text-sm">
                      <p className="text-blue-900">
                        <strong>Pickup:</strong> {listing.pickupWindow}
                      </p>
                    </div>
                  )}

                  {/* Claim Button */}
                  <Button
                    onClick={() => handleClaim(listing.id)}
                    disabled={claiming === listing.id}
                    className="w-full"
                  >
                    {claiming === listing.id ? 'Claiming...' : 'Claim Donation'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No listings found matching your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
