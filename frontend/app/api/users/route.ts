import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (role && role !== 'all') {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatar: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          donorProfile: {
            select: {
              id: true,
              listings: true,
            },
          },
          ngoProfile: {
            select: {
              id: true,
              claims: {
                select: {
                  id: true,
                  listing: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Calculate activity for each user
    const usersWithActivity = users.map(user => {
      let activity = 0
      if (user.donorProfile) {
        activity = user.donorProfile.listings.length
      } else if (user.ngoProfile) {
        activity = user.ngoProfile.claims.reduce((sum, claim) => {
          const qty = parseFloat(claim.listing?.quantity?.replace(/[^\d.]/g, '') || '0')
          return sum + (isNaN(qty) ? 0 : qty)
        }, 0)
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        activity,
        donorId: user.donorProfile?.id,
        ngoId: user.ngoProfile?.id,
      }
    })

    return NextResponse.json({
      data: usersWithActivity,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
