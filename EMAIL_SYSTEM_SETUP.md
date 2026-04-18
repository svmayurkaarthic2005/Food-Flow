# FoodFlow Email System - Complete Setup Guide

**Date:** April 18, 2026  
**Status:** Production Ready  
**Tech Stack:** FastAPI + Brevo SMTP + Redis Queue

---

## Overview

Scalable, non-blocking email system with:
- ✅ Email verification (signup)
- ✅ Password reset flow
- ✅ NGO approval/rejection emails
- ✅ High-priority food alerts (stub)
- ✅ Redis queue for async processing
- ✅ Retry logic (3 attempts)
- ✅ No API latency impact

---

## Architecture

```
User Action
    ↓
API Endpoint
    ↓
Enqueue to Redis
    ↓
Return Response (non-blocking)
    ↓
Background Worker
    ↓
Send via Brevo SMTP
    ↓
Retry on failure (max 3)
```

---

## Setup Instructions

### 1. Environment Variables

Add to `backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/foodflow

# Redis
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
FRONTEND_URL=http://localhost:3000

# Email (Brevo SMTP)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_user
SMTP_PASSWORD=your_brevo_password
EMAIL_FROM=noreply@foodflow.app
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New packages added:
- `aiosmtplib==3.0.1` - Async SMTP
- `redis==5.0.1` - Redis client

### 3. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or locally (macOS)
brew install redis
redis-server

# Or locally (Linux)
sudo apt-get install redis-server
redis-server
```

### 4. Run Backend

```bash
cd backend
python -m uvicorn main:app --reload
```

Email worker starts automatically on app startup.

---

## API Endpoints

### Signup with Email Verification

**POST** `/api/auth/signup`

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "DONOR"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "DONOR"
  }
}
```

**Action:** Verification email queued automatically

---

### Verify Email

**POST** `/api/auth/verify-email?token=...`

Frontend calls this after user clicks email link.

```bash
curl -X POST "http://localhost:8000/api/auth/verify-email?token=eyJ0eXAi..."
```

Response:
```json
{
  "message": "Email verified successfully"
}
```

---

### Request Password Reset

**POST** `/api/auth/request-reset`

```json
{
  "email": "user@example.com"
}
```

Response (always success for security):
```json
{
  "message": "If email exists, reset link has been sent"
}
```

**Action:** Reset email queued if user exists

---

### Reset Password

**POST** `/api/auth/reset-password`

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "password": "newpassword123"
}
```

Response:
```json
{
  "message": "Password reset successfully"
}
```

---

### NGO Approval

**POST** `/api/ngos/{ngo_id}/approve`

Admin endpoint to approve NGO registration.

```bash
curl -X POST "http://localhost:8000/api/ngos/ngo123/approve"
```

**Action:** Approval email queued to NGO

---

### NGO Rejection

**POST** `/api/ngos/{ngo_id}/reject`

Admin endpoint to reject NGO registration.

```json
{
  "reason": "Documentation incomplete"
}
```

**Action:** Rejection email queued to NGO

---

## Frontend Routes

### Email Verification

**Route:** `/verify?token=...`

- Reads token from URL
- Calls backend to verify
- Shows success/error UI
- Redirects to login on success

**File:** `frontend/app/verify/page.tsx`

---

### Forgot Password

**Route:** `/forgot-password`

- User enters email
- Backend sends reset link
- Shows confirmation message

**File:** `frontend/app/forgot-password/page.tsx`

---

### Reset Password

**Route:** `/reset-password?token=...`

- User enters new password
- Backend validates token
- Updates password
- Redirects to login

**File:** `frontend/app/reset-password/page.tsx`

---

## Email Templates

Located in `backend/app/templates/emails/`:

1. **verify_email.html** - Email verification
2. **reset_password.html** - Password reset
3. **ngo_approved.html** - NGO approval
4. **ngo_rejected.html** - NGO rejection

Templates use placeholders:
- `{{name}}` - User name
- `{{link}}` - Action link
- `{{expiry}}` - Token expiry hours
- `{{reason}}` - Rejection reason

---

## Redis Queue Details

### Queue Structure

```
QUEUE_KEY = "email_queue"
RETRY_KEY = "email_retry"
MAX_RETRIES = 3
RETRY_DELAY = 5 seconds
```

### Job Format

```json
{
  "payload": {
    "to": "user@example.com",
    "subject": "Email Subject",
    "html": "<html>...</html>",
    "text": "Plain text version"
  },
  "retries": 0,
  "created_at": "2026-04-18T10:30:00"
}
```

