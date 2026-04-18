import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const ngo = await prisma.ngo.findFirst({
      where: { id },
      include: {
        user: true,
        claims: {
          orderBy: { claimedAt: 'desc' },
          take: 10,
          include: {
            listing: true,
          },
        },
      },
    })

    if (!ngo) {
      return NextResponse.json(
        { error: 'NGO not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(ngo)
  } catch (error) {
    console.error('Error fetching NGO:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NGO' },
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

    const ngo = await prisma.ngo.update({
      where: { id },
      data: {
        organizationName: body.organizationName,
        phone: body.phone,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        storageCapacity: body.storageCapacity,
      },
      include: {
        user: true,
        claims: true,
      },
    })

    return NextResponse.json(ngo)
  } catch (error) {
    console.error('Error updating NGO:', error)
    return NextResponse.json(
      { error: 'Failed to update NGO' },
      { status: 500 }
    )
  }
}
