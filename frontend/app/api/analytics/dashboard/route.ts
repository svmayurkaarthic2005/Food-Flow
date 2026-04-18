import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ListingStatus } from '@prisma/client'
import { withCache, getCacheKey, CacheTTL } from '@/utils/cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    // Create cache key based on query params
    const cacheKey = getCacheKey('analytics:dashboard', { userId, role })

    // Use cache-aside pattern with longer TTL for analytics
    const result = await withCache(
      cacheKey,
      async () => {
        // Get counts
        const totalListings = await prisma.foodListing.count()
        const availableListings = await prisma.foodListing.count({
          where: { status: 'AVAILABLE' },
        })
        const claimedListings = await prisma.foodListing.count({
          where: { status: 'CLAIMED' },
        })
        const totalUsers = await prisma.user.count()
        const totalDonors = await prisma.donor.count()
        const totalNGOs = await prisma.ngo.count()
        const totalClaims = await prisma.claim.count()

        // Get recent listings
        const recentListings = await prisma.foodListing.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            donor: {
              include: { user: true },
            },
          },
        })

        // Get recent claims
        const recentClaims = await prisma.claim.findMany({
          take: 5,
          orderBy: { claimedAt: 'desc' },
          include: {
            listing: true,
            ngo: {
              include: { user: true },
            },
          },
        })

        // Calculate metrics
        const urgentListings = await prisma.foodListing.count({
          where: {
            status: 'AVAILABLE',
            expiryTime: {
              lte: new Date(Date.now() + 2 * 60 * 60 * 1000), // expires in 2 hours
            },
          },
        })

        // Get top donors
        const topDonors = await prisma.donor.findMany({
          take: 5,
          orderBy: { totalDonated: 'desc' },
          include: { user: true },
        })

        // Get top NGOs
        const topNGOs = await prisma.ngo.findMany({
          take: 5,
          orderBy: { totalReceived: 'desc' },
          include: { user: true },
        })

        return {
          summary: {
            totalListings,
            availableListings,
            claimedListings,
            totalUsers,
            totalDonors,
            totalNGOs,
            totalClaims,
            urgentListings,
          },
          recentListings,
          recentClaims,
          topDonors,
          topNGOs,
        }
      },
      CacheTTL.MEDIUM // 5 minutes - analytics can be slightly stale
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
