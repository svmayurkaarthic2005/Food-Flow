# FoodFlow API Documentation

This document outlines the API structure for the FoodFlow platform. The backend is ready for integration.

## Base URL

```
https://api.foodflow.io/v1
https://localhost:3000/api (development)
```

## Authentication

All API endpoints require authentication using JWT tokens.

```bash
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "donor|ngo|admin"
}

Response: 201 Created
{
  "user": { ... },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

#### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response: 200 OK
{
  "user": { ... },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}

Response: 200 OK
{
  "token": "new_jwt_token"
}
```

## Donor Endpoints

### Get Donor Dashboard
```http
GET /api/donor/dashboard
Authorization: Bearer <token>

Response: 200 OK
{
  "stats": {
    "totalDonated": 2847,
    "activeListings": 48,
    "ngoHelped": 12,
    "impactScore": 9.2
  },
  "recentDonations": [ ... ],
  "aiInsights": [ ... ]
}
```

### Create Donation
```http
POST /api/donor/listings
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemType": "bread",
  "quantity": 50,
  "unit": "kg",
  "expiryTime": "2024-01-20T18:00:00Z",
  "pickupLocation": {
    "lat": 45.5152,
    "lng": -122.6784,
    "address": "123 Main St"
  },
  "description": "Fresh baked goods from today",
  "images": [ "url1", "url2" ]
}

Response: 201 Created
{
  "id": "listing_123",
  "status": "active",
  "createdAt": "2024-01-20T12:00:00Z",
  ...
}
```

### Get Donor Listings
```http
GET /api/donor/listings?status=active&sort=latest
Authorization: Bearer <token>

Response: 200 OK
{
  "listings": [ ... ],
  "pagination": {
    "page": 1,
    "total": 48,
    "limit": 20
  }
}
```

### Get Listing Details
```http
GET /api/donor/listings/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "listing_123",
  "itemType": "bread",
  "quantity": 50,
  "claims": [
    {
      "id": "claim_1",
      "ngoId": "ngo_456",
      "status": "claimed",
      "claimedAt": "2024-01-20T14:30:00Z"
    }
  ],
  ...
}
```

### Update Listing
```http
PATCH /api/donor/listings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 40,
  "expiryTime": "2024-01-20T20:00:00Z"
}

Response: 200 OK
{ ... }
```

### Delete Listing
```http
DELETE /api/donor/listings/:id
Authorization: Bearer <token>

Response: 204 No Content
```

### Get Donation History
```http
GET /api/donor/history?limit=20&offset=0
Authorization: Bearer <token>

Response: 200 OK
{
  "history": [
    {
      "id": "listing_1",
      "itemType": "bread",
      "quantity": 50,
      "status": "claimed",
      "claimedBy": "Hope Center",
      "claimedAt": "2024-01-20T14:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

## NGO Endpoints

### Get NGO Dashboard
```http
GET /api/ngo/dashboard
Authorization: Bearer <token>

Response: 200 OK
{
  "stats": {
    "totalReceived": 1847,
    "activeDonors": 89,
    "peopleServed": 3421,
    "rating": 9.5
  },
  "nearbyListings": [ ... ],
  "storageSatus": {
    "capacity": 500,
    "current": 340,
    "percentUsed": 68
  }
}
```

### Get Nearby Listings
```http
GET /api/ngo/listings?lat=45.5152&lng=-122.6784&radius=5
Authorization: Bearer <token>

Response: 200 OK
{
  "listings": [
    {
      "id": "listing_123",
      "itemType": "bread",
      "quantity": 50,
      "distance": 2.3,
      "expiryIn": "4 hours",
      "urgency": "high"
    }
  ]
}
```

### Claim Listing
```http
POST /api/ngo/listings/:id/claim
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickupTime": "2024-01-20T15:00:00Z",
  "assignedStaff": "staff_user_id"
}

Response: 201 Created
{
  "claimId": "claim_456",
  "status": "claimed",
  "claimedAt": "2024-01-20T12:30:00Z"
}
```

### Get Optimized Route
```http
POST /api/ngo/routes/optimize
Authorization: Bearer <token>
Content-Type: application/json

{
  "claimIds": ["claim_1", "claim_2", "claim_3"],
  "startLocation": { "lat": 45.5, "lng": -122.6 },
  "vehicles": 2
}

Response: 200 OK
{
  "routes": [
    {
      "vehicleId": "vehicle_1",
      "stops": [
        {
          "claimId": "claim_1",
          "eta": "14:30",
          "distance": 2.3
        }
      ],
      "totalDistance": 15.2,
      "totalTime": 45
    }
  ]
}
```

### Get Demand Forecast
```http
GET /api/ngo/forecasts?days=30
Authorization: Bearer <token>

