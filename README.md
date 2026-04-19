# FoodFlow - Food Donation Platform

A comprehensive full-stack platform connecting food donors with NGOs for efficient food distribution and real-time delivery tracking.

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Documentation](#documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

FoodFlow is a full-stack food redistribution platform that bridges the gap between food donors and non-profit organizations. The platform enables:

- **Donors** to post available food items for donation
- **NGOs** to discover and claim food donations
- **Drivers** to manage real-time delivery tracking with GPS
- **Admins** to monitor platform activity and analytics

The system is built with a modern tech stack featuring Next.js frontend, FastAPI backend, PostgreSQL database, and real-time capabilities.

## 📁 Project Structure

```
FoodFlow/
├── frontend/                    # Next.js 14 frontend application
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes (auth, listings, claims, etc.)
│   │   ├── donor/             # Donor dashboard pages
│   │   ├── ngo/               # NGO dashboard pages
│   │   ├── driver/            # Driver dashboard pages
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── auth/              # Authentication pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable React components
│   │   ├── layout/           # Layout components
│   │   ├── ratings/          # Rating system components
│   │   └── ml/               # ML visualization components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and helpers
│   ├── public/               # Static assets
│   ├── styles/               # Global styles
│   ├── prisma/               # Database schema
│   └── package.json
│
├── backend/                    # FastAPI backend application
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/       # API endpoint handlers
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── listings.py
│   │   │       ├── claims.py
│   │   │       ├── donors.py
│   │   │       ├── ngos.py
│   │   │       ├── analytics.py
│   │   │       ├── notifications.py
│   │   │       └── email_verification.py
│   │   ├── core/             # Core utilities
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── oauth.py
│   │   │   └── email.py
│   │   ├── db/               # Database layer
│   │   │   └── database.py
│   │   ├── services/         # Business logic services
│   │   │   ├── email_service.py
│   │   │   ├── email_queue.py
│   │   │   ├── token_service.py
│   │   │   └── alert_service.py
│   │   ├── jobs/             # Background jobs
│   │   │   └── nightly.py
│   │   ├── ml/               # Machine learning (Python 3.11 only)
│   │   │   ├── services/
│   │   │   ├── schemas/
│   │   │   └── router.py
│   │   └── templates/        # Email templates
│   ├── tests/                # Test suite
│   ├── scripts/              # Utility scripts
│   ├── prisma/               # Database schema
│   ├── main.py               # Application entry point
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment variables
│   └── README.md             # Backend documentation
│
├── .kiro/                      # Kiro specifications
│   └── specs/                # Feature specifications
│
├── README.md                   # This file
├── package.json              # Root workspace configuration
└── .gitignore
```

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI)
- **Forms**: React Hook Form + Zod validation
- **Authentication**: NextAuth.js
- **State Management**: React Context API
- **Maps**: Google Maps API
- **Real-time**: WebSocket support

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with python-jose
- **Email**: Brevo SMTP service
- **Task Scheduling**: APScheduler
- **Async**: AsyncIO with Uvicorn
- **ML** (Python 3.11 only): Pandas, NumPy, Scikit-learn

### Infrastructure
- **Database**: PostgreSQL 12+
- **Cache**: Redis 6+
- **Email**: Brevo SMTP
- **Deployment**: Docker-ready

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Python** (3.11 or higher for full ML features, 3.14 for core app)
3. **PostgreSQL** (v12 or higher)
4. **Redis** (v6 or higher)
5. **Git**

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure .env.local with:
# - Database URL
# - NextAuth credentials
# - Google OAuth credentials
# - Backend API URL

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate dev

# Seed database (optional)
npm run prisma:db seed

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Configure .env with:
# - DATABASE_URL
# - SMTP credentials
# - JWT secret key
# - Frontend URL

# Generate Prisma client
python -m prisma generate

# Start development server
python -m uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

## ✨ Features

### Donor Features
- Create and manage food listings
- Track donation history
- View delivery status in real-time
- Receive notifications on claim status
- Rate NGOs and drivers
- Dashboard with analytics

