import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, UrgencyBadge } from '@/components/status/status-badge'
import { MapPin, Clock, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ListingCardProps {
  id: string
  foodType: string
  quantity: string
  location: string
  expiresIn: number
  status: 'unclaimed' | 'matched' | 'claimed' | 'picked-up' | 'completed'
  urgency: 'critical' | 'urgent' | 'normal'
  donor?: string
  image?: string
  className?: string
  onViewDetails?: () => void
  actionLabel?: string
  onAction?: () => void
}

export function ListingCard({
  id,
  foodType,
  quantity,
  location,
  expiresIn,
  status,
  urgency,
  donor,
  image,
  className,
  onViewDetails,
  actionLabel,
  onAction,
}: ListingCardProps) {
  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow', className)}>
      {/* Image Section */}
      {image && (
        <div className="aspect-video bg-secondary/30 relative overflow-hidden">
          <img
            src={image}
            alt={foodType}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <UrgencyBadge urgency={urgency} hoursLeft={expiresIn} />
          </div>
        </div>
      )}

      <CardContent className={cn('pt-4', image ? '' : 'pt-6')}>
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-foreground text-lg">{foodType}</h3>
              {donor && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {donor}
                </p>
              )}
            </div>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 py-4 border-y border-border">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="text-sm font-semibold text-foreground">{quantity}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Expires in</p>
              <p className="text-sm font-semibold text-foreground">{expiresIn}h</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 mb-4">
          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm font-medium text-foreground">{location}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onViewDetails && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onViewDetails}
            >
              View Details
            </Button>
          )}
          {onAction && actionLabel && (
            <Button
              className="flex-1"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
