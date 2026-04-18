'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/dashboard/kpi-card'
import { AIInsightCard } from '@/components/dashboard/ai-insight-card'
import { ListingCard } from '@/components/dashboard/listing-card'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'
import { Plus, Package, Users, TrendingUp, MapPin } from 'lucide-react'
import Link from 'next/link'
import { fetchDashboardAnalytics } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { useMLInsights } from '@/hooks/useMLInsights'

interface DonorDashboardClientProps {
  user: any
}

export default function DonorDashboardClient({ user }: DonorDashboardClientProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Fetch ML insights dynamically
  const { insights: mlInsights, isLoading: mlLoading, isError: mlError } = useMLInsights()

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await fetchDashboardAnalytics(undefined, 'DONOR')
        setAnalytics(data)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  // Calculate dynamic trends from ML insights
  const activeDonations = analytics?.summary?.availableListings || 0
  const claimedListings = analytics?.summary?.claimedListings || 0
  const totalDonors = analytics?.summary?.totalDonors || 0
  
  // Use dynamic ML insights or fallback to defaults
  const avgPickupTime = mlInsights?.avgPickupTime?.formatted || '2.3h'
  const peakHours = mlInsights?.peakDonationTimes?.peakHours || '4-6 PM'
  const peakDay = mlInsights?.peakDonationTimes?.peakDay || 'Weekdays'
  const topCategory = mlInsights?.recommendedCategories?.topCategory || 'Bakery'
  const claimRate = mlInsights?.recommendedCategories?.claimRate || 95
  
  // Calculate dynamic trends based on ML insights
  const activeDonationsTrend = mlInsights?.insights?.trends?.activeDonationsTrend || 8
  const claimedListingsTrend = mlInsights?.insights?.trends?.claimedListingsTrend || 12
  const totalDonorsTrend = mlInsights?.insights?.trends?.totalDonorsTrend || 5

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back, {user.name}! Here's your donation overview.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/donor/create">
            <Plus className="w-4 h-4" />
            Create Donation
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Donations"
          value={activeDonations.toString()}
          description="Available for claiming"
          trend={activeDonationsTrend}
          icon={<Package className="w-5 h-5" />}
          variant="default"
        />
        <KPICard
          title="Claimed Listings"
          value={claimedListings.toString()}
          description="Last 30 days"
          trend={claimedListingsTrend}
          icon={<Users className="w-5 h-5" />}
          variant="success"
        />
        <KPICard
          title="Total Donors"
          value={totalDonors.toString()}
          description="In the network"
          trend={totalDonorsTrend}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="logistics"
        />
        <KPICard
          title="Avg Pickup Time"
          value={avgPickupTime}
          description="From listing to pickup"
          icon={<MapPin className="w-5 h-5" />}
          variant="logistics"
        />
      </div>

      {/* Recent Listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Listings</h2>
          <Button variant="outline" asChild>
            <Link href="/donor/listings">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics?.recentListings?.slice(0, 4).map((listing: any) => {
            // Map database status to UI status
            const statusMap: Record<string, 'unclaimed' | 'matched' | 'claimed' | 'picked-up' | 'completed'> = {
              'AVAILABLE': 'unclaimed',
              'CLAIMED': 'claimed',
              'COMPLETED': 'completed',
            }
            const uiStatus = statusMap[listing.status] || 'unclaimed'
            
            return (
              <ListingCard
                key={listing.id}
                id={listing.id}
                foodType={listing.name}
                quantity={listing.quantity}
                location={listing.address}
                donor={listing.donor?.user?.name || 'Unknown'}
                expiresIn={listing.hoursRemaining || 0}
                status={uiStatus}
                urgency={listing.urgency || 'normal'}
              />
            )
          })}
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <h2 className="text-xl font-semibold mb-4">AI Insights</h2>
        {mlLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : mlError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            Failed to load ML insights. Please try again later.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AIInsightCard
              title="Peak Donation Times"
              description={mlInsights?.peakDonationTimes?.description}
              insights={[
                { label: 'Peak Hours', value: mlInsights?.peakDonationTimes?.peakHours, highlight: true },
                { label: 'Day', value: mlInsights?.peakDonationTimes?.peakDay },
              ]}
              variant="default"
            />
            <AIInsightCard
              title="Recommended Categories"
              description={mlInsights?.recommendedCategories?.description}
              insights={[
                { label: `${mlInsights?.recommendedCategories?.topCategory} Claim Rate`, value: `${mlInsights?.recommendedCategories?.claimRate}%`, highlight: true },
                { label: 'Recommendation', value: `Focus on ${mlInsights?.recommendedCategories?.topCategory?.toLowerCase()}` },
              ]}
              variant="success"
            />
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <ActivityTimeline
          events={analytics?.recentClaims?.slice(0, 3).map((claim: any) => ({
            id: claim.id,
            title: `${claim.ngo?.user?.name} claimed ${claim.listing?.name}`,
            timestamp: new Date(claim.claimedAt),
            type: 'claim',
          })) || []}
        />
      </div>
    </div>
  )
}
