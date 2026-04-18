'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '@/components/dashboard/kpi-card'
import { AIInsightCard } from '@/components/dashboard/ai-insight-card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { TrendingUp, Package, Users, AlertCircle, Activity } from 'lucide-react'
import Link from 'next/link'
import { fetchDashboardAnalytics } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminDashboardClientProps {
  user: any
}

export default function AdminDashboardClient({ user }: AdminDashboardClientProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await fetchDashboardAnalytics(undefined, 'ADMIN')
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

  const totalListings = analytics?.summary?.totalListings || 0
  const totalUsers = analytics?.summary?.totalUsers || 0
  const totalDonors = analytics?.summary?.totalDonors || 0
  const totalNGOs = analytics?.summary?.totalNGOs || 0

  // Note: Chart data will be generated from real analytics once sufficient data is collected
  const hasChartData = false // Set to true when analytics API provides time-series data
  
  const chartData = hasChartData ? [] : [
    { month: 'Jan', rescued: 0, distributed: 0, wasted: 0 },
    { month: 'Feb', rescued: 0, distributed: 0, wasted: 0 },
    { month: 'Mar', rescued: 0, distributed: 0, wasted: 0 },
    { month: 'Apr', rescued: 0, distributed: 0, wasted: 0 },
    { month: 'May', rescued: 0, distributed: 0, wasted: 0 },
    { month: 'Jun', rescued: 0, distributed: 0, wasted: 0 },
  ]

  const pickupData = hasChartData ? [] : [
    { week: 'Week 1', completed: 0, pending: 0, failed: 0 },
    { week: 'Week 2', completed: 0, pending: 0, failed: 0 },
    { week: 'Week 3', completed: 0, pending: 0, failed: 0 },
    { week: 'Week 4', completed: 0, pending: 0, failed: 0 },
  ]

  const statusData = [
    { name: 'Completed', value: analytics?.summary?.claimedListings || 0, color: '#10b981' },
    { name: 'Available', value: analytics?.summary?.availableListings || 0, color: '#3b82f6' },
    { name: 'Expired', value: analytics?.summary?.expiredListings || 0, color: '#f59e0b' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back, {user.name}! Network performance and system insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Food Rescued"
          value={`${totalListings}`}
          description="Listings in system"
          icon={<Package className="w-5 h-5" />}
          variant="default"
        />
        <KPICard
          title="Active Users"
          value={totalUsers.toString()}
          description={`${totalDonors} donors, ${totalNGOs} NGOs`}
          icon={<Users className="w-5 h-5" />}
          variant="success"
        />
        <KPICard
          title="System Health"
          value="98.5%"
          description="Uptime this month"
          trend={2}
          icon={<Activity className="w-5 h-5" />}
          variant="logistics"
        />
        <KPICard
          title="Alerts"
          value="14"
          description="Requiring attention"
          icon={<AlertCircle className="w-5 h-5" />}
          variant="urgent"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Food Rescue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Food Rescue Trend</CardTitle>
            <CardDescription>Monthly food rescued vs distributed</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rescued" fill="#3b82f6" />
                <Bar dataKey="distributed" fill="#10b981" />
                <Bar dataKey="wasted" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pickup Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Pickup Performance</CardTitle>
            <CardDescription>Weekly pickup completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pickupData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10b981" />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Status Distribution</CardTitle>
          <CardDescription>Current status of all deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Donors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Donors</CardTitle>
            <CardDescription>Most active food donors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topDonors?.slice(0, 5).map((donor: any) => (
                <div key={donor.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{donor.user?.name}</p>
                    <p className="text-sm text-muted-foreground">{donor.businessName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{donor.totalDonated}</p>
                    <p className="text-sm text-muted-foreground">items</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top NGOs */}
        <Card>
          <CardHeader>
            <CardTitle>Top NGOs</CardTitle>
            <CardDescription>Most active food recipients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topNGOs?.slice(0, 5).map((ngo: any) => (
                <div key={ngo.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ngo.user?.name}</p>
                    <p className="text-sm text-muted-foreground">{ngo.organizationName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{ngo.totalReceived}</p>
                    <p className="text-sm text-muted-foreground">items</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/users">Manage Users</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/listings">View Listings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/analytics">View Analytics</Link>
        </Button>
      </div>
    </div>
  )
}
