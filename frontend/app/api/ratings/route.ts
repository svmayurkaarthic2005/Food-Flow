import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { claimId, rating, comment, foodQuality, packaging, timeliness, communication } = body

    if (!claimId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating data' },
        { status: 400 }
      )
    }

    // Get claim with donor and NGO info
    const claim = await (prisma as any).claim.findUnique({
      where: { id: claimId },
      include: {
        listing: {
          include: {
            donor: true,
          },
        },
        ngo: true,
      },
    })

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Create rating
    const donorRating = await (prisma as any).donorRating.create({
      data: {
        claimId,
        donorId: claim.listing.donorId,
        ngoId: claim.ngoId,
        rating,
        comment: comment || null,
        foodQuality: foodQuality || null,
        packaging: packaging || null,
        timeliness: timeliness || null,
        communication: communication || null,
      },
    })

    // Update donor's average rating
    const allRatings = await (prisma as any).donorRating.findMany({
      where: { donorId: claim.listing.donorId },
    })

    const averageRating = allRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / allRatings.length

    await prisma.donor.update({
      where: { id: claim.listing.donorId },
      data: { rating: averageRating },
    })

    return NextResponse.json(donorRating)
  } catch (error) {
    console.error('Error creating rating:', error)
    return NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const donorId = searchParams.get('donorId')
    const claimId = searchParams.get('claimId')

    if (claimId) {
      const rating = await (prisma as any).donorRating.findUnique({
        where: { claimId },
      })
      return NextResponse.json(rating)
    }

    if (donorId) {
      const ratings = await (prisma as any).donorRating.findMany({
        where: { donorId },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(ratings)
    }

    return NextResponse.json(
      { error: 'Missing donorId or claimId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}
