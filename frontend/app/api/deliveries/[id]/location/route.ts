import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-nextauth';
import prisma from '@/lib/prisma';

// POST - Driver updates their location
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deliveryId = params.id;
    const body = await request.json();
    const { latitude, longitude, speed, heading, accuracy } = body;

    // Validate required fields
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Get delivery and verify driver
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { driver: true },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Check if user is the driver or admin
    const isDriver = user?.id === delivery.driverId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isDriver && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create location update
    const locationUpdate = await prisma.locationUpdate.create({
      data: {
        deliveryId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        accuracy: accuracy ? parseFloat(accuracy) : null,
      },
    });

    // Update delivery current location
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        currentLatitude: parseFloat(latitude),
        currentLongitude: parseFloat(longitude),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      locationUpdate,
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
