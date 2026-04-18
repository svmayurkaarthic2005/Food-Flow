// WebSocket server for real-time tracking
// This runs alongside Next.js server

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: SocketIOServer;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends Response {
  socket: SocketWithIO;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export function initializeWebSocket(server: HTTPServer) {
  if ((server as SocketServer).io) {
    console.log('WebSocket server already initialized');
    return (server as SocketServer).io;
  }

  const io = new SocketIOServer(server, {
    path: '/api/socket',
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

  (server as SocketServer).io = io;
  console.log('WebSocket server initialized');
  return io;
}

export function getIO(server: HTTPServer): SocketIOServer | undefined {
  return (server as SocketServer).io;
}

// Broadcast location update to all subscribers
export function broadcastLocationUpdate(
  io: SocketIOServer,
  deliveryId: string,
  locationData: {
    lat: number;
    lng: number;
    speed: number | null;
    timestamp: Date;
  }
) {
  io.to(`tracking:${deliveryId}`).emit('location_update', {
    delivery_id: deliveryId,
    ...locationData,
  });
  console.log(`Broadcasted location update for delivery ${deliveryId}`);
}
