import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { requestId, action } = body

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Get the NGO request
      const ngoRequest = await (prisma as any).ngoRequest.findUnique({
        where: { id: requestId },
        include: { user: true }
      })

      if (!ngoRequest) {
        return NextResponse.json(
          { error: 'NGO request not found' },
          { status: 404 }
        )
      }

      // Update user role to NGO
      await (prisma as any).user.update({
        where: { id: ngoRequest.userId },
        data: {
          role: 'NGO',
          status: 'VERIFIED'
        }
      })

      // Create NGO profile
      await (prisma as any).ngo.create({
        data: {
          userId: ngoRequest.userId,
          organizationName: ngoRequest.organizationName,
          address: ngoRequest.address,
          latitude: 0,
          longitude: 0,
          storageCapacity: 0,
        }
      })

      // Update request status
      await (prisma as any).ngoRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' }
      })

      return NextResponse.json(
        { message: 'NGO request approved successfully' },
        { status: 200 }
      )
    }

    if (action === 'reject') {
      // Update request status to rejected
      await (prisma as any).ngoRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      })

      return NextResponse.json(
        { message: 'NGO request rejected' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('NGO approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get all pending NGO requests
    const requests = await (prisma as any).ngoRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Get NGO requests error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
