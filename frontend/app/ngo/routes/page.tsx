'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Package, Clock } from 'lucide-react'

export default function NGORoutesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Route Planning</h1>
        <p className="text-muted-foreground mt-2">Optimize pickup routes for maximum efficiency</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Suggested Route</CardTitle>
          <CardDescription>AI-optimized pickup sequence for today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { stop: 1, food: 'Dairy Products', location: 'Harbor District - 3.2 km', time: '2:00 PM' },
              { stop: 2, food: 'Bakery Items', location: 'Central Bakery - 1.8 km', time: '2:45 PM' },
              { stop: 3, food: 'Vegetables', location: 'Downtown Market - 2.1 km', time: '3:15 PM' },
            ].map((stop) => (
              <div key={stop.stop} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  {stop.stop}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{stop.food}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {stop.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground text-sm">{stop.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-success/5 border border-success/20 rounded-lg p-4">
            <p className="text-sm font-semibold text-success mb-2">Route Summary</p>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">Total Distance: 12.4 km</p>
              <p className="text-muted-foreground">Estimated Time: 1h 30m</p>
              <p className="text-muted-foreground">Total Items: 270 kg</p>
            </div>
          </div>

          <Button className="w-full">Start Delivery</Button>
        </CardContent>
      </Card>
    </div>
  )
}
