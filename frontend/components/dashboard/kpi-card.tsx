import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  trend?: number
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'urgent' | 'logistics'
  subValue?: string
}

export function KPICard({
  title,
  value,
  description,
  trend,
  icon,
  variant = 'default',
  subValue,
}: KPICardProps) {
  const variantClasses = {
    default: 'border-border',
    success: 'border-l-4 border-l-success',
    urgent: 'border-l-4 border-l-urgent',
    logistics: 'border-l-4 border-l-logistics',
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-success" />
    if (value < 0) return <TrendingDown className="w-4 h-4 text-destructive" />
    return <Minus className="w-4 h-4 text-muted-foreground" />
  }

  return (
    <Card className={cn('bg-card', variantClasses[variant])}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardDescription className="text-xs font-medium text-muted-foreground mb-1">
              {title}
            </CardDescription>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{value}</span>
              {subValue && (
                <span className="text-sm text-muted-foreground">{subValue}</span>
              )}
            </div>
          </div>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {(description || trend !== undefined) && (
          <div className="flex items-center gap-2">
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
            {trend !== undefined && (
              <div className="flex items-center gap-1 text-xs font-semibold">
                {getTrendIcon(trend)}
                <span className={trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
