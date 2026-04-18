from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
from dotenv import load_dotenv

from app.api.routes import auth, users, listings, claims, analytics, donors, ngos, notifications
from app.ml.routes import router as ml_router_legacy
from app.ml.router import router as ml_router_v1
from app.db.database import prisma
from app.jobs import scheduler
from app.services.email_queue import start_email_worker, stop_email_worker

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        # Connect to database
        await prisma.connect()
        logger.info("✅ Database connected")
        
        # Start email worker
        await start_email_worker()
        logger.info("✅ Email worker started")
        
        # Start background scheduler
        scheduler.start()
        logger.info("✅ Background scheduler started")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    try:
        # Shutdown scheduler
        scheduler.shutdown(wait=True)
        logger.info("✅ Background scheduler stopped")
        
        # Stop email worker
        await stop_email_worker()
        logger.info("✅ Email worker stopped")
        
        # Disconnect database
        await prisma.disconnect()
        logger.info("✅ Database disconnected")
        
    except Exception as e:
        logger.error(f"❌ Shutdown error: {str(e)}")

app = FastAPI(
    title="FoodFlow API",
    description="Food redistribution platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(listings.router, prefix="/api/listings", tags=["Listings"])
app.include_router(claims.router, prefix="/api/claims", tags=["Claims"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(donors.router, prefix="/api/donors", tags=["Donors"])
app.include_router(ngos.router, prefix="/api/ngos", tags=["NGOs"])
app.include_router(notifications.router, tags=["Notifications"])

# ML routers (v1 with feature flags, legacy for backward compatibility)
app.include_router(ml_router_v1, tags=["ML v1"])
app.include_router(ml_router_legacy, prefix="/api", tags=["ML Legacy"])

@app.get("/")
async def root():
    return {
        "message": "FoodFlow API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
