import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-nextauth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userId = (session.user as any).id;

    const response = await fetch(`${BACKEND_URL}/api/donors/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locationSharing: body.locationSharing }),
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json(error, { status: response.status });
    }

    const data = await response.json();
    return Response.json({ locationSharing: data.locationSharing });
  } catch (error) {
    console.error('Location sharing update error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
