#!/bin/bash

# NGO Donor Rating System - Deployment Commands
# Run these commands in order to deploy the rating system

echo "=========================================="
echo "NGO Donor Rating System Deployment"
echo "=========================================="

# Step 1: Setup Environment
echo ""
echo "Step 1: Setting up environment..."
echo "Make sure you have:"
echo "  - PostgreSQL running"
echo "  - DATABASE_URL environment variable set"
echo "  - Node.js and npm installed"
echo "  - Python 3.9+ installed"
echo ""
read -p "Press enter to continue..."

# Step 2: Backend Setup
echo ""
echo "Step 2: Backend setup..."
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your DATABASE_URL"
    read -p "Press enter after updating .env..."
fi

# Install dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Run Prisma migration
echo ""
echo "Running Prisma migration..."
npx prisma migrate dev --name add_donor_ratings

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "✅ Backend setup complete"

# Step 3: Frontend Setup
echo ""
echo "Step 3: Frontend setup..."
cd ../frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete"

# Step 4: Run Tests
echo ""
echo "Step 4: Running tests..."
cd ../backend

echo "Running rating system tests..."
pytest tests/test_donor_ratings.py -v

if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Tests failed. Please check the output above."
    exit 1
fi

# Step 5: Summary
echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start backend: cd backend && python -m uvicorn main:app --reload"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Test rating flow:"
echo "   - Login as NGO"
echo "   - Go to /ngo/claimed"
echo "   - Complete a claim"
echo "   - Click 'Rate Donor'"
echo "   - Submit rating"
echo ""
echo "Documentation:"
echo "- RATING_SYSTEM_QUICKSTART.md - Quick start guide"
echo "- RATING_ML_INTEGRATION_GUIDE.md - ML integration details"
echo "- NGO_DONOR_RATING_SYSTEM.md - System overview"
echo ""
