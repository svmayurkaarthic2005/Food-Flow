# Backend Startup Guide

## Quick Start (Windows)

### Option 1: Using the Startup Script (Recommended)
```bash
cd backend
start.bat
```

### Option 2: Manual Start
```bash
# Navigate to backend folder
cd backend

# Start the server
python -m uvicorn main:app --reload
```

The backend will start on: **http://localhost:8000**

---

## First Time Setup

If this is your first time running the backend, follow these steps:

### 1. Install Python
Make sure you have Python 3.9+ installed:
```bash
python --version
```

### 2. Create Virtual Environment (Recommended)
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Activate it (Mac/Linux)
source venv/bin/activate
```

### 3. Install Dependencies
```bash
# Make sure you're in the backend folder
cd backend

# Install all required packages
pip install -r requirements.txt
```

### 4. Setup Environment Variables
Create a `.env` file in the `backend` folder:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/foodflow"

# Email (already configured)
FROM_EMAIL="noreply@foodflow.app"

# Optional
FRONTEND_URL="http://localhost:3000"
```

### 5. Generate Prisma Client
```bash
# Generate Prisma Python client
prisma generate
```

### 6. Start the Server
```bash
python -m uvicorn main:app --reload
```

---

## Verify Backend is Running

### Check Health Endpoint
Open your browser or use curl:
```bash
# Browser
http://localhost:8000/health

# Or using curl
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy"
}
```

### Check API Documentation
FastAPI provides automatic API documentation:
```bash
# Swagger UI
http://localhost:8000/docs

# ReDoc
http://localhost:8000/redoc
```

---

## Common Issues & Solutions

### Issue 1: "python: command not found"
**Solution**: Install Python from https://www.python.org/downloads/

### Issue 2: "No module named 'fastapi'"
**Solution**: Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Issue 3: "Port 8000 is already in use"
**Solution**: Kill the process using port 8000:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

Or use a different port:
```bash
python -m uvicorn main:app --reload --port 8001
```

### Issue 4: "prisma: command not found"
**Solution**: Generate Prisma client:
```bash
pip install prisma
prisma generate
```

### Issue 5: Database Connection Error
**Solution**: 
1. Make sure PostgreSQL is running
2. Check DATABASE_URL in `.env` file
3. Verify database exists:
```bash
psql -U postgres -c "CREATE DATABASE foodflow;"
```

---

## Development Commands

### Start Server (Development Mode)
```bash
python -m uvicorn main:app --reload
```
- Auto-reloads on code changes
- Runs on http://localhost:8000

### Start Server (Production Mode)
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Run Tests
```bash
pytest
```

### Run Tests with Coverage
```bash
pytest --cov=app --cov-report=html
```

### Check Code Style
```bash
# Install flake8
pip install flake8

# Run linter
flake8 app/
```

---

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # API endpoints
│   │       ├── auth.py
│   │       ├── listings.py
│   │       ├── claims.py
│   │       └── email_verification.py  # NEW
│   ├── core/
│   │   ├── config.py
│   │   ├── email.py         # Email service (Brevo SMTP)
│   │   └── security.py
│   ├── db/
│   │   └── database.py      # Prisma client
│   ├── ml/                  # Machine learning models
│   ├── services/            # Business logic
│   └── jobs/                # Background jobs
├── main.py                  # FastAPI application
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables
└── start.bat               # Startup script (Windows)
```

---

## Environment Variables Reference

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/foodflow"

# Email Service (Already Configured)
FROM_EMAIL="noreply@foodflow.app"

# Optional
FRONTEND_URL="http://localhost:3000"
LOG_LEVEL="INFO"
```

---

## Testing the Email Verification

After starting the backend, test the email verification endpoint:

```bash
# Run the test script
python test_email_verification.py
```

Or manually test with curl:
```bash
curl -X POST http://localhost:8000/api/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "verification_url": "http://localhost:3000/auth/verify-email?token=abc123&email=test@example.com"
  }'
```

---

## Next Steps

1. ✅ Start backend: `python -m uvicorn main:app --reload`
2. ✅ Verify health: http://localhost:8000/health
3. ✅ Check API docs: http://localhost:8000/docs
4. ✅ Start frontend: `cd frontend && npm run dev`
5. ✅ Test signup: http://localhost:3000/signup

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `python -m uvicorn main:app --reload` | Start development server |
| `python test_email_verification.py` | Test email service |
| `pytest` | Run tests |
| `prisma generate` | Generate Prisma client |
| `pip install -r requirements.txt` | Install dependencies |

---

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify all dependencies are installed
3. Check the `.env` file configuration
4. Review the logs in the terminal

For email verification issues, see: `EMAIL_VERIFICATION_FIX.md`
