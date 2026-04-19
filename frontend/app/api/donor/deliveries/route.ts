import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { donorProfile: true },
    })

    if (!user || user.role !== 'DONOR' || !user.donorProfile) {
      return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 })
    }

    // Fetch deliveries for donor's listings
    const deliveries = await prisma.delivery.findMany({
      where: {
        claim: {
          listing: {
            donorId: user.donorProfile.id,
          },
        },
      },
      include: {
        claim: {
          include: {
            listing: true,
          },
        },
        ngo: {
          include: {
            user: true,
          },
        },
        driver: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({ deliveries })
  } catch (error) {
    console.error('Error fetching donor deliveries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    )
  }
}
