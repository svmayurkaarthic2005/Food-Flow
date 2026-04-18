import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.foodListing.findUnique({
      where: { id: params.id },
      include: {
        donor: {
          include: {
            user: true,
          },
        },
        claims: {
          include: {
            ngo: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Calculate urgency
    const now = new Date()
    const expiryTime = new Date(listing.expiryTime)
    const hoursRemaining = (expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    let urgency: 'critical' | 'medium' | 'fresh'
    if (hoursRemaining <= 2) urgency = 'critical'
    else if (hoursRemaining <= 6) urgency = 'medium'
    else urgency = 'fresh'

    return NextResponse.json({
      ...listing,
      hoursRemaining: Math.max(0, Math.round(hoursRemaining * 10) / 10),
      urgency,
    })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const listing = await prisma.foodListing.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        quantity: body.quantity,
        category: body.category,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        expiryTime: body.expiryTime ? new Date(body.expiryTime) : undefined,
        pickupWindow: body.pickupWindow,
        status: body.status,
      },
      include: {
        donor: true,
      },
    })

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.foodListing.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}
