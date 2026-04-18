/**
 * Priority Badge Component
 * Displays priority level with color coding
 */
import { getPriorityColor } from '@/utils/ml-helpers';

interface PriorityBadgeProps {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  className?: string;
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const colors = getPriorityColor(priority);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {priority}
    </span>
  );
}
