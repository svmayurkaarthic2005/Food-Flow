import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await req.json()

    if (!role || !['DONOR', 'NGO', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Update Clerk user metadata (server-side)
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        role,
      },
    })

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        donorProfile: true,
        ngoProfile: true,
        adminProfile: true,
      },
    })

    if (!user) {
      // Get user info from Clerk
      const clerkUser = await clerk.users.getUser(userId)
      const email = clerkUser.emailAddresses[0]?.emailAddress || ''
      const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email

      // Check if user exists with this email (from old auth system)
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        // Update existing user with clerkId
        user = await prisma.user.update({
          where: { email },
          data: {
            clerkId: userId,
            role,
          },
          include: {
            donorProfile: true,
            ngoProfile: true,
            adminProfile: true,
          },
        })
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email,
            name,
            role,
            status: 'ACTIVE',
          },
          include: {
            donorProfile: true,
            ngoProfile: true,
            adminProfile: true,
          },
        })
      }
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { clerkId: userId },
        data: { role },
        include: {
          donorProfile: true,
          ngoProfile: true,
          adminProfile: true,
        },
      })
    }

    // Create role-specific profile if it doesn't exist
    if (role === 'DONOR' && !user.donorProfile) {
      await prisma.donor.create({
        data: {
          userId: user.id,
          businessName: user.name,
          businessType: 'OTHER',
          address: '',
          latitude: 0,
          longitude: 0,
        },
      })
    } else if (role === 'NGO' && !user.ngoProfile) {
      await prisma.ngo.create({
        data: {
          userId: user.id,
          organizationName: user.name,
          address: '',
          latitude: 0,
          longitude: 0,
          storageCapacity: 0,
          currentStorage: 0,
        },
      })
    } else if (role === 'ADMIN' && !user.adminProfile) {
      await prisma.admin.create({
        data: {
          userId: user.id,
          permissions: ['VIEW_ANALYTICS', 'MANAGE_USERS'],
        },
      })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}
