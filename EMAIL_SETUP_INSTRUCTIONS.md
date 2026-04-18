# Email Notifications Setup Instructions
## FoodFlow Platform - Brevo SMTP Configuration

**Date:** April 18, 2026  
**Status:** Ready for Implementation

---

## Overview

The FoodFlow platform now includes email notifications via Brevo SMTP. This enables:

- ✅ Status update emails
- ✅ ML training notifications
- ✅ Data collection reports
- ✅ Nightly job notifications
- ✅ Bulk email sending

---

## Step 1: Environment Configuration

### 1.1 Update `.env` File

Add the following to your `backend/.env` file:

```bash
# Email Configuration
FROM_EMAIL=noreply@foodflow.app
ADMIN_EMAIL=admin@foodflow.app

# Nightly Job Configuration
JOB_TIMEZONE=UTC
JOB_HOUR=2
JOB_MINUTE=0
```

### 1.2 Verify SMTP Credentials

The SMTP credentials are already configured in `backend/app/core/email.py`:

```python
SMTP_HOST = "smtp-relay.brevo.com"
SMTP_PORT = 587
SMTP_USER = "xsmtpsib-958f6d98327e696d64980048ef4bac947b47efb766bc69b6268260ffa18fae56"
SMTP_PASSWORD = "7xgL3HCYsB46Mgkguse"
```

⚠️ **Security Note:** These credentials are hardcoded for now. In production, move them to environment variables.

---

## Step 2: Install Dependencies

The email service uses Python's built-in `smtplib` and `email` modules. No additional packages needed.

Verify your `backend/requirements.txt` includes:

```
fastapi>=0.104.0
pydantic>=2.0.0
prisma>=0.13.0
python-dotenv>=1.0.0
apscheduler>=3.10.0
```

---

## Step 3: Verify File Structure

Ensure the following files are in place:

```
backend/
├── app/
│   ├── core/
│   │   ├── email.py                    ✅ NEW
│   │   ├── config.py
│   │   ├── oauth.py
│   │   └── security.py
│   ├── api/
│   │   └── routes/
│   │       ├── notifications.py        ✅ NEW
│   │       ├── auth.py
│   │       ├── users.py
│   │       └── ...
│   └── jobs/
│       └── nightly.py                  ✅ UPDATED
├── tests/
│   └── test_email_notifications.py     ✅ NEW
├── main.py                             ✅ UPDATED
└── requirements.txt
```

---

## Step 4: Update Main Application

The `backend/main.py` has been updated to include the notifications router.

Verify the following lines are present:

```python
from app.api.routes import auth, users, listings, claims, analytics, donors, ngos, notifications

# ... later in the file ...

app.include_router(notifications.router, tags=["Notifications"])
```

---

## Step 5: Test Email Service

### 5.1 Test via API

Start the backend server:

```bash
cd backend
python -m uvicorn main:app --reload
```

Test the health endpoint:

```bash
curl http://localhost:8000/api/notifications/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "email-notifications",
  "smtp_host": "smtp-relay.brevo.com",
  "smtp_port": 587
}
```

### 5.2 Send Test Email

```bash
curl -X POST http://localhost:8000/api/notifications/send-status-update \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "your-email@example.com",
    "status": "success",
    "title": "Test Email",
    "message": "This is a test email from FoodFlow"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Status update sent to your-email@example.com"
}
```

### 5.3 Test via Python

Create a test script `backend/test_email.py`:

```python
import asyncio
from app.core.email import EmailService

async def test():
    # Test 1: Status update
    print("Test 1: Status update...")
    result = EmailService.send_status_update(
        to_email="your-email@example.com",
        status="success",
        title="FoodFlow Test",
        message="Email service is working!"
    )
    print(f"Result: {result}\n")
    
    # Test 2: ML training notification
    print("Test 2: ML training notification...")
    result = EmailService.send_ml_training_notification(
        to_email="your-email@example.com",
        model_name="Demand Forecaster",
        status="completed",
        metrics={"Accuracy": "95%", "Samples": 150}
    )
    print(f"Result: {result}\n")
    
    # Test 3: Data collection report
    print("Test 3: Data collection report...")
    result = EmailService.send_data_collection_report(
        to_email="your-email@example.com",
        report_data={
            "Recommender": {"status": "ready", "count": 150},
            "Demand Forecaster": {"status": "collecting", "count": 45}
        }
    )
    print(f"Result: {result}")

asyncio.run(test())
```

