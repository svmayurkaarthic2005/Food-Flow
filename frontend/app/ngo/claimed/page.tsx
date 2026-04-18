'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchClaims, updateClaimStatus } from '@/lib/api'
import { MapPin, Calendar, Package, Truck, Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { DonorRatingModal } from '@/components/ratings/donor-rating-modal'

export default function NGOClaimedPage() {
  const { user } = useAuth()
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [ratingClaimId, setRatingClaimId] = useState<string | null>(null)
  const [ratingData, setRatingData] = useState<any>(null)

  useEffect(() => {
    const loadClaims = async () => {
      if (!user?.ngoId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetchClaims(user.ngoId)
        setClaims(response.data)
      } catch (error) {
        console.error('Failed to load claims:', error)
        toast.error('Failed to load claims')
      } finally {
        setLoading(false)
      }
    }

    loadClaims()
  }, [user?.ngoId])

  const handleCompletePickup = async (claimId: string) => {
    try {
      setUpdating(claimId)
      await updateClaimStatus(claimId, 'COMPLETED')
      toast.success('Pickup completed!')
      
      // Update local state
      setClaims(claims.map(c => 
        c.id === claimId ? { ...c, status: 'COMPLETED' } : c
      ))
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete pickup')
    } finally {
      setUpdating(null)
    }
  }

  const handleCancelClaim = async (claimId: string) => {
    try {
      setUpdating(claimId)
      await updateClaimStatus(claimId, 'REJECTED')
      toast.success('Claim cancelled')
      
      // Update local state
      setClaims(claims.map(c => 
        c.id === claimId ? { ...c, status: 'REJECTED' } : c
      ))
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel claim')
    } finally {
      setUpdating(null)
    }
  }

  const handleOpenRating = async (claim: any) => {
    // Check if already rated
    try {
      const response = await fetch(`/api/ratings?claimId=${claim.id}`)
      if (response.ok) {
        const existingRating = await response.json()
        if (existingRating) {
          toast.info('You have already rated this donor')
          return
        }
      }
    } catch (error) {
      console.error('Error checking rating:', error)
    }

    setRatingData(claim)
    setRatingClaimId(claim.id)
  }

  const handleRatingSuccess = () => {
    // Refresh claims to show updated rating
    if (user?.ngoId) {
      fetchClaims(user.ngoId).then((response) => {
        setClaims(response.data)
      })
    }
  }

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
        <h1 className="text-3xl font-bold text-foreground">Claimed Donations</h1>
        <p className="text-muted-foreground mt-2">Track your claimed food donations and deliveries</p>
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
          variant={filter === 'ACCEPTED' ? 'default' : 'outline'}
          onClick={() => setFilter('ACCEPTED')}
        >
          Ready for Pickup ({claims.filter(c => c.status === 'ACCEPTED').length})
        </Button>
        <Button
          variant={filter === 'COMPLETED' ? 'default' : 'outline'}
          onClick={() => setFilter('COMPLETED')}
        >
          Completed ({claims.filter(c => c.status === 'COMPLETED').length})
        </Button>
      </div>

      {/* Claims Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </>
        ) : filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => (
            <Card key={claim.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{claim.listing?.name}</h3>
                    <p className="text-sm text-muted-foreground">{claim.listing?.donor?.businessName}</p>
                  </div>
                  <Badge className={`${getStatusColor(claim.status)} text-xs`}>
                    {getStatusIcon(claim.status)} {claim.status}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span>{claim.listing?.quantity} - {claim.listing?.category}</span>
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

                {/* Pickup Window */}
                {claim.listing?.pickupWindow && (
                  <div className="bg-blue-50 p-2 rounded text-sm">
                    <p className="text-blue-900">
                      <strong>Pickup:</strong> {claim.listing.pickupWindow}
                    </p>
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {claim.listing?.description}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {claim.status === 'ACCEPTED' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="flex-1"
                        onClick={() => handleCompletePickup(claim.id)}
                        disabled={updating === claim.id}
                      >
                        {updating === claim.id ? 'Completing...' : 'Complete Pickup'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleCancelClaim(claim.id)}
                        disabled={updating === claim.id}
                      >
                        {updating === claim.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    </>
                  )}
                  {claim.status === 'COMPLETED' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => handleOpenRating(claim)}
                    >
                      <Star className="w-4 h-4" />
                      Rate Donor
                    </Button>
                  )}
                  {claim.status === 'REJECTED' && (
                    <Button size="sm" variant="outline" className="w-full" disabled>
                      ✗ Cancelled
                    </Button>
                  )}
                </div>

                {/* Claim Date */}
                <p className="text-xs text-muted-foreground">
                  Claimed on {new Date(claim.claimedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No claimed donations found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rating Modal */}
      {ratingClaimId && ratingData && (
        <DonorRatingModal
          claimId={ratingClaimId}
          donorName={ratingData.listing?.donor?.businessName || 'Unknown'}
          foodType={ratingData.listing?.name || 'Food'}
          onClose={() => {
            setRatingClaimId(null)
            setRatingData(null)
          }}
          onSuccess={handleRatingSuccess}
        />
      )}
    </div>
  )
}
