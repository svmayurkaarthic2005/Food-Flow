import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED']

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if claim exists
    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
    })

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Update claim status
    const updatedClaim = await prisma.claim.update({
      where: { id: params.id },
      data: { 
        status: status as any,
        updatedAt: new Date(),
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

    console.log('Claim status updated:', params.id, 'to', status)

    // If status is COMPLETED, update listing status to COMPLETED
    if (status === 'COMPLETED') {
      const completedListing = await prisma.foodListing.update({
        where: { id: claim.listingId },
        data: { status: 'COMPLETED' },
      })
      console.log('Listing marked as COMPLETED:', completedListing.id)
      
      // Publish claim completed event
      const { publishClaimEvent } = await import('@/utils/events')
      await publishClaimEvent('CLAIM_COMPLETED', updatedClaim).catch((err) => {
        console.error('Failed to publish claim completed event:', err)
      })
    }

    // If status is REJECTED, update listing status back to AVAILABLE
    if (status === 'REJECTED') {
      const availableListing = await prisma.foodListing.update({
        where: { id: claim.listingId },
        data: { status: 'AVAILABLE' },
      })
      console.log('Listing marked as AVAILABLE:', availableListing.id)
    }

    // Invalidate cache after updating claim
    const { invalidateRouteCache } = await import('@/utils/cache')
    await Promise.all([
      invalidateRouteCache('claims'),
      invalidateRouteCache('listings'),
      invalidateRouteCache('analytics'),
    ])

    return NextResponse.json(updatedClaim)
  } catch (error) {
    console.error('Error updating claim status:', error)
    return NextResponse.json(
      { error: 'Failed to update claim status' },
      { status: 500 }
    )
  }
}
