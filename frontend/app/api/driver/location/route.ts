import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { delivery_id, lat, lng, speed } = body;

    // Validate required fields
    if (!delivery_id || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'delivery_id, lat, and lng are required' },
        { status: 400 }
      );
    }

    // Get delivery and verify driver
    const delivery = await prisma.delivery.findUnique({
      where: { id: delivery_id },
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

    // Keep only last 100 location updates per delivery
    const locationCount = await prisma.locationUpdate.count({
      where: { deliveryId: delivery_id },
    });

    if (locationCount >= 100) {
      // Delete oldest records
      const oldestRecords = await prisma.locationUpdate.findMany({
        where: { deliveryId: delivery_id },
        orderBy: { timestamp: 'asc' },
        take: locationCount - 99,
        select: { id: true },
      });

      await prisma.locationUpdate.deleteMany({
        where: {
          id: { in: oldestRecords.map((r: { id: string }) => r.id) },
        },
      });
    }

    // Create location update
    const locationUpdate = await prisma.locationUpdate.create({
      data: {
        deliveryId: delivery_id,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        speed: speed ? parseFloat(speed) : null,
        timestamp: new Date(),
      },
    });

    // Update delivery current location
    await prisma.delivery.update({
      where: { id: delivery_id },
      data: {
        currentLatitude: parseFloat(lat),
        currentLongitude: parseFloat(lng),
        updatedAt: new Date(),
      },
    });

    // Broadcast to WebSocket clients (if available)
    try {
      const broadcastData = {
        lat: locationUpdate.latitude,
        lng: locationUpdate.longitude,
        speed: locationUpdate.speed,
        timestamp: locationUpdate.timestamp,
      };
      
      // Trigger broadcast via internal API
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/socket/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_id,
          ...broadcastData,
        }),
      }).catch(err => console.error('Broadcast error:', err));
    } catch (err) {
      console.error('WebSocket broadcast failed:', err);
    }

    return NextResponse.json({
      success: true,
      location: {
        id: locationUpdate.id,
        lat: locationUpdate.latitude,
        lng: locationUpdate.longitude,
        speed: locationUpdate.speed,
        timestamp: locationUpdate.timestamp,
      },
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
