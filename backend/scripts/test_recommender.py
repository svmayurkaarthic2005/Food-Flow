"""
Test Recommender System
Quick script to test NGO recommendations with seeded data
"""

import asyncio
import logging
from datetime import datetime, timedelta

from prisma import Prisma
from app.ml.services.recommender import recommend_ngos_for_listing

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def create_test_listing(db: Prisma):
    """Create a test food listing"""
    
    # Get first donor
    donor = await db.donor.find_first()
    if not donor:
        logger.error("❌ No donors found. Create a donor first.")
        return None
    
    # Create listing
    listing = await db.foodlisting.create(
        data={
            "name": "Test Fresh Vegetables",
            "description": "Assorted fresh vegetables for testing",
            "quantity": "50 kg",
            "category": "Produce",
            "address": "North District, Chennai",
            "latitude": 12.974908,
            "longitude": 80.290143,
            "expiryTime": datetime.now() + timedelta(hours=6),
            "donorId": donor.id,
            "priority": "MEDIUM"
        }
    )
    
    logger.info(f"✅ Created test listing: {listing.id}")
    return listing


async def test_recommender():
    """Test recommender system with seeded NGOs"""
    
    db = Prisma()
    
    try:
        await db.connect()
        logger.info("✅ Connected to database")
        
        # Check NGOs
        ngo_count = await db.ngo.count()
        logger.info(f"📊 NGOs in database: {ngo_count}")
        
        if ngo_count == 0:
            logger.error("❌ No NGOs found. Run seed_ngos.py first.")
            return
        
        # Create test listing
        listing = await create_test_listing(db)
        if not listing:
            return
        
        # Get recommendations
        logger.info("\n🔍 Getting recommendations...")
        recommendations = await recommend_ngos_for_listing(
            listing_id=listing.id,
            db=db,
            top_n=3,
            max_distance_km=50.0
        )
        
        if not recommendations:
            logger.warning("⚠️  No recommendations found")
            return
        
        # Display results
        logger.info("\n" + "=" * 80)
        logger.info("📋 TOP NGO RECOMMENDATIONS")
        logger.info("=" * 80)
        
        for i, rec in enumerate(recommendations, 1):
            logger.info(f"\n{i}. {rec.name}")
            logger.info(f"   Score: {rec.score}/100")
            logger.info(f"   Distance: {rec.distance_km} km")
            logger.info(f"   Trust: {rec.trust_label} ({rec.trust_score})")
        
        logger.info("\n" + "=" * 80)
        
        # Cleanup
        await db.foodlisting.delete(where={"id": listing.id})
        logger.info("\n✅ Test listing cleaned up")
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
    finally:
        await db.disconnect()
        logger.info("✅ Disconnected from database")


async def show_ngo_stats():
    """Show statistics about seeded NGOs"""
    
    db = Prisma()
    
    try:
        await db.connect()
        
        ngos = await db.ngo.find_many(
            order_by={"organizationName": "asc"}
        )
        
        logger.info("\n" + "=" * 100)
        logger.info("📊 NGO STATISTICS")
        logger.info("=" * 100)
        
        logger.info(f"\n{'Name':<30} {'Trust':<10} {'Storage':<20} {'Location':<30}")
        logger.info("-" * 100)
        
        for ngo in ngos:
            storage = f"{ngo.currentStorage}/{ngo.storageCapacity} kg"
            location = f"({ngo.latitude:.4f}, {ngo.longitude:.4f})"
            logger.info(
                f"{ngo.organizationName:<30} "
                f"{ngo.trustLabel:<10} "
                f"{storage:<20} "
                f"{location:<30}"
            )
        
        logger.info("-" * 100)
        
        # Summary
        total_capacity = sum(ngo.storageCapacity for ngo in ngos)
        total_storage = sum(ngo.currentStorage for ngo in ngos)
        avg_trust = sum(ngo.trustScore or 0 for ngo in ngos) / len(ngos) if ngos else 0
        
        logger.info(f"\nTotal Capacity: {total_capacity} kg")
        logger.info(f"Total Storage Used: {total_storage} kg ({total_storage/total_capacity*100:.1f}%)")
        logger.info(f"Average Trust Score: {avg_trust:.1f}")
        logger.info("=" * 100)
        
    except Exception as e:
        logger.error(f"❌ Failed to get stats: {e}")
    finally:
        await db.disconnect()


async def main():
    """Main entry point"""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "stats":
        await show_ngo_stats()
    else:
        await test_recommender()


if __name__ == "__main__":
    asyncio.run(main())
