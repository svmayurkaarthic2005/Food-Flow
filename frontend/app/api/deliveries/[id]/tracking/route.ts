import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deliveryId = params.id;

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
          take: 1,
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Check authorization - NGO staff, admin, or driver
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

    // Get all location updates for route
    const locationUpdates = await prisma.locationUpdate.findMany({
      where: { deliveryId },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({
      delivery: {
        id: delivery.id,
        status: delivery.status,
        startedAt: delivery.startedAt,
        completedAt: delivery.completedAt,
        estimatedArrival: delivery.estimatedArrival,
        currentLocation: delivery.locationUpdates[0]
          ? {
              latitude: delivery.locationUpdates[0].latitude,
              longitude: delivery.locationUpdates[0].longitude,
              speed: delivery.locationUpdates[0].speed,
              heading: delivery.locationUpdates[0].heading,
              timestamp: delivery.locationUpdates[0].timestamp,
            }
          : null,
      },
      claim: {
        id: delivery.claim.id,
        listing: {
          id: delivery.claim.listing.id,
          name: delivery.claim.listing.name,
          address: delivery.claim.listing.address,
          latitude: delivery.claim.listing.latitude,
          longitude: delivery.claim.listing.longitude,
          donor: {
            businessName: delivery.claim.listing.donor.businessName,
            address: delivery.claim.listing.donor.address,
          },
        },
      },
      ngo: {
        id: delivery.ngo.id,
        organizationName: delivery.ngo.organizationName,
        address: delivery.ngo.address,
        latitude: delivery.ngo.latitude,
        longitude: delivery.ngo.longitude,
      },
      driver: {
        name: delivery.driver.name,
        email: delivery.driver.email,
      },
      locationHistory: locationUpdates,
    });
  } catch (error) {
    console.error('Error fetching delivery tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
