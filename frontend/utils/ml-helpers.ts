/**
 * Utility functions for ML components
 */

/**
 * Get color for score badge
 */
export function getScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 60) {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
    };
  } else if (score >= 40) {
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-300',
    };
  } else {
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
    };
  }
}

/**
 * Get priority badge colors
 */
export function getPriorityColor(priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): {
  bg: string;
  text: string;
  border: string;
} {
  switch (priority) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-300',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-300',
      };
    case 'LOW':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
      };
  }
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Format ETA for display
 */
export function formatETA(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

/**
 * Get confidence message for score
 */
export function getConfidenceMessage(score: number): string | null {
  if (score < 40) {
    return 'Low confidence - consider alternative options';
  } else if (score < 60) {
    return 'Moderate confidence';
  }
  return null;
}
