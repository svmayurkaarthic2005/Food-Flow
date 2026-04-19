# How FoodFlow Application Works - Complete Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    (http://localhost:3000)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   FRONTEND      │
                    │   (Next.js 14)  │
                    │   TypeScript    │
                    │   React         │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐         ┌──────────┐        ┌──────────┐
   │Database │         │ Backend  │        │ External │
   │PostgreSQL         │ (FastAPI)│        │ Services │
   │         │         │ Port 8000│        │          │
   └─────────┘         └──────────┘        └──────────┘
                            │
                    ┌───────┴────────┐
                    │                │
                    ▼                ▼
              ┌──────────┐      ┌──────────┐
              │ Brevo    │      │ Redis    │
              │ SMTP     │      │ Cache    │
              │ Email    │      │ Queue    │
              └──────────┘      └──────────┘
```

---

## Step-by-Step: How It Works

### STEP 1: Starting the Application

#### Terminal 1 - Start Backend
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**What happens:**
1. FastAPI server starts on port 8000
2. Connects to PostgreSQL database
3. Initializes Prisma client
4. Starts email queue worker
5. Starts background job scheduler
6. Loads all API routes

**Output:**
```
✅ Database connected
✅ Email worker started
✅ Background scheduler started
INFO: Application startup complete.
```

#### Terminal 2 - Start Frontend
```bash
cd frontend
npm run dev
```

**What happens:**
1. Next.js development server starts on port 3000
2. Compiles TypeScript/React components
3. Sets up hot reload
4. Initializes NextAuth authentication
5. Connects to Prisma client (frontend database)

**Output:**
```
▲ Next.js 14.0.0
- Local: http://localhost:3000
```

---

### STEP 2: User Signup Flow

#### User Action: Click "Sign Up"
```
Browser: http://localhost:3000/signup
```

#### Frontend (signup/page.tsx)
```
1. User fills form:
   - Email: user@example.com
   - Password: SecurePass123!
   - Name: John Doe
   - Role: DONOR

2. User clicks "Sign Up"

3. Frontend calls: POST /api/auth/signup
   (This is a Next.js API route, not backend)
```

#### Frontend API Route (app/api/auth/signup/route.ts)
```typescript
// Step 1: Validate input
if (!email || !password || !name || !role) {
  return error "Missing fields"
}

// Step 2: Hash password
const passwordHash = await bcrypt.hash(password, 12)

// Step 3: Create user in FRONTEND database
const user = await prisma.user.create({
  data: {
    email,
    passwordHash,
    name,
    role,
    status: 'PENDING'  // Not verified yet
  }
})

// Step 4: Generate verification token
const token = crypto.randomBytes(32).toString('hex')
const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

// Step 5: Store token in database
await prisma.verificationToken.create({
  data: {
    identifier: email,
    token,
    expires
  }
})

// Step 6: Call BACKEND email service
const response = await fetch('http://localhost:8000/api/send-verification-email', {
  method: 'POST',
  body: JSON.stringify({
    email,
    name,
    verification_url: `http://localhost:3000/auth/verify-email?token=${token}&email=${email}`
  })
})

// Step 7: Return success
return {
  success: true,
  message: "Account created. Check your email to verify."
}
```

#### Backend Email Service (app/api/routes/email_verification.py)
```python
# Step 1: Receive email request
@router.post("/send-verification-email")
async def send_verification_email(request: VerificationEmailRequest):
    
    # Step 2: Build HTML email
    html_content = f"""
    <html>
        <body>
            <h1>Welcome to FoodFlow!</h1>
            <p>Hi {request.name},</p>
            <p>Click here to verify: {request.verification_url}</p>
        </body>
    </html>
    """
    
    # Step 3: Send via Brevo SMTP
    success = EmailService.send_email(
        to_email=request.email,
        subject="Verify your FoodFlow account",
        html_content=html_content
    )
    
    # Step 4: Return response
    return {"success": true, "message": "Email sent"}
```

#### Brevo SMTP Service
```
1. Receives email from backend
2. Connects to smtp-relay.brevo.com:587
3. Authenticates with credentials
4. Sends email to user@example.com
5. User receives email in inbox
```

#### Frontend Response
```
User sees: "Account created! Check your email to verify."
```

---

### STEP 3: Email Verification

#### User Action: Click Email Link
```
Email contains link:
http://localhost:3000/auth/verify-email?token=abc123&email=user@example.com
```

#### Frontend Verification Page (auth/verify-email/page.tsx)
```typescript
// Step 1: Extract token and email from URL
const token = searchParams.get('token')
const email = searchParams.get('email')

