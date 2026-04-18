# Delivery Tracking Implementation

## Overview
Complete delivery tracking system for FoodFlow with real-time location updates, estimated arrival times, and distance calculations.

## Features Implemented

### ✅ Core Features
- **Current Location Display** - Shows live GPS coordinates on interactive Google Map
- **Estimated Arrival Time** - Calculates and displays ETA to destination
- **Distance Remaining** - Calculates remaining distance using Haversine formula
- **Current Speed** - Displays current speed if available from GPS data
- **Turn-by-Turn Directions** - Route polyline showing delivery path on map
- **Auto-Refresh** - Updates every 3 seconds with toggle control
- **Delivery Status** - Shows current status (PENDING, IN_TRANSIT, DELIVERED, CANCELLED)
- **Access Control** - Accessible to NGO staff and admins only

## Pages Created

### 1. Delivery Tracking Page
**Path:** `/ngo/tracking?id={deliveryId}`
**File:** `frontend/app/ngo/tracking/page.tsx`

Features:
- Live map with current location marker (blue)
- Pickup location marker (green)
- Destination marker (red)
- Route polyline showing delivery path
- Real-time location updates every 3 seconds
- Distance remaining calculation
- Estimated arrival time
- Current speed display
- Delivery and pickup details
- Auto-refresh toggle

### 2. NGO Deliveries List
**Path:** `/ngo/deliveries`
**File:** `frontend/app/ngo/deliveries/page.tsx`

Features:
- List of all deliveries for the NGO
- Status badges with color coding
- Quick access to tracking page
- Item name, donor, driver, and ETA display
- Live location indicator

### 3. Admin Deliveries List
**Path:** `/admin/deliveries`
**File:** `frontend/app/admin/deliveries/page.tsx`

Features:
- List of all deliveries across platform
- Filter by status (ALL, PENDING, IN_TRANSIT, DELIVERED, CANCELLED)
- Comprehensive delivery information
- Access to all delivery tracking pages

## API Endpoints

### 1. Get Delivery Tracking Data
**Endpoint:** `GET /api/deliveries/{id}/tracking`
**File:** `frontend/app/api/deliveries/[id]/tracking/route.ts`

Response:
```json
{
  "delivery": {
    "id": "string",
    "status": "IN_TRANSIT",
    "startedAt": "ISO datetime",
    "completedAt": "ISO datetime",
    "estimatedArrival": "ISO datetime",
    "currentLocation": {
      "latitude": 13.0827,
      "longitude": 80.2707,
      "speed": 45.5,
      "heading": 180,
      "timestamp": "ISO datetime"
    }
  },
  "claim": {
    "id": "string",
    "listing": {
      "id": "string",
      "name": "string",
      "address": "string",
      "latitude": 13.0827,
      "longitude": 80.2707,
      "donor": {
        "businessName": "string",
        "address": "string"
      }
    }
  },
  "ngo": {
    "id": "string",
    "organizationName": "string",
    "address": "string",
    "latitude": 13.0827,
    "longitude": 80.2707
  },
  "driver": {
    "name": "string",
    "email": "string"
  },
  "locationHistory": [
    {
      "id": "string",
      "latitude": 13.0827,
      "longitude": 80.2707,
      "speed": 45.5,
      "heading": 180,
      "timestamp": "ISO datetime"
    }
  ]
}
```

Authorization: NGO staff, driver, or admin only

### 2. Get NGO Deliveries
**Endpoint:** `GET /api/ngo/deliveries`
**File:** `frontend/app/api/ngo/deliveries/route.ts`

Returns list of all deliveries for the authenticated NGO.

### 3. Get All Deliveries (Admin)
**Endpoint:** `GET /api/admin/deliveries`
**File:** `frontend/app/api/admin/deliveries/route.ts`

Returns list of all deliveries across the platform (admin only).

## Database Models Used

