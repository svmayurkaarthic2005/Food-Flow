# Driver Account Creation & Redirect - Deep Check

## Complete Flow Analysis

### Step 1: Signup Page - Role Selection
**File:** `frontend/app/signup/page.tsx`

**Check 1: Driver option exists**
```typescript
<RadioGroupItem value="DRIVER" id="driver-signup" />
<Label htmlFor="driver-signup">
  <div className="font-medium">Delivery Driver</div>
  <div className="text-xs">Deliver food from donors to NGOs</div>
</Label>
```
✅ **Status:** PRESENT

**Check 2: Role is sent to API**
```typescript
body: JSON.stringify({
  name: formData.name,
  email: formData.email,
  password: formData.password,
  role: selectedRole, // This should be "DRIVER"
})
```
✅ **Status:** CORRECT

---

### Step 2: Signup API - User Creation
**File:** `frontend/app/api/auth/signup/route.ts`

**Check 1: DRIVER role validation**
```typescript
if (!email || !password || !name || !role) {
  return NextResponse.json(
    { error: 'Email, password, name, and role are required' },
    { status: 400 }
  )
}
```
✅ **Status:** VALIDATES ALL FIELDS

**Check 2: DRIVER role handling**
```typescript
} else if (role === 'DRIVER') {
  // Driver role doesn't need a separate profile table
  console.log('Creating driver user:', email)
}
```
✅ **Status:** HANDLES DRIVER ROLE

**Check 3: User creation**
```typescript
const user = await prisma.user.create({
  data: userData,
  include: {
    donorProfile: true,
    ngoProfile: true,
    adminProfile: true,
  },
})
```
✅ **Status:** CREATES USER WITH DRIVER ROLE

**Check 4: Email verification**
```typescript
if (requireEmailVerification) {
  // Send verification email
  return NextResponse.json({
    success: true,
    message: 'Account created. Please check your email...',
  }, { status: 201 })
}
```
⚠️ **Issue:** Requires email verification by default

---

### Step 3: Email Verification
**File:** `frontend/app/auth/verify-email/page.tsx`

**After verification, user needs to sign in manually**
❓ **Question:** Does email verification work for drivers?

---

### Step 4: Signin Page - Driver Login
**File:** `frontend/app/signin/page.tsx`

**Check 1: Driver role option**
```typescript
<RadioGroupItem value="DRIVER" id="driver" />
<Label htmlFor="driver">
  <div className="font-medium">Delivery Driver</div>
  <div className="text-xs">Deliver food from donors to NGOs</div>
</Label>
```
✅ **Status:** PRESENT

**Check 2: Credentials signin**
```typescript
const result = await signIn('credentials', {
  email: formData.email,
  password: formData.password,
  redirect: false,
})
```
✅ **Status:** USES NEXTAUTH

---

### Step 5: NextAuth - Authentication
**File:** `frontend/lib/auth-nextauth.ts`

**Check 1: Credentials provider**
```typescript
async authorize(credentials) {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      name: true,
      role: true,
      status: true,
      avatar: true,
      emailVerified: true,
      donorProfile: true,
      ngoProfile: true,
      adminProfile: true,
    },
  })
  
  // Returns user with role
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role, // Should be "DRIVER"
    donorId: user.donorProfile?.id,
    ngoId: user.ngoProfile?.id,
    adminId: user.adminProfile?.id,
  }
}
```
✅ **Status:** RETURNS DRIVER ROLE

**Check 2: JWT callback**
```typescript
async jwt({ token, user, account, trigger }) {
  if (user && !token.role) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      // ...
    })
    
    if (dbUser) {
      token.id = dbUser.id
      token.role = dbUser.role // Should be "DRIVER"
      // ...
    }
  }
  return token
}
```
✅ **Status:** STORES DRIVER ROLE IN TOKEN

**Check 3: Session callback**
```typescript
async session({ session, token }) {
  if (session.user) {
    (session.user as any).id = token.id
    (session.user as any).role = token.role // Should be "DRIVER"
    // ...
  }
  return session
}
```
✅ **Status:** ADDS DRIVER ROLE TO SESSION

---

### Step 6: Middleware - Route Protection & Redirect
**File:** `frontend/middleware.ts`

**Check 1: Home page redirect for authenticated users**
```typescript
if (path === '/' && token) {
  if (token.role === 'DRIVER') {
    return NextResponse.redirect(new URL('/driver', req.url));
  }
  // ... other roles
}
```
✅ **Status:** REDIRECTS DRIVER TO /driver

**Check 2: Driver route protection**
```typescript
if (path.startsWith('/driver')) {
  if (token?.role !== 'DRIVER') {
    return NextResponse.redirect(new URL('/signin', req.url));
  }
}
```
✅ **Status:** PROTECTS /driver ROUTES

