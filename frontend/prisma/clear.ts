import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Clearing all database data...')

  // Delete in correct order (respecting foreign key constraints)
  await prisma.locationUpdate.deleteMany()
  console.log('✓ Cleared location updates')
  
  await prisma.delivery.deleteMany()
  console.log('✓ Cleared deliveries')
  
  await prisma.claim.deleteMany()
  console.log('✓ Cleared claims')
  
  await prisma.foodListing.deleteMany()
  console.log('✓ Cleared food listings')
  
  await prisma.nGORequest.deleteMany()
  console.log('✓ Cleared NGO requests')
  
  await prisma.admin.deleteMany()
  console.log('✓ Cleared admin profiles')
  
  await prisma.ngo.deleteMany()
  console.log('✓ Cleared NGO profiles')
  
  await prisma.donor.deleteMany()
  console.log('✓ Cleared donor profiles')
  
  await prisma.session.deleteMany()
  console.log('✓ Cleared sessions')
  
  await prisma.account.deleteMany()
  console.log('✓ Cleared accounts')
  
  await prisma.verificationToken.deleteMany()
  console.log('✓ Cleared verification tokens')
  
  await prisma.user.deleteMany()
  console.log('✓ Cleared users')

  console.log('✅ Database cleared successfully!')
  console.log('💡 You can now create real users by signing up at /signup')
}

main()
  .catch((e) => {
    console.error('❌ Error clearing database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
