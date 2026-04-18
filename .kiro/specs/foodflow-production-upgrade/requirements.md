# FoodFlow Production Upgrade - Requirements

## Phase 1: PostgreSQL + Prisma Database Setup

### 1.1 Database Schema Implementation
**Acceptance Criteria:**
- User model with email, password hash, name, role (DONOR/NGO/ADMIN), and status fields
- Donor profile model linked to User with business details and location coordinates
- NGO profile model linked to User with organization details, storage capacity, and metrics
- Admin profile model linked to User with permissions array
- FoodListing model with all required fields: name, description, category, quantity, location, coordinates, expiry time, status
- Claim model linking FoodListing to NGO with status tracking
- Delivery model tracking delivery status, location, route, and timing
- LocationUpdate model for real-time tracking with latitude, longitude, accuracy, timestamp
- All models have proper relationships with foreign keys and cascade delete rules
- All models have appropriate indexes on frequently queried fields (email, role, status, coordinates, timestamps)

### 1.2 Prisma Configuration
**Acceptance Criteria:**
- Prisma is installed and configured with PostgreSQL
- `.env` file contains DATABASE_URL pointing to PostgreSQL instance
- Connection pooling is configured for production use
- Prisma client is generated and ready for use

### 1.3 Database Migrations
**Acceptance Criteria:**
- Initial migration creates all tables with correct schema
- Migration can be run with `npx prisma migrate dev --name init`
- Migration can be deployed to production with `npx prisma migrate deploy`
- Rollback strategy is documented
- Migration is tested in staging environment before production

### 1.4 Database Seeding
**Acceptance Criteria:**
- Seed script creates at least one admin user for initial setup
- Seed script can be run with `npx prisma db seed`
- Seed script is idempotent (can be run multiple times safely)
- Development environment has sample data for testing

---

## Phase 2: Backend APIs (Next.js API Routes)

### 2.1 Authentication System - Register Endpoint
**Acceptance Criteria:**
- POST /api/auth/register accepts email, password, name, role, and profile-specific fields
- Validates email format and uniqueness
- Validates password strength (min 8 chars, uppercase, lowercase, number, special char)
- Hashes password using bcrypt with 12 rounds
- Creates User record with appropriate role
- Creates corresponding Donor/NGO/Admin profile based on role
- Returns user object and JWT token (1-hour expiry)
- Returns refresh token in HTTP-only cookie (7-day expiry)
- Returns 400 error for validation failures
- Returns 409 error if email already exists
- Logs registration attempt for audit trail

### 2.2 Authentication System - Login Endpoint
**Acceptance Criteria:**
- POST /api/auth/login accepts email and password
- Validates email exists in database
- Compares password hash using bcrypt
- Returns 401 error for invalid credentials
- Returns user object and JWT token on success
- Returns refresh token in HTTP-only cookie
- Logs login attempt (success and failure) for audit trail
- Implements rate limiting (10 attempts/minute per IP)

### 2.3 Authentication System - Token Refresh Endpoint
**Acceptance Criteria:**
- POST /api/auth/refresh accepts refresh token
- Validates refresh token signature and expiry
- Returns new JWT token with 1-hour expiry
- Returns 401 error for invalid/expired refresh token
- Does not issue new refresh token (only JWT)

### 2.4 Role-Based Access Control (RBAC)
**Acceptance Criteria:**
- Auth middleware validates JWT token on protected endpoints
- Auth middleware extracts user role from token
- RBAC middleware checks user role against endpoint requirements
- DONOR role can only create/read/update/delete own listings
- NGO role can only create/read/update/delete own claims
- ADMIN role can access all resources
- Returns 403 error for unauthorized access
- Returns 401 error for missing/invalid token

### 2.5 Listing Creation Endpoint
**Acceptance Criteria:**
- POST /api/listings requires DONOR role
- Accepts name, description, category, quantity, quantityUnit, location, address, coordinates, expiryTime, pickupWindow, imageUrl
- Validates all required fields are present
- Validates coordinates are valid (lat -90 to 90, lng -180 to 180)
- Validates expiryTime is in the future
- Creates FoodListing record with AVAILABLE status
- Associates listing with authenticated donor
- Returns 201 with created listing object
- Returns 400 for validation errors
- Returns 401 if not authenticated as DONOR

