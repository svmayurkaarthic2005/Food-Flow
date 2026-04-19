import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-nextauth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { ngoProfile: true },
    });

    if (!user?.ngoProfile) {
      return NextResponse.json({ error: 'Not an NGO' }, { status: 403 });
    }

    // Get all deliveries for this NGO
    const deliveries = await prisma.delivery.findMany({
      where: { ngoId: user.ngoProfile.id },
      include: {
        claim: {
          include: {
            listing: {
              include: { donor: true },
            },
          },
        },
        driver: true,
        locationUpdates: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      deliveries: deliveries.map((d) => ({
        id: d.id,
        status: d.status,
        itemName: d.claim.listing.name,
        donorName: d.claim.listing.donor.businessName,
        driverName: d.driver.name,
        estimatedArrival: d.estimatedArrival,
        currentLocation: d.locationUpdates[0]
          ? {
              latitude: d.locationUpdates[0].latitude,
              longitude: d.locationUpdates[0].longitude,
              timestamp: d.locationUpdates[0].timestamp,
            }
          : null,
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