// Step 2: Call verification API
const response = await fetch('/api/auth/verify-email', {
  method: 'POST',
  body: JSON.stringify({ token, email })
})

// Step 3: Backend verifies token
```

#### Frontend API Route (app/api/auth/verify-email/route.ts)
```typescript
// Step 1: Find token in database
const verificationToken = await prisma.verificationToken.findUnique({
  where: {
    identifier_token: {
      identifier: email,
      token
    }
  }
})

// Step 2: Check if token exists
if (!verificationToken) {
  return error "Invalid token"
}

// Step 3: Check if expired
if (verificationToken.expires < new Date()) {
  await prisma.verificationToken.delete(...)
  return error "Token expired"
}

// Step 4: Mark email as verified
await prisma.user.update({
  where: { email },
  data: { emailVerified: new Date() }
})

// Step 5: Delete token (one-time use)
await prisma.verificationToken.delete(...)

// Step 6: Return success
return { success: true }
```

#### Frontend Response
```
User sees: "Email verified! Redirecting to login..."
Redirects to: /signin
```

---

### STEP 4: User Login

#### User Action: Login
```
1. Go to http://localhost:3000/signin
2. Enter email and password
3. Click "Sign In"
```

#### Frontend Login (app/api/auth/login/route.ts)
```typescript
// Step 1: Find user
const user = await prisma.user.findUnique({
  where: { email }
})

// Step 2: Verify password
const passwordMatch = await bcrypt.compare(password, user.passwordHash)

// Step 3: Check if email verified
if (!user.emailVerified) {
  return error "Please verify your email first"
}

// Step 4: Create JWT token
const token = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  process.env.SECRET_KEY,
  { expiresIn: '30 days' }
)

// Step 5: Set secure cookie
response.cookies.set('auth-token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
})

// Step 6: Return user data
return {
  success: true,
  user: { id, email, name, role }
}
```

#### NextAuth Session
```
1. Token stored in secure cookie
2. NextAuth validates token on each request
3. User session available in frontend
4. Redirect to dashboard
```

---

### STEP 5: Donor Dashboard

#### User Action: View Dashboard
```
http://localhost:3000/donor/page
```

#### Frontend Dashboard (app/donor/client.tsx)
```typescript
// Step 1: Get user session
const session = await getServerSession(authOptions)

// Step 2: Fetch analytics from API
const analytics = await fetch('/api/analytics/dashboard')

// Step 3: Fetch recent deliveries
const deliveries = await fetch('/api/donor/deliveries')

// Step 4: Render dashboard with:
- KPI cards (active donations, claimed, etc.)
- Recent listings
- AI insights
- Recent deliveries
- Activity timeline
```

#### Frontend API Route (app/api/donor/deliveries/route.ts)
```typescript
// Step 1: Verify user is authenticated
const session = await getServerSession(authOptions)

// Step 2: Get donor profile
const user = await prisma.user.findUnique({
  where: { email: session.user.email },
  include: { donorProfile: true }
})

// Step 3: Fetch deliveries for donor's listings
const deliveries = await prisma.delivery.findMany({
  where: {
    claim: {
      listing: {
        donorId: user.donorProfile.id
      }
    }
  },
  include: {
    claim: { include: { listing: true } },
    ngo: { include: { user: true } }
  }
})

// Step 4: Return deliveries
return { deliveries }
```

#### Frontend Rendering
```
Dashboard shows:
- 5 recent deliveries
- Status badges (PENDING, IN_TRANSIT, DELIVERED)
- Track buttons for active deliveries
- NGO names and ETAs
```

---

### STEP 6: Track Delivery

#### User Action: Click "Track Delivery"
```
1. Donor sees delivery in Recent Deliveries
2. Clicks "Track" button
3. Navigates to: /donor/tracking?id=delivery_id
```

#### Frontend Tracking Page (app/donor/tracking/page.tsx)
```typescript
// Step 1: Get delivery ID from URL
const deliveryId = searchParams.get('id')

// Step 2: Fetch delivery details
const delivery = await fetch(`/api/deliveries/${deliveryId}`)

