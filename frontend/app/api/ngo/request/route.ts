import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { organizationName, address, proofDocumentUrl } = body

    if (!organizationName || !address) {
      return NextResponse.json(
        { error: 'Organization name and address are required' },
        { status: 400 }
      )
    }

    // Check if user already has a pending or approved NGO request
    const existingRequest = await (prisma as any).ngoRequest.findFirst({
      where: {
        userId: (session.user as any).id,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending or approved NGO request' },
        { status: 400 }
      )
    }

    // Create NGO request
    const ngoRequest = await (prisma as any).ngoRequest.create({
      data: {
        userId: (session.user as any).id,
        organizationName,
        address,
        proofDocumentUrl,
        status: 'PENDING'
      }
    })

    return NextResponse.json(ngoRequest, { status: 201 })
  } catch (error) {
    console.error('NGO request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
