# FastAPI Backend Setup Guide

## Overview

This is a FastAPI backend for the FoodFlow application, providing RESTful APIs for food redistribution management.

## Features

- ✅ JWT Authentication
- ✅ Role-based access control (DONOR, NGO, ADMIN)
- ✅ Prisma ORM integration
- ✅ CORS enabled for frontend
- ✅ Auto-generated API documentation
- ✅ Password hashing with bcrypt
- ✅ Async/await support

## Prerequisites

- Python 3.9 or higher
- PostgreSQL database
- pip (Python package manager)

## Quick Start

### 1. Setup (First Time Only)

**On Windows:**
```bash
setup.bat
```

**On Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Configure Environment

Edit `.env` file with your configuration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/foodflow"
SECRET_KEY="your-secret-key-here"
FRONTEND_URL="http://localhost:3000"
```

### 3. Run Database Migrations

```bash
# Activate virtual environment first
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Run migrations
cd ../frontend  # Go to frontend directory where schema.prisma is
npx prisma migrate dev
cd ../backend
```

### 4. Start the Server

**On Windows:**
```bash
start.bat
```

**On Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

The server will start on `http://localhost:8000`

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Listings
- `GET /api/listings` - Get all listings
- `GET /api/listings/{id}` - Get listing by ID
- `POST /api/listings` - Create new listing (Donor only)
- `PATCH /api/listings/{id}` - Update listing
- `DELETE /api/listings/{id}` - Delete listing

### Claims
- `GET /api/claims` - Get all claims
- `POST /api/claims` - Create new claim (NGO only)
- `PATCH /api/claims/{id}/status` - Update claim status

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/stats` - Get platform statistics

### Users
- `GET /api/users/{id}` - Get user by ID
- `PATCH /api/users/{id}` - Update user profile

### Donors
- `GET /api/donors/{id}` - Get donor by ID
- `PATCH /api/donors/{id}` - Update donor profile

### NGOs
- `GET /api/ngos/{id}` - Get NGO by ID
- `PATCH /api/ngos/{id}` - Update NGO profile

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Example Login Flow

1. **Signup:**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "donor@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "DONOR"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "donor@example.com",
    "password": "password123"
  }'
```

3. **Use Token:**
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── listings.py      # Listing management
│   │       ├── claims.py        # Claim management
│   │       ├── analytics.py     # Analytics endpoints
│   │       ├── users.py         # User management
│   │       ├── donors.py        # Donor endpoints
│   │       └── ngos.py          # NGO endpoints
│   ├── core/
│   │   ├── config.py            # Configuration
│   │   └── security.py          # JWT & password handling
│   └── db/
│       └── database.py          # Prisma client
├── main.py                      # FastAPI application
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment template
└── setup.sh / setup.bat         # Setup scripts
```

## Development

### Install Development Dependencies

```bash
pip install pytest pytest-asyncio httpx
```

### Run Tests

```bash
pytest
```

### Code Formatting

```bash
pip install black
black .
```

## Connecting Frontend to FastAPI

Update your frontend API calls to point to FastAPI:

```typescript
// frontend/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export async function fetchListings(status?: string) {
  const url = status 
    ? `${API_BASE_URL}/listings?status=${status}`
    : `${API_BASE_URL}/listings`
  
  const response = await fetch(url)
  return response.json()
}
```

## Troubleshooting

### Port Already in Use

If port 8000 is already in use, change it in the start script:

```bash
uvicorn main:app --reload --port 8001
```

### Database Connection Error

1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Ensure database exists:
```bash
createdb foodflow
```

### Prisma Client Not Found

Generate the Prisma client:

```bash
prisma generate
```

### Import Errors

Make sure virtual environment is activated:

```bash
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

## Production Deployment

### Using Gunicorn (Recommended)

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN prisma generate

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | Required |
| SECRET_KEY | JWT secret key | Required |
| ALGORITHM | JWT algorithm | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token expiration time | 30 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

## Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review the logs for error messages
3. Ensure all environment variables are set correctly

## License

MIT
