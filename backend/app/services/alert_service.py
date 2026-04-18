"""
High Priority Food Alert Service
Sends alerts to NGOs for high-priority food listings
Future: Integrate with ML recommender for smart targeting
"""

import logging
from typing import Optional

from app.db.database import prisma
from app.services.email_queue import email_queue

logger = logging.getLogger(__name__)


async def send_high_priority_alert(listing_id: str) -> bool:
    """
    Send high-priority food alert to relevant NGOs.
    
    Args:
        listing_id: Food listing ID
        
    Returns:
        True if alerts sent successfully
        
    Future:
        - Use ML recommender to find best NGOs
        - Filter by location, capacity, acceptance rate
        - Send personalized alerts
    """
    try:
        # Get listing details
        listing = await prisma.foodlisting.find_unique(
            where={"id": listing_id},
            include={"donor": True}
        )
        
        if not listing:
            logger.warning(f"Listing {listing_id} not found")
            return False
        
        if listing.priority != "CRITICAL":
            logger.info(f"Listing {listing_id} is not critical priority")
            return False
        
        # TODO: Use ML recommender to get top NGOs
        # For now, get all NGOs (stub)
        ngos = await prisma.ngo.find_many(
            include={"user": True},
            take=10  # Limit to top 10 for now
        )
        
        if not ngos:
            logger.warning("No NGOs found for alert")
            return False
        
        # Queue alerts for each NGO
        for ngo in ngos:
            try:
                alert_link = f"http://localhost:3000/ngo/listings/{listing_id}"
                
                await email_queue.enqueue_email({
                    "to": ngo.user.email,
                    "subject": f"🚨 High Priority Food Alert - {listing.name}",
                    "html": f"""
                    <html>
                        <body style="font-family: Arial; line-height: 1.6;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="background: #EF4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                                    <h2>🚨 High Priority Food Alert</h2>
                                </div>
                                <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                                    <p>Hi {ngo.user.name},</p>
                                    <p>A high-priority food listing is available for immediate pickup!</p>
                                    <p><strong>Food:</strong> {listing.name}</p>
                                    <p><strong>Category:</strong> {listing.category}</p>
                                    <p><strong>Expires:</strong> {listing.expiryTime}</p>
                                    <p><strong>Donor:</strong> {listing.donor.businessName}</p>
                                    <a href="{alert_link}" style="display: inline-block; background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                                        Claim Now
                                    </a>
                                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                                        <p>FoodFlow Team</p>
                                    </div>
                                </div>
                            </div>
                        </body>
                    </html>
                    """
                })
                
                logger.info(f"High-priority alert queued for NGO {ngo.id}")
            
            except Exception as e:
                logger.error(f"Failed to queue alert for NGO {ngo.id}: {e}")
                continue
        
        logger.info(f"✅ High-priority alerts sent for listing {listing_id}")
        return True
    
    except Exception as e:
        logger.error(f"Error sending high-priority alerts: {e}")
        return False
