# Driver Role - Quick Testing Guide

## Setup Complete ✅

The DRIVER role has been successfully added to FoodFlow with:
- Database migration applied
- Signup/Signin pages updated
- Driver dashboard created
- Driver API endpoints created
- Route protection implemented
- Role-based redirects configured

## Quick Test Steps

### 1. Create a Driver Account

**Option A: Via UI (Recommended)**
```
1. Open http://localhost:3000/signup
2. Select "Delivery Driver" radio button
3. Fill in:
   - Name: Test Driver
   - Email: driver@test.com
   - Password: testdriver123
   - Confirm Password: testdriver123
4. Click "Create Account"
5. Check email for verification link (or check console logs)
6. Click verification link
7. Login at http://localhost:3000/signin
```

**Option B: Via Database**
```sql
-- Create driver user
INSERT INTO "User" (
  id, email, "passwordHash", name, role, status, "emailVerified", "createdAt", "updatedAt"
) VALUES (
  'driver-test-1',
  'driver@test.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5jtRZvYeWUQhm', -- password: test123
  'Test Driver',
  'DRIVER',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
);
```

### 2. Login as Driver

```
1. Go to http://localhost:3000/signin
2. Select "Delivery Driver" (optional, for OAuth)
3. Enter:
   - Email: driver@test.com
   - Password: testdriver123
4. Click "Sign In"
5. Should automatically redirect to http://localhost:3000/driver
```

### 3. Create Test Delivery

You need an existing claim to create a delivery. Here's a complete setup:

```sql
-- 1. Get IDs
SELECT id, email, role FROM "User" WHERE role = 'DONOR' LIMIT 1;
SELECT id, email, role FROM "User" WHERE role = 'NGO' LIMIT 1;
SELECT id, email, role FROM "User" WHERE role = 'DRIVER' LIMIT 1;
SELECT id FROM "Donor" LIMIT 1;
SELECT id FROM "Ngo" LIMIT 1;

-- 2. Create a test listing
INSERT INTO "FoodListing" (
  id, name, description, quantity, category, status,
  address, latitude, longitude, "expiryTime",
  "donorId", "createdAt", "updatedAt"
) VALUES (
  'test-listing-driver-1',
  'Test Food for Driver',
  'Testing driver delivery',
  '10 kg',
  'Prepared Food',
  'CLAIMED',
  'Marina Beach, Chennai',
  13.0827,
  80.2707,
  NOW() + INTERVAL '2 hours',
  'donor-id-from-step-1',
  NOW(),
  NOW()
);

-- 3. Create a claim
INSERT INTO "Claim" (
  id, "listingId", "ngoId", status,
  "claimedAt", "updatedAt"
) VALUES (
  'test-claim-driver-1',
  'test-listing-driver-1',
  'ngo-id-from-step-1',
  'ACCEPTED',
  NOW(),
  NOW()
);

-- 4. Create a delivery
INSERT INTO "Delivery" (
  id, "claimId", "driverId", "ngoId", status,
  "createdAt", "updatedAt"
) VALUES (
  'test-delivery-driver-1',
  'test-claim-driver-1',
  'driver-id-from-step-1',
  'ngo-id-from-step-1',
  'PENDING',
  NOW(),
  NOW()
);
```

### 4. Test Driver Dashboard

```
1. Login as driver
2. Should see http://localhost:3000/driver
3. Verify:
   ✅ Dashboard shows "Driver Dashboard"
   ✅ Stats cards show: Active Deliveries, Pending, Completed
   ✅ Delivery list shows test delivery
   ✅ "Start Delivery" button visible for PENDING delivery
```

### 5. Test GPS Tracking

```
1. Click "Start Delivery" on pending delivery
2. Should redirect to /driver/tracking?id=test-delivery-driver-1
3. Click "Start Tracking"
4. Grant location permissions
5. Verify:
   ✅ "Tracking Status" shows "ACTIVE"
   ✅ "Location Updates Sent" counter increases
   ✅ "Current Speed" displays
   ✅ No errors in console
```

### 6. Test Real-Time Updates (NGO Side)

```
1. Open new browser tab/window
2. Login as NGO
3. Go to /ngo/tracking?id=test-delivery-driver-1
4. Verify:
   ✅ Map loads
   ✅ "Live Updates" badge shows (green)
   ✅ Driver location marker appears
   ✅ Location updates in real-time
   ✅ Distance and ETA update
```

### 7. Test Authorization

**Test 1: NGO cannot access driver routes**
```
1. Login as NGO
2. Try to access http://localhost:3000/driver
3. Should redirect to http://localhost:3000/ngo
```

