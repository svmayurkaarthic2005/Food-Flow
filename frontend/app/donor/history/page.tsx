'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchListings } from '@/lib/api'
import { MapPin, Calendar, Package, TrendingUp, Truck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function DonorHistoryPage() {
  const router = useRouter()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Fetch all listings (completed and expired)
        const availableResponse = await fetchListings('AVAILABLE')
        const claimedResponse = await fetchListings('CLAIMED')
        const expiredResponse = await fetchListings('EXPIRED')
        
        const allListings = [
          ...availableResponse.data,
          ...claimedResponse.data,
          ...expiredResponse.data,
        ]
        
        // Sort by creation date (newest first)
        allListings.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
        
        setListings(allListings)
      } catch (error) {
        console.error('Failed to load history:', error)
        toast.error('Failed to load donation history')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-blue-100 text-blue-800'
      case 'CLAIMED':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return '📋'
      case 'CLAIMED':
        return '✅'
      case 'EXPIRED':
        return '⏰'
      case 'COMPLETED':
        return '🎉'
      default:
        return '❓'
    }
  }

  // Calculate statistics
  const stats = {
    total: listings.length,
    claimed: listings.filter(l => l.status === 'CLAIMED').length,
    expired: listings.filter(l => l.status === 'EXPIRED').length,
    completed: listings.filter(l => l.status === 'COMPLETED').length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Donation History</h1>
        <p className="text-muted-foreground mt-2">View all your past and current donations</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Donations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.claimed}</p>
              <p className="text-sm text-muted-foreground">Claimed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Timeline</h2>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="space-y-4">
            {listings.map((listing, idx) => (
              <Card key={listing.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Timeline Dot */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                        {getStatusIcon(listing.status)}
                      </div>
                      {idx < listings.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200 my-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{listing.name}</h3>
                          <p className="text-sm text-muted-foreground">{listing.category}</p>
                        </div>
                        <Badge className={`${getStatusColor(listing.status)} text-xs`}>
                          {listing.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>{listing.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{listing.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(listing.createdAt || 0).toLocaleDateString()}</span>
                        </div>
                        {listing.status === 'CLAIMED' && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Claimed</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {listing.description}
                      </p>

                      {/* Track Delivery Button */}
                      {listing.claims && listing.claims.length > 0 && listing.claims[0].delivery && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant={listing.claims[0].delivery.status === 'DELIVERED' ? 'outline' : 'default'}
                            className="gap-2"
                            onClick={() => router.push(`/donor/tracking?id=${listing.claims[0].delivery.id}`)}
                          >
                            <Truck className="w-4 h-4" />
                            {listing.claims[0].delivery.status === 'DELIVERED' ? 'View Delivery' : 'Track Delivery'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No donation history found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
