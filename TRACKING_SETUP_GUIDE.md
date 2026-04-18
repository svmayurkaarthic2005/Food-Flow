# Real-Time Delivery Tracking - Setup & Testing Guide

## Quick Setup

### 1. Install Dependencies
```bash
cd frontend
npm install socket.io socket.io-client
```

### 2. Generate Prisma Client
```bash
cd frontend
npx prisma generate
```

### 3. Start Development Server
```bash
cd frontend
npm run dev
```

The server should start on `http://localhost:3000`

## Testing the Tracking System

### Option 1: Using the Simulation Tool (Recommended)

1. **Open the simulation tool** in your browser:
   ```
   http://localhost:3000/test-tracking-simulation.html
   ```

2. **Get a delivery ID** from your database:
   - You need an existing delivery record in the database
   - Or create one through the app UI (claim a listing as NGO)

3. **Configure the simulation**:
   - Enter the delivery ID
   - Select route: "Chennai Local" (5 waypoints) or "Chennai Long" (6 waypoints)
   - Set update interval: 2 seconds (recommended)
   - Set simulated speed: 30 km/h (default)

4. **Start simulation**:
   - Click "Start Simulation"
   - Watch the activity log for successful updates

5. **Open NGO tracking page** in another tab:
   ```
   http://localhost:3000/ngo/tracking?id={deliveryId}
   ```

6. **Verify real-time updates**:
   - ✅ Green "Live Updates" badge (WebSocket connected)
   - ✅ Map marker moves in real-time
   - ✅ Route polyline extends
   - ✅ Distance and ETA update
   - ✅ Speed displays
   - ✅ Last update time changes

### Option 2: Using Real GPS (Mobile Device)

1. **Open driver tracking page** on mobile:
   ```
   http://localhost:3000/driver/tracking?id={deliveryId}
   ```

2. **Grant location permissions** when prompted

3. **Start tracking**:
   - Click "Start Tracking"
   - Keep the page open
   - Move around with your device

4. **Open NGO tracking page** on desktop:
   ```
   http://localhost:3000/ngo/tracking?id={deliveryId}
   ```

5. **Watch real-time updates** as you move

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"
**Solution**: Run `npx prisma generate` in the frontend directory

### Error: "Delivery not found"
**Solution**: 
1. Check if delivery exists in database
2. Verify the delivery ID is correct
3. Create a test delivery:
   ```sql
   -- In your PostgreSQL database
   INSERT INTO "Delivery" (id, "claimId", "driverId", "ngoId", status, "createdAt", "updatedAt")
   VALUES ('test-delivery-1', 'claim-id', 'driver-user-id', 'ngo-id', 'IN_TRANSIT', NOW(), NOW());
   ```

### Error: "Unauthorized"
**Solution**: 
1. Make sure you're logged in
2. Verify your user role (must be driver, NGO staff, or admin)
3. Check session in browser DevTools → Application → Cookies

### WebSocket not connecting (Yellow "Polling Mode" badge)
**Solution**:
1. Check browser console for errors
2. Verify Socket.IO is installed: `npm list socket.io`
3. Restart dev server
4. Clear browser cache
5. Try different browser

### Map not loading
**Solution**:
1. Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`
2. Verify API key has Maps JavaScript API enabled
3. Check browser console for API errors
4. Click "Load Interactive Map" button

### GPS not working on mobile
**Solution**:
1. Grant location permissions in browser
2. Use HTTPS (required for geolocation)
3. Check if GPS is enabled on device
4. Try in Chrome/Safari (best support)

## Verification Checklist

### Driver Page (`/driver/tracking`)
- [ ] Page loads without errors
- [ ] Delivery info displays (pickup & destination)
- [ ] "Start Tracking" button works
- [ ] GPS permission prompt appears
- [ ] Location updates counter increases
- [ ] Current speed displays
- [ ] "Stop Tracking" button works

### NGO Page (`/ngo/tracking`)
- [ ] Page loads without errors
- [ ] Delivery details display
- [ ] Map shows (static preview initially)
- [ ] WebSocket connects (green badge)
- [ ] Real-time updates work
- [ ] Map marker moves
- [ ] Route polyline extends
- [ ] Distance updates
- [ ] ETA updates
- [ ] Speed displays
- [ ] Interactive map loads on click

### Simulation Tool
- [ ] Page loads without errors
- [ ] Can enter delivery ID
- [ ] Can select route
- [ ] Can configure speed
- [ ] "Start Simulation" works
- [ ] Activity log shows updates
- [ ] Updates appear in NGO page
- [ ] "Stop Simulation" works

## Database Queries for Testing

### Create Test Delivery
```sql
-- First, get IDs from existing data
SELECT id FROM "User" WHERE role = 'DONOR' LIMIT 1; -- Get donor ID
SELECT id FROM "User" WHERE role = 'NGO' LIMIT 1;   -- Get NGO user ID
SELECT id FROM "Ngo" LIMIT 1;                       -- Get NGO profile ID

