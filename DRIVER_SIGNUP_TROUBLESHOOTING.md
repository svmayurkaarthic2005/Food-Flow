# Driver Signup/Signin Troubleshooting Guide

## Quick Test

1. Open `test-driver-signup.html` in your browser
2. Click "Test Signup" button
3. Check if it creates a driver user successfully

## Common Issues & Fixes

### Issue 1: "Access Denied" Error

**Cause:** Prisma client not regenerated after adding DRIVER role

**Fix:**
```bash
cd frontend
npx prisma generate
```

If you get a file lock error, restart your dev server first.

---

### Issue 2: Database Schema Out of Sync

**Check if DRIVER role exists in database:**
```sql
-- Connect to PostgreSQL
psql -U postgres -d Food_donation

-- Check the Role enum
SELECT unnest(enum_range(NULL::public."Role"));
```

**Expected output:**
```
DONOR
NGO
ADMIN
DRIVER
```

**If DRIVER is missing, run:**
```bash
cd frontend
npx prisma db push
```

---

### Issue 3: Signup API Not Handling DRIVER Role

**File:** `frontend/app/api/auth/signup/route.ts`

**Check this code exists:**
```typescript
} else if (role === 'DRIVER') {
  // Driver role doesn't need a separate profile table
  console.log('Creating driver user:', email)
}
```

**Status:** ✅ Already fixed in commit d8d16e6

---

### Issue 4: Middleware Blocking Driver Routes

**File:** `frontend/middleware.ts`

**Check this code exists:**
```typescript
// Protect driver routes
if (path.startsWith('/driver')) {
  if (token?.role !== 'DRIVER') {
    return NextResponse.redirect(new URL('/signin', req.url));
  }
}
```

**Status:** ✅ Already configured

---

### Issue 5: Driver Dashboard Missing

**File:** `frontend/app/driver/page.tsx`

**Status:** ✅ Already exists

---

## Step-by-Step Verification

### 1. Check Prisma Schema
```bash
cd frontend
cat prisma/schema.prisma | grep -A 5 "enum Role"
```

**Expected:**
```prisma
enum Role {
  DONOR
  NGO
  ADMIN
  DRIVER
}
```

### 2. Regenerate Prisma Client
```bash
cd frontend
npx prisma generate
```

### 3. Push Schema to Database
```bash
cd frontend
npx prisma db push
```

### 4. Restart Dev Server
```bash
cd frontend
npm run dev
```

### 5. Test Signup

**Option A: Use Test Page**
1. Open `test-driver-signup.html` in browser
2. Click "Test Signup"
3. Check result

**Option B: Use Signup Page**
1. Go to http://localhost:3000/signup
2. Select "Delivery Driver"
3. Fill in details:
   - Name: Test Driver
   - Email: driver@test.com
   - Password: password123
4. Click "Create Account"

### 6. Test Signin

1. Go to http://localhost:3000/signin
2. Select "Delivery Driver"
3. Enter credentials
4. Click "Sign In"
5. Should redirect to `/driver` dashboard

---

## Database Verification

### Check if driver user was created:
```sql
SELECT id, email, name, role, "emailVerified", status 
FROM public."User" 
WHERE role = 'DRIVER';
```

### Manually create a driver user (if needed):
```sql
INSERT INTO public."User" (
  id, email, name, "passwordHash", role, status, "emailVerified", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'driver@test.com',
  'Test Driver',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7BlNBpoV3O', -- password: password123
  'DRIVER',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
);
```

---

## Console Errors to Ignore

These are normal and don't affect driver signup:
- ✅ "Removing unpermitted intrinsics" - SES security features
- ✅ "Google Maps API loaded without async" - Maps still work
- ✅ "Content Security Policy" warnings - Already fixed with CSP headers
- ✅ "Font preload warnings" - Minor optimization, not critical
- ✅ "Source map errors" - Development only, doesn't affect functionality

---

## Still Not Working?

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to signup as driver
4. Look for errors in red

### Common Console Errors:

**"Invalid enum value"**
- Prisma client not regenerated
- Run: `npx prisma generate`

**"Unique constraint failed"**
- Email already exists
- Use a different email or delete the existing user

**"Cannot read properties of undefined"**
- Check if all required fields are filled
- Check browser console for exact error

### Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try to signup
4. Click on the `/api/auth/signup` request
5. Check:
   - Request payload (should include `role: "DRIVER"`)
   - Response status (should be 201 for success)
   - Response body (check for error messages)

---

## Success Checklist

- [ ] Prisma schema has DRIVER in Role enum
- [ ] Prisma client regenerated (`npx prisma generate`)
- [ ] Database schema updated (`npx prisma db push`)
- [ ] Dev server restarted
- [ ] Signup API handles DRIVER role
- [ ] Middleware allows /driver routes for DRIVER role
- [ ] Driver dashboard exists at /driver/page.tsx
- [ ] Can create driver user via test page
- [ ] Can signup as driver via signup page
- [ ] Can signin as driver via signin page
- [ ] Redirects to /driver dashboard after signin

---

## Quick Fix Commands

Run these in order if driver signup isn't working:

```bash
# 1. Navigate to frontend
cd frontend

# 2. Regenerate Prisma client
npx prisma generate

# 3. Push schema to database
npx prisma db push

# 4. Restart dev server
# Press Ctrl+C to stop current server, then:
npm run dev
```

Then try signing up as a driver again!