// Step 3: Fetch location updates
const locations = await fetch(`/api/deliveries/${deliveryId}/locations`)

// Step 4: Initialize map
const map = new google.maps.Map(...)

// Step 5: Plot driver location
map.setCenter({
  lat: delivery.currentLatitude,
  lng: delivery.currentLongitude
})

// Step 6: Show delivery info
- Driver name
- Current location
- ETA
- Distance remaining
- Status timeline
```

#### WebSocket Real-time Updates (Optional)
```
1. Frontend connects to WebSocket
2. Backend sends location updates every 2 seconds
3. Map updates in real-time
4. ETA recalculates
```

---

## Data Flow Diagram

### Signup Flow
```
User Browser
    │
    ├─ Fill form
    │
    ▼
Frontend (signup/page.tsx)
    │
    ├─ Validate input
    ├─ Hash password
    │
    ▼
Frontend API (app/api/auth/signup/route.ts)
    │
    ├─ Create user in database
    ├─ Generate token
    ├─ Store token
    │
    ▼
Backend Email Service (http://localhost:8000/api/send-verification-email)
    │
    ├─ Build HTML email
    │
    ▼
Brevo SMTP (smtp-relay.brevo.com)
    │
    ├─ Send email
    │
    ▼
User Email Inbox
    │
    ├─ User receives email
    ├─ Clicks verification link
    │
    ▼
Frontend Verification (auth/verify-email/page.tsx)
    │
    ├─ Extract token from URL
    │
    ▼
Frontend API (app/api/auth/verify-email/route.ts)
    │
    ├─ Find token in database
    ├─ Verify not expired
    ├─ Mark email as verified
    ├─ Delete token
    │
    ▼
User sees: "Email verified!"
```

### Login Flow
```
User Browser
    │
    ├─ Enter credentials
    │
    ▼
Frontend (signin/page.tsx)
    │
    ├─ Call login API
    │
    ▼
Frontend API (app/api/auth/login/route.ts)
    │
    ├─ Find user
    ├─ Verify password
    ├─ Check email verified
    ├─ Create JWT token
    ├─ Set secure cookie
    │
    ▼
NextAuth Session
    │
    ├─ Store token
    ├─ Validate on each request
    │
    ▼
User Dashboard
    │
    ├─ Fetch analytics
    ├─ Fetch deliveries
    ├─ Render dashboard
    │
    ▼
User sees: Dashboard with data
```

### Delivery Tracking Flow
```
User Browser (Donor Dashboard)
    │
    ├─ See recent deliveries
    ├─ Click "Track" button
    │
    ▼
Frontend (app/donor/tracking/page.tsx)
    │
    ├─ Get delivery ID from URL
    ├─ Fetch delivery details
    ├─ Fetch location history
    │
    ▼
Frontend API (app/api/deliveries/[id]/route.ts)
    │
    ├─ Query database
    ├─ Return delivery + locations
    │
    ▼
Frontend Rendering
    │
    ├─ Initialize Google Map
    ├─ Plot driver location
    ├─ Show ETA
    ├─ Show status timeline
    │
    ▼
User sees: Live tracking map
```

---

## Database Schema

### Frontend Database (PostgreSQL)
```
User
├─ id
├─ email
├─ passwordHash
├─ name
├─ role (DONOR, NGO, DRIVER, ADMIN)
├─ emailVerified
└─ createdAt

Donor
├─ id
├─ userId (FK)
├─ businessName
├─ address
└─ rating

FoodListing
├─ id
├─ donorId (FK)
├─ name
├─ quantity
├─ status (AVAILABLE, CLAIMED, EXPIRED)
└─ expiryTime

Claim
├─ id
├─ listingId (FK)
├─ ngoId (FK)
├─ status (PENDING, ACCEPTED, COMPLETED)
└─ claimedAt

Delivery
├─ id
├─ claimId (FK)
├─ driverId (FK)
├─ status (PENDING, IN_TRANSIT, DELIVERED)
├─ currentLatitude
├─ currentLongitude
└─ estimatedArrival

VerificationToken
├─ identifier (email)
├─ token
└─ expires
```

### Backend Database (Same PostgreSQL)
```
Same schema as frontend
(Both use same database)
```

---

## API Endpoints

### Authentication
```
POST /api/auth/signup
  Request: { email, password, name, role }
  Response: { success, user }

POST /api/auth/login
  Request: { email, password }
  Response: { success, user, token }

POST /api/auth/verify-email
  Request: { token, email }
  Response: { success }

POST /api/auth/send-verification
  Request: { email }
  Response: { success }
```

### Email (Backend)
```
POST /api/send-verification-email
  Request: { email, name, verification_url }
  Response: { success, message }
```

### Listings
```
GET /api/listings
  Response: { data: [listings] }

POST /api/listings
  Request: { name, quantity, category, address, ... }
  Response: { id, ... }

GET /api/listings/{id}
  Response: { listing }
```

### Deliveries
```
GET /api/donor/deliveries
  Response: { deliveries: [delivery] }

GET /api/deliveries/{id}
  Response: { delivery }

POST /api/driver/location
  Request: { latitude, longitude, deliveryId }
  Response: { success }
```

---

## Key Technologies

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Prisma** - Database ORM
- **NextAuth.js** - Authentication
- **Google Maps API** - Mapping

### Backend
- **FastAPI** - Python web framework
- **Prisma Python** - Database ORM
- **Brevo SMTP** - Email service
- **Redis** - Message queue
- **APScheduler** - Background jobs
- **Uvicorn** - ASGI server

### Database
- **PostgreSQL** - Relational database
- **Prisma** - ORM for both frontend and backend

### External Services
- **Brevo** - Email delivery (SMTP)
- **Google Maps** - Location mapping
- **Redis** - Message queue (optional)

---

## Request/Response Cycle

### Example: Signup Request

**1. Browser Request**
```
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "DONOR"
}
```

**2. Frontend Processing**
```
- Validate input
- Hash password
- Create user in database
- Generate token
- Call backend email service
```

**3. Backend Processing**
```
- Receive email request
- Build HTML email
- Connect to Brevo SMTP
- Send email
```

**4. Email Service**
```
- Authenticate with Brevo
- Send email to user@example.com
```

**5. Frontend Response**
```
HTTP 201 Created

