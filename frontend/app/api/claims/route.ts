import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCache, getCacheKey, CacheTTL } from '@/utils/cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ngoId = searchParams.get('ngoId')
    const donorId = searchParams.get('donorId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}
    if (ngoId) where.ngoId = ngoId
    if (status) where.status = status
    if (donorId) {
      where.listing = {
        donorId: donorId,
      }
    }

    // Create cache key based on query params
    const cacheKey = getCacheKey('claims', { ngoId, donorId, status, page, limit })

    // Use cache-aside pattern
    const result = await withCache(
      cacheKey,
      async () => {
        const claims = await prisma.claim.findMany({
          where,
          include: {
            listing: {
              include: {
                donor: {
                  include: { user: true },
                },
              },
            },
            ngo: {
              include: { user: true },
            },
          },
          orderBy: { claimedAt: 'desc' },
          skip,
          take: limit,
        })

        const total = await prisma.claim.count({ where })

        return {
          data: claims,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        }
      },
      CacheTTL.SHORT // 60 seconds
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.listingId || !body.ngoId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if listing exists and is available
    const listing = await prisma.foodListing.findUnique({
      where: { id: body.listingId },
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Listing is not available' },
        { status: 400 }
      )
    }

    // Check if already claimed
    const existingClaim = await prisma.claim.findUnique({
      where: {
        listingId_ngoId: {
          listingId: body.listingId,
          ngoId: body.ngoId,
        },
      },
    })

    if (existingClaim) {
      return NextResponse.json(
        { error: 'This listing is already claimed by this NGO' },
        { status: 400 }
      )
    }

    // Update listing status to CLAIMED first
    const updatedListing = await prisma.foodListing.update({
      where: { id: body.listingId },
      data: { status: 'CLAIMED' },
    })

    console.log('Listing updated to CLAIMED:', updatedListing.id, updatedListing.status)

    // Create claim with ACCEPTED status (auto-approved for faster redistribution)
    const claim = await prisma.claim.create({
      data: {
        listingId: body.listingId,
        ngoId: body.ngoId,
        status: 'ACCEPTED',
      },
      include: {
        listing: {
          include: {
            donor: {
              include: { user: true },
            },
          },
        },
        ngo: {
          include: { user: true },
        },
      },
    })

    console.log('Claim created:', claim.id, 'for listing:', claim.listingId)

    // Invalidate cache after creating claim
    const { invalidateRouteCache } = await import('@/utils/cache')
    await Promise.all([
      invalidateRouteCache('claims'),
      invalidateRouteCache('listings'),
    ])

    // Publish claim created event
    const { publishClaimEvent } = await import('@/utils/events')
    await publishClaimEvent('CLAIM_CREATED', claim).catch((err) => {
      console.error('Failed to publish claim event:', err)
    })

    return NextResponse.json(claim, { status: 201 })
  } catch (error) {
    console.error('Error creating claim:', error)
    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    )
  }
}
