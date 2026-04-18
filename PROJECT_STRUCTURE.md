# FoodFlow - Project Structure

## 📋 Overview

FoodFlow is a full-stack food redistribution platform connecting food donors (restaurants, bakeries, groceries) with NGOs to reduce food waste and feed communities.

**Tech Stack:**
- **Frontend**: Next.js 16 (React, TypeScript, Tailwind CSS)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js + JWT
- **ML**: Python-based recommendations, demand prediction, route optimization

---

## 📁 Project Root Structure

```
FoodFlow/
├── frontend/                 # Next.js frontend application
├── backend/                  # FastAPI backend service
├── .git/                     # Git repository
├── .kiro/                    # Kiro IDE configuration
├── .vscode/                  # VS Code settings
├── .gitignore
├── SETUP.md                  # Initial setup guide
├── API.md                    # API documentation
├── DEPLOYMENT.md             # Deployment guide
└── [Documentation files]     # Various guides and docs
```

---

## 🎨 Frontend Structure (`/frontend`)

### Core Application

```
frontend/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Homepage
│   ├── layout.tsx           # Root layout with auth provider
│   ├── signin/              # Sign in page
│   ├── signup/              # Sign up page
│   │
│   ├── auth/                # Auth-related pages
│   │   ├── verify-email/
│   │   ├── resend-verification/
│   │   ├── success/
│   │   └── oauth-success/
│   │
│   ├── donor/               # Donor dashboard & features
│   │   ├── page.tsx         # Donor dashboard
│   │   ├── layout.tsx       # Donor layout with sidebar
│   │   ├── client.tsx       # Dashboard client component
│   │   ├── create/          # Create listing page
│   │   ├── listings/        # View all listings
│   │   │   └── [id]/        # Listing detail page
│   │   ├── history/         # Donation history
│   │   ├── claims/          # View claims on donations
│   │   ├── profile/         # Donor profile settings
│   │   └── settings/        # Donor settings
│   │
│   ├── ngo/                 # NGO dashboard & features
│   │   ├── page.tsx         # NGO dashboard
│   │   ├── layout.tsx       # NGO layout with sidebar
│   │   ├── client.tsx       # Dashboard client component
│   │   ├── listings/        # Browse available food
│   │   ├── claimed/         # Claimed items
│   │   ├── profile/         # NGO profile settings
│   │   └── settings/        # NGO settings
│   │
│   ├── admin/               # Admin dashboard & management
│   │   ├── page.tsx         # Admin dashboard
│   │   ├── layout.tsx       # Admin layout
│   │   ├── client.tsx       # Dashboard client component
│   │   ├── users/           # User management
│   │   ├── listings/        # Listing management
│   │   ├── analytics/       # Analytics & insights
│   │   ├── ml-insights/     # ML model insights
│   │   ├── network/         # Network visualization
│   │   ├── profile/         # Admin profile
│   │   └── settings/        # Admin settings
│   │
│   ├── api/                 # API routes (Next.js backend)
│   │   ├── auth/            # Authentication endpoints
│   │   │   ├── signup/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── me/          # Get current user
│   │   │   ├── verify-email/
│   │   │   ├── send-verification/
│   │   │   ├── complete-profile/
│   │   │   └── [...nextauth]/  # NextAuth.js config
│   │   ├── users/           # User management
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   └── update-role/
│   │   ├── listings/        # Listing management
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   ├── ngos/            # NGO endpoints
│   │   │   └── [id]/
│   │   ├── donors/          # Donor endpoints
│   │   │   └── [id]/
│   │   ├── claims/          # Claim management
│   │   ├── analytics/       # Analytics data
│   │   │   └── dashboard/
│   │   ├── admin/           # Admin endpoints
│   │   │   └── ngo-approve/
│   │   ├── ngo/             # NGO-specific endpoints
│   │   │   └── request/
│   │   └── webhooks/        # Webhook handlers
│   │
│   └── unauthorized/        # Unauthorized access page
│
├── components/              # Reusable React components
│   ├── ui/                  # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── [other UI components]
│   ├── layout/              # Layout components
│   │   ├── sidebar.tsx      # Main navigation sidebar
│   │   ├── header.tsx
│   │   └── footer.tsx
│   ├── map/                 # Map components
│   │   └── map-content.tsx  # Leaflet map integration
│   └── [other components]
│
├── contexts/                # React contexts
│   └── auth-context.tsx     # Authentication context
│
├── lib/                     # Utility functions & helpers
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # Auth utilities
│   ├── auth-nextauth.ts    # NextAuth configuration
│   ├── api.ts              # API client functions
│   └── [other utilities]
│
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seeding
│   ├── clear.ts            # Database clearing script
│   └── migrations/         # Database migrations
│
├── public/                  # Static assets
│   ├── images/
│   └── icons/
│
├── styles/                  # Global styles
│   └── globals.css
│
├── .env                     # Environment variables (local)
├── .env.local              # Local environment overrides
├── .env.example            # Example environment variables
├── .gitignore
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── next.config.js          # Next.js configuration
└── README.md
```

