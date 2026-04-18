# Email Notifications Guide
## FoodFlow Platform - Brevo SMTP Integration

**Setup Date:** April 18, 2026  
**SMTP Provider:** Brevo (formerly Sendinblue)  
**Status:** ✅ Ready for Production

---

## Quick Start

### 1. Environment Configuration

Add to your `.env` file:

```bash
# Email Configuration
FROM_EMAIL=noreply@foodflow.app
ADMIN_EMAIL=admin@foodflow.app

# Nightly Job Configuration (optional)
JOB_TIMEZONE=UTC
JOB_HOUR=2
JOB_MINUTE=0
```

### 2. SMTP Credentials

The following credentials are already configured in `backend/app/core/email.py`:

```
SMTP Host: smtp-relay.brevo.com
SMTP Port: 587
Username: xsmtpsib-958f6d98327e696d64980048ef4bac947b47efb766bc69b6268260ffa18fae56
Password: 7xgL3HCYsB46Mgkguse
```

---

## API Endpoints

### 1. Send Status Update

**Endpoint:** `POST /api/notifications/send-status-update`

**Request:**
```json
{
  "to_email": "user@example.com",
  "status": "success",
  "title": "Data Import Complete",
  "message": "Successfully imported 1000 food listings",
  "details": {
    "Listings": 1000,
    "Duration": "5 minutes",
    "Errors": 0
  }
}
```

**Status Types:**
- `success` - Green badge
- `warning` - Orange badge
- `error` - Red badge
- `info` - Blue badge

**Response:**
```json
{
  "success": true,
  "message": "Status update sent to user@example.com"
}
```

---

### 2. Send ML Training Notification

**Endpoint:** `POST /api/notifications/send-ml-training-notification`

**Request:**
```json
{
  "to_email": "admin@foodflow.app",
  "model_name": "Demand Forecaster",
  "status": "completed",
  "metrics": {
    "Samples": 150,
    "MAE": 2.34,
    "RMSE": 3.12,
    "Training Time": "45 seconds"
  }
}
```

**Status Types:**
- `started` - 🚀 Training Started (info)
- `completed` - ✅ Training Completed (success)
- `failed` - ❌ Training Failed (error)

**Response:**
```json
{
  "success": true,
  "message": "ML training notification sent to admin@foodflow.app"
}
```

---

### 3. Send Data Collection Report

**Endpoint:** `POST /api/notifications/send-data-collection-report`

**Request:**
```json
{
  "to_email": "admin@foodflow.app",
  "report_data": {
    "Recommender": {
      "status": "ready",
      "count": 150
    },
    "Demand Forecaster": {
      "status": "collecting",
      "count": 45
    },
    "Trust Scorer": {
      "status": "ready",
      "count": 200
    },
    "Quality Scorer": {
      "status": "collecting",
      "count": 25
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data collection report sent to admin@foodflow.app"
}
```

---

### 4. Send Bulk Status Update

**Endpoint:** `POST /api/notifications/send-bulk-status-update`

**Request:**
```json
{
  "emails": [
    "admin@foodflow.app",
    "manager@foodflow.app",
    "team@foodflow.app"
  ],
  "status": "success",
  "title": "System Maintenance Complete",
  "message": "All systems are back online",
  "details": {
    "Downtime": "2 hours",
    "Services": "All operational"
  }
}
```

**Response:**
```json
{
  "total": 3,
  "sent": 3,
  "failed": 0,
  "failed_emails": []
}
```

---

### 5. Health Check

**Endpoint:** `GET /api/notifications/health`

**Response:**
```json
{
  "status": "ok",
  "service": "email-notifications",
  "smtp_host": "smtp-relay.brevo.com",
  "smtp_port": 587
}
```

---

## Python Usage Examples

### Basic Email Sending

```python
from app.core.email import EmailService

# Send simple status update
EmailService.send_status_update(
    to_email="user@example.com",
    status="success",
    title="Process Complete",
    message="Your data has been processed successfully",
    details={
        "Records": 1000,
        "Duration": "5 minutes"
    }
)
```

### ML Training Notification

```python
from app.core.email import EmailService

# Notify about training completion
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

### Data Collection Report

```python
from app.core.email import EmailService

# Send data collection status
EmailService.send_data_collection_report(
    to_email="admin@foodflow.app",
    report_data={
        "Recommender": {"status": "ready", "count": 150},
        "Demand Forecaster": {"status": "collecting", "count": 45},
        "Trust Scorer": {"status": "ready", "count": 200}
    }
)
```

---

## Nightly Job Integration

The nightly jobs automatically send email notifications when configured.

### Configuration

Add to `.env`:

```bash
ADMIN_EMAIL=admin@foodflow.app
JOB_HOUR=2
JOB_MINUTE=0
JOB_TIMEZONE=UTC
```

### What Gets Sent

After each nightly job run, an email is sent to `ADMIN_EMAIL` with:

- ✅ Job status (success/failed)
- 📊 Rows processed
- ⏱️ Duration
- 🔴 Any errors encountered

**Example Email:**

```
Subject: 🌙 Nightly ML Jobs Report

Status: SUCCESS

Duration: 2345ms
Demand Rows: 42
Trust Rows: 15
Timestamp: 2026-04-18T02:00:00
```

---

## Testing Email Service

### Test Endpoint

```bash
# Test status update
curl -X POST http://localhost:8000/api/notifications/send-status-update \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "test@example.com",
    "status": "success",
    "title": "Test Email",
    "message": "This is a test email"
  }'

# Test health check
curl http://localhost:8000/api/notifications/health
```

### Python Test Script

```python
import asyncio
from app.core.email import EmailService

