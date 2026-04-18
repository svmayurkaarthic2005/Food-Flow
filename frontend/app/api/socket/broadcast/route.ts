import { NextRequest, NextResponse } from 'next/server';
import { getIO } from '../route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { delivery_id, lat, lng, speed, timestamp } = body;

    if (!delivery_id || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'delivery_id, lat, and lng are required' },
        { status: 400 }
      );
    }

    const io = getIO();
    
    if (!io) {
      // WebSocket not available, but that's okay - polling will work
      return NextResponse.json({ 
        success: true, 
        broadcast: false,
        message: 'WebSocket not available, using polling fallback'
      });
    }

    // Broadcast to all clients subscribed to this delivery
    io.to(`tracking:${delivery_id}`).emit('location_update', {
      delivery_id,
      lat,
      lng,
      speed,
      timestamp: timestamp || new Date().toISOString(),
    });

    console.log(`Broadcasted location update for delivery ${delivery_id} to room tracking:${delivery_id}`);

    return NextResponse.json({ 
      success: true, 
      broadcast: true,
      clients: io.sockets.adapter.rooms.get(`tracking:${delivery_id}`)?.size || 0
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast', success: true, broadcast: false },
      { status: 200 } // Return 200 so driver API doesn't fail
    );
  }
}
