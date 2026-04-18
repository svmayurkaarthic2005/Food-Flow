"""
Redis-based Email Queue
Async job queue for non-blocking email sending with retry logic
"""

import json
import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime

import redis.asyncio as redis

from app.core.config import settings
from app.services.email_service import send_email

logger = logging.getLogger(__name__)

# Redis queue configuration
QUEUE_KEY = "email_queue"
RETRY_KEY = "email_retry"
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds


class EmailQueue:
    """Redis-based email queue manager"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
    
    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf8",
                decode_responses=True
            )
            await self.redis_client.ping()
            logger.info("✅ Connected to Redis")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            self.redis_client = None
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("✅ Disconnected from Redis")
    
    async def enqueue_email(self, payload: Dict[str, Any]) -> bool:
        """
        Add email job to queue.
        
        Args:
            payload: Email job data {to, subject, html, text}
            
        Returns:
            True if enqueued successfully
        """
        if not self.redis_client:
            logger.warning("Redis not connected, sending email directly")
            try:
                await send_email(**payload)
                return True
            except Exception as e:
                logger.error(f"Direct send failed: {e}")
                return False
        
        try:
            job = {
                "payload": payload,
                "retries": 0,
                "created_at": datetime.now().isoformat()
            }
            await self.redis_client.rpush(QUEUE_KEY, json.dumps(job))
            logger.info(f"📧 Email queued to {payload['to']}")
            return True
        except Exception as e:
            logger.error(f"Failed to enqueue email: {e}")
            return False
    
    async def process_queue(self):
        """
        Process email queue continuously.
        Runs as background task.
        """
        if not self.redis_client:
            logger.warning("Redis not available, skipping queue processing")
            return
        
        logger.info("🚀 Email queue worker started")
        
        while True:
            try:
                # Get next job from queue
                job_json = await self.redis_client.lpop(QUEUE_KEY)
                
                if not job_json:
                    # Queue empty, wait before checking again
                    await asyncio.sleep(1)
                    continue
                
                job = json.loads(job_json)
                payload = job["payload"]
                retries = job["retries"]
                
                try:
                    # Send email
                    await send_email(**payload)
                    logger.info(f"✅ Email sent to {payload['to']}")
                    
                except Exception as e:
                    logger.error(f"❌ Email send failed: {e}")
                    
                    # Retry logic
                    if retries < MAX_RETRIES:
                        job["retries"] = retries + 1
                        # Push back to queue for retry
                        await self.redis_client.rpush(QUEUE_KEY, json.dumps(job))
                        logger.info(f"🔄 Retrying email to {payload['to']} (attempt {retries + 1})")
                        await asyncio.sleep(RETRY_DELAY)
                    else:
                        # Max retries exceeded, log failure
                        logger.error(f"❌ Email to {payload['to']} failed after {MAX_RETRIES} retries")
                        # Optionally store in dead letter queue
                        await self.redis_client.rpush(
                            f"{QUEUE_KEY}:dead_letter",
                            json.dumps(job)
                        )
            
            except Exception as e:
                logger.error(f"Queue processing error: {e}")
                await asyncio.sleep(1)


# Global queue instance
email_queue = EmailQueue()


async def start_email_worker():
    """Start email queue worker (call from FastAPI startup)"""
    await email_queue.connect()
    asyncio.create_task(email_queue.process_queue())


async def stop_email_worker():
    """Stop email queue worker (call from FastAPI shutdown)"""
    await email_queue.disconnect()