{
  "success": true,
  "message": "Account created. Check your email to verify.",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "DONOR"
  }
}
```

**6. Browser Display**
```
User sees: "Account created! Check your email to verify."
```

---

## Error Handling

### Frontend Errors
```
- Validation errors (missing fields)
- Network errors (backend down)
- Authentication errors (invalid credentials)
- Database errors (duplicate email)
```

### Backend Errors
```
- Email service errors (SMTP failure)
- Database errors (connection failed)
- Validation errors (invalid input)
```

### User Experience
```
- Error messages displayed in UI
- Toast notifications for feedback
- Retry buttons for failed operations
- Fallback to console logging if backend unavailable
```

---

## Security Features

### Authentication
- JWT tokens with expiration
- Secure HTTP-only cookies
- Password hashing with bcrypt
- Email verification required

### Database
- SQL injection prevention (Prisma)
- Password never stored in plain text
- Tokens expire after 24 hours
- One-time use verification tokens

### API
- CORS configured
- Rate limiting (optional)
- Input validation
- Error messages don't leak sensitive info

---

## Performance Optimization

### Frontend
- Server-side rendering (Next.js)
- Static generation where possible
- Image optimization
- Code splitting
- Caching strategies

### Backend
- Database connection pooling
- Async/await for non-blocking operations
- Email queue for async sending
- Background jobs for heavy tasks

### Database
- Indexes on frequently queried columns
- Connection pooling
- Query optimization

---

## Summary

The FoodFlow application works as follows:

1. **User opens browser** → Frontend loads (Next.js)
2. **User signs up** → Frontend creates account, calls backend for email
3. **Backend sends email** → Brevo SMTP delivers to user
4. **User verifies email** → Frontend marks email as verified
5. **User logs in** → Frontend creates JWT token
6. **User views dashboard** → Frontend fetches data from database
7. **User tracks delivery** → Frontend shows real-time location on map
8. **Backend processes** → Email queue, background jobs, database operations

**Both frontend and backend use the same PostgreSQL database**, making data synchronization seamless!

---

## Next Steps

1. ✅ Start backend: `cd backend && python -m uvicorn main:app --reload`
2. ✅ Start frontend: `cd frontend && npm run dev`
3. ✅ Test signup: http://localhost:3000/signup
4. ✅ Check email verification
5. ✅ Login and explore dashboard
6. ✅ Test delivery tracking

Everything is ready to use! 🚀