async def test_email():
    # Test 1: Status update
    print("Test 1: Sending status update...")
    result = EmailService.send_status_update(
        to_email="test@example.com",
        status="success",
        title="Test Email",
        message="This is a test email from FoodFlow"
    )
    print(f"Result: {result}")
    
    # Test 2: ML training notification
    print("\nTest 2: Sending ML training notification...")
    result = EmailService.send_ml_training_notification(
        to_email="test@example.com",
        model_name="Test Model",
        status="completed",
        metrics={"Accuracy": "95%"}
    )
    print(f"Result: {result}")

# Run tests
asyncio.run(test_email())
```

---

## Email Templates

### Status Update Template

```
┌─────────────────────────────────────┐
│ [STATUS] Title                      │
├─────────────────────────────────────┤
│ Message content here                │
│                                     │
│ Details:                            │
│ • Key 1: Value 1                    │
│ • Key 2: Value 2                    │
│                                     │
│ Sent: 2026-04-18 02:00:00 UTC       │
│ FoodFlow Platform                   │
└─────────────────────────────────────┘
```

### ML Training Template

```
┌─────────────────────────────────────┐
│ 🚀 ML Training Started              │
├─────────────────────────────────────┤
│ Model: Demand Forecaster            │
│ Status: STARTED                     │
│                                     │
│ Training will complete in ~1 hour   │
│                                     │
│ Sent: 2026-04-18 02:00:00 UTC       │
│ FoodFlow Platform                   │
└─────────────────────────────────────┘
```

---

## Troubleshooting

### Email Not Sending

**Problem:** Emails not being sent

**Solutions:**
1. Check SMTP credentials in `backend/app/core/email.py`
2. Verify `FROM_EMAIL` is set in `.env`
3. Check firewall allows port 587
4. Review application logs for errors

```bash
# Check logs
tail -f logs/app.log | grep -i email
```

### SMTP Connection Error

**Problem:** "Connection refused" or "Timeout"

**Solutions:**
1. Verify SMTP host: `smtp-relay.brevo.com`
2. Verify SMTP port: `587`
3. Check internet connectivity
4. Verify firewall rules

```bash
# Test SMTP connection
telnet smtp-relay.brevo.com 587
```

### Authentication Failed

**Problem:** "Authentication failed" error

**Solutions:**
1. Verify SMTP username and password
2. Check credentials haven't been rotated
3. Verify credentials in `backend/app/core/email.py`

---

## Best Practices

### 1. Use Appropriate Status Types

```python
# ✅ Good
EmailService.send_status_update(
    to_email="admin@example.com",
    status="success",  # Clear status
    title="Import Complete",
    message="Successfully imported 1000 records"
)

# ❌ Avoid
EmailService.send_status_update(
    to_email="admin@example.com",
    status="ok",  # Not a valid status type
    title="Something happened",
    message="Check the system"
)
```

### 2. Include Relevant Details

```python
# ✅ Good
details = {
    "Records Processed": 1000,
    "Duration": "5 minutes",
    "Success Rate": "99.5%",
    "Errors": 5
}

# ❌ Avoid
details = {
    "x": 1000,
    "y": "5m",
    "z": "99.5%"
}
```

### 3. Use Descriptive Titles

```python
# ✅ Good
title = "Daily Data Sync Complete"

# ❌ Avoid
title = "Job Done"
```

### 4. Handle Errors Gracefully

```python
# ✅ Good
try:
    EmailService.send_status_update(...)
except Exception as e:
    logger.error(f"Failed to send email: {e}")
    # Continue with other operations

# ❌ Avoid
EmailService.send_status_update(...)  # No error handling
```

---

## Rate Limiting

Brevo allows:
- **Free Plan:** 300 emails/day
- **Paid Plans:** Higher limits based on subscription

**Recommendations:**
- Batch notifications when possible
- Use bulk endpoint for multiple recipients
- Schedule non-urgent emails during off-peak hours

---

## Security Considerations

### 1. Protect SMTP Credentials

✅ Credentials stored in `backend/app/core/email.py` (not in .env)  
✅ Never commit credentials to version control  
✅ Use environment variables for sensitive data  

### 2. Validate Email Addresses

```python
from pydantic import EmailStr

# Automatic validation
email: EmailStr = "user@example.com"  # Valid
email: EmailStr = "invalid-email"     # Raises ValidationError
```

### 3. Sanitize Email Content

```python
# ✅ Good - HTML is properly formatted
message = "<strong>Important:</strong> Action required"

# ❌ Avoid - Unescaped user input
user_input = "<script>alert('xss')</script>"
message = f"User said: {user_input}"
```

---

## Monitoring & Analytics

### Track Email Sends

```python
# Log all email sends
logger.info(f"Email sent to {to_email}: {subject}")

# Monitor failures
if not success:
    logger.error(f"Email failed to {to_email}: {error}")
```

### Brevo Dashboard

Monitor email performance at: https://app.brevo.com/

- Delivery rates
- Open rates
- Click rates
- Bounce rates

---

## Support & Resources

### Brevo Documentation
- https://developers.brevo.com/docs/send-transactional-email

### Common Issues
- SMTP Connection: https://developers.brevo.com/docs/smtp-connection
- Authentication: https://developers.brevo.com/docs/smtp-authentication

### Contact
- Brevo Support: https://www.brevo.com/support/
- FoodFlow Team: admin@foodflow.app

---

## Changelog

### Version 1.0 (April 18, 2026)
- ✅ Initial email service implementation
- ✅ Brevo SMTP integration
- ✅ Status update emails
- ✅ ML training notifications
- ✅ Data collection reports
- ✅ Nightly job integration
- ✅ Bulk email support

---

**Last Updated:** April 18, 2026  
**Next Review:** May 18, 2026