Run the test:

```bash
cd backend
python test_email.py
```

---

## Step 6: Run Tests

### 6.1 Unit Tests

```bash
cd backend
pytest tests/test_email_notifications.py -v
```

Expected output:

```
tests/test_email_notifications.py::TestEmailService::test_send_email_success PASSED
tests/test_email_notifications.py::TestEmailService::test_send_email_failure PASSED
tests/test_email_notifications.py::TestEmailService::test_send_status_update_success PASSED
...
```

### 6.2 Integration Tests

```bash
cd backend
pytest tests/test_email_notifications.py::TestEmailServiceIntegration -v
```

Note: Integration tests are skipped by default (require real SMTP connection).

---

## Step 7: Configure Nightly Jobs

The nightly jobs now automatically send email notifications.

### 7.1 Set Admin Email

Update `backend/.env`:

```bash
ADMIN_EMAIL=admin@foodflow.app
```

### 7.2 Set Job Schedule

Update `backend/.env`:

```bash
JOB_TIMEZONE=UTC
JOB_HOUR=2
JOB_MINUTE=0
```

This schedules nightly jobs to run at 2:00 AM UTC daily.

### 7.3 Verify Nightly Job Configuration

Check `backend/app/jobs/nightly.py` for the scheduler setup:

```python
scheduler.add_job(
    run_nightly_jobs,
    CronTrigger(hour=JOB_HOUR, minute=JOB_MINUTE, timezone=JOB_TIMEZONE),
    id="nightly_ml_job",
    name="Nightly ML Data Refresh",
    replace_existing=True,
    max_instances=1,
    coalesce=True,
    misfire_grace_time=3600
)
```

---

## Step 8: Production Deployment

### 8.1 Security Hardening

Move SMTP credentials to environment variables:

**Current (backend/app/core/email.py):**
```python
SMTP_USER = "xsmtpsib-958f6d98327e696d64980048ef4bac947b47efb766bc69b6268260ffa18fae56"
SMTP_PASSWORD = "7xgL3HCYsB46Mgkguse"
```

**Recommended (backend/app/core/email.py):**
```python
SMTP_USER = os.getenv("SMTP_USER", "xsmtpsib-958f6d98327e696d64980048ef4bac947b47efb766bc69b6268260ffa18fae56")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "7xgL3HCYsB46Mgkguse")
```

**Add to backend/.env:**
```bash
SMTP_USER=xsmtpsib-958f6d98327e696d64980048ef4bac947b47efb766bc69b6268260ffa18fae56
SMTP_PASSWORD=7xgL3HCYsB46Mgkguse
```

### 8.2 Rate Limiting

Brevo free plan allows 300 emails/day. For production:

1. Upgrade Brevo plan if needed
2. Implement rate limiting in notifications router
3. Batch notifications when possible

### 8.3 Error Handling

Ensure proper error handling in production:

```python
try:
    EmailService.send_status_update(...)
except Exception as e:
    logger.error(f"Email failed: {e}")
    # Continue with other operations
```

### 8.4 Monitoring

Monitor email delivery:

1. Check Brevo dashboard: https://app.brevo.com/
2. Review application logs for email errors
3. Set up alerts for failed emails

---

## Step 9: Usage Examples

### 9.1 Send Status Update

```python
from app.core.email import EmailService

EmailService.send_status_update(
    to_email="admin@foodflow.app",
    status="success",
    title="Data Import Complete",
    message="Successfully imported 1000 food listings",
    details={
        "Listings": 1000,
        "Duration": "5 minutes",
        "Errors": 0
    }
)
```

