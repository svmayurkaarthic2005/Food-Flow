import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-nextauth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const ngo = await prisma.ngo.findUnique({
      where: { userId },
    });

    if (!ngo) {
      // Return default preferences if not found
      return Response.json({
        emailNotifications: true,
        listingAlerts: true,
        pickupNotifications: true,
      });
    }

    // Handle preferences - may not exist if schema not migrated yet
    const preferences = (ngo as any).preferences || {
      emailNotifications: true,
      listingAlerts: true,
      pickupNotifications: true,
    };

    return Response.json(preferences);
  } catch (error) {
    console.error('Preferences fetch error:', error);
    // Return default preferences on error
    return Response.json({
      emailNotifications: true,
      listingAlerts: true,
      pickupNotifications: true,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userId = (session.user as any).id;

    const ngo = await prisma.ngo.findUnique({
      where: { userId },
    });

    if (!ngo) {
      return Response.json({ error: 'NGO profile not found' }, { status: 404 });
    }

    // Update preferences - handle if field doesn't exist yet
    const updated = await prisma.ngo.update(
      {
        where: { id: ngo.id },
        data: { preferences: body } as any,
      }
    );

    const preferences = (updated as any).preferences || body;
    return Response.json(preferences);
  } catch (error) {
    console.error('Preferences update error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