### 2.6 Listing Read Endpoints
**Acceptance Criteria:**
- GET /api/listings returns paginated list of available listings
- Supports filtering by status (AVAILABLE, CLAIMED, EXPIRED, CANCELLED)
- Supports filtering by category
- Supports nearby search by latitude/longitude with radius parameter (default 5km)
- Supports pagination with page and limit parameters (default 20, max 100)
- Returns urgency level (critical/medium/fresh) based on expiry time
- Returns hours remaining until expiry
- Returns distance from user location if coordinates provided
- Returns 200 with listings array and pagination metadata
- Returns 400 for invalid query parameters

### 2.7 Listing Claim Endpoint
**Acceptance Criteria:**
- POST /api/listings/{id}/claim requires NGO role
- Accepts pickupTime and optional assignedStaff
- Validates listing exists and is AVAILABLE
- Validates listing has not already been claimed
- Creates Claim record with CLAIMED status
- Updates FoodListing status to CLAIMED
- Returns 201 with claim object
- Returns 404 if listing not found
- Returns 409 if listing already claimed
- Returns 401 if not authenticated as NGO

### 2.8 Delivery Status Update Endpoint
**Acceptance Criteria:**
- PUT /api/delivery/{id}/status requires NGO role or driver
- Accepts status (IN_TRANSIT, ARRIVED, COMPLETED), latitude, longitude, accuracy
- Validates delivery exists
- Validates status transition is valid
- Creates LocationUpdate record with coordinates and timestamp
- Updates Delivery record with new status and location
- Returns 200 with updated delivery object
- Returns 404 if delivery not found
- Returns 400 for invalid status transitions
- Returns 401 if not authorized

### 2.9 Delivery Route Endpoint
**Acceptance Criteria:**
- GET /api/delivery/{id}/route requires authentication
- Returns route polyline, distance, duration, and turn-by-turn steps
- Returns current delivery location and timestamp
- Returns estimated arrival time
- Returns 200 with route object
- Returns 404 if delivery not found
- Returns 401 if not authenticated

### 2.10 Input Validation & Error Handling
**Acceptance Criteria:**
- All endpoints validate input using schema validation (Zod or similar)
- All endpoints return consistent error response format
- Error responses include error code and descriptive message
- Validation errors return 400 status
- Authentication errors return 401 status
- Authorization errors return 403 status
- Not found errors return 404 status
- Conflict errors return 409 status
- Server errors return 500 status with generic message (no sensitive details)

### 2.11 Rate Limiting
**Acceptance Criteria:**
- General endpoints limited to 1000 requests/hour per user
- Auth endpoints limited to 100 requests/minute per IP
- Location update endpoints limited to 10 requests/minute per delivery
- Rate limit headers included in responses
- Returns 429 when rate limit exceeded

### 2.12 Database Query Replacement
**Acceptance Criteria:**
- All mock data references removed from API endpoints
- All endpoints query PostgreSQL via Prisma
- All endpoints use proper database transactions where needed
- Query performance is acceptable (< 200ms for 95th percentile)

---

## Phase 3: Google Maps Advanced Features

