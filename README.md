# FoodFlow - Food Donation Platform

A comprehensive platform connecting food donors with NGOs for efficient food distribution.

## Project Structure

```
foodflow/
├── frontend/          # Next.js frontend application
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions
│   ├── public/       # Static assets
│   ├── styles/       # Global styles
│   └── package.json
├── backend/          # Backend API (to be created)
│   ├── api/          # API routes
│   ├── lib/          # Backend utilities
│   ├── prisma/       # Database schema
│   └── package.json
├── .kiro/            # Kiro specifications
│   └── specs/        # Feature specifications
└── package.json      # Root workspace configuration
```

## Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **Redis** (v6 or higher)

### Installation

```bash
# Install dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database and Redis credentials

# Set up database
npm run prisma:generate
npm run prisma:migrate
npm run db:seed

# Start Redis (if not running)
redis-server

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Quick Test

Test Redis integration:
```bash
# Visit in browser
http://localhost:3000/api/test-redis
```

## Features

- **Donor Portal**: Create and manage food listings
- **NGO Portal**: Browse and claim food donations
- **Admin Dashboard**: Monitor platform activity and analytics
- **Real-time Tracking**: Track deliveries with live location updates
- **Google Maps Integration**: Visualize donations and delivery routes
- **Role-based Access Control**: Secure access for different user types
- **Redis Caching**: High-performance API caching (50-90% faster)
- **Rate Limiting**: IP-based rate limiting for security
- **Real-time Events**: Pub/Sub system for notifications

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI Components
- React Hook Form
- Zod Validation

### Backend
- Next.js API Routes
- PostgreSQL with Prisma ORM
- JWT Authentication
- Redis (Caching & Real-time)
- Google Maps API
- ioredis for Redis integration

## Documentation

- [Setup Guide](./SETUP.md)
- [Admin Credentials](./ADMIN_CREDENTIALS.md)
- [Redis Integration](./REDIS_SETUP.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Production Upgrade Spec](./.kiro/specs/foodflow-production-upgrade/)

## Development

### Scripts

```bash
# Frontend
npm run dev              # Start frontend dev server
npm run build            # Build frontend
npm run start            # Start frontend production server
npm run lint             # Lint frontend code

# Backend (when available)
npm run backend:dev      # Start backend dev server
npm run backend:build    # Build backend
```

## License

Private project - All rights reserved
