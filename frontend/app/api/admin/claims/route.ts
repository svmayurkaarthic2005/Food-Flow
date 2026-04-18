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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const noDelivery = searchParams.get('noDelivery') === 'true';

    // Build query
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    // Get claims
    const claims = await prisma.claim.findMany({
      where,
      include: {
        listing: {
          include: {
            donor: true,
          },
        },
        ngo: true,
        delivery: true,
      },
      orderBy: {
        claimedAt: 'desc',
      },
    });

    // Filter out claims that already have deliveries if requested
    const filteredClaims = noDelivery
      ? claims.filter((claim) => !claim.delivery)
      : claims;

    return NextResponse.json({ claims: filteredClaims });
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