**Test 2: NGO cannot call driver API**
```bash
# Get NGO session cookie from browser DevTools
curl -X GET http://localhost:3000/api/driver/deliveries \
  -H "Cookie: next-auth.session-token=YOUR_NGO_SESSION_TOKEN"

# Should return: {"error":"Forbidden - Driver access only"}
```

**Test 3: Driver cannot access NGO routes**
```
1. Login as driver
2. Try to access http://localhost:3000/ngo
3. Should redirect to http://localhost:3000/driver
```

## Verification Checklist

### Signup & Login
- [ ] Driver option appears in signup page
- [ ] Can create account with DRIVER role
- [ ] Email verification works
- [ ] Driver option appears in signin page
- [ ] Can login with driver credentials
- [ ] Redirects to /driver after login

### Driver Dashboard
- [ ] Dashboard loads without errors
- [ ] Shows correct user name
- [ ] Stats cards display numbers
- [ ] Delivery list shows assigned deliveries
- [ ] "Start Delivery" button works
- [ ] "Track" button works

### GPS Tracking
- [ ] Tracking page loads
- [ ] Can start GPS tracking
- [ ] Location updates sent successfully
- [ ] Update counter increases
- [ ] Speed displays
- [ ] Can stop tracking

### Real-Time Updates
- [ ] NGO can see driver location
- [ ] WebSocket connects (green badge)
- [ ] Map marker moves in real-time
- [ ] Distance updates
- [ ] ETA updates

### Authorization
- [ ] Driver can access /driver routes
- [ ] Driver can call /api/driver/* endpoints
- [ ] Non-drivers cannot access driver routes
- [ ] Non-drivers cannot call driver APIs
- [ ] Proper error messages (403 Forbidden)

## Common Issues

### Issue: "Role DRIVER does not exist"
**Solution**: Run `npx prisma migrate dev` in frontend directory

### Issue: Driver not redirected after login
**Solution**: 
1. Clear browser cache and cookies
2. Restart dev server
3. Login again

### Issue: No deliveries showing
**Solution**: Create test delivery with correct driver ID:
```sql
SELECT id FROM "User" WHERE email = 'driver@test.com';
-- Use this ID as driverId in delivery
```

### Issue: GPS not working
**Solution**:
1. Grant location permissions in browser
2. Use HTTPS (required for geolocation)
3. Check browser console for errors

### Issue: WebSocket not connecting
**Solution**:
1. Check if Socket.IO is installed: `npm list socket.io`
2. Restart dev server
3. Clear browser cache

## Database Queries for Testing

### Check driver user
```sql
SELECT id, email, name, role, status, "emailVerified"
FROM "User"
WHERE role = 'DRIVER';
```

### Check deliveries for driver
```sql
SELECT d.id, d.status, d."driverId", u.email as driver_email
FROM "Delivery" d
JOIN "User" u ON d."driverId" = u.id
WHERE u.role = 'DRIVER';
```

### Check location updates
```sql
SELECT 
  lu.id,
  lu."deliveryId",
  lu.latitude,
  lu.longitude,
  lu.speed,
  lu.timestamp,
  d.status as delivery_status
FROM "LocationUpdate" lu
JOIN "Delivery" d ON lu."deliveryId" = d.id
ORDER BY lu.timestamp DESC
LIMIT 10;
```

### Clean up test data
```sql
DELETE FROM "LocationUpdate" WHERE "deliveryId" = 'test-delivery-driver-1';
DELETE FROM "Delivery" WHERE id = 'test-delivery-driver-1';
DELETE FROM "Claim" WHERE id = 'test-claim-driver-1';
DELETE FROM "FoodListing" WHERE id = 'test-listing-driver-1';
DELETE FROM "User" WHERE email = 'driver@test.com';
```

## Success Indicators

✅ Driver can signup and login
✅ Driver sees personalized dashboard
✅ Driver can view assigned deliveries
✅ Driver can start GPS tracking
✅ Location updates sent every 2 seconds
✅ NGO sees real-time driver location
✅ WebSocket connection works (<1s latency)
✅ Polling fallback works (3s interval)
✅ Authorization properly enforced
✅ Google Maps API usage optimized

## Next Steps After Testing

1. ✅ Verify all tests pass
2. 🔄 Add driver profile page
3. 🔄 Add delivery status updates (PENDING → IN_TRANSIT → DELIVERED)
4. 🔄 Add driver assignment UI for admins
5. 🔄 Add driver notifications
6. 🔄 Add delivery history
7. 🔄 Add driver ratings
8. 🔄 Add photo proof of delivery

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs in terminal
3. Verify database connection
4. Check environment variables
5. Refer to `DRIVER_ROLE_IMPLEMENTATION.md` for details
6. Refer to `WEBSOCKET_TRACKING_IMPLEMENTATION.md` for tracking system
