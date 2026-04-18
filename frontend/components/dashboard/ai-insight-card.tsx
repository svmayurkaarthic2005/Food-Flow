import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIInsightCardProps {
  title: string
  description: string
  insights: Array<{
    label: string
    value: string
    highlight?: boolean
  }>
  actionLabel?: string
  onAction?: () => void
  variant?: 'default' | 'urgent' | 'success'
}

export function AIInsightCard({
  title,
  description,
  insights,
  actionLabel,
  onAction,
  variant = 'default',
}: AIInsightCardProps) {
  const variantClasses = {
    default: 'border-primary/20 bg-primary/5',
    urgent: 'border-urgent/20 bg-urgent/5',
    success: 'border-success/20 bg-success/5',
  }

  const titleClasses = {
    default: 'text-primary',
    urgent: 'text-urgent',
    success: 'text-success',
  }

  return (
    <Card className={cn('border', variantClasses[variant])}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', {
            'bg-primary/10': variant === 'default',
            'bg-urgent/10': variant === 'urgent',
            'bg-success/10': variant === 'success',
          })}>
            <Lightbulb className={cn('w-5 h-5', titleClasses[variant])} />
          </div>
          <div className="flex-1">
            <CardTitle className={cn('text-lg', titleClasses[variant])}>
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insights Grid */}
        <div className="space-y-2">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                insight.highlight
                  ? 'bg-primary/10 border border-primary/20'
                  : 'bg-secondary/30'
              )}
            >
              <span className="text-sm font-medium text-foreground">
                {insight.label}
              </span>
              <span className={cn(
                'text-sm font-bold',
                insight.highlight ? 'text-primary' : 'text-foreground'
              )}>
                {insight.value}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {actionLabel && (
          <Button
            onClick={onAction}
            className="w-full justify-between"
            variant={variant === 'default' ? 'default' : 'outline'}
          >
            {actionLabel}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
