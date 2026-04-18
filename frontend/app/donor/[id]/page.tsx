'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, UrgencyBadge } from '@/components/status/status-badge'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'
import { MapPin, Clock, Package, Users, Phone, Mail, Edit2 } from 'lucide-react'

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fresh Vegetables Mix</h1>
          <p className="text-muted-foreground mt-2">Listing ID: {params.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Food Details */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Food Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Food Type</p>
                  <p className="text-lg font-semibold text-foreground">Fresh Vegetables</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Quantity</p>
                  <p className="text-lg font-semibold text-foreground">45 kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Pickup Location</p>
                  <p className="text-lg font-semibold text-foreground">Downtown Market</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Full Address</p>
                  <p className="text-lg font-semibold text-foreground">123 Market St, City</p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-foreground">
                  Fresh seasonal vegetables from our market stand. Includes lettuce, tomatoes, carrots, and green peppers. All items are clean and ready for distribution. Please arrange pickup within 6 hours for optimal freshness.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status & Timeline */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
              <CardDescription>Tracking your donation progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTimeline
                events={[
                  { id: '1', title: 'Donation created', timestamp: '2024-04-14 10:00 AM', type: 'success' },
                  { id: '2', title: 'AI matching in progress', timestamp: '2024-04-14 10:05 AM', type: 'info' },
                  { id: '3', title: 'Hope Community Center matched', description: 'Match score: 94%', timestamp: '2024-04-14 10:12 AM', type: 'success' },
                  { id: '4', title: 'Claim received', description: 'Waiting for donor approval', timestamp: '2024-04-14 10:30 AM', type: 'action' },
                ]}
              />
            </CardContent>
          </Card>

          {/* Claims */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Claims Received</CardTitle>
              <CardDescription>1 NGO claimed this donation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-primary/20 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">Hope Community Center</h4>
                    <p className="text-sm text-muted-foreground mt-1">Nonprofit organization</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-primary">MATCH SCORE</p>
                    <p className="text-lg font-bold text-primary">94%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="text-sm font-semibold text-foreground">2.1 km away</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="text-sm font-semibold text-foreground">78% used</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href="mailto:contact@hope.org" className="text-sm text-primary hover:underline">
                      contact@hope.org
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">(555) 123-4567</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button variant="outline" className="flex-1">Decline</Button>
                  <Button className="flex-1">Accept & Coordinate</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Donation Status</p>
                <StatusBadge status="matched" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Urgency</p>
                <UrgencyBadge urgency="normal" hoursLeft={6} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Food Type</span>
                  <span className="font-semibold text-foreground">Vegetables</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <span className="font-semibold text-foreground">45 kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Posted</span>
                  <span className="font-semibold text-foreground">2h ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expires in</span>
                  <span className="font-semibold text-foreground">6h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Claims</span>
                  <span className="font-semibold text-foreground">1</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-success/20 bg-success/5">
            <CardHeader>
              <CardTitle className="text-lg">AI Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Based on AI analysis, Hope Community Center is an excellent match for this donation with a 94% compatibility score.
              </p>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Why this match?</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Close proximity (2.1 km)</li>
                  <li>• High capacity utilization</li>
                  <li>• History of successful pickups</li>
                  <li>• Food preference match</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
