"""
Seed NGOs from CSV file
Populates database with NGO data for testing and development
"""

import asyncio
import csv
import logging
from pathlib import Path
from datetime import datetime

from prisma import Prisma

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def seed_ngos_from_csv(csv_file: str = "ngos.csv"):
    """
    Load NGOs from CSV file and populate database.
    
    Args:
        csv_file: Path to CSV file
    """
    db = Prisma()
    
    try:
        await db.connect()
        logger.info("✅ Connected to database")
        
        # Read CSV file
        csv_path = Path(csv_file)
        if not csv_path.exists():
            logger.error(f"❌ CSV file not found: {csv_file}")
            return
        
        ngos_created = 0
        ngos_updated = 0
        errors = 0
        
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                try:
                    # Parse data
                    ngo_id = row['id']
                    user_id = row['userId']
                    
                    # Check if NGO already exists
                    existing = await db.ngo.find_unique(where={"id": ngo_id})
                    
                    if existing:
                        # Update existing NGO
                        await db.ngo.update(
                            where={"id": ngo_id},
                            data={
                                "organizationName": row['organizationName'],
                                "address": row['address'],
                                "latitude": float(row['latitude']),
                                "longitude": float(row['longitude']),
                                "storageCapacity": int(row['storageCapacity']),
                                "currentStorage": int(row['currentStorage']),
                                "trustScore": int(row['trustScore']) if row['trustScore'] else None,
                                "trustLabel": row['trustLabel'],
                                "updatedAt": datetime.now()
                            }
                        )
                        ngos_updated += 1
                        logger.info(f"✏️  Updated NGO: {row['organizationName']}")
                    else:
                        # Create new NGO
                        # First, ensure user exists
                        user = await db.user.find_unique(where={"id": user_id})
                        if not user:
                            # Create user if doesn't exist
                            user = await db.user.create(
                                data={
                                    "id": user_id,
                                    "email": f"{user_id}@foodflow.app",
                                    "name": row['organizationName'],
                                    "role": "NGO",
                                    "emailVerified": True,
                                    "password": "hashed_password_placeholder"
                                }
                            )
                            logger.info(f"👤 Created user: {user_id}")
                        
                        # Create NGO
                        await db.ngo.create(
                            data={
                                "id": ngo_id,
                                "userId": user_id,
                                "organizationName": row['organizationName'],
                                "address": row['address'],
                                "latitude": float(row['latitude']),
                                "longitude": float(row['longitude']),
                                "storageCapacity": int(row['storageCapacity']),
                                "currentStorage": int(row['currentStorage']),
                                "trustScore": int(row['trustScore']) if row['trustScore'] else None,
                                "trustLabel": row['trustLabel']
                            }
                        )
                        ngos_created += 1
                        logger.info(f"✅ Created NGO: {row['organizationName']}")
                
                except Exception as e:
                    errors += 1
                    logger.error(f"❌ Error processing row {row.get('id')}: {e}")
                    continue
        
        # Summary
        logger.info("=" * 60)
        logger.info(f"✅ Seeding complete!")
        logger.info(f"   Created: {ngos_created}")
        logger.info(f"   Updated: {ngos_updated}")
        logger.info(f"   Errors: {errors}")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"❌ Seeding failed: {e}")
    finally:
        await db.disconnect()
        logger.info("✅ Disconnected from database")


async def verify_ngos():
    """
    Verify NGOs were seeded correctly.
    """
    db = Prisma()
    
    try:
        await db.connect()
        
        # Count NGOs
        count = await db.ngo.count()
        logger.info(f"📊 Total NGOs in database: {count}")
        
        # Get all NGOs
        ngos = await db.ngo.find_many(
            include={"user": True},
            order_by={"organizationName": "asc"}
        )
        
        logger.info("\n📋 NGOs in database:")
        logger.info("-" * 80)
        
        for ngo in ngos:
            logger.info(
                f"  {ngo.organizationName:30} | "
                f"Trust: {ngo.trustLabel:10} | "
                f"Storage: {ngo.currentStorage}/{ngo.storageCapacity} kg | "
                f"Location: ({ngo.latitude:.4f}, {ngo.longitude:.4f})"
            )
        
        logger.info("-" * 80)
        
    except Exception as e:
        logger.error(f"❌ Verification failed: {e}")
    finally:
        await db.disconnect()


async def main():
    """Main entry point"""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "verify":
        await verify_ngos()
    else:
        await seed_ngos_from_csv()


if __name__ == "__main__":
    asyncio.run(main())
