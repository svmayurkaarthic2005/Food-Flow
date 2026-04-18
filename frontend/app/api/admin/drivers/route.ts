import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-nextauth';
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
    }

    // Get all drivers with their delivery stats
    const drivers = await prisma.user.findMany({
      where: { role: 'DRIVER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        deliveries: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const driversWithStats = drivers.map((driver: any) => {
      const activeDeliveries = driver.deliveries.filter(
        (d: any) => d.status === 'IN_TRANSIT' || d.status === 'PENDING'
      ).length;

      const completedDeliveries = driver.deliveries.filter(
        (d: any) => d.status === 'DELIVERED'
      ).length;

      return {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        activeDeliveries,
        totalDeliveries: driver.deliveries.length,
        completedDeliveries,
        rating: 0, // Placeholder - implement rating system
        joinedAt: driver.createdAt,
      };
    });

    return NextResponse.json({ drivers: driversWithStats });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
