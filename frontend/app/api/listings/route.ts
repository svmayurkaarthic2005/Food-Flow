import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ListingStatus } from '@prisma/client'
import { withCache, getCacheKey, CacheTTL } from '@/utils/cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as ListingStatus | null
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const donorId = searchParams.get('donorId')

    const skip = (page - 1) * limit

    // Build filter
    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (donorId) where.donorId = donorId

    // Create cache key based on query params
    const cacheKey = getCacheKey('listings', { status, category, page, limit, donorId })

    // Use cache-aside pattern
    const result = await withCache(
      cacheKey,
      async () => {
        // Fetch listings with donor info
        const listings = await prisma.foodListing.findMany({
          where,
          include: {
            donor: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            expiryTime: 'asc',
          },
          skip,
          take: limit,
        })

        // Calculate urgency for each listing
        const listingsWithUrgency = listings.map((listing) => {
          const now = new Date()
          const expiryTime = new Date(listing.expiryTime)
          const hoursRemaining = (expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60)

          let urgency: 'critical' | 'medium' | 'fresh'
          if (hoursRemaining <= 2) urgency = 'critical'
          else if (hoursRemaining <= 6) urgency = 'medium'
          else urgency = 'fresh'

          return {
            ...listing,
            hoursRemaining: Math.max(0, Math.round(hoursRemaining * 10) / 10),
            urgency,
          }
        })

        // Get total count
        const total = await prisma.foodListing.count({ where })

        return {
          data: listingsWithUrgency,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        }
      },
      CacheTTL.SHORT // 60 seconds - short TTL for frequently changing data
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.quantity || !body.donorId || !body.expiryTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create listing
    const listing = await prisma.foodListing.create({
      data: {
        name: body.name,
        description: body.description || '',
        quantity: body.quantity,
        category: body.category || 'Other',
        address: body.address || '',
        latitude: body.latitude || 0,
        longitude: body.longitude || 0,
        expiryTime: new Date(body.expiryTime),
        pickupWindow: body.pickupWindow,
        status: 'AVAILABLE',
        donorId: body.donorId,
      },
      include: {
        donor: {
          include: {
            user: true,
          },
        },
      },
    })

    // Invalidate listings cache after creating new listing
    const { invalidateRouteCache } = await import('@/utils/cache')
    await invalidateRouteCache('listings')

    // Publish new donation event
    const { publishNewDonation } = await import('@/utils/events')
    await publishNewDonation(listing).catch((err) => {
      console.error('Failed to publish new donation event:', err)
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}
