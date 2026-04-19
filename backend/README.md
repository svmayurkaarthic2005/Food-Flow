# FoodFlow Backend API

A FastAPI-based backend service for the FoodFlow food redistribution platform. This service handles authentication, food listings management, delivery tracking, NGO operations, and email notifications.

## Table of Contents

- [Overview](#overview)
- [System Architecture Diagrams](#system-architecture-diagrams)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database](#database)
- [Email Service](#email-service)
- [Background Jobs](#background-jobs)
- [Authentication](#authentication)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)

## Overview

FoodFlow Backend is a FastAPI application that powers the food redistribution platform. It manages:

- **User Authentication**: Email/password and OAuth signup/login
- **Food Listings**: Donors can post available food items
- **Claims Management**: NGOs can claim food listings
- **Delivery Tracking**: Real-time GPS tracking for food deliveries
- **Email Notifications**: Automated email verification and notifications
- **Analytics**: Dashboard metrics for admins and NGOs
- **Background Jobs**: Nightly scheduled tasks for data processing

The backend uses PostgreSQL for data persistence and integrates with Brevo SMTP for email delivery.

## System Architecture Diagrams

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FOODFLOW SYSTEM ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │   Frontend App   │
                              │  (Next.js 14)    │
                              │  Port: 3000      │
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
            │   Donor UI   │   │   NGO UI     │   │  Driver UI   │
            │  Dashboard   │   │  Dashboard   │   │  Dashboard   │
            └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                   │                  │                  │
                   └──────────────────┼──────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
        ┌─────────────────────────┐      ┌──────────────────────────┐
        │   FastAPI Backend       │      │   Email Service          │
        │   Port: 8000            │      │   (Brevo SMTP)           │
        │                         │      │   Async Queue Worker     │
        ├─────────────────────────┤      └──────────────────────────┘
        │ • Authentication        │
        │ • Listings Management   │
        │ • Claims Processing     │
        │ • Delivery Tracking     │
        │ • Analytics             │
        │ • Notifications         │
        │ • Background Jobs       │
        └────────────┬────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │PostgreSQL│  │Redis  │  │APScheduler│
    │Database  │  │Cache  │  │Jobs      │
    │          │  │       │  │          │
    └────────┘  └────────┘  └──────────┘
```

### Request/Response Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REQUEST/RESPONSE FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

CLIENT REQUEST:
┌──────────────┐
│ Frontend App │
└──────┬───────┘
       │ HTTP Request (GET/POST/PUT/DELETE)
       │
       ▼
┌──────────────────────────────────────────┐
│         FastAPI Backend                  │
│  ┌────────────────────────────────────┐  │
│  │ 1. CORS Middleware Check           │  │
│  │    (Validate origin)               │  │
│  └────────────────────────────────────┘  │
│                  │                       │
│                  ▼                       │
│  ┌────────────────────────────────────┐  │
│  │ 2. Route Matching                  │  │
│  │    (Find correct endpoint)         │  │
│  └────────────────────────────────────┘  │
│                  │                       │
│                  ▼                       │
│  ┌────────────────────────────────────┐  │
│  │ 3. Authentication Check            │  │
│  │    (Verify JWT token)              │  │
│  └────────────────────────────────────┘  │
│                  │                       │
│                  ▼                       │
│  ┌────────────────────────────────────┐  │
│  │ 4. Request Validation              │  │
│  │    (Pydantic schema validation)    │  │
│  └────────────────────────────────────┘  │
│                  │                       │
│                  ▼                       │
│  ┌────────────────────────────────────┐  │
│  │ 5. Business Logic Processing       │  │
│  │    (Execute endpoint handler)      │  │
│  └────────────────────────────────────┘  │
│                  │                       │
│                  ▼                       │
│  ┌────────────────────────────────────┐  │
│  │ 6. Database Operations             │  │
│  │    (Prisma ORM queries)            │  │
│  └────────────────────────────────────┘  │
│                  │                       │
│                  ▼                       │
│  ┌────────────────────────────────────┐  │
│  │ 7. Response Serialization          │  │
│  │    (Convert to JSON)               │  │
│  └────────────────────────────────────┘  │
└──────────────────┬───────────────────────┘
                   │
                   │ HTTP Response (JSON data)
                   │
                   ▼
┌──────────────┐
│ Frontend App │
│ (Display)    │
└──────────────┘
```

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with python-jose
- **Email**: Brevo SMTP service
- **Task Scheduling**: APScheduler
- **Async**: AsyncIO with Uvicorn
- **Python**: 3.11+ (3.14 supported with limitations)

## Prerequisites

Before you begin, ensure you have:

- Python 3.11 or higher (3.14 supported but see [Known Limitations](#known-limitations))
- PostgreSQL 12+ running locally or accessible via network
- pip (Python package manager)
- Git

### System Requirements

- **OS**: Windows, macOS, or Linux
- **RAM**: 2GB minimum
- **Disk**: 500MB for dependencies and database

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd FoodFlow/backend
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Generate Prisma Client

```bash
python -m prisma generate
```

This generates the Python Prisma client from the schema. You must run this before starting the server.

## Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/Food_donation

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# JWT Configuration
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Configuration (Brevo SMTP)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-user
SMTP_PASSWORD=your-brevo-smtp-password
EMAIL_FROM=noreply@foodflow.app
```

### Database Setup

1. Ensure PostgreSQL is running
2. Create the database:
   ```bash
   createdb Food_donation
   ```
3. Run Prisma migrations:
   ```bash
   python -m prisma migrate deploy
   ```

### Email Service Setup

1. Sign up for [Brevo](https://www.brevo.com/)
2. Get your SMTP credentials from the dashboard
3. Add credentials to `.env` file
4. Email templates are located in `app/templates/emails/`

## Running the Server

### Development Mode (with auto-reload)

```bash
python -m uvicorn main:app --reload --port 8000
```

The server will start at `http://localhost:8000`

### Production Mode

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Provided Scripts

**Windows:**
```bash
start.bat
```

**macOS/Linux:**
```bash
bash start.sh
```

### Verify Server is Running

Visit `http://localhost:8000/health` - should return:
```json
{"status": "healthy"}
```

Access API documentation at `http://localhost:8000/docs` (Swagger UI)



## Project Structure

```
backend/
├── app/
│   ├── api/routes/              # API endpoint handlers
│   │   ├── auth.py              # Authentication endpoints
│   │   ├── users.py             # User management
│   │   ├── listings.py          # Food listings
│   │   ├── claims.py            # Claim management
│   │   ├── donors.py            # Donor operations
│   │   ├── ngos.py              # NGO operations
│   │   ├── analytics.py         # Analytics endpoints
│   │   ├── notifications.py     # Notification endpoints
│   │   └── email_verification.py # Email verification
│   ├── core/
│   │   ├── config.py            # Configuration management
│   │   ├── security.py          # Security utilities
│   │   ├── oauth.py             # OAuth configuration
│   │   └── email.py             # Email service
│   ├── db/
│   │   ├── database.py          # Database connection
│   │   └── __init__.py
│   ├── services/
│   │   ├── email_service.py     # Email sending logic
│   │   ├── email_queue.py       # Email queue worker
│   │   ├── token_service.py     # Token generation/validation
│   │   ├── alert_service.py     # Alert notifications
│   │   └── __init__.py
│   ├── jobs/
│   │   ├── nightly.py           # Scheduled background jobs
│   │   └── __init__.py
│   ├── ml/                      # Machine Learning (disabled on Python 3.14)
│   │   ├── services/            # ML model services
│   │   ├── schemas/             # ML data schemas
│   │   ├── router.py            # ML API routes
│   │   └── __init__.py
│   ├── templates/emails/        # HTML email templates
│   │   ├── verify_email.html
│   │   ├── reset_password.html
│   │   ├── ngo_approved.html
│   │   └── ngo_rejected.html
│   └── __init__.py
├── tests/
│   ├── ml/                      # ML tests
│   ├── conftest.py              # Pytest configuration
│   ├── test_email_notifications.py
│   ├── test_nightly_jobs.py
│   ├── test_donor_ratings.py
│   └── test_ml_router.py
├── scripts/
│   ├── seed_ngos.py             # Database seeding script
│   └── test_recommender.py      # ML testing script
├── prisma/
│   └── schema.prisma            # Database schema
├── main.py                      # Application entry point
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (create this)
├── .env.example                 # Example environment file
├── pytest.ini                   # Pytest configuration
├── setup.sh / setup.bat         # Setup scripts
├── start.sh / start.bat         # Startup scripts
└── README.md                    # This file
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Login with email/password |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout user |
| GET | `/me` | Get current user info |

### Email Verification (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send-verification-email` | Send verification email |
| POST | `/verify-email` | Verify email token |

### Users (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{id}` | Get user by ID |
| PUT | `/{id}` | Update user profile |
| DELETE | `/{id}` | Delete user account |

### Listings (`/api/listings`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all listings |
| POST | `/` | Create new listing |
| GET | `/{id}` | Get listing details |
| PUT | `/{id}` | Update listing |
| DELETE | `/{id}` | Delete listing |

### Claims (`/api/claims`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all claims |
| POST | `/` | Create new claim |
| GET | `/{id}` | Get claim details |
| PUT | `/{id}` | Update claim status |

### Donors (`/api/donors`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/deliveries` | Get donor's deliveries |
| GET | `/profile` | Get donor profile |
| PUT | `/profile` | Update donor profile |

### NGOs (`/api/ngos`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all NGOs |
| GET | `/{id}` | Get NGO details |
| GET | `/deliveries` | Get NGO's deliveries |
| PUT | `/preferences` | Update NGO preferences |

### Analytics (`/api/analytics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get dashboard metrics |
| GET | `/reports` | Get analytics reports |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## Database

### Schema Overview

The database uses Prisma ORM with the following main models:

- **User**: Base user model with email, password, role
- **Donor**: Extends User for food donors
- **NGO**: Extends User for non-profit organizations
- **Driver**: Extends User for delivery drivers
- **Listing**: Food items available for donation
- **Claim**: NGO claims on food listings
- **Delivery**: Delivery tracking information
- **Rating**: Donor/NGO ratings and reviews

### Migrations

Run migrations:
```bash
python -m prisma migrate deploy
```

Create new migration:
```bash
python -m prisma migrate dev --name migration_name
```

View schema:
```bash
python -m prisma studio
```

## Email Service

### Configuration

Email service uses Brevo SMTP. Configure in `.env`:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-user
SMTP_PASSWORD=your-brevo-password
EMAIL_FROM=noreply@foodflow.app
```

### Email Templates

Located in `app/templates/emails/`:

- `verify_email.html` - Email verification
- `reset_password.html` - Password reset
- `ngo_approved.html` - NGO approval notification
- `ngo_rejected.html` - NGO rejection notification

### Sending Emails

Emails are queued and sent asynchronously via the email worker:

```python
from app.services.email_service import send_email

await send_email(
    to_email="user@example.com",
    subject="Verification",
    template="verify_email.html",
    context={"token": "abc123"}
)
```

## Background Jobs

### Nightly Jobs

Scheduled tasks run at midnight UTC via APScheduler:

- Data cleanup and archival
- Report generation
- Analytics updates
- Delivery status updates

Configure in `app/jobs/nightly.py`

### Email Worker

Async email queue worker processes emails in background:

- Starts automatically on server startup
- Retries failed emails
- Logs all email activity

## Authentication

### JWT Tokens

- **Access Token**: 30 minutes expiration
- **Refresh Token**: 7 days expiration
- **Algorithm**: HS256

### User Roles

- `DONOR` - Food donors
- `NGO` - Non-profit organizations
- `DRIVER` - Delivery drivers
- `ADMIN` - System administrators

### OAuth Integration

OAuth providers configured in `app/core/oauth.py`:

- Google OAuth
- GitHub OAuth (optional)

## Testing

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_email_notifications.py
```

### Run with Coverage

```bash
pytest --cov=app tests/
```

### Test Categories

- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **ML Tests**: Machine learning model testing

Test files:
- `tests/test_email_notifications.py` - Email service tests
- `tests/test_nightly_jobs.py` - Background job tests
- `tests/test_donor_ratings.py` - Rating system tests
- `tests/ml/test_recommender.py` - ML recommendation tests

## Troubleshooting

### Issue: "The Client hasn't been generated yet"

**Solution**: Run Prisma generate command:
```bash
python -m prisma generate
```

### Issue: Database Connection Failed

**Solution**: 
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Verify database exists: `createdb Food_donation`
4. Test connection: `psql postgresql://user:password@localhost:5432/Food_donation`

### Issue: Email Not Sending

**Solution**:
1. Verify SMTP credentials in `.env`
2. Check email templates exist in `app/templates/emails/`
3. Review logs for email worker errors
4. Test with: `python backend/test_email_verification.py`

### Issue: CORS Errors

**Solution**: 
1. Verify FRONTEND_URL in `.env`
2. Check CORS middleware in `main.py`
3. Ensure frontend is running on correct port

### Issue: Port Already in Use

**Solution**:
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

## Known Limitations

### Python 3.14 Compatibility

The backend runs on Python 3.14 but with the following limitations:

**Disabled Features:**
- Machine Learning models (demand forecasting, recommendations, route optimization)
- Pandas, NumPy, Scikit-learn (not compatible with Python 3.14)

**Reason**: These ML libraries haven't released Python 3.14 compatible versions yet.

**Workaround**: 
- Use Python 3.11 for full ML features
- Core application works perfectly on Python 3.14
- ML endpoints are commented out in `main.py`

**Recommendation**: 
For production with ML features, use Python 3.11:

```bash
# Install Python 3.11
# Then create virtual environment with Python 3.11
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m prisma generate
```

### ML Features Status

Currently disabled on Python 3.14:
- Demand prediction
- Donor quality scoring
- Route optimization
- Recommendation engine
- Spoilage prediction

These will be re-enabled once ML libraries support Python 3.14.

## Performance Optimization

### Database Queries

- Use Prisma's `select` for specific fields
- Implement pagination for large datasets
- Add database indexes for frequently queried fields

### Caching

- Redis integration available (configure REDIS_URL)
- Cache frequently accessed data
- Implement cache invalidation strategies

### Async Operations

- All I/O operations are async
- Email sending is non-blocking
- Database queries are optimized

## Security Best Practices

1. **Environment Variables**: Never commit `.env` file
2. **Secret Key**: Change `SECRET_KEY` in production
3. **HTTPS**: Use HTTPS in production
4. **CORS**: Restrict CORS origins in production
5. **Rate Limiting**: Implement rate limiting for APIs
6. **Input Validation**: All inputs are validated via Pydantic
7. **SQL Injection**: Protected via Prisma ORM

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
RUN python -m prisma generate
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

```env
DATABASE_URL=postgresql://user:password@prod-db:5432/Food_donation
SECRET_KEY=your-production-secret-key
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=production-smtp-user
SMTP_PASSWORD=production-smtp-password
```

## Contributing

1. Create a feature branch
2. Make changes and test thoroughly
3. Run tests: `pytest`
4. Submit pull request

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review API documentation at `/docs`
3. Check logs for error messages
4. Open an issue on GitHub

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Changelog

### Version 1.0.0
- Initial release
- Email verification system
- Delivery tracking
- NGO and Donor management
- Analytics dashboard
- Background job scheduling
- ML features (Python 3.11 only)
