# FoodFlow Deployment Guide

This guide covers deployment options for the FoodFlow platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Deployment](#vercel-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Self-Hosted Deployment](#self-hosted-deployment)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring & Logging](#monitoring--logging)
9. [Scaling](#scaling)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Git
- A production database (PostgreSQL recommended)
- SSL certificate for HTTPS
- Domain name

## Vercel Deployment

Vercel is the recommended platform for deploying FoodFlow.

### Step 1: Prepare Your Repository

```bash
# Initialize git if not done
git init

# Add Vercel config
cat > vercel.json << EOF
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-api.com/api/:path*"
    }
  ]
}
EOF
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production deployment
vercel --prod
```

### Step 3: Configure Environment Variables

```bash
vercel env add NEXT_PUBLIC_API_URL https://api.foodflow.io
vercel env add DATABASE_URL postgresql://user:pass@host/db
vercel env add JWT_SECRET your_secret_key
vercel env add API_KEY your_api_key
```

### Step 4: Set Custom Domain

In Vercel dashboard:
1. Go to Settings > Domains
2. Add your custom domain
3. Update DNS records

## Docker Deployment

### Step 1: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm i -g pnpm && pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000

CMD ["npm", "start"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/foodflow
      - NEXT_PUBLIC_API_URL=http://localhost:3000
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    networks:
      - foodflow

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=foodflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - foodflow

  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - foodflow

volumes:
  postgres_data:

networks:
  foodflow:
    driver: bridge
```

### Step 3: Deploy Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down
```

## Self-Hosted Deployment

### Option 1: AWS EC2

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance.com

# 3. Install dependencies
sudo apt update
sudo apt install -y nodejs npm postgresql nginx certbot

# 4. Install pnpm
npm install -g pnpm

# 5. Clone repository
git clone https://github.com/yourusername/foodflow.git
cd foodflow

# 6. Install dependencies
pnpm install

# 7. Build application
pnpm build

# 8. Create .env.production
cp .env.example .env.production
nano .env.production

# 9. Setup PM2 for process management
npm install -g pm2
pm2 start npm --name "foodflow" -- start
pm2 startup
pm2 save

# 10. Configure nginx as reverse proxy
sudo nano /etc/nginx/sites-available/foodflow

# 11. Enable site
sudo ln -s /etc/nginx/sites-available/foodflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 12. Setup SSL with Let's Encrypt
sudo certbot certonly --nginx -d yourdomain.com
```

### Option 2: DigitalOcean App Platform

```bash
# 1. Create app.yaml
cat > app.yaml << EOF
name: foodflow
services:
- name: web
  github:
    repo: yourusername/foodflow
    branch: main
  build_command: pnpm build
  run_command: npm start
  http_port: 3000
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    scope: RUN_AND_BUILD_TIME
    value: ${db.DATABASE_URL}
databases:
- name: db
  engine: PG
  production: true
EOF

# 2. Deploy with doctl
doctl apps create --spec app.yaml

# 3. View app status
doctl apps list
doctl apps get <app-id>
```

## Environment Variables

Create `.env.production` file:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://foodflow.io
NEXT_PUBLIC_API_URL=https://api.foodflow.io

# Database
DATABASE_URL=postgresql://user:password@host:5432/foodflow
DATABASE_SSL=true

# Authentication
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRY=7d

# API Keys
API_KEY=your-api-key
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@foodflow.io

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Redis (optional, for caching)
REDIS_URL=redis://host:6379

# File Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=foodflow-storage
```

## Database Setup

### PostgreSQL Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE foodflow;

# Create user
CREATE USER foodflow_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE foodflow TO foodflow_user;

# Connect to database
\c foodflow

# Run migrations (when backend is ready)
npm run migrate:prod
```

### Database Backup

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/foodflow"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/foodflow_$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump -U foodflow_user foodflow > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://foodflow-backups/
```

Add to crontab:
```bash
0 2 * * * /usr/local/bin/backup-database.sh
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install -g pnpm && pnpm install
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run tests
        run: pnpm test
      
      - name: Build
        run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Monitoring & Logging

### Application Monitoring

```bash
# Install monitoring tools
npm install --save pm2-monitoring
pm2 web  # Start monitoring dashboard

# Or use Datadog
npm install --save dd-trace
```

### Logging Setup

```bash
# Install Winston for logging
npm install --save winston

# View application logs
pm2 logs foodflow

# Or docker logs
docker logs foodflow-app
```

### Error Tracking

Set up Sentry for error tracking:

```bash
# Install Sentry SDK
npm install --save @sentry/nextjs

# Configure in next.config.mjs
# See Sentry documentation
```

## Scaling

### Horizontal Scaling

```bash
# Load balancing with nginx
upstream foodflow {
  server app1:3000;
  server app2:3000;
  server app3:3000;
}

server {
  listen 80;
  server_name foodflow.io;
  
  location / {
    proxy_pass http://foodflow;
    proxy_set_header Host $host;
  }
}
```

### Vertical Scaling

Increase server resources in your hosting provider (CPU, RAM, storage).

### Database Scaling

```bash
# Read replicas for PostgreSQL
# Create read replica
CREATE PUBLICATION foodflow_pub FOR ALL TABLES;

# Set read-only connection string
DATABASE_READ_URL=postgresql://user:pass@read-replica:5432/foodflow
```

### Caching Strategy

```bash
# Implement Redis caching
npm install --save redis

# Cache frequently accessed data
REDIS_URL=redis://localhost:6379
```

## Troubleshooting

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Increase node heap size
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
psql $DATABASE_URL -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname"
```

### SSL Certificate Issues

```bash
# Renew Let's Encrypt certificate
sudo certbot renew --dry-run

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Application Crashes

```bash
# Check logs
pm2 logs foodflow

# Restart application
pm2 restart foodflow

# Or with docker
docker restart foodflow-app
```

## Performance Optimization

### Enable Compression

```nginx
# nginx.conf
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### Set Cache Headers

```javascript
// next.config.mjs
export default {
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600'
          }
        ]
      }
    ]
  }
}
```

### Enable CDN

```bash
# Configure Cloudflare
# 1. Add domain to Cloudflare
# 2. Update nameservers
# 3. Enable caching rules
```

## Security Checklist

- [ ] SSL/TLS certificate installed
- [ ] Environment variables secured
- [ ] Database encrypted at rest and in transit
- [ ] Regular backups enabled
- [ ] WAF/DDoS protection enabled
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Dependency vulnerabilities scanned
- [ ] Database credentials rotated quarterly
- [ ] Monitoring and alerts enabled
- [ ] Incident response plan documented

---

For deployment support, contact devops@foodflow.io
