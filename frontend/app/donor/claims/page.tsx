'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchClaims } from '@/lib/api'
import { MapPin, Calendar, Users, Package, Truck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function DonorClaimsPage() {
  const router = useRouter()
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const loadClaims = async () => {
      try {
        // TODO: Get actual donor ID from auth context
        const donorId = 'donor1' // Placeholder
        const response = await fetchClaims(undefined, donorId)
        setClaims(response.data)
      } catch (error) {
        console.error('Failed to load claims:', error)
        toast.error('Failed to load claims')
      } finally {
        setLoading(false)
      }
    }

    loadClaims()
  }, [])

  const filteredClaims = filter === 'all' 
    ? claims 
    : claims.filter(claim => claim.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳'
      case 'ACCEPTED':
        return '✅'
      case 'REJECTED':
        return '❌'
      case 'COMPLETED':
        return '🎉'
      default:
        return '❓'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Claims on Your Donations</h1>
        <p className="text-muted-foreground mt-2">Track NGO claims on your food donations</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Claims ({claims.length})
        </Button>
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          onClick={() => setFilter('PENDING')}
        >
          Pending ({claims.filter(c => c.status === 'PENDING').length})
        </Button>
        <Button
          variant={filter === 'ACCEPTED' ? 'default' : 'outline'}
          onClick={() => setFilter('ACCEPTED')}
        >
          Accepted ({claims.filter(c => c.status === 'ACCEPTED').length})
        </Button>
        <Button
          variant={filter === 'COMPLETED' ? 'default' : 'outline'}
          onClick={() => setFilter('COMPLETED')}
        >
          Completed ({claims.filter(c => c.status === 'COMPLETED').length})
        </Button>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => (
            <Card key={claim.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Listing Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{claim.listing?.name}</h3>
                      <p className="text-sm text-muted-foreground">{claim.listing?.category}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span>{claim.listing?.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{claim.listing?.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Expires in {claim.listing?.hoursRemaining}h</span>
                      </div>
                    </div>
                  </div>

                  {/* NGO Info */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Claimed by</p>
                      <h4 className="font-semibold text-lg">{claim.ngo?.user?.name}</h4>
                      <p className="text-sm text-muted-foreground">{claim.ngo?.organizationName}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>People served: {claim.ngo?.peopleServed}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span>Received: {claim.ngo?.totalReceived} items</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Status</p>
                      <Badge className={`${getStatusColor(claim.status)} text-sm py-1 px-3`}>
                        {getStatusIcon(claim.status)} {claim.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Claimed on {new Date(claim.claimedAt).toLocaleDateString()}
                      </p>
                      {claim.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" className="flex-1">
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Reject
                          </Button>
                        </div>
                      )}
                      {(claim.status === 'ACCEPTED' || claim.status === 'COMPLETED') && claim.delivery && (
                        <Button 
                          size="sm" 
                          variant={claim.delivery.status === 'DELIVERED' ? 'outline' : 'default'}
                          className="w-full gap-2"
                          onClick={() => router.push(`/donor/tracking?id=${claim.delivery.id}`)}
                        >
                          <Truck className="w-4 h-4" />
                          {claim.delivery.status === 'DELIVERED' ? 'View Delivery' : 'Track Delivery'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No claims found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