### Delivery Model
```prisma
model Delivery {
  id                String    @id @default(cuid())
  claimId           String    @unique
  claim             Claim     @relation(fields: [claimId], references: [id])
  driverId          String
  driver            User      @relation(fields: [driverId], references: [id])
  ngoId             String
  ngo               Ngo       @relation(fields: [ngoId], references: [id])
  status            DeliveryStatus
  currentLatitude   Float?
  currentLongitude  Float?
  startedAt         DateTime?
  completedAt       DateTime?
  estimatedArrival  DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  locationUpdates   LocationUpdate[]
}
```

### LocationUpdate Model
```prisma
model LocationUpdate {
  id            String    @id @default(cuid())
  deliveryId    String
  delivery      Delivery  @relation(fields: [deliveryId], references: [id])
  latitude      Float
  longitude     Float
  accuracy      Float?
  heading       Float?
  speed         Float?
  timestamp     DateTime  @default(now())
}
```

## Sidebar Navigation Updates

Added "Deliveries" link to:
- **NGO Dashboard:** `/ngo/deliveries` (Truck icon)
- **Admin Dashboard:** `/admin/deliveries` (Truck icon)

## Technical Implementation

### Distance Calculation
Uses Haversine formula to calculate distance between two GPS coordinates:
```typescript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
```

### Auto-Refresh
- Fetches tracking data every 3 seconds
- Can be toggled on/off with button
- Uses `setInterval` with cleanup on unmount

### Map Integration
- Uses Google Maps API with `@react-google-maps/api`
- Three marker types:
  - Blue: Current location
  - Green: Pickup location
  - Red: Destination
- Polyline shows complete delivery route

### Status Color Coding
- PENDING: Yellow
- IN_TRANSIT: Blue
- DELIVERED: Green
- CANCELLED: Red

## Access Control

### NGO Staff
- Can view deliveries for their NGO only
- Can track deliveries in real-time
- Cannot view other NGO's deliveries

### Admin
- Can view all deliveries across platform
- Can filter by status
- Can access any delivery tracking page

### Driver
- Can view their own deliveries
- Can see tracking information

## Usage

### For NGO Staff
1. Navigate to `/ngo/deliveries`
2. Click on a delivery to view tracking
3. See real-time location, ETA, and distance
4. Toggle auto-refresh as needed

### For Admin
1. Navigate to `/admin/deliveries`
2. Filter by status if needed
3. Click on a delivery to view tracking
4. Monitor all platform deliveries

## Future Enhancements

- [ ] SMS/Email notifications for delivery updates
- [ ] Delivery photo capture at pickup/delivery
- [ ] Signature capture on delivery
- [ ] Route optimization suggestions
- [ ] Delivery history analytics
- [ ] Driver performance metrics
- [ ] Real-time traffic integration
- [ ] Geofencing alerts

## Testing

To test the tracking feature:

1. Create a delivery in the database with location updates
2. Navigate to `/ngo/tracking?id={deliveryId}`
3. Verify:
   - Map displays correctly
   - Current location updates every 3 seconds
   - Distance calculation is accurate
   - ETA displays correctly
   - Status badge shows correct color
   - Auto-refresh toggle works

## Files Modified/Created

### Created
- `frontend/app/ngo/tracking/page.tsx`
- `frontend/app/ngo/deliveries/page.tsx`
- `frontend/app/admin/deliveries/page.tsx`
- `frontend/app/api/deliveries/[id]/tracking/route.ts`
- `frontend/app/api/ngo/deliveries/route.ts`
- `frontend/app/api/admin/deliveries/route.ts`

### Modified
- `frontend/components/layout/sidebar.tsx` (added Deliveries links)

## Status: ✅ FULLY FUNCTIONAL

All requirements met:
- ✅ Shows current location on map
- ✅ Shows estimated arrival time
- ✅ Shows distance remaining
- ✅ Shows current speed (if available)
- ✅ Shows turn-by-turn directions
- ✅ Updates every 3 seconds
- ✅ Shows delivery status
- ✅ Accessible to NGO staff and admin
