# Database Setup Guide

This guide walks you through setting up PostgreSQL and Prisma for FoodFlow.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+
- npm or pnpm

## Step 1: Install PostgreSQL

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. PostgreSQL will run on `localhost:5432` by default

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the foodflow database
CREATE DATABASE foodflow;

# Exit psql
\q
```

## Step 3: Configure Environment Variables

Update `frontend/.env.local`:

```env
# Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/foodflow"

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC3fsrBckfPWI1VELnmdmaOWnLJpclkfVw

# JWT Secrets (change these in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-change-in-production
```

## Step 4: Run Prisma Migrations

```bash
cd frontend

# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# Or use db push (for development)
npm run db:push
```

## Step 5: Seed Database

```bash
cd frontend

# Run the seed script
npm run db:seed
```

This will create:
- 1 Admin user (without shared password)
- 4 Donor users with sample listings
- 2 NGO users

## Step 6: Verify Setup

```bash
# Start the development server
npm run dev
```

Visit `http://localhost:3000` and check:
1. Map displays with markers from database
2. Listings show real data from PostgreSQL
3. No console errors about mock data

## Troubleshooting

### Connection Error: "connect ECONNREFUSED"
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct
- Verify database exists: `psql -U postgres -l`

### Migration Error: "relation already exists"
- Reset database: `npx prisma migrate reset`
- Or manually drop tables: `DROP TABLE IF EXISTS "User" CASCADE;`

### Seed Script Fails
- Ensure all dependencies are installed: `npm install`
- Check DATABASE_URL is correct
- Try running migrations first: `npm run prisma:migrate`

### Port 5432 Already in Use
- PostgreSQL is already running (this is fine)
- Or another service is using the port
- Change DATABASE_URL to use a different port if needed

## Database Schema

The schema includes:

- **User**: Base user model with role (DONOR, NGO, ADMIN)
- **Donor**: Donor profile with business details
- **NGO**: NGO profile with organization details
- **FoodListing**: Food items available for donation
- **Claim**: NGO claims on food listings
- **Delivery**: Delivery tracking for claimed items
- **LocationUpdate**: Real-time location updates during delivery

## Next Steps

1. Start the development server: `npm run dev`
2. Test the API endpoints
3. Implement authentication
4. Build delivery tracking features

## Useful Commands

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Create a new migration
npx prisma migrate dev --name add_new_field

# Generate Prisma Client
npx prisma generate

# Check database connection
npx prisma db execute --stdin < query.sql
```

## Production Deployment

For production:

1. Use a managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)
2. Update DATABASE_URL with production credentials
3. Run migrations: `npx prisma migrate deploy`
4. Set strong JWT secrets in environment variables
5. Enable SSL for database connections
6. Set up automated backups
