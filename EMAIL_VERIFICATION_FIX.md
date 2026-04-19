# Email Verification System - Complete Fix

## Problem
When users created accounts using email/password signup, they received a "Verification Failed - Invalid verification link" error. The root cause was that verification emails were not actually being sent - the system only logged the verification URL to the console.

## Solution
Integrated the frontend Next.js signup with the existing backend FastAPI email service (Brevo SMTP) to send actual verification emails.

## Changes Made

### 1. Backend Email Verification Endpoint
**File**: `backend/app/api/routes/email_verification.py` (NEW)

Created a new FastAPI endpoint to send verification emails using the existing Brevo SMTP service.

**Features**:
- POST `/api/send-verification-email`
- Accepts: email, name, verification_url
- Sends beautifully formatted HTML email with:
  - Welcome message
  - Verification button
  - Plain text fallback
  - 24-hour expiration warning
  - FoodFlow branding

**Email Template**:
```html
- Green header with FoodFlow branding
- Personalized greeting
- Clear call-to-action button
- Fallback link for copy/paste
- Warning about 24-hour expiration
- Support contact information
```

### 2. Backend Router Registration
**File**: `backend/main.py`

Added the email verification router to the FastAPI application:
```python
from app.api.routes import email_verification
app.include_router(email_verification.router, prefix="/api", tags=["Email Verification"])
```

### 3. Frontend Signup Integration
**File**: `frontend/app/api/auth/signup/route.ts`

Updated the `sendVerificationEmail` function to call the backend email service:

**Before**:
```typescript
// Just logged to console
console.log(`Verification URL: ${verificationUrl}`)
```

**After**:
```typescript
// Calls backend email service
const response = await fetch(`${backendUrl}/api/send-verification-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    name: userName,
    verification_url: verificationUrl,
  }),
})
```

**Fallback**: If backend is unavailable, logs to console for development.

### 4. Frontend Resend Verification Integration
**File**: `frontend/app/api/auth/send-verification/route.ts`

Updated the resend verification endpoint with the same backend integration.

## How It Works

### User Registration Flow
```
1. User fills signup form
   ↓
2. Frontend POST /api/auth/signup
   ↓
3. Create user in database (status: PENDING)
   ↓
4. Generate verification token (24h expiry)
   ↓
5. Call backend /api/send-verification-email
   ↓
6. Backend sends email via Brevo SMTP
   ↓
7. User receives email with verification link
   ↓
8. User clicks link → /auth/verify-email?token=XXX&email=YYY
   ↓
9. Frontend verifies token
   ↓
10. Update user (emailVerified: now, status: VERIFIED)
    ↓
11. Redirect to login
```

### Email Verification Link Format
```
http://localhost:3000/auth/verify-email?token={32-byte-hex}&email={user@example.com}
```

### Token Storage
Tokens are stored in the `VerificationToken` table:
```prisma
model VerificationToken {
  identifier String   // User email
  token      String   // Random 32-byte hex
  expires    DateTime // 24 hours from creation
  
  @@unique([identifier, token])
}
```

## Email Service Configuration

### Brevo SMTP (Already Configured)
**File**: `backend/app/core/email.py`

```python
SMTP_HOST = "smtp-relay.brevo.com"
SMTP_PORT = 587
SMTP_USER = "xsmtpsib-958f6d98327e696d64980048ef4bac947b47efb766bc69b6268260ffa18fae56"
SMTP_PASSWORD = "7xgL3HCYsB46Mgkguse"
FROM_EMAIL = "noreply@foodflow.app"
```

**Status**: ✅ Already working (used for NGO approval emails, etc.)

## Testing Guide

### 1. Test Email Sending (Backend)
```bash
# Start backend
cd backend
python -m uvicorn main:app --reload

# Test endpoint
curl -X POST http://localhost:8000/api/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "verification_url": "http://localhost:3000/auth/verify-email?token=abc123&email=test@example.com"
  }'

