import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-nextauth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userId = (session.user as any).id;

    // Get NGO by user ID
    const ngo = await prisma.ngo.findUnique({
      where: { userId },
    });

    if (!ngo) {
      return Response.json({ error: 'NGO profile not found' }, { status: 404 });
    }

    // Update NGO profile
    const updated = await prisma.ngo.update(
      {
        where: { id: ngo.id },
        data: {
          organizationName: body.organizationName || ngo.organizationName,
          phone: body.phone || ngo.phone,
          address: body.address || ngo.address,
          storageCapacity: body.storageCapacity || ngo.storageCapacity,
        },
      }
    );

    return Response.json(updated);
  } catch (error) {
    console.error('Profile update error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      return Response.json({ error: 'NGO profile not found' }, { status: 404 });
    }

    return Response.json(ngo);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