### 3.1 Marker Display with Urgency Colors
**Acceptance Criteria:**
- GET /api/maps/listings returns all available listings with map data
- Each marker includes position (lat/lng), title, quantity, donor name
- Markers are color-coded by urgency:
  - Red (#ef4444) for critical (< 2 hours to expiry)
  - Yellow (#eab308) for medium (2-6 hours to expiry)
  - Green (#22c55e) for fresh (> 6 hours to expiry)
- Markers include custom icons with appropriate colors
- Markers include info windows with listing details
- Markers are clickable and show/hide info windows
- Map updates listing markers every 5 minutes
- Returns 200 with markers array

### 3.2 Route Drawing on Claim
**Acceptance Criteria:**
- POST /api/maps/route accepts origin, destination, and optional waypoints
- Calls Google Directions API with DRIVING mode
- Returns encoded polyline for rendering on map
- Returns distance in meters and duration in seconds
- Returns turn-by-turn directions with instructions
- Polyline is rendered on map with blue color and 3px weight
- Route is displayed when claim is created
- Returns 200 with route object
- Returns 400 for invalid coordinates
- Returns 500 if Google API call fails

### 3.3 Live Delivery Tracking
**Acceptance Criteria:**
- GET /api/maps/delivery/{id}/location returns current delivery location
- Returns latitude, longitude, accuracy, and timestamp
- Returns estimated arrival time based on route
- Returns 200 with location object
- Returns 404 if delivery not found
- Returns 401 if not authenticated

### 3.4 Driver Location Updates Every 3 Seconds
**Acceptance Criteria:**
- POST /api/maps/delivery/{id}/location accepts latitude, longitude, accuracy, speed, heading
- Creates LocationUpdate record in database
- Updates Delivery record with latest location
- Accepts updates every 3 seconds without rate limiting issues
- Returns 204 No Content on success
- Returns 404 if delivery not found
- Returns 401 if not authorized
- Location updates are persisted for audit trail

### 3.5 Marker Animation
**Acceptance Criteria:**
- Delivery marker smoothly animates between location updates
- Marker rotation updates based on heading
- Animation duration matches time between updates (3 seconds)
- Marker stays on polyline during animation
- Animation uses easing function for smooth motion
- No jank or stuttering during animation

### 3.6 Breadcrumb Trail
**Acceptance Criteria:**
- Previous delivery locations are shown as breadcrumb trail
- Trail shows last 50 location points
- Trail is rendered as polyline with light blue color and 2px weight
- Trail opacity is 50% to distinguish from main route
- Trail updates with each new location
- Trail is cleared when delivery completes

### 3.7 Map Component Integration
**Acceptance Criteria:**
- Map component uses real database listings instead of mock data
- Map component displays all available listings as markers
- Map component updates listings every 5 minutes
- Map component handles claim action and draws route
- Map component handles delivery tracking with 3-second updates
- Map component is responsive and works on mobile
- Map component has no console errors or warnings

### 3.8 Real-Time Tracking UI
**Acceptance Criteria:**
- Delivery tracking page shows current location on map
- Tracking page shows estimated arrival time
- Tracking page shows distance remaining
- Tracking page shows current speed (if available)
- Tracking page shows turn-by-turn directions
- Tracking page updates every 3 seconds
- Tracking page shows delivery status
- Tracking page is accessible to NGO staff and admin

---

## Cross-Cutting Requirements

### 4.1 Security
**Acceptance Criteria:**
- All passwords hashed with bcrypt (12 rounds minimum)
- JWT tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Refresh tokens stored in HTTP-only cookies
- All API endpoints use HTTPS in production
- CORS is properly configured
- All inputs are validated and sanitized
- SQL injection is prevented via Prisma parameterized queries
- XSS is prevented via proper output encoding
- CSRF tokens used for state-changing operations

### 4.2 Audit Logging
**Acceptance Criteria:**
- All authentication attempts logged (success and failure)
- All data modifications logged with user ID and timestamp
- All admin actions logged
- Logs retained for 90 days
- Logs are immutable and tamper-evident
- Logs do not contain sensitive data (passwords, tokens)

### 4.3 Performance
**Acceptance Criteria:**
- API endpoints respond in < 200ms (95th percentile)
- Database queries use appropriate indexes
- Listing queries with nearby search complete in < 500ms
- Location updates processed in < 100ms
- Map markers load in < 1 second
- No N+1 query problems
- Response compression (gzip) enabled

### 4.4 Monitoring & Observability
**Acceptance Criteria:**
- API response times are monitored
- Error rates are monitored and alerted (> 1%)
- Database connection pool is monitored
- Location update delays are monitored (alert if > 5s)
- Google Maps API quota usage is monitored
- All errors are logged with stack traces
- Logs are centralized and searchable

### 4.5 Documentation
**Acceptance Criteria:**
- All API endpoints documented with request/response examples
- Database schema documented with relationships
- Authentication flow documented
- Deployment procedure documented
- Troubleshooting guide provided
- README updated with setup instructions