### 9.2 Send ML Training Notification

```python
from app.core.email import EmailService

EmailService.send_ml_training_notification(
    to_email="admin@foodflow.app",
    model_name="Demand Forecaster",
    status="completed",
    metrics={
        "Samples": 150,
        "MAE": 2.34,
        "Training Time": "45 seconds"
    }
)
```

### 9.3 Send Data Collection Report

```python
from app.core.email import EmailService

EmailService.send_data_collection_report(
    to_email="admin@foodflow.app",
    report_data={
        "Recommender": {"status": "ready", "count": 150},
        "Demand Forecaster": {"status": "collecting", "count": 45},
        "Trust Scorer": {"status": "ready", "count": 200}
    }
)
```

### 9.4 Send Bulk Email

```bash
curl -X POST http://localhost:8000/api/notifications/send-bulk-status-update \
  -H "Content-Type: application/json" \
  -d '{
    "emails": ["admin@foodflow.app", "manager@foodflow.app"],
    "status": "success",
    "title": "System Maintenance Complete",
    "message": "All systems are back online"
  }'
```

---

## Troubleshooting

### Issue: "Connection refused"

**Solution:**
1. Verify SMTP host: `smtp-relay.brevo.com`
2. Verify SMTP port: `587`
3. Check firewall allows outbound port 587

```bash
telnet smtp-relay.brevo.com 587
```

### Issue: "Authentication failed"

**Solution:**
1. Verify SMTP credentials in `backend/app/core/email.py`
2. Check credentials haven't been rotated
3. Verify credentials are correct

### Issue: "Email not received"

**Solution:**
1. Check spam/junk folder
2. Verify recipient email is correct
3. Check Brevo dashboard for delivery status
4. Review application logs for errors

### Issue: "Rate limit exceeded"

**Solution:**
1. Check Brevo plan limits
2. Upgrade plan if needed
3. Implement rate limiting in application

---

## Verification Checklist

- [ ] Environment variables configured in `backend/.env`
- [ ] SMTP credentials verified in `backend/app/core/email.py`
- [ ] Email service files created:
  - [ ] `backend/app/core/email.py`
  - [ ] `backend/app/api/routes/notifications.py`
  - [ ] `backend/tests/test_email_notifications.py`
- [ ] Main application updated (`backend/main.py`)
- [ ] Nightly jobs updated (`backend/app/jobs/nightly.py`)
- [ ] Health check endpoint working
- [ ] Test email sent successfully
- [ ] Unit tests passing
- [ ] Nightly job notifications configured
- [ ] Production security hardening completed

---

## Next Steps

1. ✅ Complete setup steps above
2. ✅ Test email service with test emails
3. ✅ Run unit tests
4. ✅ Deploy to staging environment
5. ✅ Monitor email delivery
6. ✅ Deploy to production
7. ✅ Set up monitoring and alerts

---

## Support

For issues or questions:

1. Check `EMAIL_NOTIFICATIONS_GUIDE.md` for detailed documentation
2. Review application logs for error messages
3. Test SMTP connection manually
4. Contact Brevo support: https://www.brevo.com/support/

---

## Files Modified/Created

### Created Files
- ✅ `backend/app/core/email.py` - Email service implementation
- ✅ `backend/app/api/routes/notifications.py` - Notifications API endpoints
- ✅ `backend/tests/test_email_notifications.py` - Email service tests
- ✅ `EMAIL_NOTIFICATIONS_GUIDE.md` - Detailed usage guide
- ✅ `EMAIL_SETUP_INSTRUCTIONS.md` - This file

### Modified Files
- ✅ `backend/main.py` - Added notifications router
- ✅ `backend/app/jobs/nightly.py` - Added email notifications

---

**Last Updated:** April 18, 2026  
**Version:** 1.0.0  
**Status:** Ready for Implementation
