import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Forbidden - Driver access only' }, { status: 403 });
    }

    // Get deliveries for this driver
    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId: user.id,
      },
      include: {
        claim: {
          include: {
            listing: {
              include: {
                donor: true,
              },
            },
            ngo: true,
          },
        },
        ngo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedDeliveries = deliveries.map((delivery) => ({
      id: delivery.id,
      status: delivery.status,
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
      createdAt: delivery.createdAt,
      startedAt: delivery.startedAt,
      completedAt: delivery.completedAt,
    }));

    return NextResponse.json({ deliveries: formattedDeliveries });
  } catch (error) {
    console.error('Error fetching driver deliveries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
