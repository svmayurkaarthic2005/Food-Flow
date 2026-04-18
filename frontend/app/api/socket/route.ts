import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

// Global WebSocket server instance
let io: SocketIOServer | null = null;

export async function GET(request: NextRequest) {
  if (!io) {
    return NextResponse.json({ 
      error: 'WebSocket server not initialized',
      message: 'WebSocket will be initialized on first connection'
    }, { status: 503 });
  }

  return NextResponse.json({ 
    status: 'connected',
    clients: io.engine.clientsCount 
  });
}

// Initialize WebSocket server
export function initializeSocketIO(server: HTTPServer) {
  if (io) {
    console.log('Socket.IO already initialized');
    return io;
  }

  io = new SocketIOServer(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Subscribe to delivery tracking
    socket.on('subscribe_tracking', (deliveryId: string) => {
      console.log(`Client ${socket.id} subscribed to delivery ${deliveryId}`);
      socket.join(`tracking:${deliveryId}`);
      socket.emit('subscribed', { deliveryId });
    });

    // Unsubscribe from delivery tracking
    socket.on('unsubscribe_tracking', (deliveryId: string) => {
      console.log(`Client ${socket.id} unsubscribed from delivery ${deliveryId}`);
      socket.leave(`tracking:${deliveryId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('Socket.IO server initialized on path /api/socketio');
  return io;
}

// Get the global IO instance
export function getIO(): SocketIOServer | null {
  return io;
}
