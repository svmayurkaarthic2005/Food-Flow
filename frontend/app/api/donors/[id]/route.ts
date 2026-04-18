import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const donor = await prisma.donor.findFirst({
      where: { id },
      include: {
        user: true,
        listings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(donor)
  } catch (error) {
    console.error('Error fetching donor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const donor = await prisma.donor.update({
      where: { id },
      data: {
        businessName: body.businessName,
        businessType: body.businessType,
        phone: body.phone,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
      },
      include: {
        user: true,
        listings: true,
      },
    })

    return NextResponse.json(donor)
  } catch (error) {
    console.error('Error updating donor:', error)
    return NextResponse.json(
      { error: 'Failed to update donor' },
      { status: 500 }
    )
  }
}