-- Create a test listing
INSERT INTO "FoodListing" (
  id, name, description, quantity, category, status,
  address, latitude, longitude, "expiryTime",
  "donorId", "createdAt", "updatedAt"
) VALUES (
  'test-listing-1',
  'Test Food Item',
  'For testing tracking',
  '10 kg',
  'Prepared Food',
  'CLAIMED',
  'Marina Beach, Chennai',
  13.0827,
  80.2707,
  NOW() + INTERVAL '2 hours',
  'donor-id-here',
  NOW(),
  NOW()
);

-- Create a test claim
INSERT INTO "Claim" (
  id, "listingId", "ngoId", status,
  "claimedAt", "updatedAt"
) VALUES (
  'test-claim-1',
  'test-listing-1',
  'ngo-id-here',
  'ACCEPTED',
  NOW(),
  NOW()
);

-- Create a test delivery
INSERT INTO "Delivery" (
  id, "claimId", "driverId", "ngoId", status,
  "createdAt", "updatedAt"
) VALUES (
  'test-delivery-1',
  'test-claim-1',
  'driver-user-id-here',
  'ngo-id-here',
  'IN_TRANSIT',
  NOW(),
  NOW()
);
```

### Check Location Updates
```sql
SELECT 
  id,
  "deliveryId",
  latitude,
  longitude,
  speed,
  timestamp
FROM "LocationUpdate"
WHERE "deliveryId" = 'test-delivery-1'
ORDER BY timestamp DESC
LIMIT 10;
```

### Clean Up Test Data
```sql
DELETE FROM "LocationUpdate" WHERE "deliveryId" = 'test-delivery-1';
DELETE FROM "Delivery" WHERE id = 'test-delivery-1';
DELETE FROM "Claim" WHERE id = 'test-claim-1';
DELETE FROM "FoodListing" WHERE id = 'test-listing-1';
```

## Performance Monitoring

### Check WebSocket Connections
Open browser DevTools → Network → WS (WebSocket) tab
- Should see connection to `/api/socketio`
- Should see `subscribe_tracking` event
- Should see `location_update` events

### Check API Calls
Open browser DevTools → Network → Fetch/XHR tab
- Driver: POST to `/api/driver/location` every 2 seconds
- NGO: GET to `/api/tracking/{id}` every 3 seconds (only if WebSocket fails)

### Monitor Database
```sql
-- Check location update count per delivery
SELECT 
  "deliveryId",
  COUNT(*) as update_count,
  MAX(timestamp) as last_update
FROM "LocationUpdate"
GROUP BY "deliveryId";

-- Should not exceed 100 per delivery (auto-cleanup)
```

## Next Steps After Testing

1. ✅ Verify WebSocket real-time updates work
2. ✅ Verify polling fallback works
3. ✅ Test with multiple concurrent deliveries
4. ✅ Test on mobile devices
5. ✅ Monitor Google Maps API usage
6. ✅ Test error scenarios (network loss, GPS disabled)
7. ✅ Performance test with many location updates
8. 🔄 Add delivery status updates (PENDING → IN_TRANSIT → DELIVERED)
9. 🔄 Add notifications (driver approaching, delivery completed)
10. 🔄 Add Redis adapter for production scaling

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs in terminal
3. Verify database connection
4. Check environment variables
5. Refer to `WEBSOCKET_TRACKING_IMPLEMENTATION.md` for architecture details
