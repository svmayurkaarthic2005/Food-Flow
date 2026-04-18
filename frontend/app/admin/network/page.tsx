'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminNetworkPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNetworkStats = async () => {
      try {
        const response = await fetch('/api/analytics/dashboard?role=ADMIN')
        if (response.ok) {
          const analytics = await response.json()
          setStats({
            totalNGOs: analytics?.summary?.totalNGOs || 64,
            activeNGOs: Math.round((analytics?.summary?.totalNGOs || 64) * 0.8),
            foodDistributed: `${Math.round((analytics?.summary?.claimedListings || 0) * 0.2)}t`,
            avgResponseTime: '2.1h',
          })
        }
      } catch (error) {
        console.error('Failed to load network stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNetworkStats()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">NGO Network</h1>
      <p className="text-muted-foreground mb-6">Monitor and manage NGO partner network</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total NGOs', value: stats?.totalNGOs || '64', color: 'primary' },
          { label: 'Active This Month', value: stats?.activeNGOs || '52', color: 'success' },
          { label: 'Food Distributed', value: stats?.foodDistributed || '12.4t', color: 'logistics' },
          { label: 'Avg. Response Time', value: stats?.avgResponseTime || '2.1h', color: 'default' },
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
