import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-nextauth';
import { prisma } from '@/lib/prisma';

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface DriverScore {
  driverId: string;
  score: number;
  reasons: string[];
  distance: number;
  activeDeliveries: number;
  totalDeliveries: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get('claimId');

    if (!claimId) {
      return NextResponse.json({ error: 'claimId is required' }, { status: 400 });
    }

    // Get claim with location data
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        listing: {
          select: {
            latitude: true,
            longitude: true,
            address: true,
          },
        },
        ngo: {
          select: {
            latitude: true,
            longitude: true,
            address: true,
          },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Get all drivers
    const drivers = await prisma.user.findMany({
      where: { role: 'DRIVER' },
      select: {
        id: true,
        name: true,
        email: true,
        deliveries: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            currentLatitude: true,
            currentLongitude: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1, // Get most recent delivery for location
        },
      },
    });

    // Calculate ML scores for each driver
    const driverScores: DriverScore[] = drivers.map((driver: any) => {
      const reasons: string[] = [];
      let score = 0;

      // Factor 1: Active deliveries (lower is better)
      const activeDeliveries = driver.deliveries.filter(
        (d: any) => d.status === 'IN_TRANSIT' || d.status === 'PENDING'
      ).length;
      
      if (activeDeliveries === 0) {
        score += 0.4;
        reasons.push('No active deliveries - fully available');
      } else if (activeDeliveries === 1) {
        score += 0.2;
        reasons.push('Only 1 active delivery');
      } else {
        score += 0.05;
        reasons.push(`${activeDeliveries} active deliveries - may be busy`);
      }

      // Factor 2: Total experience (more is better, but with diminishing returns)
      const totalDeliveries = driver.deliveries.length;
      const experienceScore = Math.min(totalDeliveries / 50, 1) * 0.2;
      score += experienceScore;
      
      if (totalDeliveries > 20) {
        reasons.push(`Experienced driver (${totalDeliveries} total deliveries)`);
      } else if (totalDeliveries > 5) {
        reasons.push(`Moderate experience (${totalDeliveries} deliveries)`);
      } else {
        reasons.push(`New driver (${totalDeliveries} deliveries)`);
      }

      // Factor 3: Recent activity (active in last 7 days is better)
      const recentDeliveries = driver.deliveries.filter(
        (d: any) => new Date(d.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      if (recentDeliveries > 0) {
        score += 0.15;
        reasons.push('Active in the last week');
      }

      // Factor 4: Proximity to pickup location (closer is better)
      let distance = 0;
      let distanceScore = 0;
      
      // Try to get driver's last known location from most recent delivery
      const lastDelivery = driver.deliveries[0];
      if (lastDelivery?.currentLatitude && lastDelivery?.currentLongitude) {
        // Calculate distance from driver's last location to pickup
        distance = calculateDistance(
          lastDelivery.currentLatitude,
          lastDelivery.currentLongitude,
          claim.listing.latitude,
          claim.listing.longitude
        );
        
        // Score based on distance (closer = better)
        // 0-5 km: full score (0.25)
        // 5-15 km: medium score (0.15)
        // 15-30 km: low score (0.05)
        // 30+ km: minimal score (0.01)
        if (distance <= 5) {
          distanceScore = 0.25;
          reasons.push(`Very close to pickup (${distance.toFixed(1)} km)`);
        } else if (distance <= 15) {
          distanceScore = 0.15;
          reasons.push(`Nearby pickup location (${distance.toFixed(1)} km)`);
        } else if (distance <= 30) {
          distanceScore = 0.05;
          reasons.push(`Moderate distance to pickup (${distance.toFixed(1)} km)`);
        } else {
          distanceScore = 0.01;
          reasons.push(`Far from pickup (${distance.toFixed(1)} km)`);
        }
      } else {
        // No location data - give average score
        distanceScore = 0.125; // Half of max proximity score
        reasons.push('Location unknown - estimated proximity');
      }
      
      score += distanceScore;

      // Normalize score to 0-1 range
      const normalizedScore = Math.min(score, 1);

      return {
        driverId: driver.id,
        score: normalizedScore,
        reasons,
        distance,
        activeDeliveries,
        totalDeliveries,
      };
    });

    // Sort by score (highest first)
    driverScores.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      recommendations: driverScores.map((ds) => ({
        driverId: ds.driverId,
        score: ds.score,
        reasons: ds.reasons,
      })),
      details: driverScores,
    });
  } catch (error) {
    console.error('Error getting driver recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
