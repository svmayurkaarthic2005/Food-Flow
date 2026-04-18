# FoodFlow Architecture - Step 1

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React Components                                    │  │
│  │  - MapView (fetches listings)                        │  │
│  │  - Dashboard (displays data)                         │  │
│  │  - Listings (shows all items)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Layer (Next.js API Routes)                      │  │
│  │  - GET /api/listings (fetch from DB)                 │  │
│  │  - Filters: status, category, pagination             │  │
│  │  - Calculates urgency levels                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Prisma Client (ORM)                                 │  │
│  │  - Query builder                                     │  │
│  │  - Type-safe database access                         │  │
│  │  - Connection pooling                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tables:                                                    │
│  - User (email, password, role)                             │
│  - Donor (business details)                                 │
│  - NGO (organization details)                               │
│  - FoodListing (items, location, expiry)                    │
│  - Claim (NGO claims)                                       │
│  - Delivery (tracking)                                      │
│  - LocationUpdate (real-time tracking)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Fetching Listings

```
User visits /donor/listings
        ↓
MapView component mounts
        ↓
useEffect calls fetchListings()
        ↓
fetch('/api/listings?status=AVAILABLE')
        ↓
API Route: GET /api/listings
        ↓
Prisma queries database:
  SELECT * FROM FoodListing 
  WHERE status = 'AVAILABLE'
  INCLUDE donor
        ↓
Calculate urgency for each listing
        ↓
Return JSON with listings + pagination
        ↓
MapView updates state with listings
        ↓
MapContent renders markers on map
        ↓
User sees map with food listings
```

## File Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── listings/
│   │       └── route.ts          ← API endpoint
│   ├── donor/
│   ├── ngo/
│   ├── admin/
│   └── layout.tsx
├── components/
│   ├── map/
│   │   ├── map-view.tsx          ← Fetches from DB
│   │   └── map-content.tsx        ← Renders markers
│   └── dashboard/
├── lib/
│   ├── prisma.ts                 ← Prisma client
│   ├── api.ts                    ← API utilities
│   ├── urgency.ts                ← Urgency calculation
│   └── utils.ts
├── prisma/
│   ├── schema.prisma             ← Database schema
│   └── seed.ts                   ← Seed script
├── .env.local                    ← Environment variables
├── DATABASE_SETUP.md             ← Setup guide
├── QUICK_SETUP.md                ← Quick reference
└── ARCHITECTURE.md               ← This file
```

## Database Schema

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          Role      @default(DONOR)
  status        UserStatus
  
  donorProfile  Donor?
  ngoProfile    NGO?
  adminProfile  Admin?
  deliveries    Delivery[]
}
```

### FoodListing Model
```prisma
model FoodListing {
  id            String    @id @default(cuid())
  name          String
  description   String
  quantity      String
  category      String
  status        ListingStatus
  
  address       String
  latitude      Float
  longitude     Float
  
  expiryTime    DateTime
  pickupWindow  String?
  
  donorId       String
  donor         Donor     @relation(...)
  
  claims        Claim[]
}
```

### Relationships

```
User (1) ──→ (1) Donor
User (1) ──→ (1) NGO
User (1) ──→ (1) Admin

Donor (1) ──→ (many) FoodListing
FoodListing (1) ──→ (many) Claim
Claim (1) ──→ (1) NGO
Claim (1) ──→ (1) Delivery

Delivery (1) ──→ (many) LocationUpdate
```

## API Endpoints

### GET /api/listings
Fetch food listings with filtering and pagination.

**Query Parameters:**
- `status` - Filter by status (AVAILABLE, CLAIMED, EXPIRED)
- `category` - Filter by category (Bakery, Produce, etc.)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "cuid123",
      "name": "Fresh Bakery Items",
      "quantity": "50 items",
      "category": "Bakery",
      "status": "AVAILABLE",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "expiryTime": "2024-04-17T14:30:00Z",
      "hoursRemaining": 2.5,
      "urgency": "critical",
      "donor": {
        "businessName": "Downtown Bakery Co.",
        "businessType": "Bakery"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

## Urgency Calculation

Urgency is calculated based on time remaining until expiry:

```typescript
const hoursRemaining = (expiryTime - now) / (1000 * 60 * 60)

if (hoursRemaining <= 2) urgency = 'critical'  // Red #ef4444
else if (hoursRemaining <= 6) urgency = 'medium'  // Yellow #eab308
else urgency = 'fresh'  // Green #22c55e
```

## Performance Optimizations

1. **Database Indexes**
   - Email (unique)
   - Role
   - Status
   - Category
   - Expiry time

2. **Pagination**
   - Default 20 items per page
   - Prevents loading entire database

3. **Caching**
   - Map refreshes every 5 minutes
   - Reduces database queries

4. **Connection Pooling**
   - Prisma manages connection pool
   - Min 2, Max 10 connections

## Security Considerations

1. **Password Hashing**
   - bcrypt with 12 rounds
   - Never store plain passwords

2. **Environment Variables**
   - DATABASE_URL in .env.local
   - JWT secrets in .env.local
   - Not committed to git

3. **Type Safety**
   - TypeScript for compile-time checks
   - Prisma for runtime safety

4. **Input Validation**
   - Ready for Zod validation
   - API routes validate inputs

## Next Steps

### Phase 2: Authentication
- Implement JWT tokens
- Create login/register endpoints
- Add RBAC middleware

### Phase 3: Advanced Features
- Delivery tracking
- Real-time location updates
- Route optimization
- Advanced Google Maps integration

---

**Last Updated**: April 17, 2024
**Status**: Step 1 Complete ✅