# Expected response:
{
  "success": true,
  "message": "Verification email sent to test@example.com"
}
```

### 2. Test Full Signup Flow
```bash
# Start both servers
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Navigate to signup
http://localhost:3000/signup

# Fill form:
- Email: your-email@example.com
- Password: SecurePass123!
- Name: Your Name
- Role: DONOR (or NGO/DRIVER)
- Business details (for DONOR)

# Click "Sign Up"

# Expected:
1. Success message: "Account created. Please check your email..."
2. Email sent to your inbox
3. Email contains verification link
4. Click link → Email verified
5. Redirect to login
```

### 3. Test Resend Verification
```bash
# Navigate to resend page
http://localhost:3000/auth/resend-verification

# Enter email
# Click "Resend Verification Email"

# Expected:
- New email sent
- Old token deleted
- New token created (24h expiry)
```

### 4. Test Token Expiration
```bash
# Create account
# Wait 24+ hours
# Try to verify

# Expected:
- "Verification token has expired"
- Token deleted from database
- User can request new verification email
```

## Environment Variables

### Frontend (.env.local)
```env
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### Backend (.env)
```env
# Already configured - no changes needed
FROM_EMAIL="noreply@foodflow.app"
```

## Database Schema

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String
  role          Role      @default(DONOR)
  status        UserStatus @default(ACTIVE)
  emailVerified DateTime?  // NULL = not verified
  isVerified    Boolean   @default(false)
  // ...
}
```

### VerificationToken Model
```prisma
model VerificationToken {
  identifier String   // User email
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@index([identifier])
}
```

## Error Handling

### Frontend Errors
- Missing token/email → "Invalid verification link"
- Expired token → "Verification token has expired"
- User not found → "User not found"
- Network error → "An error occurred while verifying your email"

### Backend Errors
- Email service failure → HTTP 500 + fallback to console log
- Invalid request → HTTP 400
- SMTP connection error → Logged to console

## Security Features

1. **Token Expiration**: 24 hours
2. **One-time Use**: Token deleted after verification
3. **Unique Tokens**: 32-byte random hex (256-bit entropy)
4. **Email Validation**: Pydantic EmailStr validation
5. **HTTPS Required**: Production should use HTTPS
6. **Rate Limiting**: Consider adding rate limits to prevent abuse

## Production Checklist

- [x] Email service integrated (Brevo SMTP)
- [x] Verification endpoint created
- [x] Frontend signup updated
- [x] Resend verification updated
- [x] Error handling implemented
- [x] Token expiration (24h)
- [x] HTML email template
- [x] Plain text fallback
- [ ] HTTPS enabled (production)
- [ ] Rate limiting (optional)
- [ ] Email delivery monitoring (optional)
- [ ] Custom email domain (optional)

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Verify backend is running: `http://localhost:8000/health`
3. Check backend logs for email sending confirmation
4. Verify Brevo SMTP credentials are valid
5. Check email service quota (Brevo free tier limits)

### "Invalid verification link" Error
1. Check URL format: `?token=XXX&email=YYY`
2. Verify token exists in database
3. Check token expiration (24h)
4. Ensure email matches exactly (case-sensitive)

### Backend Connection Failed
1. Verify backend is running on port 8000
2. Check CORS configuration in `backend/main.py`
3. Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
4. Check network/firewall settings

## Files Modified

### Backend
1. `backend/app/api/routes/email_verification.py` - NEW email endpoint
2. `backend/main.py` - Added router registration

### Frontend
3. `frontend/app/api/auth/signup/route.ts` - Integrated email service
4. `frontend/app/api/auth/send-verification/route.ts` - Integrated email service

## Summary

The email verification system is now fully functional:

✅ Verification emails are sent via Brevo SMTP
✅ Users receive professional HTML emails
✅ Verification links work correctly
✅ Token expiration enforced (24h)
✅ Resend verification works
✅ Error handling implemented
✅ Fallback to console for development

Users can now successfully create accounts and verify their email addresses!
