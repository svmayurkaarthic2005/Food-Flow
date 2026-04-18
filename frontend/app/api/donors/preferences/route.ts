import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-nextauth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const response = await fetch(`${BACKEND_URL}/api/donors/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Return default preferences if not found
      return Response.json({
        emailUpdates: true,
        claimAlerts: true,
        pickupReminders: true,
      });
    }

    const data = await response.json();
    return Response.json(data.preferences || {
      emailUpdates: true,
      claimAlerts: true,
      pickupReminders: true,
    });
  } catch (error) {
    console.error('Preferences fetch error:', error);
    // Return default preferences on error
    return Response.json({
      emailUpdates: true,
      claimAlerts: true,
      pickupReminders: true,
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

    const response = await fetch(`${BACKEND_URL}/api/donors/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences: body }),
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json(error, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data.preferences || body);
  } catch (error) {
    console.error('Preferences update error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
