import { PrismaClient, Role, UserStatus, ListingStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

function generateSecureSeedPassword() {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}A1!`
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.locationUpdate.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.claim.deleteMany()
  await prisma.foodListing.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.ngo.deleteMany()
  await prisma.donor.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      status: UserStatus.VERIFIED,
      emailVerified: new Date(),
      adminProfile: {
        create: {
          permissions: ['manage_users', 'manage_listings', 'view_analytics'],
        },
      },
    },
  })
  console.log('✓ Created admin user:', adminUser.email)
  console.log('  Email: admin@gmail.com')
  console.log('  Password: admin123')

  // Create donor users with listings
  const donors = [
    {
      email: 'bakery@foodflow.com',
      name: 'Downtown Bakery',
      businessName: 'Downtown Bakery Co.',
      businessType: 'Bakery',
      address: '123 Main St, Manhattan',
      latitude: 40.7128,
      longitude: -74.006,
      listings: [
        {
          name: 'Fresh Bakery Items',
          description: 'Fresh bread, croissants, and pastries from today\'s batch',
          quantity: '50 items',
          category: 'Bakery',
          address: '123 Main St, Manhattan',
          latitude: 40.7128,
          longitude: -74.006,
          expiryTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          pickupWindow: '4:00 PM - 6:00 PM',
        },
      ],
    },
    {
      email: 'market@foodflow.com',
      name: 'Green Market NYC',
      businessName: 'Green Market NYC',
      businessType: 'Grocery',
      address: '456 Park Ave, Manhattan',
      latitude: 40.7505,
      longitude: -73.9972,
      listings: [
        {
          name: 'Organic Vegetables',
          description: 'Seasonal organic vegetables including broccoli, carrots, and spinach',
          quantity: '30 kg',
          category: 'Produce',
          address: '456 Park Ave, Manhattan',
          latitude: 40.7505,
          longitude: -73.9972,
          expiryTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
          pickupWindow: '3:00 PM - 8:00 PM',
        },
      ],
    },
    {
      email: 'restaurant@foodflow.com',
      name: 'Bella Restaurant',
      businessName: 'Bella Restaurant',
      businessType: 'Restaurant',
      address: '789 Broadway, Manhattan',
      latitude: 40.7489,
      longitude: -73.968,
      listings: [
        {
          name: 'Restaurant Surplus',
          description: 'Prepared meals and ingredients from lunch service',
          quantity: '15 meals',
          category: 'Prepared Food',
          address: '789 Broadway, Manhattan',
          latitude: 40.7489,
          longitude: -73.968,
          expiryTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
          pickupWindow: '4:00 PM - 9:00 PM',
        },
      ],
    },
    {
      email: 'dairy@foodflow.com',
      name: 'Fresh Dairy Farm',
      businessName: 'Fresh Dairy Farm',
      businessType: 'Dairy',
      address: '321 Madison Ave, Manhattan',
      latitude: 40.7614,
      longitude: -73.9776,
      listings: [
        {
          name: 'Dairy Products',
          description: 'Milk, yogurt, and cheese approaching expiration',
          quantity: '40 units',
          category: 'Dairy',
          address: '321 Madison Ave, Manhattan',
          latitude: 40.7614,
          longitude: -73.9776,
          expiryTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
          pickupWindow: '2:00 PM - 7:00 PM',
        },
      ],
    },
  ]

  for (const donorData of donors) {
    const password = await bcrypt.hash(generateSecureSeedPassword(), 12)
    const user = await prisma.user.create({
      data: {
        email: donorData.email,
        passwordHash: password,
        name: donorData.name,
        role: Role.DONOR,
        status: UserStatus.VERIFIED,
        donorProfile: {
          create: {
            businessName: donorData.businessName,
            businessType: donorData.businessType,
            address: donorData.address,
            latitude: donorData.latitude,
            longitude: donorData.longitude,
          },
        },
      },
      include: { donorProfile: true },
    })

    // Create listings for this donor
    for (const listingData of donorData.listings) {
      await prisma.foodListing.create({
        data: {
          name: listingData.name,
          description: listingData.description,
          quantity: listingData.quantity,
          category: listingData.category,
          address: listingData.address,
          latitude: listingData.latitude,
          longitude: listingData.longitude,
          expiryTime: listingData.expiryTime,
          pickupWindow: listingData.pickupWindow,
          status: ListingStatus.AVAILABLE,
          donorId: user.donorProfile!.id,
        },
      })
    }

    console.log(`✓ Created donor user: ${donorData.email}`)
  }

  // Create NGO users
  const ngos = [
    {
      email: 'ngo1@foodflow.com',
      name: 'Community Food Bank',
      organizationName: 'Community Food Bank',
      address: '100 Community Ave, Manhattan',
      latitude: 40.7614,
      longitude: -73.9776,
      storageCapacity: 5000,
      peopleServed: 500,
    },
    {
      email: 'ngo2@foodflow.com',
      name: 'Hope Foundation',
      organizationName: 'Hope Foundation',
      address: '200 Hope St, Brooklyn',
      latitude: 40.6782,
      longitude: -73.9442,
      storageCapacity: 3000,
      peopleServed: 300,
    },
  ]

  for (const ngoData of ngos) {
    const password = await bcrypt.hash(generateSecureSeedPassword(), 12)
    await prisma.user.create({
      data: {
        email: ngoData.email,
        passwordHash: password,
        name: ngoData.name,
        role: Role.NGO,
        status: UserStatus.VERIFIED,
        ngoProfile: {
          create: {
            organizationName: ngoData.organizationName,
            address: ngoData.address,
            latitude: ngoData.latitude,
            longitude: ngoData.longitude,
            storageCapacity: ngoData.storageCapacity,
            peopleServed: ngoData.peopleServed,
          },
        },
      },
    })
    console.log(`✓ Created NGO user: ${ngoData.email}`)
  }

  console.log('✅ Database seed completed!')
  console.log('\n🔐 Admin Login Credentials:')
  console.log('  Email: admin@gmail.com')
  console.log('  Password: admin123')
  console.log('\n📝 Other seeded users were created without shared passwords.')
  console.log('Use Sign Up or Google OAuth to create login-ready accounts.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