### Key Frontend Features

**Authentication**
- Email/password signup & login
- Email verification
- NextAuth.js session management
- Role-based access (Donor, NGO, Admin)

**Donor Features**
- Create food listings with details (quantity, category, expiry)
- View all listings created
- Track donation history
- View claims on donations
- Complete donor profile

**NGO Features**
- Browse available food listings
- Claim food items
- View claimed items
- Complete NGO profile
- Track storage capacity

**Admin Features**
- User management
- Listing management
- Analytics dashboard
- ML insights
- Network visualization
- NGO approval workflow

---

## 🔧 Backend Structure (`/backend`)

### FastAPI Application

```
backend/
├── app/                     # Main application package
│   ├── __init__.py
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   └── routes/          # Route handlers
│   │       ├── __init__.py
│   │       ├── auth.py      # Authentication endpoints
│   │       ├── users.py     # User management
│   │       ├── listings.py  # Food listing endpoints
│   │       ├── ngos.py      # NGO endpoints
│   │       ├── donors.py    # Donor endpoints
│   │       ├── claims.py    # Claim management
│   │       └── analytics.py # Analytics endpoints
│   │
│   ├── core/                # Core configuration
│   │   ├── __init__.py
│   │   ├── config.py        # Settings & environment
│   │   ├── security.py      # Security utilities
│   │   └── oauth.py         # OAuth configuration
│   │
│   ├── db/                  # Database
│   │   ├── __init__.py
│   │   └── database.py      # Database connection
│   │
│   └── ml/                  # Machine Learning
│       ├── __init__.py
│       ├── models/          # ML model definitions
│       │   └── __init__.py
│       ├── services/        # ML services
│       │   ├── __init__.py
│       │   └── recommender.py  # NGO recommendation engine
│       └── routes/          # ML API endpoints
│           └── __init__.py
│
├── main.py                  # FastAPI application entry point
├── requirements.txt         # Python dependencies
├── .env.example            # Example environment variables
├── .gitignore
├── schema.prisma           # Prisma schema (shared with frontend)
├── prisma/                 # Prisma configuration
│   └── [migrations]
├── setup.sh / setup.bat    # Setup scripts
├── start.sh / start.bat    # Start scripts
├── README.md
└── FASTAPI_SETUP.md        # FastAPI setup guide
```

### Backend API Endpoints