### NGO Features
- Browse available food listings
- Claim food donations
- Manage claimed items
- Track deliveries in real-time
- Rate donors and drivers
- Preferences and settings management

### Driver Features
- View assigned deliveries
- Real-time GPS tracking
- Update delivery status
- View route optimization
- Manage profile and settings
- Track delivery history

### Admin Features
- Monitor all platform activity
- View analytics and reports
- Manage users and roles
- System configuration
- Performance metrics

### Platform Features
- **Email Verification**: Secure signup with email verification
- **Real-time Tracking**: Live GPS tracking for deliveries
- **Notifications**: Email and in-app notifications
- **Analytics**: Comprehensive dashboard metrics
- **OAuth Integration**: Google OAuth support
- **Role-based Access**: Secure access control
- **Background Jobs**: Nightly data processing
- **Responsive Design**: Mobile-friendly interface

## 🏗 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                        │
│              Donor | NGO | Driver | Admin Dashboards           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Authentication | Listings | Claims | Tracking | Analytics│  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────┐      ┌────────┐      ┌──────────┐
    │PostgreSQL│      │Redis  │      │Email     │
    │Database  │      │Cache  │      │Service   │
    └────────┘      └────────┘      └──────────┘
```

### Request Flow

1. **Client Request** → Frontend sends HTTP request to backend
2. **Authentication** → JWT token validation
3. **Validation** → Pydantic schema validation
4. **Processing** → Business logic execution
5. **Database** → Prisma ORM queries
6. **Response** → JSON response to client

## 📚 Documentation

### Quick References
- [Backend README](./backend/README.md) - Complete backend documentation with diagrams
- [API Documentation](./API.md) - API endpoints and usage
- [Application Architecture](./APPLICATION_ARCHITECTURE_VISUAL.txt) - Visual system diagrams
- [How Application Works](./HOW_APPLICATION_WORKS.md) - Detailed workflow explanation

### Setup Guides
- [Backend Startup Guide](./BACKEND_STARTUP_GUIDE.md)
- [Quick Start Guide](./QUICK_START_GUIDE.txt)
- [Email Verification Setup](./START_HERE_EMAIL_VERIFICATION.txt)

### Feature Documentation
- [Delivery Tracking Guide](./DELIVERY_TRACKING_COMPLETE_GUIDE.md)
- [Donor Tracking Features](./DONOR_TRACKING_FEATURES_SUMMARY.txt)
- [Driver Dashboard Guide](./DRIVER_DASHBOARD_SUMMARY.md)

### Troubleshooting
- [Backend Issues](./BACKEND_START_ISSUE_SUMMARY.txt)
- [Python 3.14 Compatibility](./PYTHON_314_COMPATIBILITY_ISSUE.md)
- [Email Verification Issues](./EMAIL_VERIFICATION_FIX.md)

## 💻 Development

### Available Scripts

```bash
# Frontend
npm run dev              # Start frontend dev server
npm run build            # Build frontend for production
npm run start            # Start frontend production server
npm run lint             # Lint frontend code
npm run type-check       # TypeScript type checking

# Backend
python -m uvicorn main:app --reload --port 8000  # Dev server
python -m pytest                                  # Run tests
python -m prisma generate                        # Generate Prisma client
python -m prisma migrate dev                     # Create migration
```

### Code Quality

- **Frontend**: ESLint, Prettier, TypeScript
- **Backend**: Pylint, Black, Type hints
- **Testing**: Jest (frontend), Pytest (backend)

## 🚢 Deployment

### Frontend Deployment
- Vercel (recommended)
- Netlify
- AWS Amplify
- Docker

### Backend Deployment
- Heroku
- AWS EC2
- DigitalOcean
- Docker + Kubernetes

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📝 License

Private project - All rights reserved

## 📞 Support

For issues and questions:
1. Check the [documentation](./backend/README.md)
2. Review [troubleshooting guides](./BACKEND_START_ISSUE_SUMMARY.txt)
3. Open an issue on GitHub

---

**Last Updated**: April 2026
**Version**: 1.0.0
**Status**: Production Ready
