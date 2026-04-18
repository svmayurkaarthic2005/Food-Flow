"""
Nightly Background Jobs
Automated ML data refresh using APScheduler
"""

import os
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from prisma import Prisma

from app.db.database import prisma
from app.core.email import EmailService

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
JOB_TIMEZONE = os.getenv("JOB_TIMEZONE", "UTC")
JOB_HOUR = int(os.getenv("JOB_HOUR", "2"))
JOB_MINUTE = int(os.getenv("JOB_MINUTE", "0"))

# Create scheduler
scheduler = AsyncIOScheduler(timezone=JOB_TIMEZONE)


async def refresh_demand_forecasts(db: Prisma) -> Dict[str, Any]:
    """
    Refresh demand forecasts for all districts.
    
    Args:
        db: Prisma client instance
        
    Returns:
        Dictionary with refresh statistics
    """
    from app.ml.services.demand_predictor import retrain_model, predict_demand
    
    start_time = time.time()
    rows_written = 0
    errors = []
    
    try:
        # Retrain model with latest data
        logger.info("Retraining demand prediction model...")
        retrain_result = await retrain_model(db)
        
        if not retrain_result["success"]:
            logger.warning(f"Model retraining failed: {retrain_result['message']}")
            return {
                "success": False,
                "rows_written": 0,
                "duration_ms": int((time.time() - start_time) * 1000),
                "error": retrain_result["message"]
            }
        
        logger.info(f"Model retrained with {retrain_result['samples']} samples")
        
        # Get all unique districts and categories from listings
        listings = await db.foodlisting.find_many(
            select={
                'district': True,
                'category': True
            }
        )
        
        # Get unique combinations
        district_category_pairs = set()
        for listing in listings:
            district_category_pairs.add((listing.district, listing.category))
        
        logger.info(f"Generating forecasts for {len(district_category_pairs)} district-category pairs")
        
        # Generate forecasts for each district-category pair
        for district, category in district_category_pairs:
            try:
                # Predict demand for next 14 days
                forecasts = await predict_demand(
                    district=district,
                    category=category,
                    db=db,
                    days_ahead=14
                )
                
                # Save forecasts to database
                for forecast in forecasts:
                    try:
                        # Upsert forecast (update if exists, create if not)
                        await db.demandforecast.upsert(
                            where={
                                'district_category_forecastDate': {
                                    'district': district,
                                    'category': category,
                                    'forecastDate': forecast.date
                                }
                            },
                            data={
                                'create': {
                                    'district': district,
                                    'category': category,
                                    'forecastDate': forecast.date,
                                    'predicted': forecast.predicted,
                                    'lowerCi': forecast.low,
                                    'upperCi': forecast.high
                                },
                                'update': {
                                    'predicted': forecast.predicted,
                                    'lowerCi': forecast.low,
                                    'upperCi': forecast.high,
                                    'generatedAt': datetime.now()
                                }
                            }
                        )
                        rows_written += 1
                    except Exception as e:
                        error_msg = f"Error saving forecast for {district}/{category}: {str(e)}"
                        logger.error(error_msg)
                        errors.append(error_msg)
                
            except Exception as e:
                error_msg = f"Error predicting demand for {district}/{category}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        return {
            "success": True,
            "rows_written": rows_written,
            "duration_ms": duration_ms,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        error_msg = f"Demand forecast refresh failed: {str(e)}"
        logger.error(error_msg, exc_info=True)
        
        return {
            "success": False,
            "rows_written": rows_written,
            "duration_ms": duration_ms,
            "error": error_msg
        }


async def refresh_trust_scores(db: Prisma) -> Dict[str, Any]:
    """
    Refresh trust scores for all NGOs.
    
    Args:
        db: Prisma client instance
        
    Returns:
        Dictionary with refresh statistics
    """
    from app.ml.services.trust_scorer import batch_update_trust_scores
    
    start_time = time.time()
    
    try:
        logger.info("Refreshing trust scores for all NGOs...")
        
        # Update all NGO trust scores
        result = await batch_update_trust_scores(db)
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        logger.info(f"Trust scores updated: {result['updated']}/{result['total']} NGOs")
        
        return {
            "success": True,
            "rows_written": result['updated'],
            "duration_ms": duration_ms,
            "total": result['total'],
            "skipped": result['skipped']
        }
        
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        error_msg = f"Trust score refresh failed: {str(e)}"
        logger.error(error_msg, exc_info=True)
        
        return {
            "success": False,
            "rows_written": 0,
            "duration_ms": duration_ms,
            "error": error_msg
        }


