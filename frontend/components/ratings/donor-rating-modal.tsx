'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

interface DonorRatingModalProps {
  claimId: string
  donorName: string
  foodType: string
  onClose: () => void
  onSuccess: () => void
}

export function DonorRatingModal({
  claimId,
  donorName,
  foodType,
  onClose,
  onSuccess,
}: DonorRatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [foodQuality, setFoodQuality] = useState(0)
  const [packaging, setPackaging] = useState(0)
  const [timeliness, setTimeliness] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          rating,
          comment: comment || null,
          foodQuality: foodQuality || null,
          packaging: packaging || null,
          timeliness: timeliness || null,
          communication: communication || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit rating')
      }

      toast.success('Rating submitted successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoveredRating || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Rate Donor</CardTitle>
          <CardDescription>
            {donorName} - {foodType}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Overall Rating *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category Ratings */}
          <div className="space-y-4 pt-4 border-t">
            <StarRating value={foodQuality} onChange={setFoodQuality} label="Food Quality" />
            <StarRating value={packaging} onChange={setPackaging} label="Packaging" />
            <StarRating value={timeliness} onChange={setTimeliness} label="Timeliness" />
            <StarRating value={communication} onChange={setCommunication} label="Communication" />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Comments (Optional)</label>
            <Textarea
              placeholder="Share your experience with this donor..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-24"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