**Authentication** (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user
- `POST /verify-email` - Verify email
- `POST /send-verification` - Send verification email

**Users** (`/api/users`)
- `GET /` - List all users
- `GET /{id}` - Get user by ID
- `PUT /{id}` - Update user
- `POST /update-role` - Update user role

**Listings** (`/api/listings`)
- `GET /` - List all food listings
- `GET /{id}` - Get listing details
- `POST /` - Create new listing
- `PUT /{id}` - Update listing
- `DELETE /{id}` - Delete listing

**NGOs** (`/api/ngos`)
- `GET /{id}` - Get NGO profile
- `PUT /{id}` - Update NGO profile

**Donors** (`/api/donors`)
- `GET /{id}` - Get donor profile
- `PUT /{id}` - Update donor profile

**Claims** (`/api/claims`)
- `GET /` - List all claims
- `POST /` - Create claim
- `PUT /{id}/status` - Update claim status

**Analytics** (`/api/analytics`)
- `GET /dashboard` - Dashboard analytics
- `GET /stats` - System statistics

---

## 🗄️ Database Schema

### Core Tables

**Users**
- id, email, password_hash, name, role, status
- emailVerified, avatar, createdAt, updatedAt

**DonorProfile**
- id, userId, businessName, businessType, phone, address
- latitude, longitude, createdAt, updatedAt

**NGOProfile**
- id, userId, organizationName, phone, address
- storageCapacity, peopleServed, status, createdAt, updatedAt

**AdminProfile**
- id, userId, createdAt, updatedAt

**Listings**
- id, donorId, name, description, quantity, category
- address, latitude, longitude, expiryTime, pickupWindow
- status, createdAt, updatedAt

**Claims**
- id, listingId, ngoId, status, claimedAt, completedAt
- createdAt, updatedAt

**Analytics**
- id, userId, action, metadata, createdAt

---

## 🤖 ML Integration

### ML Services (`/backend/app/ml`)

**Recommender Service** (`services/recommender.py`)
- Smart NGO recommendations based on:
  - Food category preferences
  - Storage capacity
  - Location proximity
  - Historical performance

**Demand Prediction** (Planned)
- Predict food demand patterns
- Forecast peak donation times
- Optimize inventory management

**Route Optimization** (Planned)
- Calculate optimal pickup routes
- Minimize delivery time
- Reduce transportation costs

### ML API Endpoints (`/api/ml`)
- `GET /recommendations/{listing_id}` - Get NGO recommendations
- `GET /demand-forecast` - Get demand predictions
- `GET /route-optimization` - Get optimized routes

---

## 🔐 Authentication Flow

```
User Signup/Login
    ↓
NextAuth.js (Frontend)
    ↓
/api/auth/[...nextauth] (Next.js)
    ↓
Backend FastAPI (Optional)
    ↓
JWT Token + Session
    ↓
Authenticated Requests
```

### Session Management
- NextAuth.js handles session state
- JWT tokens for API authentication
- Role-based access control (RBAC)
- Protected routes by role

---

## 📊 Data Flow

### Creating a Listing (Donor)
```
1. Donor fills form on /donor/create
2. Frontend validates & submits to /api/listings
3. Next.js API route creates listing in database
4. Listing appears on /ngo/listings for NGOs
5. NGOs can claim the listing
```

### Claiming Food (NGO)
```
1. NGO browses /ngo/listings
2. NGO clicks "Claim" on listing
3. Frontend submits to /api/claims
4. Claim created in database
5. Donor sees claim on /donor/claims
6. Donor can approve/reject claim
```

### Analytics & Insights
```
1. Admin views /admin/analytics
2. Frontend fetches /api/analytics/dashboard
3. Backend aggregates data from database
4. ML models generate insights
5. Dashboard displays real-time metrics
```

---

## 🚀 Key Features

### For Donors
- ✅ Create & manage food listings
- ✅ Track donation history
- ✅ View claims from NGOs
- ✅ Complete business profile
- ✅ Real-time notifications

### For NGOs
- ✅ Browse available food
- ✅ Claim food items
- ✅ Track claimed items
- ✅ Complete organization profile
- ✅ Smart recommendations (ML)

### For Admins
- ✅ User management
- ✅ Listing moderation
- ✅ Analytics dashboard
- ✅ ML insights
- ✅ Network visualization

---

## 🔄 Development Workflow

### Setup
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python main.py
```

### Database
```bash
# Create/update schema
npx prisma migrate dev

# Seed with test data
npm run db:seed

# Clear all data
npm run db:clear
```

### Testing
```bash
# Frontend tests
npm run test

# Backend tests
pytest
```

---

## 📝 Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=postgresql://...
```

### Backend (`.env`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
FASTAPI_ENV=development
```

---

## 📚 Documentation Files

- `SETUP.md` - Initial project setup
- `API.md` - API documentation
- `DEPLOYMENT.md` - Deployment guide
- `FASTAPI_QUICKSTART.md` - FastAPI setup
- `FOODFLOW_ML_GUIDE.md` - ML integration guide
- `AFTER_CLEARING_DATABASE.md` - Database setup after clearing
- `CREATE_LISTING_FUNCTIONAL.md` - Create listing feature docs
- `REAL_DATA_IMPLEMENTATION.md` - Real data sources

---

## 🎯 Project Status

**Completed:**
- ✅ User authentication & authorization
- ✅ Donor listing creation
- ✅ NGO claiming system
- ✅ Admin dashboard
- ✅ Database schema
- ✅ API endpoints
- ✅ Frontend UI/UX

**In Progress:**
- 🔄 ML recommendation engine
- 🔄 Advanced analytics

**Planned:**
- 📋 Demand prediction
- 📋 Route optimization
- 📋 Mobile app
- 📋 Payment integration

---

**Last Updated**: April 17, 2026
**Version**: 1.0
