'use client'

import { Card } from '@/components/ui/card'
import { CheckCircle2, Package, Users, AlertCircle } from 'lucide-react'

interface TimelineEvent {
  id: string
  title: string
  timestamp: Date | string
  type: 'claim' | 'listing' | 'completed' | 'alert'
  description?: string
}

interface ActivityTimelineProps {
  events: TimelineEvent[]
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'claim':
        return <Users className="w-5 h-5 text-blue-600" />
      case 'listing':
        return <Package className="w-5 h-5 text-green-600" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-amber-600" />
      default:
        return <Package className="w-5 h-5 text-gray-600" />
    }
  }

  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  if (events.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No recent activity</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          {/* Timeline line and icon */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
              {getIcon(event.type)}
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-12 bg-gray-200 mt-2" />
            )}
          </div>

          {/* Event content */}
          <div className="flex-1 pt-1">
            <p className="font-medium text-foreground">{event.title}</p>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {formatTime(event.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