Response: 200 OK
{
  "forecast": [
    {
      "date": "2024-01-20",
      "expectedDemand": 250,
      "expectedSupply": 280,
      "confidence": 0.92
    }
  ]
}
```

## Admin Endpoints

### Get Admin Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <token>

Response: 200 OK
{
  "stats": {
    "totalUsers": 2300,
    "totalDonations": 45000,
    "totalRecipients": 127340,
    "systemUptime": 99.9
  },
  "recentActivity": [ ... ],
  "alerts": [ ... ]
}
```

### List Users
```http
GET /api/admin/users?role=donor&status=active&page=1&limit=50
Authorization: Bearer <token>

Response: 200 OK
{
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "donor",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 1500,
    "limit": 50
  }
}
```

### Update User Status
```http
PATCH /api/admin/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "suspended|active|verified",
  "reason": "Optional reason"
}

Response: 200 OK
{ ... }
```

### Moderate Listing
```http
PATCH /api/admin/listings/:id/moderate
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve|reject|remove",
  "reason": "Optional reason"
}

Response: 200 OK
{
  "id": "listing_123",
  "status": "approved",
  "moderatedAt": "2024-01-20T12:30:00Z"
}
```

### Get Platform Analytics
```http
GET /api/admin/analytics?startDate=2024-01-01&endDate=2024-01-31&metric=all
Authorization: Bearer <token>

Response: 200 OK
{
  "totalFoodDonated": 45000,
  "totalRecipients": 127340,
  "carbonSaved": 23.5,
  "activeUsers": {
    "donors": 1500,
    "ngos": 87,
    "admins": 5
  },
  "topPerformers": [
    {
      "name": "Green Valley Bakery",
      "donated": 2847,
      "impact": 9.2
    }
  ]
}
```

### Get ML Insights
```http
GET /api/admin/ml-insights?model=matching|routing|demand
Authorization: Bearer <token>

Response: 200 OK
{
  "model": "matching",
  "accuracy": 0.94,
  "precision": 0.91,
  "recall": 0.89,
  "improvements": [
    {
      "suggestion": "Increase training data for perishables",
      "impact": "High",
      "eta": "2 weeks"
    }
  ]
}
```

## User Endpoints

### Get Profile
```http
GET /api/users/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "donor",
  "avatar": "https://...",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Update Profile
```http
PATCH /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "avatar": "image_url"
}

Response: 200 OK
{ ... }
```

### Get Settings
```http
GET /api/users/settings
Authorization: Bearer <token>

Response: 200 OK
{
  "notifications": {
    "email": true,
    "push": true,
    "sms": false
  },
  "preferences": {
    "theme": "system",
    "language": "en"
  }
}
```

### Update Settings
```http
PATCH /api/users/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "notifications": {
    "email": true,
    "push": false
  }
}

Response: 200 OK
{ ... }
```

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_CREDENTIALS | 401 | Email or password incorrect |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input data |
| SERVER_ERROR | 500 | Internal server error |
| RATE_LIMITED | 429 | Too many requests |

## Rate Limiting

All endpoints are rate limited:

```
Rate Limit: 1000 requests per hour
Rate Limit Reset: X-Rate-Limit-Reset header
```

## Pagination

List endpoints support pagination:

```
GET /api/donor/listings?page=1&limit=20&sort=latest
```

Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (default: latest)

## Webhooks

### Setup Webhook
```http
POST /api/admin/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-domain.com/webhook",
  "events": ["listing.created", "claim.made", "user.verified"]
}

Response: 201 Created
{
  "id": "webhook_123",
  "url": "https://your-domain.com/webhook",
  "secret": "webhook_secret"
}
```

### Webhook Payload

```json
{
  "id": "event_123",
  "type": "listing.created",
  "timestamp": "2024-01-20T12:30:00Z",
  "data": {
    "listing": { ... }
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { FoodFlowAPI } from '@foodflow/sdk'

const client = new FoodFlowAPI({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.foodflow.io/v1'
})

// Create donation
const listing = await client.donor.createListing({
  itemType: 'bread',
  quantity: 50
})

// Get nearby listings
const nearby = await client.ngo.getNearbyListings({
  lat: 45.5152,
  lng: -122.6784
})
```

### Python

```python
from foodflow import FoodFlowAPI

client = FoodFlowAPI(api_key='your_api_key')

# Create donation
listing = client.donor.create_listing(
    item_type='bread',
    quantity=50
)

# Claim listing
claim = client.ngo.claim_listing(
    listing_id=listing['id'],
    pickup_time='2024-01-20T15:00:00Z'
)
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

For questions or support, email api-support@foodflow.io