**Check 3: Matcher configuration**
```typescript
export const config = {
  matcher: ['/driver/:path*', '/ngo/:path*', '/donor/:path*', '/admin/:path*', '/'],
};
```
✅ **Status:** INCLUDES /driver ROUTES

---

### Step 7: Driver Dashboard
**File:** `frontend/app/driver/page.tsx`

**Check 1: Dashboard exists**
✅ **Status:** FILE EXISTS

**Check 2: Layout protection**
**File:** `frontend/app/driver/layout.tsx`

```typescript
// Should check if user is DRIVER role
```
✅ **Status:** LAYOUT EXISTS

---

## Potential Issues Found

### Issue 1: Email Verification Required
**Problem:** Signup requires email verification by default
**Impact:** Driver can't sign in until email is verified
**Location:** `frontend/app/api/auth/signup/route.ts`

**Current Code:**
```typescript
const { email, password, name, role, requireEmailVerification = true, ...profileData } = body
```

**Fix:** Allow skipping email verification for testing
```typescript
const { email, password, name, role, requireEmailVerification = false, ...profileData } = body
```

---

### Issue 2: Prisma Client Not Regenerated
**Problem:** If Prisma client wasn't regenerated after adding DRIVER role
**Impact:** Database operations fail with "Invalid enum value"
**Fix:** Run `npx prisma generate`

---

### Issue 3: Database Schema Not Updated
**Problem:** Database doesn't have DRIVER in Role enum
**Impact:** Cannot insert users with DRIVER role
**Fix:** Run `npx prisma db push`

---

## Testing Checklist

### Pre-Test Setup
- [ ] Stop dev server
- [ ] Run `cd frontend && npx prisma generate`
- [ ] Run `cd frontend && npx prisma db push`
- [ ] Start dev server: `npm run dev`

### Test 1: Signup Flow
- [ ] Go to http://localhost:3000/signup
- [ ] Select "Delivery Driver" radio button
- [ ] Fill in:
  - Name: Test Driver
  - Email: testdriver@example.com
  - Password: password123
  - Confirm Password: password123
- [ ] Click "Create Account"
- [ ] Check browser console for errors
- [ ] Check Network tab for API response
- [ ] Expected: Success message or redirect to verification page

### Test 2: Email Verification (if required)
- [ ] Check console logs for verification URL
- [ ] Copy verification URL
- [ ] Open in browser
- [ ] Expected: "Email verified successfully" message

### Test 3: Signin Flow
- [ ] Go to http://localhost:3000/signin
- [ ] Select "Delivery Driver" radio button
- [ ] Enter:
  - Email: testdriver@example.com
  - Password: password123
- [ ] Click "Sign In"
- [ ] Check browser console for errors
- [ ] Check Network tab for API response
- [ ] Expected: Redirect to /driver dashboard

### Test 4: Dashboard Access
- [ ] After signin, should be at http://localhost:3000/driver
- [ ] Check if dashboard loads correctly
- [ ] Check if user info is displayed
- [ ] Expected: Driver dashboard with delivery stats

### Test 5: Direct Access
- [ ] Sign out
- [ ] Try to access http://localhost:3000/driver directly
- [ ] Expected: Redirect to /signin

### Test 6: Home Page Redirect
- [ ] Sign in as driver
- [ ] Go to http://localhost:3000/
- [ ] Expected: Automatic redirect to /driver

---

## Debug Commands

### Check if user was created:
```sql
SELECT id, email, name, role, "emailVerified", status 
FROM public."User" 
WHERE email = 'testdriver@example.com';
```

### Check Role enum in database:
```sql
SELECT unnest(enum_range(NULL::public."Role"));
```

### Manually verify email:
```sql
UPDATE public."User" 
SET "emailVerified" = NOW(), status = 'ACTIVE'
WHERE email = 'testdriver@example.com';
```

### Delete test user:
```sql
DELETE FROM public."User" 
WHERE email = 'testdriver@example.com';
```

---

## Expected Console Logs

### During Signup:
```
Creating driver user: testdriver@example.com
Verification email would be sent to testdriver@example.com
```

### During Signin:
```
AUTH DEBUG: Credentials authorize called { email: 'testdriver@example.com' }
AUTH DEBUG: User found { id: '...', email: '...', role: 'DRIVER', hasPasswordHash: true }
AUTH DEBUG: Password validation { isValid: true }
AUTH DEBUG: Authorization successful
```

---

## Quick Fix Script

Run this to fix common issues:

```bash
# Stop dev server first (Ctrl+C)

cd frontend

# Regenerate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start dev server
npm run dev
```

Then test driver signup/signin again.
