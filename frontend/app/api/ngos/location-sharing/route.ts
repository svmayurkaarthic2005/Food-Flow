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

    const ngo = await prisma.ngo.findUnique({
      where: { userId },
    });

    if (!ngo) {
      return Response.json({ error: 'NGO profile not found' }, { status: 404 });
    }

    const updated = await prisma.ngo.update(
      {
        where: { id: ngo.id },
        data: { locationSharing: body.locationSharing },
      }
    );

    return Response.json({ locationSharing: updated.locationSharing });
  } catch (error) {
    console.error('Location sharing update error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
