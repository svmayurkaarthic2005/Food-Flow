from prisma import Prisma

# Create a single Prisma client instance
prisma = Prisma()

# Dependency for FastAPI routes
async def get_db():
    """Get database session for FastAPI dependency injection"""
    if not prisma.is_connected():
        await prisma.connect()
    return prisma
