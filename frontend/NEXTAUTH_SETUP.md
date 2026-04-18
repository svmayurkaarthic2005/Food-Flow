# NextAuth.js Setup Guide for FoodFlow

This document provides instructions for setting up and using NextAuth.js with email verification and Google OAuth in the FoodFlow application.

## Overview

The FoodFlow application now supports multiple authentication methods:
1. **Email/Password Authentication** - Traditional email and password login with email verification
2. **Google OAuth** - Sign in with Google account (auto-verified)
3. **JWT Tokens** - Backward compatible with existing JWT-based authentication

## Installation

NextAuth.js dependencies have been installed:
```bash
npm install next-auth@latest @auth/prisma-adapter @auth/core
```

## Database Schema Updates

The Prisma schema has been updated with the following new models required by NextAuth.js:

### Account Model
Stores OAuth provider account information:
```prisma
model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}
```

### Session Model
Stores user sessions:
```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### VerificationToken Model
Stores email verification tokens:
```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@index([identifier])
}
```

### User Model Updates
- Added `emailVerified` field (DateTime, nullable)
- Made `passwordHash` optional (for OAuth users)
- Added relations to Account and Session models

## Configuration

### Environment Variables

Add the following to your `.env` and `.env.local` files:

```env
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-change-in-production"

# Google OAuth (get these from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# JWT Configuration (for backward compatibility)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
REFRESH_TOKEN_SECRET="your-super-secret-refresh-token-key-change-in-production"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy the Client ID and Client Secret to your environment variables

## Files Created/Modified

### New Files

1. **`lib/auth-nextauth.ts`**
   - NextAuth configuration with Credentials and Google providers
   - JWT and session callbacks for role-based access
   - Prisma adapter configuration

2. **`app/api/auth/[...nextauth]/route.ts`**
   - NextAuth API route handler

3. **`app/api/auth/verify-email/route.ts`**
   - Email verification endpoint
   - Validates verification tokens and marks email as verified

4. **`app/api/auth/send-verification/route.ts`**
   - Sends verification emails
   - Generates verification tokens (24-hour expiry)

5. **`app/auth/verify-email/page.tsx`**
   - Email verification page
   - Displays verification status and handles token validation

6. **`app/auth/resend-verification/page.tsx`**
   - Resend verification email page
   - Allows users to request a new verification email

### Modified Files

1. **`app/signin/page.tsx`**
   - Added Google OAuth button
   - Integrated NextAuth signIn function
   - Updated signup to support email verification

2. **`app/api/auth/signup/route.ts`**
   - Added email verification support
   - Optional email verification requirement
   - Sends verification email on signup

3. **`prisma/schema.prisma`**
   - Added Account, Session, VerificationToken models
   - Updated User model with emailVerified field
   - Made passwordHash optional

## Authentication Flow

### Email/Password Registration with Verification

1. User fills signup form with email, password, and profile details
2. System creates user account with `status: PENDING` and `emailVerified: null`
3. Verification token is generated and stored in database (24-hour expiry)
4. Verification email is sent to user (currently logs to console)
5. User clicks verification link in email
6. System validates token and marks email as verified
7. User can now log in

### Email/Password Login

1. User enters email and password
2. System validates credentials
3. System checks if email is verified
4. If verified, JWT token is issued and user is logged in
5. If not verified, error message is shown

### Google OAuth

1. User clicks "Sign in with Google" button
2. User is redirected to Google login
3. User authorizes FoodFlow application
4. Google redirects back to callback URL
5. System creates or updates user account
6. Email is automatically verified for Google OAuth users
7. User is logged in

## Email Service Integration

Currently, the email sending is stubbed out (logs to console). To integrate a real email service:

1. Update `sendVerificationEmail` function in:
   - `app/api/auth/send-verification/route.ts`
   - `app/api/auth/signup/route.ts`

2. Integrate with email service (SendGrid, Resend, AWS SES, etc.):

```typescript
async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  // Example with SendGrid
  await sgMail.send({
    to: email,
    from: 'noreply@foodflow.com',
    subject: 'Verify your FoodFlow email',
    html: `
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `,
  })
}
```

## API Endpoints

### POST /api/auth/signin
NextAuth.js built-in endpoint for sign in

### POST /api/auth/callback/google
NextAuth.js built-in endpoint for Google OAuth callback

### POST /api/auth/verify-email
Verify email with token

**Request:**
```json
{
  "token": "verification-token",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### POST /api/auth/send-verification
Send verification email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

## Session Management

### Getting Current Session

In client components:
```typescript
import { useSession } from 'next-auth/react'

export default function Component() {
  const { data: session } = useSession()
  
  if (session) {
    console.log(session.user.email)
    console.log(session.user.role)
    console.log(session.user.donorId)
  }
}
```

In server components:
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-nextauth'

export default async function Component() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    console.log(session.user.email)
  }
}
```

## Role-Based Access Control

The JWT callback includes user role and profile IDs:

```typescript
{
  id: string
  email: string
  role: 'DONOR' | 'NGO' | 'ADMIN'
  donorId?: string
  ngoId?: string
  adminId?: string
}
```

Use these in your application to enforce role-based access:

```typescript
if (session.user.role === 'DONOR') {
  // Show donor-specific features
}
```

## Backward Compatibility

The existing JWT-based authentication endpoints remain functional:
- `POST /api/auth/login` - Traditional login
- `POST /api/auth/signup` - Traditional signup
- `GET /api/auth/me` - Get current user

These can be used alongside NextAuth.js or gradually migrated to NextAuth.js.

## Testing

### Test Accounts

No default shared credentials are provided.
Use the Sign Up flow or Google OAuth to create accounts for testing.

### Manual Testing Steps

1. **Email/Password Registration:**
   - Go to `/signin`
   - Click "Sign Up" tab
   - Fill in form and submit
   - Check console for verification email
   - Click verification link
   - Log in with credentials

2. **Email/Password Login:**
   - Go to `/signin`
   - Enter email and password
   - Should be logged in

3. **Google OAuth:**
   - Go to `/signin`
   - Click "Google" button
   - Complete Google login flow
   - Should be logged in

## Security Considerations

1. **Email Verification:** Required before login (except for Google OAuth)
2. **Token Expiry:** Verification tokens expire after 24 hours
3. **Password Hashing:** Passwords hashed with bcrypt (12 rounds)
4. **JWT Expiry:** JWT tokens expire after 30 days
5. **HTTP-Only Cookies:** Session tokens stored in HTTP-only cookies
6. **HTTPS:** Use HTTPS in production

## Troubleshooting

### Google OAuth Not Working

1. Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
2. Verify redirect URI is registered in Google Cloud Console
3. Check browser console for errors
4. Ensure `NEXTAUTH_URL` matches your domain

### Email Verification Not Working

1. Check that verification email is being sent (check console logs)
2. Verify token is being stored in database
3. Check token expiry time
4. Ensure email matches exactly

### Session Not Persisting

1. Check that `NEXTAUTH_SECRET` is set
2. Verify cookies are enabled in browser
3. Check that session strategy is set to 'jwt'
4. Ensure `NEXTAUTH_URL` is correct

## Production Deployment

1. Set strong `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
2. Set `NEXTAUTH_URL` to your production domain
3. Configure Google OAuth credentials for production domain
4. Integrate real email service
5. Enable HTTPS
6. Set `NODE_ENV=production`
7. Use environment variables for all secrets

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- [Google OAuth Provider](https://next-auth.js.org/providers/google)
- [Email Verification Pattern](https://next-auth.js.org/getting-started/example)
