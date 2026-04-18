export type UrgencyLevel = 'critical' | 'medium' | 'fresh'

export function getUrgency(expiryTime: Date | string): UrgencyLevel {
  const expiry = new Date(expiryTime)
  const now = new Date()
  const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursLeft < 3) return 'critical'
  if (hoursLeft < 8) return 'medium'
  return 'fresh'
}

export function getUrgencyColor(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'critical':
      return '#ef4444' // Red
    case 'medium':
      return '#eab308' // Amber
    case 'fresh':
      return '#22c55e' // Green
  }
}

export function getHoursLeft(expiryTime: Date | string): number {
  const expiry = new Date(expiryTime)
  const now = new Date()
  return Math.max(0, Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60) * 10) / 10)
}
