'use client'

import { Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DonorRatingDisplayProps {
  rating: number
  totalRatings?: number
  foodQuality?: number
  packaging?: number
  timeliness?: number
  communication?: number
}

export function DonorRatingDisplay({
  rating,
  totalRatings = 0,
  foodQuality,
  packaging,
  timeliness,
  communication,
}: DonorRatingDisplayProps) {
  const renderStars = (value: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(value)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Donor Rating</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Rating */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Overall Rating</p>
            <div className="flex items-center gap-2 mt-1">
              {renderStars(rating)}
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
              {totalRatings > 0 && (
                <span className="text-xs text-muted-foreground">({totalRatings} ratings)</span>
              )}
            </div>
          </div>
        </div>

        {/* Category Ratings */}
        {(foodQuality || packaging || timeliness || communication) && (
          <div className="space-y-3 pt-4 border-t">
            {foodQuality && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Food Quality</span>
                {renderStars(foodQuality)}
              </div>
            )}
            {packaging && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Packaging</span>
                {renderStars(packaging)}
              </div>
            )}
            {timeliness && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Timeliness</span>
                {renderStars(timeliness)}
              </div>
            )}
            {communication && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Communication</span>
                {renderStars(communication)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
