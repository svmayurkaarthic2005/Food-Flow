# Nightly Background Jobs Implementation

## Overview
Automated ML data refresh system using APScheduler to keep demand forecasts and trust scores up-to-date.

---

## Features

### 1. Automated Scheduling
- Runs daily at 02:00 AM (configurable)
- Uses APScheduler with AsyncIOScheduler
- CronTrigger for reliable scheduling
- Timezone-aware (default: UTC)

### 2. Robust Error Handling
- Jobs are isolated - if one fails, others still run
- Graceful error handling - scheduler never crashes
- Detailed error logging
- Database connection management

### 3. Structured Logging
- JSON-formatted log output
- Execution time tracking
- Row count statistics
- Error details

### 4. Manual Trigger
- API endpoint for manual execution
- Useful for testing and immediate refresh
- Same execution path as scheduled job

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Lifespan Manager                       │    │
│  │  • Start scheduler on startup                       │    │
│  │  • Stop scheduler on shutdown                       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           APScheduler (AsyncIOScheduler)            │    │
│  │  • CronTrigger: Daily at 02:00                    