async def run_nightly_jobs():
    """
    Main nightly job function.
    
    Runs:
    1. Demand forecast refresh
    2. Trust score refresh
    
    Jobs are isolated - if one fails, the other still runs.
    """
    job_start_time = time.time()
    
    logger.info("=" * 80)
    logger.info("Starting nightly ML jobs")
    logger.info("=" * 80)
    
    # Initialize results
    demand_result = None
    trust_result = None
    overall_success = True
    
    # Create new database connection for this job
    # Do NOT reuse request-scoped sessions
    db = Prisma()
    
    try:
        # Connect to database
        await db.connect()
        logger.info("Database connected for nightly job")
        
        # Job 1: Refresh demand forecasts
        try:
            logger.info("Job 1/2: Refreshing demand forecasts...")
            demand_result = await refresh_demand_forecasts(db)
            
            if demand_result["success"]:
                logger.info(
                    f"✓ Demand forecasts refreshed: {demand_result['rows_written']} rows "
                    f"in {demand_result['duration_ms']}ms"
                )
            else:
                logger.error(f"✗ Demand forecast refresh failed: {demand_result.get('error')}")
                overall_success = False
                
        except Exception as e:
            logger.error(f"✗ Demand forecast job crashed: {str(e)}", exc_info=True)
            demand_result = {
                "success": False,
                "rows_written": 0,
                "duration_ms": 0,
                "error": str(e)
            }
            overall_success = False
        
        # Job 2: Refresh trust scores
        try:
            logger.info("Job 2/2: Refreshing trust scores...")
            trust_result = await refresh_trust_scores(db)
            
            if trust_result["success"]:
                logger.info(
                    f"✓ Trust scores refreshed: {trust_result['rows_written']} rows "
                    f"in {trust_result['duration_ms']}ms"
                )
            else:
                logger.error(f"✗ Trust score refresh failed: {trust_result.get('error')}")
                overall_success = False
                
        except Exception as e:
            logger.error(f"✗ Trust score job crashed: {str(e)}", exc_info=True)
            trust_result = {
                "success": False,
                "rows_written": 0,
                "duration_ms": 0,
                "error": str(e)
            }
            overall_success = False
        
    finally:
        # Always disconnect database
        await db.disconnect()
        logger.info("Database disconnected")
    
    # Calculate total duration
    total_duration_ms = int((time.time() - job_start_time) * 1000)
    
    # Build structured log output
    log_data = {
        "event": "nightly_job",
        "status": "success" if overall_success else "failed",
        "duration_ms": total_duration_ms,
        "demand_rows": demand_result["rows_written"] if demand_result else 0,
        "trust_rows": trust_result["rows_written"] if trust_result else 0,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add errors if any
    if not overall_success:
        errors = []
        if demand_result and not demand_result["success"]:
            errors.append(f"Demand: {demand_result.get('error')}")
        if trust_result and not trust_result["success"]:
            errors.append(f"Trust: {trust_result.get('error')}")
        log_data["errors"] = errors
    
    # Log structured output
    logger.info("=" * 80)
    logger.info(f"Nightly job completed: {json.dumps(log_data, indent=2)}")
    logger.info("=" * 80)
    
    # Send email notification if configured
    admin_email = os.getenv("ADMIN_EMAIL")
    if admin_email:
        try:
            await send_nightly_job_notification(log_data, admin_email)
        except Exception as e:
            logger.error(f"Failed to send nightly job notification: {str(e)}")
    
    return log_data


async def send_nightly_job_notification(log_data: Dict[str, Any], admin_email: str):
    """
    Send email notification about nightly job results.
    
    Args:
        log_data: Job results data
        admin_email: Admin email address
    """
    status = log_data["status"]
    status_type = "success" if status == "success" else "warning"
    
    # Build details
    details = {
        "Duration": f"{log_data['duration_ms']}ms",
        "Demand Rows": log_data["demand_rows"],
        "Trust Rows": log_data["trust_rows"],
        "Timestamp": log_data["timestamp"]
    }
    
    if "errors" in log_data:
        details["Errors"] = ", ".join(log_data["errors"])
    
    message = f"Nightly ML jobs completed with status: <strong>{status.upper()}</strong>"
    
    EmailService.send_status_update(
        to_email=admin_email,
        status=status_type,
        title="🌙 Nightly ML Jobs Report",
        message=message,
        details=details
    )


# Register nightly job
scheduler.add_job(
    run_nightly_jobs,
    CronTrigger(hour=JOB_HOUR, minute=JOB_MINUTE, timezone=JOB_TIMEZONE),
    id="nightly_ml_job",
    name="Nightly ML Data Refresh",
    replace_existing=True,
    max_instances=1,  # Prevent concurrent executions
    coalesce=True,    # If multiple runs are pending, only run once
    misfire_grace_time=3600  # Allow up to 1 hour delay
)

logger.info(
    f"Nightly job scheduled: Daily at {JOB_HOUR:02d}:{JOB_MINUTE:02d} {JOB_TIMEZONE}"
)
