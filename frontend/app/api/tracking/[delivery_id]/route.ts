import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch tracking data (fallback polling)
export async function GET(
  request: NextRequest,
  { params }: { params: { delivery_id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deliveryId = params.delivery_id;

    // Get delivery with related data
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        claim: {
          include: {
            listing: {
              include: { donor: true },
            },
            ngo: true,
          },
        },
        driver: true,
        ngo: true,
        locationUpdates: {
          orderBy: { timestamp: 'desc' },
          take: 10, // Last 10 points for route line
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { ngoProfile: true, adminProfile: true },
    });

    const isNGOStaff = user?.ngoProfile?.id === delivery.ngoId;
    const isDriver = user?.id === delivery.driverId;
    const isAdmin = !!user?.adminProfile;

    if (!isNGOStaff && !isDriver && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get latest location
    const latestLocation = delivery.locationUpdates[0] || null;

    // Calculate distance and ETA
    let distanceKm = null;
    let etaMinutes = null;

    if (latestLocation && delivery.ngo) {
      distanceKm = calculateDistance(
        latestLocation.latitude,
        latestLocation.longitude,
        delivery.ngo.latitude,
        delivery.ngo.longitude
      );

      // Calculate ETA
      const speed = latestLocation.speed || 30; // Default 30 km/h
      etaMinutes = (distanceKm / speed) * 60;
    }

    return NextResponse.json({
      delivery: {
        id: delivery.id,
        status: delivery.status,
        startedAt: delivery.startedAt,
        completedAt: delivery.completedAt,
        estimatedArrival: delivery.estimatedArrival,
      },
      current_location: latestLocation
        ? {
            lat: latestLocation.latitude,
            lng: latestLocation.longitude,
            speed: latestLocation.speed,
            heading: latestLocation.heading,
            timestamp: latestLocation.timestamp,
          }
        : null,
      route_points: delivery.locationUpdates.map((loc) => ({
        lat: loc.latitude,
        lng: loc.longitude,
        timestamp: loc.timestamp,
      })),
      pickup: {
        name: delivery.claim.listing.name,
        address: delivery.claim.listing.address,
        lat: delivery.claim.listing.latitude,
        lng: delivery.claim.listing.longitude,
        donor: delivery.claim.listing.donor.businessName,
      },
      destination: {
        name: delivery.ngo.organizationName,
        address: delivery.ngo.address,
        lat: delivery.ngo.latitude,
        lng: delivery.ngo.longitude,
      },
      driver: {
        name: delivery.driver.name,
        email: delivery.driver.email,
      },
      distance_km: distanceKm,
      eta_minutes: etaMinutes,
    });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Haversine formula for distance calculation
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
