import { PrismaClient, Role, UserStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Adding admin user...')

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gmail.com' },
    })

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email: admin@gmail.com')
      
      // Update password to admin123
      const adminPassword = await bcrypt.hash('admin123', 12)
      await prisma.user.update({
        where: { email: 'admin@gmail.com' },
        data: {
          passwordHash: adminPassword,
          status: UserStatus.VERIFIED,
          emailVerified: new Date(),
        },
      })
      console.log('✓ Updated admin password to: admin123')
    } else {
      // Create new admin user
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
    }

    console.log('\n✅ Admin user ready!')
    console.log('\n🔐 Admin Login Credentials:')
    console.log('  Email: admin@gmail.com')
    console.log('  Password: admin123')
    console.log('\n📍 Login at: http://localhost:3000/signin')
    console.log('📍 Admin Dashboard: http://localhost:3000/admin')
  } catch (error) {
    console.error('❌ Failed to add admin user:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
