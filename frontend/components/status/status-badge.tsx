import { cn } from '@/lib/utils'
import { Clock, CheckCircle2, AlertCircle, Truck, Zap } from 'lucide-react'

export type StatusType = 'unclaimed' | 'matched' | 'claimed' | 'picked-up' | 'completed'
export type UrgencyType = 'critical' | 'urgent' | 'normal'

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

interface UrgencyBadgeProps {
  urgency: UrgencyType
  hoursLeft?: number
  className?: string
}

const statusConfig = {
  unclaimed: {
    label: 'Unclaimed',
    icon: <Clock className="w-3.5 h-3.5" />,
    className: 'bg-secondary/50 text-foreground border border-border',
  },
  matched: {
    label: 'Matched',
    icon: <Zap className="w-3.5 h-3.5" />,
    className: 'bg-logistics/20 text-logistics border border-logistics/30',
  },
  claimed: {
    label: 'Claimed',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    className: 'bg-urgent/20 text-urgent border border-urgent/30',
  },
  'picked-up': {
    label: 'Picked Up',
    icon: <Truck className="w-3.5 h-3.5" />,
    className: 'bg-primary/20 text-primary border border-primary/30',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: 'bg-success/20 text-success border border-success/30',
  },
}

const urgencyConfig = {
  critical: {
    label: 'Critical',
    className: 'bg-destructive text-destructive-foreground',
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-urgent text-urgent-foreground',
  },
  normal: {
    label: 'Fresh',
    className: 'bg-success/20 text-success border border-success/30',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unclaimed

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </div>
  )
}

export function UrgencyBadge({ urgency, hoursLeft, className }: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency] || urgencyConfig.normal

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <Zap className="w-3.5 h-3.5" />
      {config.label}
      {hoursLeft && <span className="text-xs opacity-90">({hoursLeft}h)</span>}
    </div>
  )
}