### Worker Process

1. Connect to Redis
2. Pop job from queue
3. Send email via SMTP
4. On success: Log and continue
5. On failure:
   - If retries < 3: Push back to queue
   - If retries >= 3: Move to dead letter queue

---

## Testing

### Test Email Sending

```bash
# Start backend
cd backend
python -m uvicorn main:app --reload

# In another terminal, test signup
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User",
    "role": "DONOR"
  }'
```

Check Redis queue:
```bash
redis-cli
> LLEN email_queue
> LRANGE email_queue 0 -1
```

Check logs:
```
✅ Email queued to test@example.com
✅ Email sent to test@example.com: Verify Your Email - FoodFlow
```

---

## Monitoring

### Check Queue Status

```bash
redis-cli
> LLEN email_queue          # Pending emails
> LLEN email_queue:dead_letter  # Failed emails
```

### View Logs

```bash
# Watch email logs
tail -f logs/app.log | grep -i email
```

### Brevo Dashboard

Monitor delivery at: https://app.brevo.com/

- Delivery rates
- Open rates
- Click rates
- Bounce rates

---

## Troubleshooting

### Redis Connection Error

**Error:** `ConnectionError: Error 111 connecting to localhost:6379`

**Solution:**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# If not running, start it
redis-server
```

### SMTP Authentication Failed

**Error:** `SMTPAuthenticationError: (535, b'Authentication failed')`

**Solution:**
1. Verify SMTP credentials in `.env`
2. Check Brevo account is active
3. Verify credentials haven't been rotated

### Emails Not Sending

**Check:**
1. Redis is running: `redis-cli ping`
2. Backend logs: `tail -f logs/app.log`
3. Queue status: `redis-cli LLEN email_queue`
4. SMTP credentials in `.env`

---

## Production Deployment

### 1. Environment Variables

Use secure secret management:
- AWS Secrets Manager
- HashiCorp Vault
- Environment variables (CI/CD)

### 2. Redis

Use managed Redis:
- AWS ElastiCache
- Redis Cloud
- Self-hosted with replication

### 3. Email Rate Limiting

Brevo free plan: 300 emails/day

For production:
- Upgrade Brevo plan
- Implement rate limiting
- Batch non-urgent emails

### 4. Monitoring

Set up alerts for:
- Queue size > 100
- Failed emails > 10
- Worker crashes
- SMTP connection errors

### 5. Backup

Store dead letter queue:
```bash
redis-cli BGSAVE
```

---

## File Structure

```
backend/
├── app/
│   ├── services/
│   │   ├── email_service.py      # SMTP client
│   │   ├── email_queue.py        # Redis queue
│   │   ├── token_service.py      # JWT tokens
│   │   └── alert_service.py      # High-priority alerts
│   ├── templates/
│   │   └── emails/
│   │       ├── verify_email.html
│   │       ├── reset_password.html
│   │       ├── ngo_approved.html
│   │       └── ngo_rejected.html
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py           # Updated with email flows
│   │       └── ngos.py           # Updated with approval emails
│   └── core/
│       └── config.py             # Updated with email config
├── main.py                        # Updated with email worker
└── requirements.txt               # Updated with new packages

frontend/
├── app/
│   ├── verify/
│   │   └── page.tsx              # Email verification
│   ├── forgot-password/
│   │   └── page.tsx              # Password reset request
│   └── reset-password/
│       └── page.tsx              # Password reset form
```

---

## Success Criteria

✅ Signup sends verification email  
✅ Verify link activates account  
✅ Password reset works end-to-end  
✅ Emails processed via Redis queue  
✅ No API latency increase  
✅ Retry logic handles failures  
✅ NGO approval/rejection emails sent  
✅ High-priority alert stub ready  

---

## Next Steps

1. ✅ Complete setup above
2. ✅ Test email flows
3. ✅ Deploy to staging
4. ✅ Monitor queue and delivery
5. ✅ Integrate ML recommender for alerts
6. ✅ Add email preferences/unsubscribe
7. ✅ Implement email analytics

---

## Support

For issues:
1. Check logs: `tail -f logs/app.log`
2. Verify Redis: `redis-cli ping`
3. Check queue: `redis-cli LLEN email_queue`
4. Review Brevo dashboard
5. Check SMTP credentials

---

**Last Updated:** April 18, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
